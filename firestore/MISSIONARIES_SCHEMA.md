# Firestore Schema - Missionaries (Phase 7)

This document defines the Firestore schema for the Missionary Spotlight feature.

## Collection Structure

```
firestore/
└── wards/                                  # Top-level ward collection
    └── {wardId}/                            # Document per ward (e.g., "meadowview")
        └── missionaries/                    # Subcollection: Missionaries
            └── {missionaryId}/               # Auto-generated document ID
                ├── id: number                 # Sequential ID (for display order)
                ├── name: string               # Full name (e.g., "Sister Kylie Gorecki")
                ├── mission: string            # Mission name (e.g., "Poland Warsaw Mission")
                ├── language: string           # Primary language (e.g., "Polish")
                ├── scripture: string          # Favorite scripture reference
                ├── photoUrl: string           # Cloud Storage URL for profile photo
                ├── homeLocation: string?      # Optional: Home city/state
                ├── callDate: timestamp?       # Optional: When they were called
                ├── departureDate: timestamp?  # Optional: When they left
                ├── returnDate: timestamp?     # Optional: Expected return date
                ├── companionId: string?       # Optional: Reference to companion document
                ├── displayOrder: number       # Sort order for display (default: id)
                ├── active: boolean            # true if currently serving
                ├── uploadToken: string        # Secret token for family/friend uploads (Phase 8)
                ├── createdAt: timestamp       # When record was created
                ├── updatedAt: timestamp       # Last update
                │
                └── gallery/                   # Subcollection: Gallery photos
                    └── {photoId}/              # Auto-generated document ID
                        ├── url: string         # Cloud Storage URL
                        ├── caption: string?    # Optional caption
                        ├── uploadedBy: string? # Who uploaded (e.g., "family", "missionary")
                        ├── createdAt: timestamp
                        └── featured: boolean   # Show in featured gallery
```

## Document Details

### wards/{wardId}/missionaries/{missionaryId}

**Purpose**: Store missionary profile information

**Fields**:
- `id` (number, required): Sequential ID for display order (1, 2, 3, ...)
- `name` (string, required): Full name with title (e.g., "Sister Kylie Gorecki")
- `mission` (string, required): Mission name (e.g., "Poland Warsaw Mission")
- `language` (string, required): Primary mission language
- `scripture` (string, required): Favorite scripture reference
- `photoUrl` (string, required): Cloud Storage URL for profile photo
- `homeLocation` (string, optional): Home city/state (e.g., "Bountiful, UT")
- `callDate` (timestamp, optional): When they received call
- `departureDate` (timestamp, optional): When they left for mission
- `returnDate` (timestamp, optional): Expected return date
- `companionId` (string, optional): Document ID of companion (for pairs)
- `displayOrder` (number, optional): Custom sort order (defaults to `id`)
- `active` (boolean, required): true if currently serving, false if returned
- `uploadToken` (string, required): Secret token for family/friend uploads (Phase 8, auto-generated)
- `createdAt` (timestamp, required): When record was created
- `updatedAt` (timestamp, required): Last update

**Example**:
```json
{
  "id": 1,
  "name": "Sister Kylie Gorecki",
  "mission": "Poland Warsaw Mission",
  "language": "Polish",
  "scripture": "2 Nephi 2:25",
  "photoUrl": "gs://bucket/wards/meadowview/missionaries/photos/kylie-profile.jpg",
  "homeLocation": "Bountiful, UT",
  "callDate": "2024-06-15T00:00:00Z",
  "departureDate": "2024-08-20T00:00:00Z",
  "returnDate": "2026-02-20T00:00:00Z",
  "companionId": null,
  "displayOrder": 1,
  "active": true,
  "uploadToken": "a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

### wards/{wardId}/missionaries/{missionaryId}/gallery/{photoId}

**Purpose**: Store missionary gallery photos (uploaded by family/friends)

**Fields**:
- `url` (string, required): Cloud Storage URL to photo
- `caption` (string, optional): Photo caption
- `uploadedBy` (string, optional): Who uploaded (e.g., "family", "missionary", "kiosk")
- `createdAt` (timestamp, required): Upload timestamp
- `featured` (boolean, required): Whether to show in featured gallery

**Example**:
```json
{
  "url": "gs://bucket/wards/meadowview/missionaries/gallery/kylie/photo1.jpg",
  "caption": "Serving in Warsaw",
  "uploadedBy": "family",
  "createdAt": "2025-01-20T14:30:00Z",
  "featured": true
}
```

**Note**: Photos are sorted by `createdAt` DESC (newest first, per spec decision #12).

---

## Indexes

**Required Composite Indexes**:

1. **Active Missionaries by Display Order**
   - Collection: `wards/{wardId}/missionaries`
   - Fields: `active` (Descending), `displayOrder` (Ascending)
   - Purpose: Query active missionaries in display order

2. **Gallery Photos by Date**
   - Collection: `wards/{wardId}/missionaries/{missionaryId}/gallery`
   - Fields: `createdAt` (Descending)
   - Purpose: Query gallery photos newest-first

**Note**: Firestore may auto-create these indexes when queries are first run.

---

## Migration from Config

**Legacy Data Mapping**:
- `KIOSK_CONFIG.MISSIONARIES.MISSIONARIES_LIST` → Firestore `missionaries` collection
- `id` → `id` (sequential number)
- `name` → `name`
- `mission` → `mission`
- `language` → `language`
- `scripture` → `scripture`
- `photoUrl` → Upload to Cloud Storage, store URL in `photoUrl`
- `galleryFolder` + `galleryPhotos` → Upload to Cloud Storage, create `gallery` subcollection

**Migration Script**: See `firestore/seed-data/missionaries-seed.js`

---

## Read Patterns

**Kiosk Missionary Spotlight**:
```javascript
// Subscribe to active missionaries
db.collection('wards').doc(wardId).collection('missionaries')
  .where('active', '==', true)
  .orderBy('displayOrder', 'asc')
  .onSnapshot((snapshot) => {
    const missionaries = [];
    snapshot.forEach((doc) => {
      missionaries.push({ id: doc.id, ...doc.data() });
    });
    updateMissionaryGrid(missionaries);
  });
