# Firestore - Phase 1 Firebase Scaffolding

This directory contains Firebase infrastructure files for Temple 365.

## Directory Structure

```
firestore/
├── README.md                    # This file
├── schema.md                    # Complete Firestore schema documentation
├── DEPLOYMENT.md                # Step-by-step deployment guide
└── seed-data/                   # Seed data templates and scripts
    ├── ward-template.json       # Ward configuration template
    ├── initial-stats.json       # Initial statistics template
    └── temple-squares-seed.js   # Script to generate 365 squares
```

## Quick Start

### 1. Review the Schema

Start by reading `schema.md` to understand the Firestore data structure.

### 2. Initialize a Ward

```bash
cd seed-data
npm install firebase-admin
node temple-squares-seed.js <wardId> --init
```

This creates:
- Ward configuration document
- Initial statistics (zeros)
- All 365 temple squares (unclaimed)

### 3. Deploy

See `DEPLOYMENT.md` for complete deployment instructions.

## Files Overview

### schema.md

Complete documentation of Firestore collections and documents:
- Collection hierarchy
- Field definitions and types
- Index requirements
- Ward portability architecture

### DEPLOYMENT.md

Step-by-step deployment guide covering:
- Firebase project setup
- Firestore rules deployment
- Ward data initialization
- Cloud Functions deployment
- PWA configuration
- Testing procedures

### seed-data/

Templates and scripts for initializing Firestore:

- **ward-template.json**: Ward configuration structure
- **initial-stats.json**: Statistics starting values
- **temple-squares-seed.js**: Node.js script to create 365 squares

## Related Files (Project Root)

- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Composite index definitions
- `firebase.json` - Firebase project configuration
- `storage.rules` - Cloud Storage security rules

## Phase 1 Objectives

✅ Define complete Firestore schema
✅ Create seed data templates
✅ Document ward portability architecture
✅ Provide deployment automation

## Next Phases

- **Phase 2**: Cloud Functions for visit logging ✅
- **Phase 3**: Temple 365 Phone PWA ✅
- **Phase 4**: Kiosk mode with keyboard ✅
- **Phase 5**: Kiosk integration fixes ✅
- **Phase 6**: Selfie upload pipeline (next)

## Notes

- All ward-specific data lives under `wards/{wardId}`
- No code changes needed to deploy to new wards
- Seed scripts use Firebase Admin SDK
- Security rules enforce write-via-Cloud-Functions pattern
