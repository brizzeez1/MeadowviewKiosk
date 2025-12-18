# Firestore Schema - Temple 365

This document defines the complete Firestore database structure for the Temple 365 feature.

## Design Principles

- **Ward Portability**: All ward-specific data lives under `wards/{wardId}`
- **No Code Changes**: Deploying to a new ward requires only database setup (no code modification)
- **Real-Time Sync**: Uses Firestore onSnapshot listeners for live updates
- **Transactional Writes**: Critical operations use Cloud Functions with Firestore transactions

## Collection Structure

```
firestore/
├── wards/                                    # Top-level ward collection
│   └── {wardId}/                             # Document per ward (e.g., "meadowview-1st")
│       ├── name: string                       # "Meadowview 1st Ward"
│       ├── templeAffiliation: string          # "Bountiful Utah Temple"
│       ├── timezone: string                   # "America/Denver"
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       ├── stats/                             # Subcollection: Ward statistics
│       │   └── current/                       # Document: current stats (singleton)
│       │       ├── totalVisits: number        # All-time visit count
│       │       ├── totalBonusVisits: number   # Bonus visits (after 365)
│       │       ├── totalSelfies: number       # Selfie-only uploads
│       │       ├── squaresFilled: number      # 0-365
│       │       ├── lastVisitAt: timestamp
│       │       └── updatedAt: timestamp
│       │
│       ├── templeSquares/                     # Subcollection: 365 squares
│       │   └── {squareNumber}/                # Document per square ("1" through "365")
│       │       ├── squareNumber: number       # 1-365
│       │       ├── claimed: boolean           # true if filled
│       │       ├── claimedAt: timestamp       # When filled
│       │       ├── claimedByName: string      # Visitor name
│       │       └── selfieUrl: string?         # Optional selfie URL
│       │
│       ├── visits/                            # Subcollection: Visit log
│       │   └── {visitId}/                     # Auto-generated document ID
│       │       ├── name: string               # Visitor name
│       │       ├── mode: string               # "phone" | "kiosk"
│       │       ├── squareNumber: number?      # 1-365 or null (bonus)
│       │       ├── isBonusVisit: boolean      # true if no square assigned
│       │       ├── collisionResolved: boolean # true if auto-assigned
│       │       ├── selfieUrl: string?         # Optional selfie URL
│       │       ├── createdAt: timestamp
│       │       └── clientRequestId: string?   # For idempotency
│       │
│       └── selfies/                           # Subcollection: Selfie-only uploads
│           └── {selfieId}/                    # Auto-generated document ID
│               ├── uploadedBy: string?        # Optional name
│               ├── mode: string               # "kiosk" | "upload-portal"
│               ├── originalUrl: string        # Cloud Storage path
│               ├── thumbnailUrl: string?      # Processed thumbnail
│               ├── createdAt: timestamp
│               └── uploadSessionId: string?   # For upload portal tracking
```

## Document Details

### wards/{wardId}

**Purpose**: Ward configuration and identity

**Fields**:
- `name` (string, required): Display name (e.g., "Meadowview 1st Ward")
- `templeAffiliation` (string, required): Temple name (e.g., "Bountiful Utah Temple")
- `timezone` (string, required): IANA timezone (e.g., "America/Denver")
- `createdAt` (timestamp): When ward was initialized
- `updatedAt` (timestamp): Last configuration update

**Example**:
```json
{
  "name": "Meadowview 1st Ward",
  "templeAffiliation": "Bountiful Utah Temple",
  "timezone": "America/Denver",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

### wards/{wardId}/stats/current

**Purpose**: Real-time aggregated statistics (singleton document)

**Fields**:
- `totalVisits` (number): All-time visit count (regular + bonus)
- `totalBonusVisits` (number): Visits after 365 squares filled
- `totalSelfies` (number): Selfie-only uploads (no visit)
- `squaresFilled` (number): Count of claimed squares (0-365)
- `lastVisitAt` (timestamp): Most recent visit timestamp
- `updatedAt` (timestamp): Last stats update

**Example**:
```json
{
  "totalVisits": 142,
  "totalBonusVisits": 0,
  "totalSelfies": 37,
  "squaresFilled": 142,
  "lastVisitAt": "2025-01-20T14:32:00Z",
  "updatedAt": "2025-01-20T14:32:00Z"
}
```

**Note**: Updated atomically by Cloud Functions during visit logging.

---

### wards/{wardId}/templeSquares/{squareNumber}

**Purpose**: Individual square state (1-365)

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

### wards/{wardId}/visits/{visitId}

**Purpose**: Audit log of all temple visits

**Fields**:
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

### wards/{wardId}/selfies/{selfieId}

**Purpose**: Selfie-only uploads (no associated visit)

**Fields**:
- `uploadedBy` (string, optional): Name (if provided)
- `mode` (string, required): "kiosk" or "upload-portal"
- `originalUrl` (string, required): Cloud Storage path
- `thumbnailUrl` (string, optional): Processed thumbnail path
- `createdAt` (timestamp): Upload timestamp
- `uploadSessionId` (string, optional): For upload portal tracking

**Example**:
```json
{
  "uploadedBy": "Anonymous",
  "mode": "kiosk",
  "originalUrl": "gs://bucket/wards/meadowview-1st/selfies/def789.jpg",
  "thumbnailUrl": "gs://bucket/wards/meadowview-1st/selfies/def789_thumb.jpg",
  "createdAt": "2025-01-21T08:30:00Z"
}
```

---

## Indexes

**Required Composite Indexes**:

1. **templeSquares - Find Available Square**
   - Collection: `wards/{wardId}/templeSquares`
   - Fields: `claimed` (Ascending), `squareNumber` (Ascending)
   - Purpose: Efficiently find next unclaimed square during collision

2. **visits - Idempotency Check**
   - Collection: `wards/{wardId}/visits`
   - Fields: `clientRequestId` (Ascending)
   - Purpose: Prevent duplicate visit logging

**Note**: Firestore will auto-create these indexes when queries are first run. You may receive index creation links in Cloud Functions logs.

---

## Ward Portability Pattern

To deploy Temple 365 to a new ward:

1. **Create ward document**: `wards/{newWardId}` with ward-specific config
2. **Initialize 365 squares**: Run seed script to create `templeSquares/1` through `templeSquares/365`
3. **Initialize stats**: Create `stats/current` with zero values
4. **Update PWA config**: Set `wardId` in `apps/temple365/js/config.js`

**No code changes required** - all ward-specific data is runtime-loaded from Firestore.

---

## Migration from Apps Script

**Legacy Data Mapping**:
- Apps Script spreadsheet rows → Firestore `visits` documents
- Sheet "Current Stats" → Firestore `stats/current`
- Sheet "365 Grid" → Firestore `templeSquares` collection

See `firestore/DEPLOYMENT.md` for complete migration guide.