```

**Missionary Gallery**:
```javascript
// Get gallery photos for a missionary (newest first)
db.collection('wards').doc(wardId)
  .collection('missionaries').doc(missionaryId)
  .collection('gallery')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .onSnapshot((snapshot) => {
    const photos = [];
    snapshot.forEach((doc) => {
      photos.push({ id: doc.id, ...doc.data() });
    });
    updateGallery(photos);
  });
```

---

## Write Patterns

**Adding a Missionary** (via Cloud Function or admin):
```javascript
const missionaryRef = db.collection('wards').doc(wardId)
  .collection('missionaries').doc();

await missionaryRef.set({
  id: nextId,
  name: "Elder John Smith",
  mission: "Brazil São Paulo Mission",
  language: "Portuguese",
  scripture: "Mosiah 2:17",
  photoUrl: "gs://bucket/wards/wardId/missionaries/photos/john-profile.jpg",
  displayOrder: nextId,
  active: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Adding Gallery Photo** (via upload portal or kiosk):
```javascript
const galleryRef = db.collection('wards').doc(wardId)
  .collection('missionaries').doc(missionaryId)
  .collection('gallery').doc();

await galleryRef.set({
  url: "gs://bucket/wards/wardId/missionaries/gallery/missionary/photo.jpg",
  caption: "Teaching investigators",
  uploadedBy: "family",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  featured: true
});
```

---

## Security Rules

**Firestore Rules** (to be added to `firestore.rules`):

```javascript
// Missionaries - read-only for clients
match /wards/{wardId}/missionaries/{missionaryId} {
  // Allow read for all clients
  allow read: if true;

  // Deny all writes from clients (use Cloud Functions)
  allow write: if false;

  // Gallery photos - same rules
  match /gallery/{photoId} {
    allow read: if true;
    allow write: if false;
  }
}
```

**Note**: All missionary updates must go through Cloud Functions to ensure data integrity.

---

## Upload Tokens (Phase 8)

**Purpose**: Enable family/friends to upload photos/videos to missionary gallery using a secret token.

**Token Format**:
- 32-character URL-safe random string
- Example: `a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- Generated automatically when missionary is created
- Shared privately with family (not displayed on kiosk)

**Upload Portal Flow**:
1. User visits upload portal URL with token in query string: `/upload?token=...`
2. Cloud Function validates token and returns missionary info
3. User selects photos/videos to upload (100MB max per file)
4. Cloud Function generates signed Cloud Storage URL
5. Client uploads directly to Cloud Storage
6. Storage trigger automatically creates gallery document (auto-published per spec decision #9)

**Token Validation** (via Cloud Function):
```javascript
// POST /api/v1/missionary/validateToken
{
  "token": "a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

// Response:
{
  "valid": true,
  "missionary": {
    "id": "abc123",
    "name": "Sister Kylie Gorecki",
    "mission": "Poland Warsaw Mission"
  }
}
```

**Security**:
- Tokens are secret and should not be logged or exposed
- Tokens do not expire (simplifies family usage)
- One token per missionary
- Tokens can be regenerated if compromised

---

## Future Enhancements

- Video support (store video URLs in missionary document)
- Companion pairing (link via `companionId`)
- Statistics (track photo upload counts, views)
- Admin portal for managing missionaries
- Automatic retirement when `returnDate` passes
- Token expiration/regeneration
