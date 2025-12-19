/**
 * Missionary Data Seed Script (Phase 7)
 *
 * This script initializes missionary data in Firestore for a ward.
 *
 * USAGE:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Update serviceAccountPath below
 * 4. Update wardId and missionary data
 * 5. Run: node missionaries-seed.js
 *
 * WHAT IT DOES:
 * - Creates missionary documents in wards/{wardId}/missionaries collection
 * - Sets up proper timestamps and metadata
 * - Validates data structure
 *
 * NOTE: This script creates missionary metadata only.
 * Photos must be uploaded to Cloud Storage separately.
 * See MISSIONARIES_SCHEMA.md for photo upload process.
 */

const admin = require('firebase-admin');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Path to your Firebase service account key
// Download from: Firebase Console → Project Settings → Service Accounts
const serviceAccountPath = './service-account-key.json';

// Your Firebase project ID
const projectId = 'your-project-id';  // CHANGE THIS

// Ward ID to seed missionaries for
const wardId = 'meadowview';  // CHANGE THIS

// ============================================================================
// MISSIONARY DATA
// ============================================================================

/**
 * Missionary data array
 *
 * NOTES:
 * - photoUrl should be Cloud Storage path (gs://bucket/path)
 * - If migrating from local files, upload photos first
 * - displayOrder defaults to id if not specified
 * - active=true for currently serving, false for returned
 */
const missionaries = [
  {
    id: 1,
    name: "Sister Kylie Gorecki",
    mission: "Poland Warsaw Mission",
    language: "Polish",
    scripture: "2 Nephi 2:25",
    photoUrl: "gs://your-bucket/wards/meadowview/missionaries/photos/kylie-profile.jpg",
    homeLocation: "Bountiful, UT",
    callDate: new Date("2024-06-15"),
    departureDate: new Date("2024-08-20"),
    returnDate: new Date("2026-02-20"),
    displayOrder: 1,
    active: true
  },
  {
    id: 2,
    name: "Sister Emily Johnson",
    mission: "England London Mission",
    language: "English",
    scripture: "Doctrine & Covenants 4:2",
    photoUrl: "gs://your-bucket/wards/meadowview/missionaries/photos/emily-profile.jpg",
    homeLocation: "Salt Lake City, UT",
    displayOrder: 2,
    active: true
  },
  // Add more missionaries here...
];

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId
  });

  console.log('✓ Firebase Admin SDK initialized');
} catch (error) {
  console.error('✗ Error initializing Firebase:', error.message);
  console.error('\nMake sure you:');
  console.error('1. Downloaded service account key from Firebase Console');
  console.error('2. Updated serviceAccountPath in this script');
  console.error('3. Updated projectId in this script\n');
  process.exit(1);
}

const db = admin.firestore();

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate missionary data structure
 * @param {Object} missionary - Missionary object
 * @returns {Array} Array of error messages (empty if valid)
 */
function validateMissionary(missionary) {
  const errors = [];

  // Required fields
  if (!missionary.id || typeof missionary.id !== 'number') {
    errors.push('Missing or invalid id (must be number)');
  }
  if (!missionary.name || typeof missionary.name !== 'string') {
    errors.push('Missing or invalid name (must be string)');
  }
  if (!missionary.mission || typeof missionary.mission !== 'string') {
    errors.push('Missing or invalid mission (must be string)');
  }
  if (!missionary.language || typeof missionary.language !== 'string') {
    errors.push('Missing or invalid language (must be string)');
  }
  if (!missionary.scripture || typeof missionary.scripture !== 'string') {
    errors.push('Missing or invalid scripture (must be string)');
  }
  if (!missionary.photoUrl || typeof missionary.photoUrl !== 'string') {
    errors.push('Missing or invalid photoUrl (must be string)');
  }
  if (typeof missionary.active !== 'boolean') {
    errors.push('Missing or invalid active (must be boolean)');
  }

  // Validate Cloud Storage URL format
  if (missionary.photoUrl && !missionary.photoUrl.startsWith('gs://')) {
    errors.push('photoUrl must start with gs:// (Cloud Storage path)');
  }

  return errors;
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

/**
 * Seed missionaries to Firestore
 */
async function seedMissionaries() {
  console.log('\n='.repeat(60));
  console.log('MISSIONARY SEED SCRIPT (Phase 7)');
  console.log('='.repeat(60));
  console.log(`\nProject ID: ${projectId}`);
  console.log(`Ward ID: ${wardId}`);
  console.log(`Missionaries to seed: ${missionaries.length}\n`);

  // Validate all missionaries first
  let hasErrors = false;
  missionaries.forEach((missionary, index) => {
    const errors = validateMissionary(missionary);
    if (errors.length > 0) {
      console.error(`✗ Validation errors for missionary ${index + 1} (${missionary.name || 'unnamed'}):`);
      errors.forEach(error => console.error(`  - ${error}`));
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.error('\n✗ Validation failed. Fix errors and try again.\n');
    process.exit(1);
  }

  console.log('✓ All missionaries validated\n');
  console.log('Starting seed...\n');

  // Seed each missionary
  let successCount = 0;
  let errorCount = 0;

  for (const missionary of missionaries) {
    try {
      // Create missionary document
      const missionaryRef = db.collection('wards')
        .doc(wardId)
        .collection('missionaries')
        .doc(); // Auto-generate ID

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
      };

      await missionaryRef.set(missionaryData);

      console.log(`✓ Created: ${missionary.name} (ID: ${missionary.id})`);
      successCount++;

    } catch (error) {
      console.error(`✗ Error creating ${missionary.name}:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${missionaries.length}\n`);

  if (errorCount === 0) {
    console.log('✓ All missionaries seeded successfully!\n');
    console.log('NEXT STEPS:');
    console.log('1. Upload missionary photos to Cloud Storage');
    console.log('2. Verify data in Firebase Console → Firestore Database');
    console.log('3. Update kiosk to read from Firestore (Phase 7 complete)\n');
  } else {
    console.log('✗ Some missionaries failed to seed. Check errors above.\n');
  }
}

// ============================================================================
// RUN
// ============================================================================

seedMissionaries()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Fatal error:', error);
    process.exit(1);
  });
