/**
 * Meadowview Ward Kiosk - Cloud Functions
 *
 * API Endpoints:
 * - POST /api/v1/temple/logVisit - Log temple visit (Phase 2)
 * - POST /api/v1/temple/logBonusVisit - Log bonus visit (convenience wrapper)
 * - POST /api/v1/mosaic/requestSelfieUpload - Generate signed URL for selfie upload (Phase 6)
 * - POST /api/v1/missionary/validateToken - Validate upload token (Phase 8)
 * - POST /api/v1/missionary/requestUpload - Generate signed URL for missionary photo upload (Phase 8)
 * - POST /api/v1/missionary/kiosk/requestVideoUpload - Generate signed URL for kiosk video upload (Phase 9)
 *
 * Storage Triggers:
 * - onSelfieUploaded - Process selfie uploads to Cloud Storage (Phase 6)
 * - onMissionaryPhotoUploaded - Process missionary photo uploads (Phase 8)
 * - onMissionaryVideoUploaded - Process missionary video uploads from kiosk (Phase 9)
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

// Import API handlers - Missionary (Phase 8)
const validateToken = require('./src/missionary/validateToken');
const requestUpload = require('./src/missionary/requestUpload');

// Import API handlers - Missionary Kiosk (Phase 9)
const requestKioskVideoUpload = require('./src/missionary/requestKioskVideoUpload');

// Import Storage Triggers - Missionary (Phase 8)
const onMissionaryPhotoUploaded = require('./src/missionary/onMissionaryPhotoUploaded');

// Import Storage Triggers - Missionary Kiosk (Phase 9)
const onMissionaryVideoUploaded = require('./src/missionary/onMissionaryVideoUploaded');

/**
 * Main API endpoint
 *
 * Routes:
 * - POST /v1/temple/logVisit
 * - POST /v1/temple/logBonusVisit
 * - POST /v1/mosaic/requestSelfieUpload
 * - POST /v1/missionary/validateToken
 * - POST /v1/missionary/requestUpload
 * - POST /v1/missionary/kiosk/requestVideoUpload
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
    // Missionary routes (Phase 8)
    else if (path === '/v1/missionary/validateToken' && req.method === 'POST') {
      await validateToken(req, res);
    }
    else if (path === '/v1/missionary/requestUpload' && req.method === 'POST') {
      await requestUpload(req, res);
    }
    // Missionary kiosk routes (Phase 9)
    else if (path === '/v1/missionary/kiosk/requestVideoUpload' && req.method === 'POST') {
      await requestKioskVideoUpload(req, res);
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

/**
 * Storage Trigger - Missionary Photo Uploaded
 *
 * Fires when a file is uploaded to Cloud Storage.
 * Processes missionary photos uploaded to: wards/{wardId}/missionaries/gallery/{missionaryId}/{fileName}
 * Auto-publishes to missionary gallery per spec decision #9.
 */
exports.onMissionaryPhotoUploaded = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  // Only process missionary gallery uploads
  if (filePath && filePath.includes('/missionaries/gallery/')) {
    return onMissionaryPhotoUploaded(object);
  }

  // Ignore other uploads
  return null;
});

/**
 * Storage Trigger - Missionary Video Uploaded
 *
 * Fires when a file is uploaded to Cloud Storage.
 * Processes missionary videos uploaded from kiosk: wards/{wardId}/missionaries/videos/{missionaryId}/{fileName}
 * Auto-publishes to missionary gallery per spec decision #9.
 * Kiosk videos capped at 30 seconds (locked decision #11).
 */
exports.onMissionaryVideoUploaded = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  // Only process missionary video uploads from kiosk
  if (filePath && filePath.includes('/missionaries/videos/')) {
    return onMissionaryVideoUploaded(object);
  }

  // Ignore other uploads
  return null;
});
