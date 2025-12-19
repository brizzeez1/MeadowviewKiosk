/**
 * Validate Missionary Upload Token
 *
 * POST /api/v1/missionary/validateToken
 *
 * Phase 8: Validates secret upload tokens for family/friend photo uploads.
 * Returns missionary info if token is valid.
 *
 * Request body:
 * {
 *   "token": "a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 * }
 *
 * Response (valid):
 * {
 *   "valid": true,
 *   "missionary": {
 *     "id": "abc123",
 *     "name": "Sister Kylie Gorecki",
 *     "mission": "Poland Warsaw Mission"
 *   }
 * }
 *
 * Response (invalid):
 * {
 *   "valid": false
 * }
 */

const admin = require('firebase-admin');

module.exports = async (req, res) => {
  console.log('[validateToken] Request received');

  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, wardId } = req.body;

  // Validate input
  if (!token || typeof token !== 'string' || !wardId) {
    return res.status(400).json({ error: 'Missing required fields: token, wardId' });
  }

  try {
    const db = admin.firestore();

    // Query missionaries in specified ward with matching token
    const missionariesSnapshot = await db
      .collection('wards')
      .doc(wardId)
      .collection('missionaries')
      .where('uploadToken', '==', token)
      .where('active', '==', true) // Only active missionaries
      .limit(1)
      .get();

    if (missionariesSnapshot.empty) {
      console.log('[validateToken] Invalid token for ward:', wardId);
      return res.status(200).json({ valid: false });
    }

    // Token found!
    const missionaryDoc = missionariesSnapshot.docs[0];
    const missionaryData = missionaryDoc.data();

    console.log('[validateToken] Token validated for missionary in ward:', wardId);

    return res.status(200).json({
      valid: true,
      missionary: {
        id: missionaryDoc.id,
        wardId: wardId,
        name: missionaryData.name,
        mission: missionaryData.mission
      }
    });

  } catch (error) {
    console.error('[validateToken] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
