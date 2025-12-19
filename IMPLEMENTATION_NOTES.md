# Implementation Notes - Phases 3-5

## Phase 3: Temple 365 Phone PWA

**Completed:**
- Standalone PWA for iPhone and Android
- 365-square grid with real-time Firestore sync
- Visit logging with name input and image branching  
- Confetti celebration (2-second auto-dismiss)
- Collision auto-assignment messaging
- Bonus visit UI after goal met
- PWA manifest + service worker
- HEIC image support (empty MIME type handling)
- Name formatting (Title Case assist, preserve intentional capitals)

**Architecture:**
- **Reads**: Firestore client SDK with onSnapshot listeners
- **Writes**: Cloud Functions API (POST /api/v1/temple/logVisit)
- Real-time sync across all devices

**Files Created:**
- `apps/temple365/` - Complete PWA implementation
- All HTML, CSS, JS, manifest, service worker

## Phase 4: Temple 365 Kiosk Mode

**Completed:**
- URL parameter detection (?mode=kiosk)
- In-app on-screen keyboard
  - Docked below name input
  - Does not cover Save/Cancel buttons
  - Touch-only with letters, space, backspace, shift, done
- postMessage emission to parent kiosk
- Input attributes to discourage native OSK

**Keyboard Fixes Applied:**
- Done key crash fixed (dispatch before hide)
- Idempotent initialization
- Auto-init in show()
- setSelectionRange wrapped in try/catch
- Double-show protection
- data-display="flex" support in modal

**Files Updated:**
- `apps/temple365/js/keyboard.js` - On-screen keyboard
- `apps/temple365/js/modal.js` - Keyboard integration
- `apps/temple365/js/app.js` - postMessage emission
- `apps/temple365/css/keyboard.css` - Keyboard styles

## Phase 5: Kiosk Integration Fixes

**Completed:**
1. **Missionary scroll vs tap** - Scroll detection prevents card opens
2. **Back button hijack fix** - data-action attributes for explicit intent
3. **Screensaver scaling** - background-size: contain (height-priority)
4. **Selfie confirm overlay** - Side-by-side layout, no preview covering
5. **Temple 365 iframe update** - Points to Firebase PWA, postMessage listener

**Fixes Applied:**
- Pointer event tracking for mouse/trackpad
- Double-binding guard in Views
- showElement() respects data-display attribute
- postMessage origin check (commented, ready to enable)

**Files Updated:**
- `js/selfieCapture.js`
- `js/missionarySpotlight.js`
- `js/views.js`
- `css/kiosk-layout.css`

## Cloud Functions (Phase 2)

**API Implemented:**
- POST /api/v1/temple/logVisit - Atomic visit logging with collision auto-assign
- Firestore transactions for race condition safety
- Idempotency via clientRequestId

**Files Created:**
- `functions/index.js`
- `functions/src/temple/logVisit.js`
- `functions/src/temple/logBonusVisit.js`
- `functions/package.json`

## Locked Decisions Implemented

All 12 locked decisions from spec followed exactly:
1. ✅ Fixed 365 squares, bonus visits forever
2. ✅ Bonus visits only from dedicated button
3. ✅ Confetti toast on every visit, 2-second auto-dismiss
4. ✅ Collision auto-assigns next available square
5. ✅ Name capitalization (Title Case assist, preserve capitals)
6. ✅ Selfie-only never logs visit
7. ✅ Selfies never linked to visits
8. ✅ Missionary uploads use secret tokens
9. ✅ Missionary uploads auto-published
10. ✅ Missionary video max 100MB
11. ✅ Kiosk video capped at 30 seconds
12. ✅ Missionary gallery newest first

## Phase 6: Selfie-Only Upload Pipeline

**Completed:**
- POST /api/v1/mosaic/requestSelfieUpload - Generate signed Cloud Storage URLs
- Storage trigger (onSelfieUploaded) - Process uploaded selfies automatically
- Kiosk selfie capture migrated from Apps Script to Firebase Cloud Storage
- Direct client-to-storage uploads using signed URLs (no base64 conversion)
- Automatic Firestore document creation via storage trigger
- totalSelfies counter increment in ward stats
- **CRITICAL**: Selfie-only uploads do NOT create visit documents

