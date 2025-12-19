/**
 * Request Selfie Upload API Handler
 *
 * POST /api/v1/mosaic/requestSelfieUpload
 *
 * Generates a signed Cloud Storage URL for direct client upload.
 * This enables selfie-only uploads WITHOUT creating visit documents.
 *
 * Flow:
 * 1. Client requests signed URL
 * 2. Client uploads image directly to Cloud Storage via signed URL
 * 3. Storage trigger (onSelfieUploaded) creates Firestore selfie doc
 * 4. NO visit document is created (selfie-only)
 *
 * Phase 6 - Selfie Upload Pipeline
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate signed upload URL for selfie
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function requestSelfieUpload(req, res) {
  try {
    // Parse request body
    const {
      wardId,
      mode,
      uploadedBy
    } = req.body;

    // Validate required fields
    if (!wardId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: wardId'
      });
    }

    // Validate mode
    if (!mode || !['kiosk', 'upload-portal'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode (must be kiosk or upload-portal)'
      });
    }

    console.log('[requestSelfieUpload]', {
      wardId,
      mode,
      uploadedBy: uploadedBy || 'anonymous'
    });

    // Generate unique file ID using UUID v4
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.jpg`;
    const filePath = `wards/${wardId}/selfies/${fileName}`;

    console.log('[requestSelfieUpload] Generated file path:', filePath);

    // Get Cloud Storage bucket
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Generate signed URL for upload (valid for 15 minutes)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'image/jpeg'
    });

    console.log('[requestSelfieUpload] Signed URL generated');

    // Store metadata for storage trigger to use
    // We'll pass this via custom metadata when the client uploads
    const metadata = {
      wardId,
      mode,
      uploadedBy: uploadedBy || null,
      uploadSessionId: uniqueId,
      requestedAt: new Date().toISOString()
    };

    // Return signed URL and metadata
    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: signedUrl,
        filePath: filePath,
        uploadSessionId: uniqueId,
        expiresIn: 900, // 15 minutes in seconds
        metadata: metadata
      }
    });

  } catch (error) {
    console.error('[requestSelfieUpload] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { requestSelfieUpload };
