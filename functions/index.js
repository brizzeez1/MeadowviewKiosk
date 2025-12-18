/**
 * Meadowview Ward Kiosk - Cloud Functions
 *
 * API Endpoints:
 * - POST /api/v1/temple/logVisit - Log temple visit (Phase 2)
 * - POST /api/v1/temple/logBonusVisit - Log bonus visit (convenience wrapper)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import API handlers
const { logVisit } = require('./src/temple/logVisit');
const { logBonusVisit } = require('./src/temple/logBonusVisit');

/**
 * Main API endpoint
 *
 * Routes:
 * - POST /v1/temple/logVisit
 * - POST /v1/temple/logBonusVisit
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
    if (path === '/v1/temple/logVisit' && req.method === 'POST') {
      await logVisit(req, res);
    } else if (path === '/v1/temple/logBonusVisit' && req.method === 'POST') {
      await logBonusVisit(req, res);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
