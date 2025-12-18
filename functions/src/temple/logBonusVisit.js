/**
 * Log Bonus Visit API Handler
 *
 * POST /api/v1/temple/logBonusVisit
 *
 * Convenience wrapper around logVisit with desiredSquareNumber=null
 * UI may use /logVisit directly for bonus visits (this is optional)
 *
 * Phase 2 - Core Implementation
 */

const { logVisit: logVisitHandler } = require('./logVisit');

/**
 * Log a bonus temple visit
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function logBonusVisit(req, res) {
  // Force desiredSquareNumber to null for bonus visits
  req.body.desiredSquareNumber = null;

  // Delegate to logVisit handler
  return logVisitHandler(req, res);
}

module.exports = { logBonusVisit };
