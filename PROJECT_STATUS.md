# Temple 365 - Project Status & Summary

**Last Updated:** December 18, 2025
**Branch:** `claude/refactor-apps-script-H0QQa`
**Status:** Phase 1-5 Complete ✅

---

## Executive Summary

Temple 365 has been successfully migrated from Google Apps Script to Firebase, making it fully portable to other wards without code changes. The system now uses a modern architecture with Firestore for real-time data sync, Cloud Functions for transactional writes, and a Progressive Web App (PWA) that works on both phones and kiosks.

**Key Achievement:** Any ward can now deploy Temple 365 by simply:
1. Running a seed script to initialize their Firestore data
2. Setting two build-time values (`wardId` and `apiBaseUrl`)
3. All other configuration loaded at runtime from Firestore

---

## Project Structure

```
MeadowviewKiosk/
├── apps/
│   └── temple365/                    # Temple 365 PWA (Phase 3-4)
│       ├── index.html                # Main PWA interface
│       ├── manifest.webmanifest      # PWA manifest for installability
│       ├── sw.js                     # Service worker (offline support)
│       ├── css/
│       │   ├── styles.css            # Main PWA styles
│       │   ├── grid.css              # 365-square grid layout
│       │   └── keyboard.css          # On-screen keyboard styles
│       └── js/
│           ├── config.js             # Build-time config (wardId, apiBaseUrl)
│           ├── firebase-init.js      # Firebase SDK initialization
│           ├── api.js                # Firestore onSnapshot listeners
│           ├── app.js                # Main app initialization
│           ├── grid.js               # 365-square grid rendering
│           ├── modal.js              # Visit modal with keyboard
│           ├── celebration.js        # Confetti & toast notifications
│           └── keyboard.js           # On-screen keyboard (kiosk mode)
│
├── functions/                        # Cloud Functions (Phase 2)
│   ├── index.js                      # API router
│   ├── package.json                  # Dependencies (Node.js 22)
│   └── src/temple/
│       ├── logVisit.js               # POST /api/v1/temple/logVisit
│       └── logBonusVisit.js          # POST /api/v1/temple/logBonusVisit
│
├── firestore/                        # Phase 1 scaffolding
│   ├── schema.md                     # Complete Firestore schema docs
│   ├── DEPLOYMENT.md                 # Step-by-step deployment guide
│   ├── README.md                     # Phase 1 overview
│   └── seed-data/
│       ├── ward-template.json        # Ward config template
│       ├── initial-stats.json        # Initial stats template
│       └── temple-squares-seed.js    # Script to create 365 squares
│
├── js/                               # Kiosk integration (Phase 5 fixes)
│   ├── missionarySpotlight.js        # Scroll detection with pointer events
│   └── views.js                      # Back button handling, element helpers
│
├── css/                              # Kiosk styles (Phase 5 fixes)
│   └── kiosk-layout.css              # Screensaver scaling fix
│
├── firebase.json                     # Firebase project configuration
├── firestore.rules                   # Security rules (read-only client access)
├── firestore.indexes.json            # Composite indexes
└── storage.rules                     # Cloud Storage security rules
```

---

## Phases Completed

### ✅ Phase 1: Firebase Scaffolding & Infrastructure

**Goal:** Define Firestore schema and provide deployment automation

**Deliverables:**
- Complete Firestore schema documentation (`firestore/schema.md`)
- Seed data templates with all Phase 2-4 config fields
- Deployment guide (`firestore/DEPLOYMENT.md`)
- Firebase configuration files (rules, indexes, storage rules)
- Ward initialization script (`temple-squares-seed.js`)

**Key Decision:** Ward portability via top-level collections
- Ward config: `wards/{wardId}` (source of truth)
- Stats: `wardStats/{wardId}` (top-level)
- Squares: `templeSquares/{wardId}/squares/{squareId}` (top-level with subcollection)
- Visits: `templeVisits/{visitId}` (top-level, shared across wards)

---

### ✅ Phase 2: Temple Visit Logging API

**Goal:** Implement Cloud Functions for atomic visit logging

**Deliverables:**
- `POST /api/v1/temple/logVisit` - Main visit logging endpoint
- `POST /api/v1/temple/logBonusVisit` - Convenience wrapper
- Firestore transactions for race-condition safety
- Automatic collision handling (auto-assigns next available square)
- Idempotency support via `clientRequestId`

