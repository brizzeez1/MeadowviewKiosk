# Phase 8 Audit Report

**Date**: December 19, 2025
**Scope**: Phase 8 (Missionary Upload Portal with Secret Tokens)
**Status**: ⚠️ CRITICAL ISSUE FOUND

---

## 🔴 CRITICAL ISSUE #1: Missing uploadToken Generation in Seed Script

### Problem
The missionary seed script (`firestore/seed-data/missionaries-seed.js`) does NOT generate `uploadToken` field when creating missionary documents. This means Phase 8 upload portal will not work until tokens are manually added.

### Evidence
**Seed Script** (missionaries-seed.js:195-211):
```javascript
const missionaryData = {
  id: missionary.id,
  name: missionary.name,
  mission: missionary.mission,
  language: missionary.language,
  scripture: missionary.scripture,
  photoUrl: missionary.photoUrl,
  homeLocation: missionary.homeLocation || null,
  callDate: missionary.callDate || null,
  departureDate: missionary.departureDate || null,
  returnDate: missionary.returnDate || null,
  companionId: missionary.companionId || null,
  displayOrder: missionary.displayOrder || missionary.id,
  active: missionary.active,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
  // ❌ MISSING: uploadToken field!
};
```

### Impact
- **BLOCKER**: Upload portal cannot validate tokens (tokens don't exist)
- **BLOCKER**: Family/friends cannot upload photos via portal
- **BLOCKER**: Phase 8 is non-functional without manual token insertion

### Recommendation
**OPTION A (Recommended)**: Update seed script to auto-generate uploadToken
```javascript
const crypto = require('crypto');

function generateUploadToken() {
  // Generate 32-character URL-safe random string
  return crypto.randomBytes(24).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const missionaryData = {
  // ... existing fields ...
  uploadToken: generateUploadToken(),  // Add this
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};
```

**OPTION B**: Create separate script to add tokens to existing missionaries

---

## ✅ SCHEMA CONSISTENCY

### Collection Paths
**Phase 8 Implementation** ✅ Correct:
- Upload portal validates tokens from: `wards/{wardId}/missionaries/{missionaryId}`
- Signed URLs upload to: `wards/{wardId}/missionaries/gallery/{missionaryId}/{fileName}`
- Storage trigger creates docs in: `wards/{wardId}/missionaries/{missionaryId}/gallery/{photoId}`

**Matches Phase 7**: ✅
- Kiosk reads from same paths
- Gallery subcollection structure identical

### Gallery Document Structure
**Storage Trigger Creates** (onMissionaryPhotoUploaded.js:62-69):
```javascript
{
  url: "gs://bucket/wards/wardId/missionaries/gallery/missionaryId/uuid.jpg",
  originalFileName: "birthday-party.jpg",
  contentType: "image/jpeg",
  sizeBytes: 2458123,
  uploadedBy: "family",
  createdAt: timestamp,
  featured: true  // Auto-publish (spec decision #9)
}
```

**Kiosk Expects** (missionaryGallery.js:160):
```javascript
img.src = photo.url;  // ✅ Matches
```

**Comparison**: ✅ Compatible
- `url` field is present and correctly formatted
- `caption` field is optional (not required)
- All required fields match

---

## ✅ LOCKED DECISIONS COMPLIANCE

### Decision #8: Missionary uploads use secret tokens
**Status**: ✅ IMPLEMENTED (but broken - see Issue #1)

**Implementation**:
- 32-character URL-safe tokens stored in `uploadToken` field
- Token validation via `POST /api/v1/missionary/validateToken`
- Token passed via URL: `/upload?token=...`
- No expiration (simplified for family use)

**Evidence**:
- `functions/src/missionary/validateToken.js` - Validates tokens
- `apps/upload/js/upload.js` - Accepts token in URL or form
- Schema documented in `firestore/MISSIONARIES_SCHEMA.md`

**Issue**: Seed script doesn't generate tokens (see Issue #1 above)

---

### Decision #9: Missionary uploads auto-published
**Status**: ✅ FULLY IMPLEMENTED

**Implementation**:
- Storage trigger fires on upload completion
- Automatically creates gallery document with `featured: true`
- No manual approval required

**Evidence** (onMissionaryPhotoUploaded.js:62-69):
```javascript
await galleryRef.set({
  url: storageUrl,
  originalFileName: originalFileName,
  contentType: contentType,
  sizeBytes: sizeBytes,
  uploadedBy: uploadedBy,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  featured: true // Auto-publish (spec decision #9) ✅
});
```

**Real-time Display**:
- Kiosk uses `onSnapshot` listener on gallery collection
- Photos appear immediately after upload (no refresh needed)

---

### Decision #10: Missionary video max 100MB
**Status**: ✅ FULLY IMPLEMENTED

**Implementation**:
- Client validation in upload portal
- Cloud Function validation in requestUpload
- Storage rules enforcement

**Evidence**:

**Upload Portal** (apps/upload/js/config.js:16):
```javascript
maxFileSize: 100 * 1024 * 1024, // 100MB ✅
```

**Upload Portal** (apps/upload/js/upload.js:215):
```javascript
if (file.size > UPLOAD_CONFIG.maxFileSize) {
  alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
  return false;
}
```

**Cloud Function** (functions/src/missionary/requestUpload.js:23-27):
```javascript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB ✅
if (fileSizeBytes > MAX_FILE_SIZE) {
  return res.status(400).json({ error: 'File size exceeds 100MB limit' });
}
```

**Storage Rules** (storage.rules:64):
```javascript
&& request.resource.size < 100 * 1024 * 1024;  // Max 100MB ✅
```

**Triple Enforcement**: ✅ Client, Cloud Function, Storage Rules

---

## ✅ SECURITY RULES

### Storage Rules
**Path**: `wards/{wardId}/missionaries/gallery/{missionaryId}/{fileName}`

**Rules** (storage.rules:59-68):
```javascript
match /wards/{wardId}/missionaries/gallery/{missionaryId}/{fileName} {
  // Allow signed URL uploads (request.auth is null for signed URLs)
  // Support both photos and videos
  allow write: if request.auth == null
               && (request.resource.contentType.matches('image/.*')
                   || request.resource.contentType.matches('video/.*'))
               && request.resource.size < 100 * 1024 * 1024;  // Max 100MB

  // Allow public read for kiosk gallery display
  allow read: if true;
}
```

**Security Analysis**: ✅ Correct
- ✅ Signed URL uploads allowed (auth is null)
- ✅ Both photos AND videos supported
- ✅ 100MB size limit enforced
- ✅ Public read for kiosk display
- ✅ Path pattern prevents uploads to wrong locations

### Firestore Rules
**Gallery Documents**: Already covered by Phase 7 rules

**From firestore.rules**:
```javascript
match /missionaries/{missionaryId} {
  allow read: if isValidRequest();
  allow write: if false;  // Only Cloud Functions can write

  match /gallery/{photoId} {
    allow read: if isValidRequest();
    allow write: if false;  // Only Cloud Functions/storage triggers ✅
  }
}
```

**Security Analysis**: ✅ Correct
- ✅ Clients cannot write gallery documents
- ✅ Storage trigger uses Admin SDK (bypasses rules)
- ✅ Public read for kiosk display

---

## ✅ ARCHITECTURE ALIGNMENT

### Upload Flow
1. ✅ User enters token (or URL with `?token=...`)
2. ✅ Cloud Function validates token → Returns missionary info
3. ✅ User selects files → Client validates type/size
4. ✅ Cloud Function generates signed Cloud Storage URL (15-min expiration)
5. ✅ Client uploads directly to Cloud Storage (no server bottleneck)
6. ✅ Storage trigger creates gallery document (auto-published)
7. ✅ Kiosk displays photos in real-time (onSnapshot)

**Matches Phase 6 Pattern**: ✅
- Similar to selfie upload pipeline
- Direct client-to-storage uploads
- Storage trigger creates Firestore documents
- No visit documents created (photos only)

### API Endpoints
**Phase 8 Adds**:
- `POST /api/v1/missionary/validateToken` ✅
- `POST /api/v1/missionary/requestUpload` ✅

**Consistent with Existing**:
- `/api/v1/temple/*` (Phase 2)
- `/api/v1/mosaic/*` (Phase 6)
- `/api/v1/missionary/*` (Phase 8) ✅

**Versioning**: ✅ All endpoints use `/v1/` prefix

---

## ✅ INTEGRATION WITH PHASES 1-7

### Phase 7 Integration (Missionary Data)
**Dependencies**:
- ✅ Upload portal reads missionary documents created in Phase 7
- ✅ Validates tokens against `uploadToken` field (once added)
- ✅ Gallery photos stored in correct subcollection structure
- ✅ Kiosk gallery displays Phase 8 uploads

**Schema Compatibility**: ✅
- Gallery document structure matches kiosk expectations
- `url` field present (required by kiosk)
- `caption` field optional (kiosk handles missing captions)

### Phase 6 Integration (Selfie Upload)
**Pattern Reuse**: ✅
- Similar signed URL approach
- Similar storage trigger pattern
- Similar Firestore document creation

**No Conflicts**: ✅
- Selfies: `wards/{wardId}/selfies/{fileName}`
- Missionary photos: `wards/{wardId}/missionaries/gallery/{missionaryId}/{fileName}`
- Different storage paths prevent collisions

### Phases 1-5 Integration
**No Impact**: ✅
- Phase 8 is additive (no changes to existing features)
- Temple 365 (Phases 1-5) unaffected
- Kiosk (Phases 1-5) unaffected

---

## 🟡 MEDIUM ISSUE #2: Token Security Logging

### Problem
Tokens should not be logged to avoid exposing them in server logs.

### Evidence
**validateToken.js:81**:
```javascript
console.log('[validateToken] Token validated for:', missionaryData.name);
// Should NOT log token itself ✅ (currently doesn't)
```

**requestUpload.js:69**:
```javascript
console.log('[requestUpload] Token validated for:', missionaryData.name);
// Should NOT log token itself ✅ (currently doesn't)
```

**Current Status**: ✅ Good practice already followed
- Tokens are NOT logged in Cloud Functions
- Only missionary names are logged

**Recommendation**: Add comment to remind developers not to log tokens

---

## 🟢 MINOR ISSUE #3: Missing Token Regeneration Feature

### Problem
No mechanism to regenerate tokens if compromised.

### Impact
- LOW: Tokens don't expire (by design)
- MEDIUM: If token leaked, no way to revoke except manual Firestore edit

### Recommendation
**Future Enhancement**: Add admin endpoint to regenerate tokens
```javascript
POST /api/v1/admin/regenerateToken
{
  "missionaryId": "abc123",
  "adminKey": "secret"
}
```

**Priority**: LOW (can be added later if needed)

---

## 🟢 MINOR ISSUE #4: Upload Portal No Error Recovery

### Problem
Upload portal doesn't handle network failures during upload.

### Evidence
**upload.js:345**:
```javascript
catch (error) {
  console.error('[Upload] Upload failed:', error);
  alert('Upload failed. Please try again.');

  // Reset UI
  elements.uploadProgress.style.display = 'none';
  elements.uploadButton.style.display = 'block';
}
```

**Current Behavior**:
- Shows generic error alert
- Resets UI
- User must re-select files and retry

**Recommendation**:
- Store failed uploads in state
- Add "Retry" button
- Resume from failed file instead of restarting

**Priority**: LOW (acceptable for Phase 8)

---

## Summary

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | 1 | Missing uploadToken generation in seed script |
| 🟡 Medium | 1 | Token logging reminder (already handled correctly) |
| 🟢 Minor | 2 | No token regeneration feature, no upload retry |
| **Total** | **4** | |

---

## Required Actions (Priority Order)

### MUST FIX (Before Testing)
1. **✅ Update missionaries-seed.js** - Auto-generate uploadToken field
   - Add crypto-based token generation
   - Include uploadToken in missionaryData object
   - Update seed script documentation

### SHOULD FIX (Before Production)
2. **Add token logging warning comment** - Document in Cloud Functions
3. **Test end-to-end upload flow** - Verify all pieces work together

### NICE TO HAVE
4. **Token regeneration endpoint** - Admin tool to revoke/regenerate
5. **Upload retry logic** - Better error recovery in portal

---

## Conclusion

**Phase 8**: ⚠️ **CRITICAL issue prevents functionality** (uploadToken missing)

**Locked Decisions**: ✅ All 3 decisions correctly implemented (#8, #9, #10)

**Architecture**: ✅ Solid - follows Phase 6 patterns, integrates cleanly

**Security**: ✅ Proper signed URL usage, storage rules, Firestore rules

**The ONLY blocker**: Seed script must generate `uploadToken` field when creating missionaries. Once fixed, Phase 8 is production-ready.

**Recommendation**: Fix seed script immediately, then test upload portal end-to-end.
