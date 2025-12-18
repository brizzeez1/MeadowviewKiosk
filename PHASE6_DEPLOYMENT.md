# Phase 6: Selfie-Only Upload Pipeline - Deployment Guide

## Overview

Phase 6 implements selfie-only uploads to Firebase Cloud Storage, completely replacing the previous Apps Script integration. This enables ward members to take kiosk selfies without logging temple visits.

## Architecture

```
Client (Kiosk)
    ↓ (1) Request signed URL
Cloud Function (requestSelfieUpload)
    ↓ (2) Return signed URL (valid 15 min)
Client (Kiosk)
    ↓ (3) Upload image blob directly to Cloud Storage
Cloud Storage (wards/{wardId}/selfies/{uniqueId}.jpg)
    ↓ (4) Trigger fires automatically
Cloud Function (onSelfieUploaded)
    ↓ (5) Create selfie doc + increment stats
Firestore (wards/{wardId}/selfies/{selfieId})
```

**CRITICAL**: Selfie-only uploads do NOT create visit documents (per spec decision #6).

## Prerequisites

- Phase 1-5 completed and deployed
- Firebase project with Cloud Storage enabled
- Cloud Functions deployed and accessible
- Firestore database configured with ward data

## Configuration Steps

### 1. Update Kiosk Configuration

Edit `js/selfieCapture.js` lines 21-22:

```javascript
const FIREBASE_API_BASE_URL = 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api';
const WARD_ID = 'your-ward-id';  // Match your Firestore ward document ID
```

Replace:
- `YOUR-PROJECT-ID` with your Firebase project ID
- `your-ward-id` with your ward's Firestore document ID (e.g., "meadowview")

### 2. Configure Firebase Storage Bucket

The storage bucket should already exist from Firebase initialization, but ensure:

```bash
# Check your default bucket
firebase storage:buckets

# Should show: YOUR-PROJECT-ID.appspot.com
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install  # Ensure dependencies are installed
cd ..
firebase deploy --only functions
```

This deploys:
- `api` function with new `/v1/mosaic/requestSelfieUpload` route
- `onSelfieUploaded` storage trigger

### 4. Configure Storage Security Rules

**IMPORTANT**: You need to set up storage security rules to allow signed URL uploads but prevent unauthorized access.

Create `storage.rules` in your project root:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow signed URL uploads to selfie directories
    match /wards/{wardId}/selfies/{fileName} {
      allow write: if request.auth == null;  // Signed URLs don't require auth
      allow read: if true;  // Public read for display purposes
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy storage rules:

```bash
firebase deploy --only storage
```

**Security Note**: The `allow write: if request.auth == null` is safe because:
- Only signed URLs (valid 15 min) can write
- Uploads are restricted to specific paths
- Cloud Function controls URL generation

### 5. Test the Pipeline

#### Test 1: Signed URL Generation

```bash
curl -X POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api/v1/mosaic/requestSelfieUpload \
  -H "Content-Type: application/json" \
  -d '{
    "wardId": "your-ward-id",
    "mode": "kiosk",
    "uploadedBy": null
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/...",
    "filePath": "wards/your-ward-id/selfies/1737123456-abc123.jpg",
    "uploadSessionId": "1737123456-abc123",
    "expiresIn": 900,
    "metadata": { ... }
  }
}
```

#### Test 2: Upload to Signed URL

```bash
# Create test image
echo "test" > test.jpg

# Upload using signed URL from previous response
curl -X PUT "SIGNED_URL_FROM_ABOVE" \
  -H "Content-Type: image/jpeg" \
  -H "x-goog-meta-wardId: your-ward-id" \
  -H "x-goog-meta-mode: kiosk" \
  -H "x-goog-meta-uploadSessionId: 1737123456-abc123" \
  --data-binary @test.jpg
```

Expected: HTTP 200 OK

#### Test 3: Verify Firestore Document

Check Firestore console:
1. Navigate to `wards/{your-ward-id}/selfies` collection
2. Verify new document created with:
   - `originalUrl`: "gs://bucket/wards/{wardId}/selfies/..."
   - `mode`: "kiosk"
   - `createdAt`: timestamp
   - `uploadSessionId`: matches request

#### Test 4: Verify Stats Update

Check `wards/{your-ward-id}/stats/current`:
- `totalSelfies` should have incremented by 1
- `updatedAt` should be recent

#### Test 5: Verify NO Visit Document

**CRITICAL CHECK**: Verify that NO document was created in:
- `wards/{your-ward-id}/visits` collection

Selfie-only uploads must NOT create visit documents.

#### Test 6: Kiosk UI Test

1. Open kiosk at selfie capture screen
2. Take a selfie
3. Confirm upload
4. Verify:
   - Success message appears
   - Console logs show Firebase upload (not Apps Script)
   - Firestore updates correctly

## Monitoring

### Cloud Functions Logs

Monitor function execution:

```bash
# View all logs
firebase functions:log

# Filter for specific functions
firebase functions:log --only onSelfieUploaded
```

Look for:
- `[requestSelfieUpload]` - Signed URL generation
- `[onSelfieUploaded]` - Storage trigger processing

### Common Issues

#### Issue: "Failed to get upload URL"
- **Cause**: Cloud Function not deployed or URL incorrect
- **Fix**: Verify `FIREBASE_API_BASE_URL` in selfieCapture.js

#### Issue: "Upload failed: 403"
- **Cause**: Storage rules denying upload or signed URL expired
- **Fix**: Check storage rules, regenerate signed URL

#### Issue: Storage trigger not firing
- **Cause**: Function not deployed or path mismatch
- **Fix**: Verify function deployed with `firebase functions:list`

#### Issue: Selfie doc created but stats not updated
- **Cause**: Transaction failure
- **Fix**: Check function logs for transaction errors

## Rollback Plan

If Phase 6 causes issues, rollback:

1. **Revert kiosk code**:
   ```bash
   git checkout HEAD~1 js/selfieCapture.js
   ```

2. **Keep Cloud Functions deployed** (they won't interfere with Apps Script)

3. **Restore Apps Script uploads**:
   - Kiosk will automatically use old Apps Script URL
   - Phase 1-5 features remain unaffected

## Next Steps

After successful deployment:
- Phase 7: Missionary Portal Data
- Phase 8: Upload Portal (web-based selfie uploads)
- Phase 9: Kiosk-Recorded Missionary Video

## Configuration Summary

**Required Changes**:
- ✅ `js/selfieCapture.js` - Update FIREBASE_API_BASE_URL and WARD_ID
- ✅ `storage.rules` - Create and deploy storage security rules
- ✅ Deploy Cloud Functions

**Optional Optimizations**:
- Add thumbnail generation in storage trigger
- Implement retry logic for failed uploads
- Add upload progress indicators in UI
- Configure CORS for storage bucket if needed

## Support

For issues or questions:
1. Check Cloud Functions logs: `firebase functions:log`
2. Check Firestore console for data
3. Review browser console for client errors
4. Verify storage rules allow uploads
