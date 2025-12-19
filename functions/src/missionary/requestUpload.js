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

  // Validate input - contentType is now optional (can be empty for iPhone HEIC)
  if (!token || !fileName || !fileSizeBytes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate file size (100MB max per spec decision #10)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (fileSizeBytes > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File size exceeds 100MB limit' });
  }

  // Validate file type by extension (fallback for empty MIME type - iPhone HEIC fix)
  const fileExtension = fileName.toLowerCase().split('.').pop();
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'mp4', 'mov', 'avi'];

  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  // Accept if EITHER MIME type is valid OR extension is valid
  const hasValidMimeType = contentType && ALLOWED_MIME_TYPES.includes(contentType);
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

  if (!hasValidMimeType && !hasValidExtension) {
    return res.status(400).json({ error: 'Unsupported file type' });
  }

  // Infer content type from extension if not provided (iPhone HEIC fix)
  function inferContentType(ext) {
    const map = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo'
    };
    return map[ext] || 'application/octet-stream';
  }

  // Use provided content type or infer from extension
  const effectiveContentType = contentType || inferContentType(fileExtension);

  // Extract wardId from request
  let wardId = req.body.wardId;

  // For backward compatibility, try to extract from token validation if not provided
  // In production, wardId should always be provided by client
  if (!wardId) {
    console.warn('[requestUpload] wardId not provided - this is deprecated behavior');
    return res.status(400).json({ error: 'Missing required field: wardId' });
  }

  try {
    const db = admin.firestore();

    // Validate token and find missionary in specified ward
    const missionariesSnapshot = await db
      .collection('wards')
      .doc(wardId)
      .collection('missionaries')
      .where('uploadToken', '==', token)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (missionariesSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const missionaryId = missionariesSnapshot.docs[0].id;
    const missionaryData = missionariesSnapshot.docs[0].data();

    console.log('[requestUpload] Token validated for missionary in ward:', wardId);

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
      contentType: effectiveContentType,
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
