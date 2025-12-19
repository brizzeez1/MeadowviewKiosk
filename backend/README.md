# Legacy Backend (ARCHIVED)

⚠️ **This backend is no longer in active use.**

## Status: DEPRECATED

This directory contains a legacy Python Flask backend that was used before migrating to Firebase.

**Current Architecture:**
- All backend operations now use **Firebase Cloud Functions** (see `/functions/` directory)
- Firestore for database
- Cloud Storage for file storage
- Firebase Hosting for static assets

This legacy code is retained for historical reference only and should not be deployed or modified.

## Migration Complete

The Meadowview Kiosk now runs entirely on Firebase infrastructure:
- **Functions:** `/functions/` - Node.js Cloud Functions (HTTP API)
- **Firestore:** Real-time database with security rules
- **Storage:** Cloud Storage with signed URLs
- **Hosting:** Firebase Hosting serves the PWA and kiosk interface

---

**If you need to make backend changes, modify the Cloud Functions in `/functions/`, not this legacy backend.**
