/**
 * On Missionary Photo Uploaded (Storage Trigger)
 *
 * Phase 8: Automatically creates gallery document when family/friends
 * upload photos/videos via the upload portal.
 *
 * Trigger: Storage object finalized
 * Path: wards/{wardId}/missionaries/gallery/{missionaryId}/*
 *
 * Auto-publishes to missionary gallery per spec decision #9.
 */

const admin = require('firebase-admin');

/**
 * Handle missionary photo/video upload
 * @param {object} object - Cloud Storage object metadata
 * @returns {Promise<void>}
 */
module.exports = async (object) => {
  const filePath = object.name;
  console.log('[onMissionaryPhotoUploaded] New file:', filePath);

  // Parse storage path: wards/{wardId}/missionaries/gallery/{missionaryId}/{filename}
  const pathParts = filePath.split('/');

  if (pathParts.length !== 6 || pathParts[0] !== 'wards' || pathParts[2] !== 'missionaries' || pathParts[3] !== 'gallery') {
    console.log('[onMissionaryPhotoUploaded] Skipping - not a missionary gallery upload');
    return;
  }

  const wardId = pathParts[1];
  const missionaryId = pathParts[4];
  const fileName = pathParts[5];

  console.log('[onMissionaryPhotoUploaded] Ward:', wardId, 'Missionary:', missionaryId);

  // Get custom metadata
  const uploadedBy = object.metadata?.['uploaded-by'] || 'family';
  const originalFileName = object.metadata?.['original-filename'] || fileName;

  // Get file metadata
  const contentType = object.contentType || '';
  const sizeBytes = parseInt(object.size, 10);

  // Build Cloud Storage URL
  const bucket = object.bucket;
  const storageUrl = `gs://${bucket}/${filePath}`;

  try {
    const db = admin.firestore();

    // Create gallery document (auto-published per spec decision #9)
    const galleryRef = db
      .collection('wards')
      .doc(wardId)
      .collection('missionaries')
      .doc(missionaryId)
      .collection('gallery')
      .doc();

    await galleryRef.set({
      url: storageUrl,
      originalFileName: originalFileName,
      contentType: contentType,
      sizeBytes: sizeBytes,
      uploadedBy: uploadedBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      featured: true // Auto-publish (spec decision #9)
    });

    console.log('[onMissionaryPhotoUploaded] ✅ Gallery document created:', galleryRef.id);

  } catch (error) {
    console.error('[onMissionaryPhotoUploaded] ❌ Error creating gallery document:', error);
    throw error;
  }
};