**Architecture:**
- **Reads:** None (clients read directly from Firestore)
- **Writes:** Cloud Functions only (Admin SDK bypasses security rules)
- **Transactions:** Atomic updates to stats, squares, and visits collections

**Key Features:**
- Collision detection and auto-assignment
- Bonus visits when 365 squares filled
- Real-time stats updates
- Audit trail in `templeVisits` collection

---

### ✅ Phase 3: Temple 365 Phone PWA

**Goal:** Build Progressive Web App for iPhone and Android

**Deliverables:**
- Standalone PWA with offline support
- 365-square grid with real-time sync
- Visit logging modal with name input
- Confetti celebrations (2-second auto-dismiss)
- Title Case name formatting (preserves intentional capitals)
- HEIC image support (accepts empty MIME type)

**Architecture:**
- **Frontend Reads:** Firestore client SDK with `onSnapshot` listeners
- **Frontend Writes:** Cloud Functions API (no direct Firestore writes)
- **Real-time Sync:** All devices see updates immediately
- **No REST GET endpoints:** All reads are direct Firestore queries

**PWA Features:**
- Installable on home screen (manifest.webmanifest)
- Offline support (service worker with cache)
- Relative paths for subfolder hosting

---

### ✅ Phase 4: Kiosk Mode with On-Screen Keyboard

**Goal:** Add kiosk mode with in-app keyboard

**Deliverables:**
- URL parameter detection (`?mode=kiosk`)
- On-screen keyboard module (`keyboard.js`)
- Keyboard docked below name input (flex layout)
- postMessage emission to parent kiosk
- Input attributes to suppress native OSK

**Keyboard Features:**
- Letters, space, backspace, shift, done
- Mobile-friendly tap targets (44px minimum)
- Idempotent initialization
- Double-show protection
- setSelectionRange error handling

**Fixes Applied:**
- Done key crash fix (dispatch event before hide)
- Modal flex layout (footer always visible)
- Service worker relative paths
- Auto-init on show()

---

### ✅ Phase 5: Kiosk Integration Fixes

**Goal:** Fix integration issues between Temple 365 iframe and parent kiosk

**Deliverables:**
- Screensaver background-size fix (contain, not cover)
- Missionary scroll detection (pointer events for touch + mouse)
- Back button double-binding guard
- Element display helpers (respect `data-display` attribute)

**Files Updated:**
- `css/kiosk-layout.css` - Screensaver scaling
- `js/missionarySpotlight.js` - Scroll vs tap detection
- `js/views.js` - Back button handling and element helpers

**Key Fixes:**
1. Missionary cards no longer open accidentally during scrolling
2. Screensaver images no longer crop (letterbox instead)
3. Back buttons only bind once (prevents double-navigation)
4. Flex layouts preserved when showing/hiding elements

---

## Architecture Decisions

### 1. Collection Structure (Top-Level vs Subcollections)

**Decision:** Use top-level collections keyed by `wardId`, not subcollections under `wards/{wardId}`

**Rationale:**
- Better scalability (Firestore subcollections have depth limits)
- Cleaner security rules (fewer nested match statements)
- Easier querying across wards (if needed in future)
- Follows Firestore best practices for multi-tenant data

**Collections:**
```
wards/{wardId}                           # Config only
wardStats/{wardId}                       # Stats per ward
templeSquares/{wardId}/squares/{id}      # Squares per ward
templeVisits/{visitId}                   # Shared, with wardId field
```

### 2. Client Reads, Function Writes

**Decision:** Clients read directly from Firestore; all writes via Cloud Functions

**Rationale:**
- **Real-time sync:** `onSnapshot` listeners provide instant updates
- **Data integrity:** Transactions in Cloud Functions prevent race conditions
- **Security:** Client writes blocked by security rules
- **Simplicity:** No need for REST GET endpoints

**Benefits:**
- Fewer API calls (no polling needed)
- Lower latency (direct Firestore connection)
- Automatic offline support (Firestore client SDK caching)
- Better error handling (Firebase SDK built-in retry logic)

### 3. Ward Portability Pattern

**Decision:** Only `wardId` and `apiBaseUrl` required at build time; everything else runtime-loaded