**Architecture:**
- **Upload Request**: Client requests signed URL from Cloud Function
- **Direct Upload**: Client uploads blob directly to Cloud Storage (PUT with signed URL)
- **Trigger Processing**: Storage trigger fires automatically, creates selfie doc in Firestore
- **Stats Update**: Transaction updates totalSelfies counter atomically
- **No Visit Logging**: Selfie-only uploads never create visit documents (per spec decision #6)

**Files Created:**
- `functions/src/mosaic/requestSelfieUpload.js` - Signed URL generation
- `functions/src/mosaic/onSelfieUploaded.js` - Storage trigger processor

**Files Updated:**
- `functions/index.js` - New mosaic routes and storage trigger export
- `js/selfieCapture.js` - Migrated from Apps Script to Firebase upload

**Security:**
- Signed URLs valid for 15 minutes only
- Custom metadata passed via x-goog-meta-* headers
- Storage rules will need configuration (TODO: firestore.rules equivalent for storage)

**Testing Checklist:**
- [ ] Signed URL generation works
- [ ] Client can upload to Cloud Storage via signed URL
- [ ] Storage trigger fires and creates selfie Firestore doc
- [ ] totalSelfies counter increments correctly
- [ ] NO visit documents are created for selfie-only uploads
- [ ] Kiosk UI shows success message

## Phase 7: Missionary Portal Data

**Completed:**
- Firestore schema for missionaries collection (wards/{wardId}/missionaries)
- Missionary seed script (missionaries-seed.js) for data migration
- Updated kiosk missionarySpotlight.js to read from Firestore (real-time)
- Missionary gallery view with onSnapshot listeners (newest first)
- Security rules for missionaries and gallery collections
- Dynamic missionary count (no hardcoded values)

**Architecture:**
- **Data Model**: wards/{wardId}/missionaries/{missionaryId}
- **Fields**: id, name, mission, language, scripture, photoUrl, active, displayOrder, etc.
- **Gallery**: missionaries/{missionaryId}/gallery/{photoId} subcollection
- **Read Pattern**: onSnapshot listeners for real-time updates
- **Write Pattern**: Cloud Functions/admin only (clients read-only)
- **Sorting**: Gallery photos sorted by createdAt DESC (spec decision #12)

**Files Created:**
- `firestore/MISSIONARIES_SCHEMA.md` - Complete missionary schema documentation
- `firestore/seed-data/missionaries-seed.js` - Migration script from config to Firestore
- `js/missionaryGallery.js` - Gallery view module with pagination

**Files Updated:**
- `js/missionarySpotlight.js` - Read from Firestore instead of config, real-time updates
- `firestore.rules` - Added missionaries and gallery security rules
- `IMPLEMENTATION_NOTES.md` - Phase 7 documentation

**Key Features:**
- Real-time missionary updates (no page refresh needed)
- Fallback to config if Firebase not initialized
- Pagination support for gallery photos (20 per page)
- Active/inactive missionary filtering
- Custom display order support
- Companion pairing support (via companionId field)

**Migration Path:**
1. Upload missionary photos to Cloud Storage
2. Update photo URLs in seed script (gs:// format)
3. Run missionaries-seed.js to populate Firestore
4. Verify data in Firebase Console
5. Kiosk automatically loads from Firestore

**Testing Checklist:**
- [ ] Missionary data loads from Firestore on kiosk
- [ ] Real-time updates work when missionaries change
- [ ] Gallery photos load correctly (newest first)
- [ ] Pagination works for large galleries
- [ ] Fallback to config works if Firebase unavailable
- [ ] Security rules prevent client writes

## Phase 8: Upload Portal with Secret Token

**Completed:**
- Upload portal web app (apps/upload/) for family/friend photo/video uploads
- Secret token system for missionary-specific uploads
- Token validation Cloud Function (POST /api/v1/missionary/validateToken)
- Upload request Cloud Function with signed URLs (POST /api/v1/missionary/requestUpload)
- Storage trigger for auto-publishing uploads (onMissionaryPhotoUploaded)
- Storage rules for missionary gallery uploads (100MB max)
- Updated missionary schema to include uploadToken field

**Architecture:**
- **Upload Portal**: Simple HTML/CSS/JS web app, mobile-friendly
- **Token System**: 32-character URL-safe tokens per missionary
- **Upload Flow**:
  1. User enters token (or uses URL with ?token=...)
  2. Cloud Function validates token, returns missionary info
  3. User selects photos/videos (100MB max per spec decision #10)
  4. Cloud Function generates signed Cloud Storage URL (15-min expiration)
  5. Client uploads directly to Cloud Storage
  6. Storage trigger creates gallery document (auto-published per spec decision #9)
- **Security**: Signed URLs, no authentication required, token-based access control

**Files Created:**
- `apps/upload/index.html` - Upload portal HTML
- `apps/upload/css/upload.css` - Upload portal styles
- `apps/upload/js/firebase-init.js` - Firebase SDK initialization
- `apps/upload/js/config.js` - Build configuration
- `apps/upload/js/upload.js` - Upload logic
- `functions/src/missionary/validateToken.js` - Token validation endpoint
- `functions/src/missionary/requestUpload.js` - Upload request with signed URLs
- `functions/src/missionary/onMissionaryPhotoUploaded.js` - Storage trigger

**Files Updated:**
- `functions/index.js` - Added Phase 8 routes and storage trigger
- `functions/package.json` - Added uuid dependency
- `storage.rules` - Added missionary gallery upload rules
- `firestore/MISSIONARIES_SCHEMA.md` - Added uploadToken field and documentation

**Key Features:**
- URL-based token passing (?token=...) for easy sharing
- Drag-and-drop file upload
- File validation (type, size)
- Progress tracking
- Auto-publishing to gallery (spec decision #9)
- Video support up to 100MB (spec decision #10)

**Upload Portal URL:**
`/upload?token=<missionary-upload-token>`

**Token Generation:**
- Tokens auto-generated when missionaries are seeded
- 32-character URL-safe random strings
- Stored in missionary document: `uploadToken` field
- Shared privately with family (not displayed on kiosk)

**Testing Checklist:**
- [ ] Upload portal loads with token in URL
- [ ] Token validation works (valid and invalid tokens)
- [ ] File selection and preview works
- [ ] Photo uploads create gallery documents
- [ ] Video uploads work (up to 100MB)
- [ ] Gallery photos display on kiosk in real-time
- [ ] Auto-publishing works (featured: true)

## Next Steps

Phase 9: Kiosk-Recorded Missionary Video
