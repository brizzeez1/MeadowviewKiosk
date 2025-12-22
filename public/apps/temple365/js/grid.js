/**
 * Temple 365 Grid Rendering
 *
 * Renders the 365-square grid with real-time updates from Firestore
 */

(function() {
  'use strict';

  let _gridContainer = null;
  let _currentSquares = [];

  /**
   * Initialize the grid module
   */
  function init() {
    _gridContainer = document.getElementById('templeGrid');
    if (!_gridContainer) {
      console.error('[Grid] Grid container not found');
      return;
    }

    console.log('[Grid] Initialized');
  }

  /**
   * Render the 365 grid from squares data
   * @param {Array} squares - Array of square objects from Firestore
   */
  function render(squares) {
    if (!_gridContainer) {
      console.error('[Grid] Cannot render - not initialized');
      return;
    }

    _currentSquares = squares;

    // Clear existing grid
    _gridContainer.innerHTML = '';

    // Create 365 square elements
    for (let i = 1; i <= 365; i++) {
      const squareData = squares.find(s => parseInt(s.squareNumber) === i);
      const squareEl = createSquareElement(i, squareData);
      _gridContainer.appendChild(squareEl);
    }

    console.log('[Grid] Rendered 365 squares');
  }

  /**
   * Create a single square element
   * @param {number} squareNumber - Square number (1-365)
   * @param {Object|undefined} data - Square data from Firestore
   * @returns {HTMLElement} Square element
   */
  function createSquareElement(squareNumber, data) {
    const square = document.createElement('div');
    square.className = 'grid-square';
    square.dataset.square = squareNumber;

    if (data && data.claimed) {
      square.classList.add('claimed');
      square.title = `${data.claimedByName || 'Anonymous'} - ${formatDate(data.claimedAt)}`;
    } else {
      square.classList.add('unclaimed');
      square.title = `Square ${squareNumber} - Available`;
    }

    // Square number label
    const label = document.createElement('span');
    label.className = 'square-number';
    label.textContent = squareNumber;
    square.appendChild(label);

    // Click handler - open visit modal with this square pre-selected
    square.addEventListener('click', () => {
      if (window.Temple365Modal) {
        window.Temple365Modal.show(squareNumber);
      }
    });

    return square;
  }

  /**
   * Format timestamp for display
   * @param {Object} timestamp - Firestore timestamp
   * @returns {string} Formatted date
   */
  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) {
      return 'Unknown';
    }

    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error('[Grid] Error formatting date:', e);
      return 'Unknown';
    }
  }

  /**
   * Highlight a specific square (for animations, celebrations, etc.)
   * @param {number} squareNumber - Square to highlight
   */
  function highlightSquare(squareNumber) {
    const squareEl = _gridContainer.querySelector(`[data-square="${squareNumber}"]`);
    if (squareEl) {
      squareEl.classList.add('highlight');
      setTimeout(() => {
        squareEl.classList.remove('highlight');
      }, 2000);
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  window.Temple365Grid = {
    init,
    render,
    highlightSquare
  };

})();
