# Temple 365 - Deployment Guide

This guide explains how to deploy Temple 365 to a new ward using the Firebase scaffolding files.

## Prerequisites

1. **Firebase Project**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Cloud Functions
   - Enable Cloud Storage
   - Enable Authentication (optional for Phase 6+)

2. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Service Account** (for seed scripts)
   - Download service account key from Firebase Console
   - Save as `serviceAccountKey.json` (add to .gitignore)

## Step 1: Firebase Project Setup

### Initialize Firebase in this directory

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### Link to your Firebase project

```bash
firebase use --add
# Enter your project ID
# Choose an alias (e.g., "production")
```

## Step 2: Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

This deploys:
- `firestore.rules` - Security rules (read-only access, writes via Cloud Functions)
- `firestore.indexes.json` - Composite indexes for efficient queries

## Step 3: Initialize Ward Data

### Option A: Automatic Seed Script (Recommended)

```bash
cd firestore/seed-data

# Install dependencies (if using seed script)
npm install firebase-admin

# Initialize complete ward structure
node temple-squares-seed.js meadowview-1st --init

# Or just create 365 squares (if ward document already exists)
node temple-squares-seed.js meadowview-1st
```

**Note**: Edit ward configuration in `temple-squares-seed.js` before running:
```javascript
const wardConfig = {
  name: 'Your Ward Name',              // e.g., "Meadowview 1st Ward"
  templeAffiliation: 'Your Temple',    // e.g., "Bountiful Utah Temple"
  timezone: 'Your/Timezone'            // e.g., "America/Denver"
};
```

### Option B: Manual Firestore Setup

Use the Firebase Console to manually create:

1. **Ward Document**: `wards/meadowview-1st`
   - Copy structure from `seed-data/ward-template.json`
   - Replace `{{TIMESTAMP}}` with current timestamp

2. **Stats Document**: `wards/meadowview-1st/stats/current`
   - Copy structure from `seed-data/initial-stats.json`

3. **Temple Squares**: `wards/meadowview-1st/templeSquares/1` through `365`
   - Each document:
     ```json
     {
       "squareNumber": 1,
       "claimed": false,
       "claimedAt": null,
       "claimedByName": null
     }
     ```

## Step 4: Deploy Cloud Functions

```bash
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
```

This deploys:
- `POST /api/v1/temple/logVisit` - Visit logging API
- `POST /api/v1/temple/logBonusVisit` - Bonus visit wrapper

## Step 5: Configure Temple 365 PWA

Update `apps/temple365/js/config.js`:

```javascript
const TEMPLE365_CONFIG = {
  wardId: 'meadowview-1st',  // ← Change this to your ward ID
  apiBaseUrl: 'https://YOUR-PROJECT.cloudfunctions.net/api',  // ← Your Cloud Functions URL
  mode: 'phone',
  isKioskMode: false
};
```

Update `apps/temple365/js/firebase-init.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 6: Deploy Hosting (Optional)

If hosting Temple 365 PWA on Firebase Hosting:

```bash
# Deploy all apps
firebase deploy --only hosting

# Access at:
# https://YOUR-PROJECT.web.app/temple365/
```

**Alternative**: Host on existing web server
- Copy `apps/temple365/` to your web server
- Ensure service worker paths are correct (already using relative paths)

## Step 7: Configure Kiosk (If Using Kiosk Mode)

Update kiosk `config.js` to embed Temple 365 iframe:

```javascript
// In your kiosk config
const TEMPLE_365_URL = 'https://YOUR-PROJECT.web.app/temple365/?mode=kiosk';

// Or if self-hosted:
const TEMPLE_365_URL = '/apps/temple365/?mode=kiosk';
```

## Verification Checklist

After deployment, verify:

- [ ] Firestore rules deployed successfully
- [ ] Ward document exists in Firestore (`wards/{wardId}`)
- [ ] 365 temple squares created (`templeSquares/1` through `365`)
- [ ] Initial stats document exists (`stats/current`)
- [ ] Cloud Functions deployed and accessible
- [ ] Temple 365 PWA loads without errors
- [ ] Can log a test visit (creates visit document, updates stats)
- [ ] Grid displays correctly with real-time updates

## Testing

### Test Visit Logging

```bash
# Test API directly
curl -X POST https://YOUR-PROJECT.cloudfunctions.net/api/v1/temple/logVisit \
  -H "Content-Type: application/json" \
  -d '{
    "wardId": "meadowview-1st",
    "mode": "phone",
    "name": "Test User",
    "desiredSquareNumber": 1,
    "clientRequestId": "test-123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "visitId": "abc123",
    "assignedSquareNumber": 1,
    "isBonusVisit": false,
    "collisionResolved": false,
    "totalVisits": 1,
    "squaresFilled": 1
  }
}
```

### Test PWA

1. Open Temple 365 PWA in browser
2. Click a square to open visit modal
3. Enter a name and save
4. Verify:
   - Confetti animation plays
   - Square turns purple (claimed)
   - Stats update in real-time
   - Visit appears in Firestore `visits` collection

## Deploying to Additional Wards

To deploy Temple 365 to another ward (e.g., "oakridge-2nd"):

1. **Create ward structure in Firestore**:
   ```bash
   node firestore/seed-data/temple-squares-seed.js oakridge-2nd --init
   ```

2. **Deploy separate PWA instance** (optional):
   - Copy `apps/temple365/` to `apps/temple365-oakridge/`
   - Update `config.js` with `wardId: 'oakridge-2nd'`
   - Deploy to different URL or subdomain

3. **OR use single PWA with ward selector** (future enhancement):
   - Add ward selection UI
   - Load `wardId` from URL parameter or user selection

**No code changes needed** - just database setup!

## Migrating from Google Apps Script

If migrating existing Temple 365 data from Apps Script:

1. **Export spreadsheet data**:
   - Export "Visits" sheet as CSV
   - Export "365 Grid" sheet as CSV

2. **Import to Firestore**:
   - Use Firebase Admin SDK to bulk import
   - Map spreadsheet columns to Firestore fields
   - See `firestore/schema.md` for field mapping

3. **Verify data integrity**:
   - Check `totalVisits` matches visit count
   - Check `squaresFilled` matches claimed squares
   - Verify no data loss

## Troubleshooting

### "Index required" error

Firestore will show index creation links in Cloud Functions logs. Click the link to auto-create the required index, or manually create using `firestore.indexes.json`.

### Real-time updates not working

- Check Firebase config in `firebase-init.js`
- Verify Firestore rules allow reads
- Check browser console for errors

### Cloud Functions timeout

- Increase function timeout in `firebase.json`
- Optimize batch operations in seed scripts

### CORS errors

- Verify CORS headers in Cloud Functions
- Check `Access-Control-Allow-Origin` is set to `*` (or specific domain)

## Support

For issues or questions:
- Check Firebase logs: `firebase functions:log`
- Review Firestore security rules tab in console
- Verify indexes are created in Firestore indexes tab

## Next Steps

After deployment:
- **Phase 6**: Implement selfie upload pipeline
- **Phase 7**: Add missionary data
- **Phase 8**: Build upload portal
- **Phase 9**: Add kiosk video recording
