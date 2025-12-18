/**
 * Storage Trigger - On Selfie Uploaded
 *
 * Triggered when a selfie is uploaded to Cloud Storage.
 * Creates Firestore selfie document and updates ward stats.
 *
 * Storage Path Pattern: wards/{wardId}/selfies/{fileName}
 *
 * Flow:
 * 1. Selfie uploaded to Cloud Storage (via signed URL)
 * 2. This trigger fires automatically
 * 3. Extract wardId from file path
 * 4. Create selfie document in wards/{wardId}/selfies collection
 * 5. Increment totalSelfies counter in stats
 * 6. NO visit document is created (selfie-only upload)
 *
 * Phase 6 - Selfie Upload Pipeline
 */

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Handle selfie upload to Cloud Storage
 *
 * @param {Object} object - Cloud Storage object metadata
 */
async function onSelfieUploaded(object) {
  try {
    const filePath = object.name; // e.g., "wards/meadowview-1st/selfies/1737123456-abc123.jpg"
    const contentType = object.contentType;

    console.log('[onSelfieUploaded] File uploaded:', filePath);
    console.log('[onSelfieUploaded] Content type:', contentType);

    // Validate this is a selfie upload (not other storage events)
    if (!filePath || !filePath.includes('/selfies/')) {
      console.log('[onSelfieUploaded] Not a selfie upload, skipping');
      return null;
    }

    // Extract wardId from path: wards/{wardId}/selfies/{fileName}
    const pathParts = filePath.split('/');
    if (pathParts.length < 4 || pathParts[0] !== 'wards') {
      console.warn('[onSelfieUploaded] Invalid file path format:', filePath);
      return null;
    }

    const wardId = pathParts[1];
    const fileName = pathParts[pathParts.length - 1];

    console.log('[onSelfieUploaded] Ward ID:', wardId);
    console.log('[onSelfieUploaded] File name:', fileName);

    // Extract metadata from custom metadata (set by client during upload)
    const metadata = object.metadata || {};
    const mode = metadata.mode || 'kiosk';
    const uploadedBy = metadata.uploadedBy || null;
    const uploadSessionId = metadata.uploadSessionId || null;

    // Build Cloud Storage URL
    const bucket = object.bucket;
    const storageUrl = `gs://${bucket}/${filePath}`;

    console.log('[onSelfieUploaded] Creating Firestore document...');

    // Use transaction to atomically create selfie doc and update stats
    await db.runTransaction(async (transaction) => {
      const wardRef = db.collection('wards').doc(wardId);
      const statsRef = wardRef.collection('stats').doc('current');
      const selfiesRef = wardRef.collection('selfies');
      const selfieDocRef = selfiesRef.doc(); // Auto-generate ID

      // Read current stats
      const statsDoc = await transaction.get(statsRef);
      const currentStats = statsDoc.exists ? statsDoc.data() : {
        totalVisits: 0,
        totalBonusVisits: 0,
        totalSelfies: 0,
        squaresFilled: 0
      };

      // Create selfie document
      const selfieData = {
        uploadedBy: uploadedBy,
        mode: mode,
        originalUrl: storageUrl,
        thumbnailUrl: null, // TODO: Generate thumbnail in future phase
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadSessionId: uploadSessionId
      };

      transaction.set(selfieDocRef, selfieData);

      // Update stats - increment totalSelfies
      const newStats = {
        totalSelfies: (currentStats.totalSelfies || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(statsRef, newStats, { merge: true });

      console.log('[onSelfieUploaded] Transaction complete');
      console.log('[onSelfieUploaded] Selfie ID:', selfieDocRef.id);
      console.log('[onSelfieUploaded] New total selfies:', newStats.totalSelfies);
    });

    console.log('[onSelfieUploaded] Success');
    return null;

  } catch (error) {
    console.error('[onSelfieUploaded] Error:', error);
    // Don't throw - let Cloud Functions retry mechanism handle it
    return null;
  }
}

module.exports = { onSelfieUploaded };
