/**
 * Temple 365 Celebration Module
 *
 * Confetti animation and toast message (2-second auto-dismiss per spec)
 */

(function() {
  'use strict';

  const CONFETTI_DURATION = 2000; // 2 seconds per spec (Locked Decision #3)

  /**
   * Show celebration for a visit
   * @param {Object} visitResult - Result from logVisit API
   */
  function celebrate(visitResult) {
    const {
      assignedSquareNumber,
      isBonusVisit,
      totalVisits,
      squaresFilled,
      collisionResolved
    } = visitResult.data || visitResult;

    // Show confetti
    showConfetti();

    // Show toast message
    let message = '';
    if (isBonusVisit) {
      message = `Bonus Visit #${totalVisits - 365} logged! 🎉`;
    } else if (collisionResolved) {
      message = `Square ${assignedSquareNumber} assigned! (auto-reassigned)`;
    } else {
      message = `Square ${assignedSquareNumber} claimed! 🎉`;
    }

    showToast(message);

    // Highlight the square
    if (window.Temple365Grid) {
      window.Temple365Grid.highlightSquare(assignedSquareNumber);
    }
  }

  /**
   * Show confetti animation
   */
  function showConfetti() {
    // Simple confetti using canvas-confetti library (if loaded)
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      console.warn('[Celebration] confetti library not loaded');
    }
  }

  /**
   * Show toast message (2-second auto-dismiss)
   * @param {string} message - Message to display
   */
  function showToast(message) {
    // Remove existing toast
    const existingToast = document.getElementById('celebrationToast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'celebrationToast';
    toast.className = 'celebration-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger show animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300); // Wait for fade-out animation
    }, CONFETTI_DURATION);
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  window.Temple365Celebration = {
    celebrate
  };

  console.log('[Celebration] Module loaded');

})();
