/**
 * Log Temple Visit API Handler
 *
 * POST /api/v1/temple/logVisit
 *
 * Features:
 * - Atomic collision handling with auto-assignment
 * - Firestore transactions for race-condition safety
 * - Idempotency via clientRequestId
 * - Supports regular visits (1-365) and bonus visits (null)
 *
 * Phase 2 - Core Implementation
 */

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Log a temple visit
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function logVisit(req, res) {
  try {
    // Parse request body
    const {
      wardId,
      mode,
      name,
      desiredSquareNumber,
      clientRequestId
    } = req.body;

    // Validate required fields
    if (!wardId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wardId, name'
      });
    }

    // Validate mode
    if (!mode || !['phone', 'kiosk'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode (must be phone or kiosk)'
      });
    }

    // Determine if this is a bonus visit
    const isBonusVisit = desiredSquareNumber === null || desiredSquareNumber === undefined;

    console.log('[logVisit]', {
      wardId,
      mode,
      name: name ? '[REDACTED]' : null,  // PII - do not log full name
      desiredSquareNumber,
      isBonusVisit,
      clientRequestId
    });

    // Execute transaction to log visit (IDEMPOTENCY FIX: moved check inside transaction)
    const result = await db.runTransaction(async (transaction) => {
      const wardRef = db.collection('wards').doc(wardId);
      const statsRef = wardRef.collection('stats').doc('current');
      const visitsCollectionRef = wardRef.collection('visits');
      const squaresCollectionRef = wardRef.collection('templeSquares');

      // Check for duplicate request INSIDE transaction (SECURITY FIX for race condition)
      if (clientRequestId) {
        const duplicateQuery = visitsCollectionRef
          .where('clientRequestId', '==', clientRequestId)
          .limit(1);

        const duplicateSnapshot = await transaction.get(duplicateQuery);

        if (!duplicateSnapshot.empty) {
          console.log('[logVisit] Duplicate request detected inside transaction');
          const doc = duplicateSnapshot.docs[0];
          const data = doc.data();

          // Return existing visit data (will be wrapped in response below)
          return {
            duplicate: true,
            visitId: doc.id,
            assignedSquareNumber: data.squareNumber,
            isBonusVisit: data.isBonusVisit,
            collisionResolved: data.collisionResolved || false,
            totalVisits: null,
            squaresFilled: null,
            totalBonusVisits: null
          };
        }
      }

      // Read current stats
      const statsDoc = await transaction.get(statsRef);
      const currentStats = statsDoc.exists ? statsDoc.data() : {
        totalVisits: 0,
        totalBonusVisits: 0,
        totalSelfies: 0,
        squaresFilled: 0
      };

      let assignedSquareNumber = null;
      let collisionResolved = false;

      if (isBonusVisit) {
        // Bonus visit - no square assignment
        assignedSquareNumber = null;
      } else {
        // Regular visit - attempt to claim desired square
        const desiredSquareRef = squaresCollectionRef.doc(String(desiredSquareNumber));
        const desiredSquareDoc = await transaction.get(desiredSquareRef);

        if (desiredSquareDoc.exists && !desiredSquareDoc.data().claimed) {
          // Square is available - claim it
          assignedSquareNumber = desiredSquareNumber;
          transaction.update(desiredSquareRef, {
            claimed: true,
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
            claimedByName: name
          });
        } else {
          // Collision - find next available square
          console.log('[logVisit] Collision detected, finding next available square');

          // Query for first available square
          const availableQuery = squaresCollectionRef
            .where('claimed', '==', false)
            .orderBy('squareNumber', 'asc')
            .limit(1);

          const availableSnapshot = await transaction.get(availableQuery);

          if (availableSnapshot.empty) {
            // No squares available - treat as bonus visit
            console.log('[logVisit] No squares available, converting to bonus visit');
            assignedSquareNumber = null;
          } else {
            // Claim first available square
            const availableSquare = availableSnapshot.docs[0];
            assignedSquareNumber = parseInt(availableSquare.id);
            collisionResolved = true;

            transaction.update(availableSquare.ref, {
              claimed: true,
              claimedAt: admin.firestore.FieldValue.serverTimestamp(),
              claimedByName: name
            });

            console.log('[logVisit] Auto-assigned square:', assignedSquareNumber);
          }
        }
      }

      // Create visit document
      const visitRef = visitsCollectionRef.doc();
      const visitData = {
        name: name,
        mode: mode,
        squareNumber: assignedSquareNumber,
        isBonusVisit: assignedSquareNumber === null,
        collisionResolved: collisionResolved,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        clientRequestId: clientRequestId || null
      };

      transaction.set(visitRef, visitData);

      // Update stats
      const newStats = {
        totalVisits: currentStats.totalVisits + 1,
        lastVisitAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (assignedSquareNumber === null) {
        // Bonus visit
        newStats.totalBonusVisits = (currentStats.totalBonusVisits || 0) + 1;
      } else {
        // Regular visit - increment squaresFilled
        newStats.squaresFilled = (currentStats.squaresFilled || 0) + 1;
      }

      transaction.set(statsRef, newStats, { merge: true });

      // Return result data
      return {
        visitId: visitRef.id,
        assignedSquareNumber: assignedSquareNumber,
        isBonusVisit: assignedSquareNumber === null,
        collisionResolved: collisionResolved,
        totalVisits: newStats.totalVisits,
        squaresFilled: newStats.squaresFilled,
        totalBonusVisits: newStats.totalBonusVisits
      };
    });

    console.log('[logVisit] Success:', result);

    // Return success response (handle duplicate flag from transaction)
    if (result.duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[logVisit] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { logVisit };
