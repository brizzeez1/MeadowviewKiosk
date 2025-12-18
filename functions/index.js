/**
 * Meadowview Ward Kiosk - Cloud Functions
 *
 * API Endpoints:
 * - POST /api/v1/temple/logVisit - Log temple visit (Phase 2)
 * - POST /api/v1/temple/logBonusVisit - Log bonus visit (convenience wrapper)
 * - POST /api/v1/mosaic/requestSelfieUpload - Generate signed URL for selfie upload (Phase 6)
 *
 * Storage Triggers:
 * - onSelfieUploaded - Process selfie uploads to Cloud Storage (Phase 6)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import API handlers - Temple 365
const { logVisit } = require('./src/temple/logVisit');
const { logBonusVisit } = require('./src/temple/logBonusVisit');

// Import API handlers - Mosaic (Phase 6)
const { requestSelfieUpload } = require('./src/mosaic/requestSelfieUpload');

// Import Storage Triggers - Mosaic (Phase 6)
const { onSelfieUploaded } = require('./src/mosaic/onSelfieUploaded');

/**
 * Main API endpoint
 *
 * Routes:
 * - POST /v1/temple/logVisit
 * - POST /v1/temple/logBonusVisit
 * - POST /v1/mosaic/requestSelfieUpload
 */
exports.api = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Route to handlers
  const path = req.path;

  try {
    // Temple 365 routes
    if (path === '/v1/temple/logVisit' && req.method === 'POST') {
      await logVisit(req, res);
    } else if (path === '/v1/temple/logBonusVisit' && req.method === 'POST') {
      await logBonusVisit(req, res);
    }
    // Mosaic routes (Phase 6)
    else if (path === '/v1/mosaic/requestSelfieUpload' && req.method === 'POST') {
      await requestSelfieUpload(req, res);
    }
    // 404 - Not found
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Storage Trigger - Selfie Uploaded
 *
 * Fires when a file is uploaded to Cloud Storage.
 * Processes selfies uploaded to: wards/{wardId}/selfies/{fileName}
 */
exports.onSelfieUploaded = functions.storage.object().onFinalize(async (object) => {
  return onSelfieUploaded(object);
});
