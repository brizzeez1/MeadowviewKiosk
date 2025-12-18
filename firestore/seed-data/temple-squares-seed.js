/**
 * Temple Squares Seed Script
 *
 * Generates all 365 temple squares for a ward.
 *
 * Usage:
 *   node temple-squares-seed.js <wardId>
 *
 * Example:
 *   node temple-squares-seed.js meadowview-1st
 *
 * Prerequisites:
 *   - Firebase Admin SDK initialized
 *   - Service account credentials configured
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (use your service account)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault()
// });

const db = admin.firestore();

/**
 * Generate seed data for 365 temple squares
 * @param {string} wardId - Ward identifier
 */
async function seedTempleSquares(wardId) {
  console.log(`[Seed] Initializing 365 temple squares for ward: ${wardId}`);

  const squaresRef = db.collection('wards').doc(wardId).collection('templeSquares');

  // Create batch writes (max 500 per batch)
  const batches = [];
  let currentBatch = db.batch();
  let operationCount = 0;

  for (let squareNumber = 1; squareNumber <= 365; squareNumber++) {
    const squareRef = squaresRef.doc(String(squareNumber));

    const squareData = {
      squareNumber: squareNumber,
      claimed: false,
      claimedAt: null,
      claimedByName: null
    };

    currentBatch.set(squareRef, squareData);
    operationCount++;

    // Firestore batch limit is 500 operations
    if (operationCount === 500) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      operationCount = 0;
    }
  }

  // Add final batch if it has operations
  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  console.log(`[Seed] Committing ${batches.length} batch(es)...`);

  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`[Seed] Batch ${i + 1}/${batches.length} committed`);
  }

  console.log(`[Seed] ✅ Successfully created 365 temple squares for ${wardId}`);
}

/**
 * Initialize complete ward data structure
 * @param {string} wardId - Ward identifier
 * @param {Object} wardConfig - Ward configuration
 */
async function initializeWard(wardId, wardConfig) {
  console.log(`[Seed] Initializing complete ward structure: ${wardId}`);

  const wardRef = db.collection('wards').doc(wardId);

  // 1. Create ward document
  await wardRef.set({
    name: wardConfig.name,
    templeAffiliation: wardConfig.templeAffiliation,
    timezone: wardConfig.timezone || 'America/Denver',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('[Seed] ✅ Ward document created');

  // 2. Create initial stats
  await wardRef.collection('stats').doc('current').set({
    totalVisits: 0,
    totalBonusVisits: 0,
    totalSelfies: 0,
    squaresFilled: 0,
    lastVisitAt: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('[Seed] ✅ Initial stats created');

  // 3. Create 365 temple squares
  await seedTempleSquares(wardId);

  console.log(`[Seed] ✅ Ward ${wardId} fully initialized!`);
}

/**
 * Main execution
 */
async function main() {
  const wardId = process.argv[2];

  if (!wardId) {
    console.error('Error: Ward ID is required');
    console.log('Usage: node temple-squares-seed.js <wardId>');
    console.log('Example: node temple-squares-seed.js meadowview-1st');
    process.exit(1);
  }

  // Check if full initialization is requested
  const fullInit = process.argv[3] === '--init';

  try {
    if (fullInit) {
      // Full ward initialization
      const wardConfig = {
        name: 'Meadowview 1st Ward',  // TODO: Customize
        templeAffiliation: 'Bountiful Utah Temple',  // TODO: Customize
        timezone: 'America/Denver'  // TODO: Customize
      };

      await initializeWard(wardId, wardConfig);
    } else {
      // Just seed squares
      await seedTempleSquares(wardId);
    }

    console.log('\n✅ Seed operation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed operation failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  seedTempleSquares,
  initializeWard
};

// Run if executed directly
if (require.main === module) {
  main();
}
