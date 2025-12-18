# Firestore Schema - Temple 365

This document defines the complete Firestore database structure for the Temple 365 feature.

## Design Principles

- **Ward Portability**: Ward-specific configuration lives in `wards/{wardId}` (source of truth for config). Ward-scoped data is stored across top-level collections keyed by wardId (`wardStats`, `templeSquares`, `templeVisits`).
- **No Code Changes**: Deploying to a new ward requires only database setup (no code modification). Frontends only require `wardId` and `apiBaseUrl` at build time. All other ward-specific values are loaded at runtime from `wards/{wardId}`.
- **Real-Time Sync**: Uses Firestore onSnapshot listeners for live updates
- **Transactional Writes**: Critical operations use Cloud Functions with Firestore transactions
- **Client Reads, Function Writes**: PWA and kiosk read directly from Firestore; all writes go through Cloud Functions API

## Collection Structure

```
firestore/
├── wards/                                    # Ward configuration (top-level)
│   └── {wardId}/                             # Document per ward (e.g., "meadowview-1st")
│       ├── name: string                       # "Meadowview 1st Ward"
│       ├── templeAffiliation: string          # "Bountiful Utah Temple"
│       ├── timezone: string                   # "America/Denver"
│       ├── goalSquares: number                # 365 (locked decision #1)
│       ├── celebrationAutoDismissMs: number   # 2000 (locked decision #3)
│       ├── uploadLimits: object               # Upload constraints
│       │   ├── maxBytes: number
│       │   ├── maxFilesPerDay: number
│       │   └── allowedMimeTypes: array
│       ├── baseUrls: object                   # Deployment URLs
│       │   ├── kioskBaseUrl: string
│       │   ├── templeBaseUrl: string
│       │   └── uploadBaseUrl: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── wardStats/                                # Ward statistics (top-level, keyed by wardId)
│   └── {wardId}/                             # Document per ward
│       ├── totalVisits: number                # All-time visit count (regular + bonus)
│       ├── totalBonusVisits: number           # Visits after 365 squares filled
│       ├── totalSelfies: number               # Selfie-only uploads (no visit)
│       ├── squaresFilled: number              # 0-365
│       ├── goalMetAt: timestamp?              # When 365th square was filled
│       ├── lastVisitAt: timestamp?            # Most recent visit timestamp
│       └── updatedAt: timestamp
│
├── templeSquares/                            # Temple squares (top-level, keyed by wardId)
│   └── {wardId}/                             # Document per ward
│       └── squares/                           # Subcollection: 365 squares
│           └── {squareId}/                    # Document per square ("1" through "365")
│               ├── squareNumber: number       # 1-365
│               ├── claimed: boolean           # true if filled
│               ├── claimedAt: timestamp?      # When filled
│               ├── claimedByName: string?     # Visitor name
│               └── selfieUrl: string?         # Optional selfie URL
│
└── templeVisits/                             # Visit log (top-level, shared across wards)
    └── {visitId}/                            # Auto-generated document ID
        ├── wardId: string                     # Which ward (for filtering)
        ├── name: string                       # Visitor name
        ├── mode: string                       # "phone" | "kiosk"
        ├── squareNumber: number?              # 1-365 or null (bonus)
        ├── isBonusVisit: boolean              # true if no square assigned
        ├── collisionResolved: boolean         # true if auto-assigned
        ├── selfieUrl: string?                 # Optional selfie URL
        ├── createdAt: timestamp
        └── clientRequestId: string?           # For idempotency
```

## Document Details

### wards/{wardId}

**Purpose**: Ward configuration and identity (source of truth for runtime config)

**Fields**:
- `name` (string, required): Display name (e.g., "Meadowview 1st Ward")
- `templeAffiliation` (string, required): Temple name (e.g., "Bountiful Utah Temple")
- `timezone` (string, required): IANA timezone (e.g., "America/Denver")
- `goalSquares` (number, required): Target square count (365 per spec)
- `celebrationAutoDismissMs` (number, required): Toast auto-dismiss duration (2000ms per spec)
- `uploadLimits` (object, required): Upload constraints
  - `maxBytes` (number): Maximum file size
  - `maxFilesPerDay` (number): Rate limit per day
  - `allowedMimeTypes` (array): Permitted MIME types
- `baseUrls` (object, required): Deployment URLs
  - `kioskBaseUrl` (string): Kiosk app URL
  - `templeBaseUrl` (string): Temple 365 PWA URL
  - `uploadBaseUrl` (string): Upload portal URL
- `createdAt` (timestamp): When ward was initialized
- `updatedAt` (timestamp): Last configuration update

