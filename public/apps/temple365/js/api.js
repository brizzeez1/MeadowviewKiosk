/**
 * Temple 365 API Client
 *
 * ARCHITECTURE:
 * - READS: Firestore client SDK with onSnapshot listeners (real-time sync)
 * - WRITES: Cloud Functions API (transactional, collision-safe)
 */

(function() {
  'use strict';

  const wardId = TEMPLE365_CONFIG.wardId;
  const apiBaseUrl = TEMPLE365_CONFIG.apiBaseUrl;
  const mode = TEMPLE365_CONFIG.mode;

  // ============================================================================
  // REAL-TIME READS (Firestore onSnapshot)
  // ============================================================================

  /**
   * Subscribe to ward configuration
   * @param {Function} callback - Called with config object on each update
   * @returns {Function} Unsubscribe function
   */
  function subscribeToWardConfig(callback) {
    console.log('[API] Subscribing to ward config:', wardId);

    return window.db.collection('wards').doc(wardId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          console.log('[API] Ward config updated');
          callback(doc.data());
        } else {
          console.warn('[API] Ward config not found, using defaults');
          callback({
            name: 'Ward',
            templeAffiliation: 'Temple',
            timezone: 'America/Denver'
          });
        }
      },
      (error) => {
        console.error('[API] Error subscribing to ward config:', error);
        callback({
          name: 'Ward',
          templeAffiliation: 'Temple',
          timezone: 'America/Denver'
        });
      }
    );
  }

  /**
   * Subscribe to ward stats
   * @param {Function} callback - Called with stats object on each update
   * @returns {Function} Unsubscribe function
   */
  function subscribeToWardStats(callback) {
    console.log('[API] Subscribing to ward stats:', wardId);

    return window.db.collection('wards').doc(wardId).collection('stats').doc('current').onSnapshot(
      (doc) => {
        if (doc.exists) {
          console.log('[API] Ward stats updated');
          callback(doc.data());
        } else {
          console.warn('[API] Ward stats not found, using defaults');
          callback({
            totalVisits: 0,
            totalBonusVisits: 0,
            totalSelfies: 0,
            squaresFilled: 0,
            lastVisitAt: null
          });
        }
      },
      (error) => {
        console.error('[API] Error subscribing to ward stats:', error);
        callback({
          totalVisits: 0,
          totalBonusVisits: 0,
          totalSelfies: 0,
          squaresFilled: 0,
          lastVisitAt: null
        });
      }
    );
  }

  /**
   * Subscribe to temple squares (365 grid)
   * @param {Function} callback - Called with array of square objects on each update
   * @returns {Function} Unsubscribe function
   */
  function subscribeToTempleSquares(callback) {
    console.log('[API] Subscribing to temple squares:', wardId);

    return window.db.collection('wards').doc(wardId).collection('templeSquares')
      .orderBy('squareNumber', 'asc')
      .onSnapshot(
        (snapshot) => {
          const squares = [];
          snapshot.forEach((doc) => {
            squares.push({
              squareNumber: doc.id,
              ...doc.data()
            });
          });
          console.log('[API] Temple squares updated, count:', squares.length);
          callback(squares);
        },
        (error) => {
          console.error('[API] Error subscribing to temple squares:', error);
          callback([]);
        }
      );
  }

  // ============================================================================
  // TRANSACTIONAL WRITES (Cloud Functions API)
  // ============================================================================

  /**
   * Log a temple visit (regular or bonus)
   * @param {string} name - Visitor name
   * @param {number|null} desiredSquareNumber - Desired square (1-365) or null for bonus
   * @param {File|null} selfieFile - Optional selfie file
   * @returns {Promise<Object>} Result with assignedSquareNumber, isBonusVisit, etc.
   */
  async function logVisit(name, desiredSquareNumber, selfieFile) {
    console.log('[API] Logging visit:', { name, desiredSquareNumber, hasSelfie: !!selfieFile });

    // Generate client request ID for idempotency
    const clientRequestId = `${mode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const requestBody = {
      wardId: wardId,
      mode: mode,
      name: name,
      desiredSquareNumber: desiredSquareNumber,
      clientRequestId: clientRequestId
    };

    // TODO: Handle selfie upload via signed URL in Phase 6
    // For now, selfieFile is ignored (visits log without selfies)

    try {
      const response = await fetch(`${apiBaseUrl}/v1/temple/logVisit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[API] Visit logged successfully:', result);
      return result;

    } catch (error) {
      console.error('[API] Error logging visit:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  window.Temple365API = {
    subscribeToWardConfig,
    subscribeToWardStats,
    subscribeToTempleSquares,
    logVisit
  };

  console.log('[API] Temple365API initialized');

})();
