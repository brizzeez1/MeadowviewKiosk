/* ================================================================
   APP.JS - MAIN APPLICATION ENTRY POINT
   ================================================================
   This is the main JavaScript file that initializes and controls
   the entire kiosk application.
   
   RESPONSIBILITIES:
   - Initialize all modules
   - Manage application state (state machine)
   - Handle state transitions
   - Manage inactivity timer
   - Coordinate between modules
   
   STATE MACHINE:
   The app uses a simple state machine to control which screen
   is displayed. States include:
   - SCREENSAVER (default/idle state)
   - HOME (main menu)
   - TEMPLE_365
   - SELFIE
   - BULLETIN
   - YOUTH, PRIMARY, MIRACLES, MISSIONARIES, CALENDAR (Phase 2)
   ================================================================ */

const KioskApp = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: STATE DEFINITIONS
       ============================================================
       All possible application states.
       ============================================================ */
    
    const STATES = {
        SCREENSAVER: 'SCREENSAVER',
        HOME: 'HOME',
        TEMPLE_365: 'TEMPLE_365',
        SELFIE: 'SELFIE',
        BULLETIN: 'BULLETIN',
        MISSIONARIES: 'MISSIONARIES',
        MISSIONARY_DETAIL: 'MISSIONARY_DETAIL',
        // Phase 2 states
        YOUTH: 'YOUTH',
        PRIMARY: 'PRIMARY',
        MIRACLES: 'MIRACLES',
        CALENDAR: 'CALENDAR'
    };


    /* ============================================================
       SECTION 2: PRIVATE VARIABLES
       ============================================================ */
    
    // Current application state
    let _currentState = null;
    
    // Previous state (for back navigation)
    let _previousState = null;
    
    // Inactivity timer reference
    let _inactivityTimer = null;
    
    // Is app initialized?
    let _isInitialized = false;


    /* ============================================================
       SECTION 3: INITIALIZATION
       ============================================================ */
    
    /**
     * Initialize the entire application.
     * This is called when the DOM is ready.
     */
    function init() {
        console.log('[KioskApp] Starting initialization...');
        
        // Initialize all modules in order
        try {
            // Views must be initialized first to set up the DOM
            Views.init();

            // Initialize screensaver
            Screensaver.init();

            // Initialize home screen
            HomeScreen.init();

            // Initialize missionary modules
            MissionarySpotlight.init();
            MissionaryDetail.init();

            // Initialize floating QR code
            FloatingQR.init();

            // Initialize Phase 2 placeholders
            Phase2Placeholders.initAll();

            // Initialize selfie capture module
            SelfieCapture.init();

            // Initialize Temple 365 video module
            Temple365Video.init();

            // Set up event listeners
            setupEventListeners();

            // Set up inactivity timer
            setupInactivityTimer();

            // Start in screensaver state
            setState(STATES.SCREENSAVER);

            _isInitialized = true;

            console.log('[KioskApp] Initialization complete!');

            // Optional: Check backend health
            checkBackendHealth();

        } catch (error) {
            console.error('[KioskApp] Initialization failed:', error);
        }
    }
    
    /**
     * Check if the backend is reachable.
     */
    async function checkBackendHealth() {
        const isHealthy = await ApiClient.checkHealth();
        
        if (isHealthy) {
            ConfigLoader.debugLog('Backend is reachable');
        } else {
            console.warn('[KioskApp] Backend not reachable at:', ConfigLoader.getApiBaseUrl());
            console.warn('[KioskApp] Make sure the Python server is running.');
        }
    }


    /* ============================================================
       SECTION 4: STATE MANAGEMENT
       ============================================================ */
    
    /**
     * Get the current application state.
     * @returns {string} Current state name
     */
    function getState() {
        return _currentState;
    }
    
    /**
     * Set the application state.
     * @param {string} newState - The state to transition to
     */
    function setState(newState) {
        // Validate state
        if (!STATES[newState]) {
            console.error('[KioskApp] Invalid state:', newState);
            return;
        }
        
        // Skip if already in this state
        if (_currentState === newState) {
            return;
        }
        
        // Log state change
        if (ConfigLoader.shouldLogStateChanges()) {
            console.log(`[KioskApp] State: ${_currentState} → ${newState}`);
        }
        
        // Store previous state
        _previousState = _currentState;
        
        // Deactivate old state
        if (_currentState) {
            deactivateState(_currentState);
        }
        
        // Update current state
        _currentState = newState;
        
        // Activate new state
        activateState(newState);
        
        // Reset inactivity timer (except for screensaver)
        if (newState !== STATES.SCREENSAVER) {
            resetInactivityTimer();
        }
    }
    
    /**
     * Go back to the previous state.
     */
    function goBack() {
        if (_previousState) {
            setState(_previousState);
        } else {
            setState(STATES.HOME);
        }
    }
    
    /**
     * Activate a state (show its screen and run activation logic).
     * @param {string} state - The state to activate
     */
    function activateState(state) {
        // Show the corresponding screen
        Views.showScreen(state);
        
        // Run state-specific activation
        switch (state) {
            case STATES.SCREENSAVER:
                Screensaver.activate();
                break;
                
            case STATES.HOME:
                HomeScreen.activate();
                break;
                
            case STATES.TEMPLE_365:
                Views.renderTemple365View();
                Temple365Video.activate();
                break;

            case STATES.SELFIE:
                Views.renderSelfieView();
                SelfieCapture.activate();
                break;
                
            case STATES.BULLETIN:
                Views.renderBulletinView();
                break;
                
            // Phase 2 states
            case STATES.YOUTH:
                Phase2Placeholders.activateYouth();
                break;
                
            case STATES.PRIMARY:
                Phase2Placeholders.activatePrimary();
                break;
                
            case STATES.MIRACLES:
                Phase2Placeholders.activateMiracles();
                break;
                
            case STATES.MISSIONARIES:
                MissionarySpotlight.activate();
                break;

            case STATES.MISSIONARY_DETAIL:
                // Missionary ID will be passed via event detail
                // This will be handled by the event listener
                break;

            case STATES.CALENDAR:
                Phase2Placeholders.activateCalendar();
                break;
        }
    }
    
    /**
     * Deactivate a state (run cleanup logic).
     * @param {string} state - The state to deactivate
     */
    function deactivateState(state) {
        switch (state) {
            case STATES.SCREENSAVER:
                Screensaver.deactivate();
                break;

            case STATES.HOME:
                HomeScreen.deactivate();
                break;

            case STATES.MISSIONARIES:
                MissionarySpotlight.deactivate();
                break;

            case STATES.MISSIONARY_DETAIL:
                MissionaryDetail.deactivate();
                break;

            case STATES.SELFIE:
                SelfieCapture.deactivate();
                break;

            case STATES.TEMPLE_365:
                Temple365Video.deactivate();
                break;
        }
    }


    /* ============================================================
       SECTION 5: EVENT LISTENERS
       ============================================================ */
    
    /**
     * Set up all event listeners for navigation and interaction.
     */
    function setupEventListeners() {
        // Listen for screensaver exit
        window.addEventListener('screensaver-exit', handleScreensaverExit);

        // Listen for navigation requests from other modules
        window.addEventListener('navigate', handleNavigate);

        // Listen for missionary detail navigation
        window.addEventListener('navigate-missionary-detail', handleMissionaryDetailNavigate);

        // Listen for user activity (for inactivity timer)
        document.addEventListener('click', handleUserActivity);
        document.addEventListener('touchstart', handleUserActivity);
        document.addEventListener('mousemove', handleUserActivity);
        document.addEventListener('keypress', handleUserActivity);

        ConfigLoader.debugLog('Event listeners set up');
    }
    
    /**
     * Handle screensaver exit event.
     */
    function handleScreensaverExit() {
        setState(STATES.HOME);
    }
    
    /**
     * Handle navigation event from other modules.
     * @param {CustomEvent} event - The navigation event
     */
    function handleNavigate(event) {
        const { state } = event.detail;
        if (state && STATES[state]) {
            setState(state);
        }
    }

    /**
     * Handle missionary detail navigation event.
     * @param {CustomEvent} event - The navigation event with missionary ID
     */
    function handleMissionaryDetailNavigate(event) {
        const { missionaryId } = event.detail;

        // Store the missionary ID for the detail view
        _currentState = STATES.MISSIONARY_DETAIL;

        // Show the missionary detail screen
        Views.showScreen('MISSIONARY_DETAIL');

        // Activate the detail view with the specific missionary
        MissionaryDetail.activate(missionaryId);

        // Reset inactivity timer
        resetInactivityTimer();
    }

    /**
     * Handle any user activity.
     */
    function handleUserActivity() {
        // Only reset timer if not in screensaver
        if (_currentState !== STATES.SCREENSAVER) {
            resetInactivityTimer();
        }
    }


    /* ============================================================
       SECTION 6: INACTIVITY TIMER
       ============================================================
       Returns to screensaver after a period of inactivity.
       ============================================================ */
    
    /**
     * Set up the inactivity timer.
     */
    function setupInactivityTimer() {
        if (!ConfigLoader.isInactivityEnabled()) {
            ConfigLoader.debugLog('Inactivity timer disabled');
            return;
        }
        
        ConfigLoader.debugLog('Inactivity timer set up');
    }
    
    /**
     * Reset the inactivity timer.
     */
    function resetInactivityTimer() {
        // Clear existing timer
        if (_inactivityTimer) {
            clearTimeout(_inactivityTimer);
        }
        
        // Don't set timer if disabled
        if (!ConfigLoader.isInactivityEnabled()) {
            return;
        }
        
        // Don't set timer if already in screensaver
        if (_currentState === STATES.SCREENSAVER) {
            return;
        }
        
        // Set new timer
        const timeout = ConfigLoader.getInactivityTimeout();
        _inactivityTimer = setTimeout(() => {
            handleInactivityTimeout();
        }, timeout);
    }
    
    /**
     * Handle inactivity timeout.
     */
    function handleInactivityTimeout() {
        ConfigLoader.debugLog('Inactivity timeout reached, returning to screensaver');
        setState(STATES.SCREENSAVER);
    }
    
    /**
     * Stop the inactivity timer completely.
     */
    function stopInactivityTimer() {
        if (_inactivityTimer) {
            clearTimeout(_inactivityTimer);
            _inactivityTimer = null;
        }
    }


    /* ============================================================
       SECTION 7: UTILITY FUNCTIONS
       ============================================================ */
    
    /**
     * Check if the app is initialized.
     * @returns {boolean} True if initialized
     */
    function isInitialized() {
        return _isInitialized;
    }
    
    /**
     * Force refresh the current view.
     */
    function refreshCurrentView() {
        activateState(_currentState);
    }
    
    /**
     * Get all available states.
     * @returns {Object} States object
     */
    function getStates() {
        return { ...STATES };
    }


    /* ============================================================
       SECTION 8: PUBLIC API
       ============================================================ */
    
    return {
        // Initialization
        init: init,
        isInitialized: isInitialized,
        
        // State management
        getState: getState,
        setState: setState,
        goBack: goBack,
        getStates: getStates,
        
        // Inactivity timer
        resetInactivityTimer: resetInactivityTimer,
        stopInactivityTimer: stopInactivityTimer,
        
        // Utilities
        refreshCurrentView: refreshCurrentView,
        
        // Constants
        STATES: STATES
    };

})();
// ============================================================
// Kiosk <-> Temple 365 integration for optional selfie
// ============================================================

