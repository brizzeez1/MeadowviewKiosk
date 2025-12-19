/**
 * Request Missionary Photo/Video Upload URL
 *
 * POST /api/v1/missionary/requestUpload
 *
 * Phase 8: Generates signed Cloud Storage URLs for family/friend uploads.
 * Validates token and file metadata, returns signed URL for direct upload.
 *
 * Request body:
 * {
 *   "token": "a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
 *   "fileName": "birthday-party.jpg",
 *   "contentType": "image/jpeg",
 *   "fileSizeBytes": 2458123
 * }
 *
 * Response:
 * {
 *   "uploadUrl": "https://storage.googleapis.com/...",
 *   "storagePath": "wards/meadowview/missionaries/gallery/abc123/uuid.jpg"
 * }
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  console.log('[requestUpload] Request received');

  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, fileName, contentType, fileSizeBytes } = req.body;

  // Validate input
  if (!token || !fileName || !contentType || !fileSizeBytes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate file size (100MB max per spec decision #10)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (fileSizeBytes > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File size exceeds 100MB limit' });
  }

  // Validate content type
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'Unsupported file type' });
  }

  try {
    const db = admin.firestore();

    // Validate token and find missionary
    let wardId = null;
    let missionaryId = null;
    let missionaryData = null;

    const wardsSnapshot = await db.collection('wards').get();

    for (const wardDoc of wardsSnapshot.docs) {
      const currentWardId = wardDoc.id;

      const missionariesSnapshot = await db
        .collection('wards')
        .doc(currentWardId)
        .collection('missionaries')
        .where('uploadToken', '==', token)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!missionariesSnapshot.empty) {
        wardId = currentWardId;
        missionaryId = missionariesSnapshot.docs[0].id;
        missionaryData = missionariesSnapshot.docs[0].data();
        break;
      }
    }

    if (!missionaryId) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    console.log('[requestUpload] Token validated for:', missionaryData.name);

    // Generate unique filename with UUID to prevent collisions
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // Storage path: wards/{wardId}/missionaries/gallery/{missionaryId}/{uniqueFileName}
    const storagePath = `wards/${wardId}/missionaries/gallery/${missionaryId}/${uniqueFileName}`;

    // Generate signed URL (valid for 15 minutes)
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
      extensionHeaders: {
        // Custom metadata for storage trigger
        'x-goog-meta-ward-id': wardId,
        'x-goog-meta-missionary-id': missionaryId,
        'x-goog-meta-uploaded-by': 'family',
        'x-goog-meta-original-filename': fileName
      }
    });

    console.log('[requestUpload] Signed URL generated:', storagePath);

    return res.status(200).json({
      uploadUrl: signedUrl,
      storagePath: storagePath
    });

  } catch (error) {
    console.error('[requestUpload] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