**Example**:
```json
{
  "name": "Meadowview 1st Ward",
  "templeAffiliation": "Bountiful Utah Temple",
  "timezone": "America/Denver",
  "goalSquares": 365,
  "celebrationAutoDismissMs": 2000,
  "uploadLimits": {
    "maxBytes": 10485760,
    "maxFilesPerDay": 100,
    "allowedMimeTypes": ["image/jpeg", "image/png", "image/heic", "image/heif"]
  },
  "baseUrls": {
    "kioskBaseUrl": "https://meadowview-kiosk.web.app",
    "templeBaseUrl": "https://meadowview-kiosk.web.app/temple365",
    "uploadBaseUrl": "https://meadowview-kiosk.web.app/upload"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

### wardStats/{wardId}

**Purpose**: Real-time aggregated statistics (top-level collection, one document per ward)

**Fields**:
- `totalVisits` (number): All-time visit count (regular + bonus)
- `totalBonusVisits` (number): Visits after 365 squares filled
- `totalSelfies` (number): Selfie-only uploads (no visit)
- `squaresFilled` (number): Count of claimed squares (0-365)
- `goalMetAt` (timestamp, nullable): When 365th square was filled
- `lastVisitAt` (timestamp, nullable): Most recent visit timestamp
- `updatedAt` (timestamp): Last stats update

**Example**:
```json
{
  "totalVisits": 142,
  "totalBonusVisits": 0,
  "totalSelfies": 37,
  "squaresFilled": 142,
  "goalMetAt": null,
  "lastVisitAt": "2025-01-20T14:32:00Z",
  "updatedAt": "2025-01-20T14:32:00Z"
}
```

**Note**: Updated atomically by Cloud Functions during visit logging.

---

### templeSquares/{wardId}/squares/{squareId}

**Purpose**: Individual square state (1-365 per ward)

**Collection Path**: `templeSquares/{wardId}/squares/{squareId}`

**Fields**:
- `squareNumber` (number, required): 1-365
- `claimed` (boolean, required): Whether square is filled
- `claimedAt` (timestamp, nullable): When square was claimed
- `claimedByName` (string, nullable): Name of person who claimed it
- `selfieUrl` (string, optional): Cloud Storage URL if selfie included

**Example (Unclaimed)**:
```json
{
  "squareNumber": 42,
  "claimed": false,
  "claimedAt": null,
  "claimedByName": null
}
```

**Example (Claimed with Selfie)**:
```json
{
  "squareNumber": 42,
  "claimed": true,
  "claimedAt": "2025-01-18T09:15:00Z",
  "claimedByName": "John Smith",
  "selfieUrl": "gs://bucket/wards/meadowview-1st/selfies/abc123.jpg"
}
```

**Note**: Document ID is the string representation of squareNumber ("1" through "365").

---

### templeVisits/{visitId}

**Purpose**: Audit log of all temple visits (shared across all wards)

**Collection Path**: `templeVisits` (top-level)

**Fields**:
- `wardId` (string, required): Which ward this visit belongs to
- `name` (string, required): Visitor name
- `mode` (string, required): "phone" or "kiosk"
- `squareNumber` (number, nullable): 1-365 or null for bonus visits
- `isBonusVisit` (boolean, required): true if squareNumber is null
- `collisionResolved` (boolean, required): true if auto-assigned different square
- `selfieUrl` (string, optional): Cloud Storage URL if selfie included
- `createdAt` (timestamp): When visit was logged
- `clientRequestId` (string, optional): For idempotency (prevents duplicates)

**Example (Regular Visit)**:
```json
{
  "wardId": "meadowview-1st",
  "name": "Jane Doe",
  "mode": "phone",
  "squareNumber": 127,
  "isBonusVisit": false,
  "collisionResolved": false,
  "createdAt": "2025-01-19T11:22:00Z",
  "clientRequestId": "phone-1737287520-xyz789"
}
```

**Example (Bonus Visit)**:
```json
{
  "wardId": "meadowview-1st",
  "name": "Bob Johnson",
  "mode": "kiosk",
  "squareNumber": null,
  "isBonusVisit": true,
  "collisionResolved": false,
  "createdAt": "2025-02-10T16:45:00Z",
  "clientRequestId": "kiosk-1739205900-abc456"
}
```

---

## Indexes

**Required Composite Indexes**:

1. **templeSquares/squares - Find Available Square**
   - Collection Group: `squares`
   - Fields: `claimed` (Ascending), `squareNumber` (Ascending)
   - Purpose: Efficiently find next unclaimed square during collision

2. **templeVisits - Idempotency Check**
   - Collection: `templeVisits`
   - Fields: `wardId` (Ascending), `clientRequestId` (Ascending)
   - Purpose: Prevent duplicate visit logging per ward

**Note**: Firestore will auto-create single-field indexes. Composite indexes above must be created manually or via `firestore.indexes.json`.

---

## Client Read Pattern (PWA and Kiosk)

Frontends use Firestore client SDK with onSnapshot listeners for real-time sync:

```javascript
// Ward config (source of truth)
db.collection('wards').doc(wardId).onSnapshot(...)

// Stats
db.collection('wardStats').doc(wardId).onSnapshot(...)

// Squares
db.collection('templeSquares').doc(wardId)
  .collection('squares')
  .orderBy('squareNumber', 'asc')
  .onSnapshot(...)
```

**No REST GET endpoints.** All reads are direct Firestore client SDK calls.

---

## Cloud Functions Write Pattern

All writes go through Cloud Functions API:

- `POST /api/v1/temple/logVisit` - Log temple visit (regular or bonus)
- `POST /api/v1/temple/logBonusVisit` - Convenience wrapper for bonus visits

Cloud Functions use Admin SDK with transactions for atomic updates to:
- `wardStats/{wardId}` - Increment counters
- `templeSquares/{wardId}/squares/{squareId}` - Claim square
- `templeVisits/{visitId}` - Create visit record

**Client writes are blocked by security rules.** All mutations via Cloud Functions only.

---

## Ward Portability Pattern

To deploy Temple 365 to a new ward:

1. **Create ward configuration**: `wards/{newWardId}` with ward-specific config
2. **Initialize stats**: Create `wardStats/{newWardId}` with zero values
3. **Initialize 365 squares**: Create `templeSquares/{newWardId}/squares/1` through `squares/365`
4. **Update PWA build config**: Set `wardId` and `apiBaseUrl` in build config

**No code changes required** - all ward-specific settings are runtime-loaded from `wards/{wardId}`.

---

## Migration from Apps Script

**Legacy Data Mapping**:
- Apps Script spreadsheet rows → Firestore `templeVisits` documents (add `wardId` field)
- Sheet "Current Stats" → Firestore `wardStats/{wardId}`
- Sheet "365 Grid" → Firestore `templeSquares/{wardId}/squares` subcollection

See `firestore/DEPLOYMENT.md` for complete migration guide.
