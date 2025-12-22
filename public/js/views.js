/* ================================================================
   VIEWS.JS - VIEW RENDERING HELPERS
   ================================================================
   This module provides helper functions for rendering and managing
   the different views/screens in the kiosk app.
   
   PURPOSE:
   - Show/hide screens based on current state
   - Render dynamic content into views
   - Handle view transitions and animations
   
   SCREENS MANAGED:
   - screensaver-screen
   - home-screen
   - temple365-screen
   - selfie-screen
   - bulletin-screen
   - Phase 2 screens (youth, primary, miracles, missionaries, calendar)
   ================================================================ */

const Views = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: SCREEN IDS MAPPING
       ============================================================
       Maps state names to screen element IDs.
       ============================================================ */
    
    const SCREEN_IDS = {
        SCREENSAVER: 'screensaver-screen',
        HOME: 'home-screen',
        TEMPLE_365: 'temple365-screen',
        SELFIE: 'selfie-screen',
        BULLETIN: 'bulletin-screen',
        MISSIONARIES: 'missionaries-screen',
        MISSIONARY_DETAIL: 'missionary-detail-screen',
        // Phase 2 screens
        YOUTH: 'youth-screen',
        PRIMARY: 'primary-screen',
        MIRACLES: 'miracles-screen',
        CALENDAR: 'calendar-screen'
    };


    /* ============================================================
       SECTION 2: SCREEN MANAGEMENT
       ============================================================ */
    
    /**
     * Get a screen element by state name.
     * @param {string} stateName - The state/screen name
     * @returns {HTMLElement|null} The screen element
     */
    function getScreenElement(stateName) {
        const screenId = SCREEN_IDS[stateName];
        if (!screenId) {
            console.warn(`[Views] Unknown screen: ${stateName}`);
            return null;
        }
        return document.getElementById(screenId);
    }
    
    /**
     * Hide all screens.
     */
    function hideAllScreens() {
        Object.values(SCREEN_IDS).forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.remove('active');
            }
        });
    }
    
    /**
     * Show a specific screen by state name.
     * @param {string} stateName - The state/screen to show
     */
    function showScreen(stateName) {
        // First hide all screens
        hideAllScreens();
        
        // Then show the requested screen
        const screen = getScreenElement(stateName);
        if (screen) {
            screen.classList.add('active');
            ConfigLoader.debugLog(`Showing screen: ${stateName}`);
        } else {
            console.error(`[Views] Cannot show screen: ${stateName}`);
        }
    }
    
    /**
     * Check if a screen is currently visible.
     * @param {string} stateName - The state/screen to check
     * @returns {boolean} True if screen is active
     */
    function isScreenVisible(stateName) {
        const screen = getScreenElement(stateName);
        return screen ? screen.classList.contains('active') : false;
    }


    /* ============================================================
       SECTION 3: DYNAMIC CONTENT RENDERING
       ============================================================ */
    
    /**
     * Update the ward title on the home screen.
     * @param {string} title - The title to display
     */
    function updateWardTitle(title) {
        const titleElement = document.querySelector('.ward-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    /**
     * Update the screensaver greeting text.
     * @param {string} greeting - The greeting to display
     */
    function updateGreeting(greeting) {
        const promptText = document.querySelector('.prompt-text');
        if (promptText) {
            promptText.textContent = greeting;
        }
    }
    
    /**
     * Update the bulletin URL displayed on the bulletin screen.
     * @param {string} url - The bulletin URL
     */
    function updateBulletinUrl(url) {
        const urlText = document.querySelector('.url-text');
        if (urlText) {
            // Display a shortened version of the URL
            urlText.textContent = url.replace(/^https?:\/\//, '');
        }
        
        // TODO: Also update the QR code to link to this URL
        // This will require a QR code generation library
    }


    /* ============================================================
       SECTION 4: FEATURE FLAG-BASED VISIBILITY
       ============================================================
       Show or hide buttons based on feature flags.
       ============================================================ */
    
    /**
     * Update visibility of Phase 2 buttons based on feature flags.
     */
    function updatePhase2ButtonVisibility() {
        // Youth button
        toggleButtonVisibility(
            'btn-youth',
            ConfigLoader.isFeatureEnabled('YOUTH_SECTION_ENABLED')
        );

        // Primary button
        toggleButtonVisibility(
            'btn-primary',
            ConfigLoader.isFeatureEnabled('PRIMARY_SECTION_ENABLED')
        );

        // Miracles button
        toggleButtonVisibility(
            'btn-miracles',
            ConfigLoader.isFeatureEnabled('MIRACLES_BOARD_ENABLED')
        );

        // Calendar button
        toggleButtonVisibility(
            'btn-calendar',
            ConfigLoader.isFeatureEnabled('WARD_CALENDAR_ENABLED')
        );
    }
    
    /**
     * Toggle visibility of a button.
     * @param {string} buttonId - The button element ID
     * @param {boolean} visible - Whether to show or hide
     */
    function toggleButtonVisibility(buttonId, visible) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = visible ? 'flex' : 'none';
        }
    }
    
    /**
     * Update visibility of Phase 1 buttons based on feature flags.
     */
    function updatePhase1ButtonVisibility() {
        toggleButtonVisibility(
            'btn-temple365',
            ConfigLoader.isFeatureEnabled('TEMPLE_365_ENABLED')
        );

        toggleButtonVisibility(
            'btn-selfie',
            ConfigLoader.isFeatureEnabled('SELFIE_CAPTURE_ENABLED')
        );

        toggleButtonVisibility(
            'btn-bulletin',
            ConfigLoader.isFeatureEnabled('BULLETIN_QR_ENABLED')
        );

        toggleButtonVisibility(
            'btn-missionaries',
            ConfigLoader.isFeatureEnabled('MISSIONARY_SECTION_ENABLED')
        );
    }


    /* ============================================================
       SECTION 5: VIEW-SPECIFIC RENDER FUNCTIONS
       ============================================================
       Functions to render specific views with data.
       ============================================================ */
    
    /**
     * Render the Temple 365 view with data.
     * @param {Object} data - Temple visit data from API
     * 
     * TODO: Implement actual Temple 365 display with:
     * - Progress bar showing visits vs goal
     * - Calendar view of visit dates
     * - Statistics and milestones
     */
    function renderTemple365View(data) {
        const container = document.querySelector('#temple365-screen .view-content');
        if (!container) return;
        
        // TODO: Replace placeholder with actual content
        // For now, just log the data
        ConfigLoader.debugLog('Temple 365 data:', data);
        
        // Example of how to update content:
        // container.innerHTML = `
        //   <div class="temple-progress">
        //     <h3>Ward Progress: ${data.totalVisits} visits</h3>
        //     <div class="progress-bar">...</div>
        //   </div>
        // `;
    }
    
    /**
     * Render the Selfie view.
     * 
     * TODO: Implement camera functionality:
     * - navigator.mediaDevices.getUserMedia() for camera access
     * - Canvas for capturing frames
     * - Upload to backend via ApiClient.postSelfie()
     */
    function renderSelfieView() {
        // TODO: Initialize camera when this view is shown
        // TODO: Clean up camera when navigating away
        ConfigLoader.debugLog('Selfie view rendered');
    }
    
    /**
     * Render the Bulletin view with the configured URL.
     */
    function renderBulletinView() {
        const bulletinUrl = ConfigLoader.getBulletinUrl();
        updateBulletinUrl(bulletinUrl);
        
        // TODO: Generate actual QR code using a library like:
        // - qrcode.js
        // - qr-code-styling
        ConfigLoader.debugLog('Bulletin view rendered with URL:', bulletinUrl);
    }


    /* ============================================================
       SECTION 6: INITIALIZATION
       ============================================================ */

    /**
     * Initialize all views based on config.
     * Called during app startup.
     */
    function init() {
        // Update ward title
        updateWardTitle(ConfigLoader.getOrganizationName());

        // Update screensaver greeting
        updateGreeting(ConfigLoader.getGreeting());

        // Set up button visibility based on feature flags
        updatePhase1ButtonVisibility();
        updatePhase2ButtonVisibility();

        // Pre-render bulletin URL
        updateBulletinUrl(ConfigLoader.getBulletinUrl());

        // PHASE 5 FIX: Set up back button handlers
        setupBackButtons();

        ConfigLoader.debugLog('Views initialized');
    }


    /* ============================================================
       SECTION 7: PHASE 5 UTILITY HELPERS
       ============================================================ */

    // PHASE 5 FIX: Prevent double-binding
    let _backButtonsWired = false;

    /**
     * PHASE 5 FIX: Set up back button event listeners with double-binding guard.
     * Only binds to buttons with explicit data-action="home" attribute.
     */
    function setupBackButtons() {
        if (_backButtonsWired) {
            console.log('[Views] Back buttons already wired, skipping');
            return;
        }
        _backButtonsWired = true;

        // Only bind to buttons with explicit data-action="home"
        const homeBackButtons = document.querySelectorAll('[data-action="home"]');
        homeBackButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('[Views] Back button clicked, navigating to HOME');
                // Trigger navigation to home (app.js should handle this)
                if (window.App && window.App.navigateToHome) {
                    window.App.navigateToHome();
                } else {
                    // Fallback: directly show home screen
                    showScreen('HOME');
                }
            });
        });

        console.log('[Views] Wired', homeBackButtons.length, 'back buttons');
    }

    /**
     * PHASE 5 FIX: Show element with respect for data-display attribute.
     * Prevents breaking flex layouts by forcing display: block.
     * @param {string} id - Element ID
     */
    function showElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn('[Views] Element not found:', id);
            return;
        }
        const desired = el.getAttribute('data-display') || 'block';
        el.style.display = desired;
    }

    /**
     * PHASE 5 FIX: Hide element helper.
     * @param {string} id - Element ID
     */
    function hideElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn('[Views] Element not found:', id);
            return;
        }
        el.style.display = 'none';
    }


    /* ============================================================
       SECTION 8: PUBLIC API
       ============================================================ */
    
    return {
        // Screen management
        showScreen: showScreen,
        hideAllScreens: hideAllScreens,
        isScreenVisible: isScreenVisible,
        getScreenElement: getScreenElement,

        // Dynamic content
        updateWardTitle: updateWardTitle,
        updateGreeting: updateGreeting,
        updateBulletinUrl: updateBulletinUrl,

        // Button visibility
        updatePhase1ButtonVisibility: updatePhase1ButtonVisibility,
        updatePhase2ButtonVisibility: updatePhase2ButtonVisibility,
        toggleButtonVisibility: toggleButtonVisibility,

        // View-specific rendering
        renderTemple365View: renderTemple365View,
        renderSelfieView: renderSelfieView,
        renderBulletinView: renderBulletinView,

        // PHASE 5: Element helpers
        showElement: showElement,
        hideElement: hideElement,
        setupBackButtons: setupBackButtons,

        // Initialization
        init: init,

        // Constants
        SCREEN_IDS: SCREEN_IDS
    };

})();

// Make available globally
window.Views = Views;
