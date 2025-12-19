# Phase 6-7 Audit Report

**Date**: December 19, 2025
**Scope**: Phase 6 (Selfie Upload Pipeline) and Phase 7 (Missionary Data Migration)
**Status**: ⚠️ CRITICAL ISSUES FOUND

---

## 🔴 CRITICAL ISSUE #1: Schema Inconsistency

### Problem
There is a **fundamental mismatch** between the documented schema and the actual implementation.

### Documented Schema (firestore/schema.md - Phase 1)
```
wardStats/{wardId}                          # Top-level collection
templeSquares/{wardId}/squares/{squareId}   # Top-level with subcollection
templeVisits/{visitId}                      # Top-level, shared across wards
```

### Actual Implementation (Phase 2-7 Code)
```
wards/{wardId}/stats/current                # Subcollection under wards
wards/{wardId}/templeSquares/{squareId}     # Subcollection under wards
wards/{wardId}/visits/{visitId}             # Subcollection under wards
wards/{wardId}/selfies/{selfieId}           # Subcollection (Phase 6)
wards/{wardId}/missionaries/{missionaryId}  # Subcollection (Phase 7)
```

### Evidence
**Cloud Functions** (`functions/src/temple/logVisit.js:78-81`):
```javascript
const wardRef = db.collection('wards').doc(wardId);
const statsRef = wardRef.collection('stats').doc('current');
const visitsCollectionRef = wardRef.collection('visits');
const squaresCollectionRef = wardRef.collection('templeSquares');
```

**Temple 365 PWA** (`apps/temple365/js/api.js:98`):
```javascript
return window.db.collection('wards').doc(wardId).collection('templeSquares')
```

**Seed Script** (`firestore/seed-data/temple-squares-seed.js:37`):
```javascript
const squaresRef = db.collection('templeSquares').doc(wardId).collection('squares');
```
☝️ **This is using the OLD top-level structure!**

### Impact
- **BLOCKER**: Seed script writes to wrong location (`templeSquares/{wardId}/squares`)
- **BLOCKER**: Data written by seed script will NOT be visible to PWA/Cloud Functions
- **MEDIUM**: Security rules cover both structures (but confusing)
- **MEDIUM**: Schema documentation misleads developers

### Recommendation
**OPTION A (Recommended)**: Use subcollections (current implementation)
- ✅ Better ward portability
- ✅ Cleaner ward deletion (cascading deletes)
- ✅ Already implemented in all code (Phase 2-7)
- ❌ Requires fixing seed script and schema docs

**OPTION B**: Use top-level collections (original design)
- ✅ Matches original design docs
- ❌ Requires rewriting ALL Cloud Functions (Phase 2-7)
- ❌ More complex security rules
- ❌ Harder to delete ward data (orphaned records)

---

## 🟡 MEDIUM ISSUE #2: Seed Script Uses Wrong Schema

### Problem
`firestore/seed-data/temple-squares-seed.js` uses top-level collections, but all application code uses subcollections.

### Location
Line 37: `db.collection('templeSquares').doc(wardId).collection('squares')`

### Fix Required
```javascript
// OLD (current):
const squaresRef = db.collection('templeSquares').doc(wardId).collection('squares');

// NEW (should be):
const wardRef = db.collection('wards').doc(wardId);
const squaresRef = wardRef.collection('templeSquares');
```

---

## 🟡 MEDIUM ISSUE #3: Firebase Initialization Missing for Kiosk

### Problem
Phase 7 updated `js/missionarySpotlight.js` to read from Firestore, but the kiosk (`/index.html`) doesn't initialize Firebase.

### Evidence
- Temple 365 PWA has `apps/temple365/js/firebase-init.js` ✅
- Kiosk has NO firebase initialization script ❌

### Impact
- Kiosk missionary spotlight will ALWAYS fall back to config (Firebase unavailable)
- Real-time updates won't work on kiosk
- Phase 7 features half-broken

### Fix Required
1. Create `js/firebase-init-kiosk.js` (similar to PWA version)
2. Add to `index.html` before other kiosk scripts
3. Configure with Firebase project credentials

---

## 🟡 MEDIUM ISSUE #4: Ward ID Configuration Scattered

### Problem
Ward ID is configured in multiple places with different fallback values.

### Locations Found
1. `apps/temple365/js/config.js:10` - `wardId: 'meadowview'`
2. `js/selfieCapture.js:22` - `const WARD_ID = 'meadowview'`
3. `js/missionarySpotlight.js:105` - Reads from `KIOSK_CONFIG.ORGANIZATION.WARD_ID` with fallback `'meadowview'`
4. `firestore/seed-data/missionaries-seed.js:18` - `const wardId = 'meadowview'`

### Issue
- No single source of truth
- Easy to misconfigure (different IDs in different files)
- Manual updates required in 4+ places

