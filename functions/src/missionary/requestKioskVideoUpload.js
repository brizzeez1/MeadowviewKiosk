/**
 * Request Kiosk Video Upload (API Handler)
 *
 * Phase 9: Generate signed Cloud Storage URL for kiosk-recorded missionary videos.
 *
 * Endpoint: POST /api/v1/missionary/kiosk/requestVideoUpload
 *
 * Request Body:
 * {
 *   wardId: string,
 *   missionaryId: string,
 *   fileSizeBytes: number,
 *   contentType: string
 * }
 *
 * Response:
 * {
 *   uploadUrl: string (signed URL, 15-minute expiration)
 * }
 *
 * Security:
 * - Kiosk-only endpoint (no authentication required)
 * - 50MB max file size (locked decision #11: kiosk videos capped at 30 seconds)
 * - Content-Type validation (video/* only)
 * - Storage rules enforce same restrictions
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle kiosk video upload request
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  console.log('[requestKioskVideoUpload] Request received:', req.body);

  const { wardId, missionaryId, fileSizeBytes, contentType } = req.body;

  // ============================================================
  // VALIDATION
  // ============================================================

  if (!wardId || !missionaryId || !fileSizeBytes || !contentType) {
    console.error('[requestKioskVideoUpload] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: wardId, missionaryId, fileSizeBytes, contentType' });
  }

  // Validate content type (video only)
  if (!contentType.startsWith('video/')) {
    console.error('[requestKioskVideoUpload] Invalid content type:', contentType);
    return res.status(400).json({ error: 'Invalid content type. Only video/* allowed.' });
  }

  // Validate file size (50MB max for 30-second videos)
  // Spec decision #11: 30-second kiosk videos should be ~5-15MB at 2.5 Mbps
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB safety margin
  if (fileSizeBytes > MAX_FILE_SIZE) {
    console.error('[requestKioskVideoUpload] File too large:', fileSizeBytes);
    return res.status(400).json({ error: `File size exceeds 50MB limit (kiosk videos capped at 30 seconds)` });
  }

  // ============================================================
  // VERIFY MISSIONARY EXISTS
  // ============================================================

  try {
    const db = admin.firestore();

    const missionaryRef = db
      .collection('wards')
      .doc(wardId)
      .collection('missionaries')
      .doc(missionaryId);

    const missionaryDoc = await missionaryRef.get();

    if (!missionaryDoc.exists) {
      console.error('[requestKioskVideoUpload] Missionary not found:', missionaryId);
      return res.status(404).json({ error: 'Missionary not found' });
    }

    const missionary = missionaryDoc.data();

    if (!missionary.active) {
      console.error('[requestKioskVideoUpload] Missionary not active:', missionaryId);
      return res.status(403).json({ error: 'Missionary is not active' });
    }

    console.log('[requestKioskVideoUpload] ✓ Missionary verified:', missionaryId);  // PII fix: log ID not name

  } catch (error) {
    console.error('[requestKioskVideoUpload] Error verifying missionary:', error);
    return res.status(500).json({ error: 'Failed to verify missionary' });
  }

  // ============================================================
  // GENERATE SIGNED UPLOAD URL
  // ============================================================

  try {
    const bucket = admin.storage().bucket();

    // Generate unique filename with UUID
    const fileExtension = contentType.split('/')[1] || 'webm';
    const uniqueFileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Storage path: wards/{wardId}/missionaries/videos/{missionaryId}/{fileName}
    const storagePath = `wards/${wardId}/missionaries/videos/${missionaryId}/${uniqueFileName}`;

    console.log('[requestKioskVideoUpload] Generating signed URL for:', storagePath);

    const file = bucket.file(storagePath);

    // Generate signed URL (15-minute expiration, same as other uploads)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
      extensionHeaders: {
        'x-goog-meta-uploaded-by': 'kiosk',
        'x-goog-meta-original-filename': uniqueFileName
      }
    });

    console.log('[requestKioskVideoUpload] ✅ Signed URL generated');

    res.status(200).json({
      uploadUrl: signedUrl
    });

  } catch (error) {
    console.error('[requestKioskVideoUpload] Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