**Rationale:**
- No code changes to deploy to new wards
- Ward-specific settings in Firestore (editable without redeploy)
- Single codebase for all wards

**Config Fields (Runtime-loaded from `wards/{wardId}`):**
- `name` - Ward display name
- `templeAffiliation` - Temple name
- `timezone` - IANA timezone
- `goalSquares` - Target count (365)
- `celebrationAutoDismissMs` - Toast duration (2000ms)
- `uploadLimits` - File size/count constraints
- `baseUrls` - Deployment URLs

### 4. Name Formatting Rules

**Decision:** Title Case assist for lowercase input, preserve intentional capitals

**Rationale:**
- Helps users with lowercase typing (phones)
- Respects user intent (doesn't "correct" intentional capitals)
- Handles edge cases (e.g., "McDonald" stays "McDonald", not "Mcdonald")

**Implementation:**
- If input has 2+ capitals → keep as-is
- If mostly lowercase → apply Title Case
- Trim whitespace

### 5. Locked Decisions (Per Spec)

All 12 locked decisions from original spec implemented:

1. ✅ Fixed 365 squares, bonus visits forever
2. ✅ Bonus visits only from dedicated button (not grid clicks after 365)
3. ✅ Confetti toast on every visit, 2-second auto-dismiss
4. ✅ Collision auto-assigns next available square
5. ✅ Name capitalization (Title Case assist, preserve capitals)
6. ✅ Date-only (no time) for visit logging
7. ✅ Selfies optional (Phase 6 will add upload support)
8. ✅ Real-time sync across all devices
9. ✅ Kiosk in-app keyboard (no reliance on Windows OSK)
10. ✅ postMessage protocol for kiosk iframe communication
11. ✅ Service worker for offline support
12. ✅ No user authentication (public access for kiosk)

---

## Key Files & Responsibilities

### Frontend (Temple 365 PWA)

| File | Purpose |
|------|---------|
| `apps/temple365/index.html` | Main HTML structure, PWA meta tags, modal, keyboard mount |
| `apps/temple365/js/config.js` | Build-time config (wardId, apiBaseUrl), mode detection |
| `apps/temple365/js/firebase-init.js` | Initialize Firestore client SDK |
| `apps/temple365/js/api.js` | onSnapshot listeners for wards, wardStats, templeSquares |
| `apps/temple365/js/app.js` | App initialization, real-time subscriptions |
| `apps/temple365/js/grid.js` | Render 365-square grid from Firestore data |
| `apps/temple365/js/modal.js` | Visit modal with keyboard integration |
| `apps/temple365/js/keyboard.js` | On-screen keyboard for kiosk mode |
| `apps/temple365/js/celebration.js` | Confetti and toast notifications |

### Backend (Cloud Functions)

| File | Purpose |
|------|---------|
| `functions/index.js` | API router (CORS, path routing) |
| `functions/src/temple/logVisit.js` | Main visit logging with transactions |
| `functions/src/temple/logBonusVisit.js` | Convenience wrapper (sets squareNumber=null) |

### Infrastructure (Firebase)

| File | Purpose |
|------|---------|
| `firebase.json` | Project config (functions, hosting, rules, indexes) |
| `firestore.rules` | Security rules (client reads allowed, writes denied) |
| `firestore.indexes.json` | Composite index for collision query |
| `storage.rules` | Cloud Storage rules (signed URL uploads only) |

### Deployment (Phase 1)

| File | Purpose |
|------|---------|
| `firestore/schema.md` | Complete Firestore schema documentation |
| `firestore/DEPLOYMENT.md` | Step-by-step deployment guide |
| `firestore/seed-data/temple-squares-seed.js` | Initialize ward data (365 squares, stats, config) |
| `firestore/seed-data/ward-template.json` | Ward configuration template |
| `firestore/seed-data/initial-stats.json` | Initial statistics template |

---

## Database Schema Summary

### wards/{wardId}
**Purpose:** Ward configuration (source of truth)
**Key Fields:** name, templeAffiliation, timezone, goalSquares, celebrationAutoDismissMs, uploadLimits, baseUrls

### wardStats/{wardId}
**Purpose:** Real-time statistics per ward
**Key Fields:** totalVisits, totalBonusVisits, squaresFilled, goalMetAt, lastVisitAt

### templeSquares/{wardId}/squares/{squareId}
**Purpose:** Individual square state (1-365 per ward)
**Key Fields:** squareNumber, claimed, claimedAt, claimedByName, selfieUrl

### templeVisits/{visitId}
**Purpose:** Audit log of all visits (shared across wards)
**Key Fields:** wardId, name, mode, squareNumber, isBonusVisit, collisionResolved, clientRequestId, createdAt

### Indexes Required
- **squares collection group:** `claimed ASC, squareNumber ASC` (for collision handling)
- **Other indexes:** Auto-created by Firestore (single-field equality queries)

---

## What's Left to Do

### Phase 6: Selfie-Only Upload Pipeline (Next)

**Goal:** Allow kiosk selfie uploads without creating visit records

**Tasks:**
1. Implement `POST /api/v1/mosaic/requestSelfieUpload` Cloud Function
   - Generate signed Cloud Storage URL
   - Return upload URL to client
   - Enforce upload limits (file size, rate limiting)

2. Update kiosk selfie capture (`js/selfieCapture.js`)
   - Upload directly to Cloud Storage via signed URL
   - Show upload progress
   - Handle errors gracefully

3. Create Cloud Storage trigger function
   - Detect new selfie uploads
   - Create Firestore document in `wardStats/{wardId}/selfies` (or similar)
   - Increment `totalSelfies` counter
   - Optional: Trigger image processing (thumbnails, compression)

4. Update Temple 365 PWA visit modal
   - Add selfie upload option
   - Support HEIC/HEIF formats
   - Preview before upload

**Deliverables:**
- Cloud Function for signed URL generation
- Storage trigger for selfie processing
- Updated kiosk selfie capture UI
- Updated Temple 365 visit modal

---

### Phase 7: Missionary Portal Data

**Goal:** Migrate missionary data from Apps Script to Firestore

**Tasks:**
1. Define `missionaries/{wardId}/missionaries/{missionaryId}` collection schema
   - Fields: name, photoUrl, homeLocation, mission, returnDate, etc.
   - Support for companion pairs

2. Seed missionary data from existing Apps Script/spreadsheet
   - Create migration script
   - Bulk import to Firestore

3. Update kiosk missionary view (`js/missionarySpotlight.js`)
   - Read from Firestore instead of config
   - Real-time updates when missionaries change
   - Support dynamic count (not hardcoded)

4. Create missionary gallery view
   - Sort by newest first (createdAt DESC)
   - Infinite scroll or pagination
   - Fetch from Firestore

**Deliverables:**
- Missionary Firestore schema
- Migration script from Apps Script
- Updated kiosk missionary display
- Gallery view with Firestore integration

---

### Phase 8: Upload Portal with Secret Token

**Goal:** Allow users to upload photos/videos via web portal (not just kiosk)

**Tasks:**
1. Build upload portal web app
   - Simple HTML form with file input
   - Secret token validation (stored in `wards/{wardId}` config)
   - Support for multiple files
   - Drag & drop UI

2. Implement `POST /api/v1/upload/requestUploadSession` Cloud Function
   - Validate secret token
   - Generate signed Cloud Storage URLs (batch)
   - Track upload sessions for rate limiting
   - Return upload URLs and session ID

3. Create upload session tracking
   - Collection: `uploadSessions/{sessionId}`
   - Fields: wardId, tokenUsed, filesUploaded, createdAt, expiresAt
   - Auto-expire old sessions (Cloud Scheduler or TTL)

4. Storage trigger for uploaded media
   - Detect uploaded files from portal
   - Create Firestore records
   - Trigger media conversion (images/videos)
   - Update stats

**Deliverables:**
- Upload portal web app
- Token validation Cloud Function
- Upload session tracking
- Storage trigger for media processing

---

### Phase 9: Kiosk-Recorded Missionary Video

**Goal:** Record missionary introduction videos directly on kiosk

**Tasks:**
1. Build video recording UI (`js/missionaryVideoRecorder.js`)
   - MediaRecorder API integration
   - 30-second timer with countdown
   - Preview before save
   - Re-record option

2. Implement `POST /api/v1/missionaries/requestVideoUpload` Cloud Function
   - Generate signed Cloud Storage URL for video
   - Validate missionary ID
   - Return upload URL

3. Upload recorded video to Cloud Storage
   - Use signed URL from Cloud Function
   - Show upload progress
   - Handle errors (network issues, file too large)

4. Storage trigger for video processing
   - Transcode to web-friendly format (H.264/WebM)
   - Generate thumbnail
   - Update missionary record with video URL
   - Optional: Cloud Run for heavy processing

**Deliverables:**
- Video recorder module for kiosk
- Cloud Function for video upload URLs
- Storage trigger for video processing
- Updated missionary records with video URLs

---

## Testing & Validation Checklist

### Phase 1-5 (Completed)
- ✅ Firestore schema documented
- ✅ Seed script creates 365 squares
- ✅ Security rules deployed
- ✅ Cloud Functions deployed
- ✅ PWA loads without errors
- ✅ Visit logging works (regular + bonus)
- ✅ Real-time sync verified
- ✅ Grid updates immediately
- ✅ Stats increment correctly
- ✅ Collision auto-assignment works
- ✅ Confetti shows on every visit
- ✅ Kiosk keyboard functional
- ✅ postMessage emitted to parent
- ✅ Service worker caches assets
- ✅ Screensaver scaling correct
- ✅ Missionary scroll detection works

### Phase 6-9 (Pending)
- ⬜ Selfie upload via signed URL
- ⬜ Storage trigger creates selfie docs
- ⬜ Stats increment for selfies
- ⬜ Missionary data migrated from Apps Script
- ⬜ Kiosk reads missionaries from Firestore
- ⬜ Upload portal validates token
- ⬜ Batch file upload works
- ⬜ Upload session tracking
- ⬜ Video recording with 30s timer
- ⬜ Video upload and processing
- ⬜ Missionary records updated with videos

---

## Deployment Steps (Quick Reference)

### Initial Setup (One-time per ward)

```bash
# 1. Initialize Firestore data
cd firestore/seed-data
npm install firebase-admin
node temple-squares-seed.js <wardId> --init

# 2. Deploy Firebase infrastructure
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules

# 3. Deploy Cloud Functions
cd functions
npm install
firebase deploy --only functions

# 4. Deploy hosting (optional)
firebase deploy --only hosting
```

### Configuration (Build-time)

Edit `apps/temple365/js/config.js`:
```javascript
const TEMPLE365_CONFIG = {
  wardId: 'your-ward-id',  // Change this
  apiBaseUrl: 'https://YOUR-PROJECT.cloudfunctions.net/api',  // Change this
  mode: 'phone',
  isKioskMode: false
};
```

Edit `apps/temple365/js/firebase-init.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  // ... etc
};
```

### Verification

1. Open Temple 365 PWA in browser
2. Click a square → modal opens
3. Enter name → save
4. Verify confetti shows
5. Verify square turns purple (claimed)
6. Verify stats update in real-time
7. Check Firestore console for visit document

---

## Known Issues & Limitations

### Current Limitations
1. **No selfie upload yet** - Phase 6 will add this
2. **Missionary data still in config** - Phase 7 will migrate to Firestore
3. **No upload portal** - Phase 8 will add token-based upload
4. **No video recording** - Phase 9 will add kiosk video capture

### Future Enhancements (Not in Current Spec)
- User authentication (optional for private wards)
- Analytics dashboard (visit trends, popular times)
- Export data to CSV/Excel
- Email notifications when goals met
- Social sharing (announce 365 completion)
- Multi-language support
- Accessibility improvements (WCAG 2.1 AA)

---

## Repository Status

**Branch:** `claude/refactor-apps-script-H0QQa`
**Commits:**
- `c95bd5f` - Implement Temple 365 Firebase migration (Phases 2-5)
- `be1bb09` - Add Phase 1: Firebase Scaffolding & Infrastructure
- `8124ba3` - Fix Phase 1 scaffolding to match Phase 2-4 architecture
- `68e03fb` - Remove templeVisits composite index (Firestore auto-indexes equality queries)

**Files Changed:** 33 files, 4,000+ insertions
**Status:** All changes committed and pushed ✅

---

## Contact & Support

For deployment assistance or questions:
1. Review `firestore/DEPLOYMENT.md` for step-by-step instructions
2. Check Firebase logs: `firebase functions:log`
3. Verify Firestore rules and indexes in Firebase Console
4. Test locally using Firebase emulators

---

**Document Version:** 1.0
**Last Updated:** December 18, 2025
**Maintained By:** Development Team