### Recommendation
Create shared config file or environment variable for ward ID.

---

## 🟢 MINOR ISSUE #5: Duplicate Security Rules

### Problem
`firestore.rules` has rules for BOTH top-level and subcollection structures.

### Evidence
Lines 69-82: Top-level `wardStats`, `templeSquares`, `templeVisits`
Lines 28-65: Subcollections under `wards/{wardId}`

### Impact
- Confusing to maintain
- Unnecessary rules increase bundle size
- Could accidentally allow wrong access patterns

### Fix
Remove top-level collection rules if using subcollections.

---

## 🟢 MINOR ISSUE #6: Missing Firebase Config in Kiosk Selfie Capture

### Problem
`js/selfieCapture.js:21` has placeholder Firebase URL.

### Current
```javascript
const FIREBASE_API_BASE_URL = 'https://us-central1-your-project.cloudfunctions.net/api';
```

### Impact
- Selfie uploads will fail until manually configured
- No runtime config loading (hardcoded)

### Recommendation
Load from `KIOSK_CONFIG` or environment variable.

---

## 🟢 MINOR ISSUE #7: Gallery Load More Button Missing

### Problem
`js/missionaryGallery.js:189` attempts to add "Load More" button but pagination logic incomplete.

### Evidence
```javascript
// Add "Load More" button if there are more photos
if (_hasMore) {
    const loadMoreBtn = document.createElement('button');
    // ...
}
```

BUT `loadMorePhotos()` function removed in final version (lines 120-189 show no pagination code).

### Impact
- Users can't load more than first 20 photos
- Gallery functionality incomplete

### Status
Documented as TODO - acceptable for Phase 7.

---

## ✅ PHASE 6 ITEMS (No Issues Found)

### Selfie Upload Pipeline
- ✅ Cloud Function generates signed URLs correctly
- ✅ Storage trigger references correct subcollection (`wards/{wardId}/selfies`)
- ✅ Metadata passed via x-goog-meta-* headers
- ✅ Stats update uses correct path (`wards/{wardId}/stats/current`)
- ✅ No visit documents created (per spec decision #6)
- ✅ Security rules allow selfie reads, deny writes

### Storage Rules
- ✅ `storage.rules` properly configured for selfie uploads
- ✅ Signed URL validation via file size and MIME type
- ✅ Public read for mosaic display

---

## ✅ PHASE 7 ITEMS (No Issues Found)

### Missionary Data Schema
- ✅ Schema documentation comprehensive
- ✅ Subcollection structure correct (`wards/{wardId}/missionaries`)
- ✅ Gallery subcollection properly nested
- ✅ Fields match requirements
- ✅ Companion pairing supported

### Seed Script
- ✅ Validation logic solid
- ✅ Error handling comprehensive
- ✅ Batch writes correct

### Kiosk Integration
- ✅ `missionarySpotlight.js` properly queries Firestore
- ✅ onSnapshot listeners implemented correctly
- ✅ Fallback to config works
- ✅ Active filtering applied
- ✅ Display order sorting correct

### Security Rules
- ✅ Missionary read access allowed
- ✅ Missionary write access denied
- ✅ Gallery subcollection rules match

---

## Summary

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | 1 | Schema mismatch between docs and code |
| 🟡 Medium | 4 | Seed script, Firebase init, ward ID config, duplicate rules |
| 🟢 Minor | 3 | Missing pagination, hardcoded config, TODO items |
| **Total** | **8** | |

---

## Required Actions (Priority Order)

### MUST FIX (Before Deployment)
1. **Fix Seed Script** - Update `temple-squares-seed.js` to use subcollections
2. **Update Schema Docs** - Fix `firestore/schema.md` to match actual implementation
3. **Add Firebase Init to Kiosk** - Create firebase initialization for kiosk HTML

### SHOULD FIX (Before Production)
4. **Consolidate Ward ID Config** - Single source of truth for ward ID
5. **Clean Up Security Rules** - Remove top-level collection rules
6. **Make Firebase URLs Configurable** - Load from config instead of hardcoded

### NICE TO HAVE
7. **Implement Gallery Pagination** - Complete load-more functionality
8. **Add Config Validation** - Runtime checks for required config values

---

## Conclusion

**Phase 6**: ✅ Technically sound, minor config issues only
**Phase 7**: ✅ Technically sound, Firebase init missing for kiosk
**Overall**: ⚠️ **CRITICAL schema inconsistency must be fixed before deployment**

The core implementation of both phases is solid, but there's a fundamental mismatch between:
- What was designed (top-level collections)
- What was built (subcollections)
- What was documented (top-level collections)

**Recommendation**: Adopt subcollection structure (current implementation) and update documentation + seed scripts to match.
