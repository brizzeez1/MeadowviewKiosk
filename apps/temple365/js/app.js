/**
 * Temple 365 Main App
 *
 * Initializes all modules and sets up real-time Firestore sync
 */

(function() {
  'use strict';

  let _unsubscribeConfig = null;
  let _unsubscribeStats = null;
  let _unsubscribeSquares = null;

  /**
   * Initialize the app
   */
  async function init() {
    console.log('[App] Temple 365 PWA initializing...');
    console.log('[App] Mode:', TEMPLE365_CONFIG.mode);
    console.log('[App] Ward ID:', TEMPLE365_CONFIG.wardId);

    // Wait for Firebase to be ready
    if (!window.db) {
      console.error('[App] Firebase not initialized');
      return;
    }

    // Initialize modules
    initModules();

    // Subscribe to real-time updates
    subscribeToRealtimeUpdates();

    console.log('[App] Initialization complete');
  }

  /**
   * Initialize all modules
   */
  function initModules() {
    // Initialize grid
    if (window.Temple365Grid) {
      window.Temple365Grid.init();
    }

    // Initialize modal
    if (window.Temple365Modal) {
      window.Temple365Modal.init(TEMPLE365_CONFIG);
    }

    // Initialize keyboard (kiosk mode only)
    if (TEMPLE365_CONFIG.isKioskMode && window.OnScreenKeyboard) {
      window.OnScreenKeyboard.init();
    }

    console.log('[App] Modules initialized');
  }

  /**
   * Subscribe to real-time Firestore updates
   */
  function subscribeToRealtimeUpdates() {
    console.log('[App] Subscribing to real-time updates...');

    // Subscribe to ward config
    _unsubscribeConfig = window.Temple365API.subscribeToWardConfig((config) => {
      console.log('[App] Ward config updated:', config);
      updateWardConfig(config);
    });

    // Subscribe to ward stats
    _unsubscribeStats = window.Temple365API.subscribeToWardStats((stats) => {
      console.log('[App] Ward stats updated:', stats);
      updateWardStats(stats);
    });

    // Subscribe to temple squares
    _unsubscribeSquares = window.Temple365API.subscribeToTempleSquares((squares) => {
      console.log('[App] Temple squares updated, count:', squares.length);
      updateTempleSquares(squares);
    });

    console.log('[App] Real-time subscriptions active');
  }

  /**
   * Update UI with ward config
   * @param {Object} config - Ward configuration
   */
  function updateWardConfig(config) {
    // Update page title
    document.title = `Temple 365 - ${config.name || 'Ward'}`;

    // Update header if exists
    const headerTitle = document.getElementById('wardName');
    if (headerTitle) {
      headerTitle.textContent = config.name || 'Ward';
    }

    const templeAffiliation = document.getElementById('templeAffiliation');
    if (templeAffiliation) {
      templeAffiliation.textContent = config.templeAffiliation || 'Temple';
    }
  }

  /**
   * Update UI with ward stats
   * @param {Object} stats - Ward statistics
   */
  function updateWardStats(stats) {
    // Update counters
    const totalVisitsEl = document.getElementById('totalVisits');
    if (totalVisitsEl) {
      totalVisitsEl.textContent = stats.totalVisits || 0;
    }

    const squaresFilledEl = document.getElementById('squaresFilled');
    if (squaresFilledEl) {
      squaresFilledEl.textContent = `${stats.squaresFilled || 0} / 365`;
    }

    const bonusVisitsEl = document.getElementById('bonusVisits');
    if (bonusVisitsEl) {
      bonusVisitsEl.textContent = stats.totalBonusVisits || 0;
    }

    // Show/hide bonus visit button
    const btnBonusVisit = document.getElementById('btnBonusVisit');
    if (btnBonusVisit) {
      if (stats.squaresFilled >= 365) {
        btnBonusVisit.style.display = 'block';
      } else {
        btnBonusVisit.style.display = 'none';
      }
    }
  }

  /**
   * Update grid with temple squares
   * @param {Array} squares - Temple squares data
   */
  function updateTempleSquares(squares) {
    if (window.Temple365Grid) {
      window.Temple365Grid.render(squares);
    }
  }

  /**
   * Cleanup subscriptions
   */
  function cleanup() {
    console.log('[App] Cleaning up subscriptions...');

    if (_unsubscribeConfig) _unsubscribeConfig();
    if (_unsubscribeStats) _unsubscribeStats();
    if (_unsubscribeSquares) _unsubscribeSquares();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle bonus visit button click
   */
  function handleBonusVisitClick() {
    if (window.Temple365Modal) {
      window.Temple365Modal.show(null); // null = bonus visit
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Wire up bonus visit button
  window.addEventListener('load', () => {
    const btnBonusVisit = document.getElementById('btnBonusVisit');
    if (btnBonusVisit) {
      btnBonusVisit.addEventListener('click', handleBonusVisitClick);
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  console.log('[App] Module loaded');

})();