// Allowed message types from Temple 365 iframe
const ALLOWED_MESSAGE_TYPES = [
    'TEMPLE_VISIT_LOGGED',
    'NAVIGATE_TO_SELFIE'
];

// Security token for postMessage validation (optional additional security)
const MESSAGE_SOURCE_TOKEN = 'Temple365';

// 1) Helper: go to the Selfie screen using the state machine
function goToSelfieView() {
  // Use the KioskApp state machine directly for reliable navigation
  if (window.KioskApp && typeof KioskApp.setState === 'function') {
    console.log('[Kiosk] Navigating to SELFIE via state machine');
    KioskApp.setState('SELFIE');
  } else {
    // Fallback: dispatch navigation event
    console.log('[Kiosk] Navigating to SELFIE via event');
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { state: 'SELFIE' }
    }));
  }
}

// 2) Listen for messages coming from the Temple 365 iframe
window.addEventListener('message', function(event) {
  // SECURITY: Validate origin - only accept from Google Apps Script
  if (!event.origin || !event.origin.includes('script.google.com')) {
    console.warn('[Kiosk] Rejected message from unauthorized origin:', event.origin);
    return;
  }

  var data = event.data;

  // SECURITY: Validate message structure
  if (!data || typeof data !== 'object') {
    return;
  }

  // SECURITY: Validate source token
  if (data.source !== MESSAGE_SOURCE_TOKEN) {
    console.warn('[Kiosk] Rejected message with invalid source:', data.source);
    return;
  }

  // SECURITY: Validate message type
  if (!data.type || ALLOWED_MESSAGE_TYPES.indexOf(data.type) === -1) {
    console.warn('[Kiosk] Rejected message with invalid type:', data.type);
    return;
  }

  console.log('[Kiosk] Received valid message from Temple 365:', data.type);

  // Handle TEMPLE_VISIT_LOGGED - show selfie prompt if no selfie was uploaded
  if (data.type === 'TEMPLE_VISIT_LOGGED') {
    console.log('[Kiosk] Visit logged:', data);

    // If they already uploaded a selfie on the tracker page, no need to ask
    if (data.hasSelfie) {
      return;
    }

    var modal = document.getElementById('selfiePromptModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Handle NAVIGATE_TO_SELFIE - direct navigation request from iframe
  if (data.type === 'NAVIGATE_TO_SELFIE') {
    console.log('[Kiosk] Navigation request to selfie screen');
    goToSelfieView();
  }
});

// 3) Wire up the Yes / No buttons on the selfie prompt modal
document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById('selfiePromptModal');
  var yesBtn = document.getElementById('selfiePromptYesBtn');
  var noBtn  = document.getElementById('selfiePromptNoBtn');

  if (yesBtn) {
    yesBtn.addEventListener('click', function() {
      if (modal) {
        modal.classList.add('hidden');
      }
      // Navigate to the selfie screen
      goToSelfieView();
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', function() {
      if (modal) {
        modal.classList.add('hidden');
      }
      // Do nothing else; they stay where they are
    });
  }
});


/* ================================================================
   APPLICATION STARTUP
   ================================================================
   Initialize the app when the DOM is fully loaded.
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Kiosk] DOM loaded, starting app...');
    KioskApp.init();
});


// Make available globally
window.KioskApp = KioskApp;
