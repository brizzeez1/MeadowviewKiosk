/* ================================================================
   HOMESCREEN.JS - HOME SCREEN LOGIC
   ================================================================
   This module handles the home screen functionality:
   - Circle button click/touch handlers
   - Navigation to feature screens
   - Button animations and interactions
   
   PURPOSE:
   The home screen is the main menu of the kiosk, providing
   access to the three primary features (Temple 365, Selfie,
   Bulletin) plus any enabled Phase 2 features.
   ================================================================ */

const HomeScreen = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */
    
    // Reference to the home screen element
    let _screenElement = null;
    
    // Reference to the buttons container
    let _buttonsContainer = null;
    
    // Is home screen currently active?
    let _isActive = false;


    /* ============================================================
       SECTION 2: BUTTON ACTIONS MAPPING
       ============================================================
       Maps button data-action attributes to app states.
       ============================================================ */
    
    const BUTTON_ACTIONS = {
        'temple365': 'TEMPLE_365',
        'selfie': 'SELFIE',
        'bulletin': 'BULLETIN',
        // Phase 2 actions
        'youth': 'YOUTH',
        'primary': 'PRIMARY',
        'miracles': 'MIRACLES',
        'missionaries': 'MISSIONARIES',
        'calendar': 'CALENDAR',
        // Navigation
        'home': 'HOME'
    };


    /* ============================================================
       SECTION 3: INITIALIZATION
       ============================================================ */
    
    /**
     * Initialize the home screen module.
     * Call this once when the app starts.
     */
    function init() {
        // Get DOM elements
        _screenElement = document.getElementById('home-screen');
        _buttonsContainer = document.querySelector('.circle-buttons-container');
        
        if (!_screenElement) {
            console.error('[HomeScreen] Home screen element not found!');
            return;
        }
        
        // Set up button click handlers
        setupButtonHandlers();
        
        // Set up back button handlers (in all views)
        setupBackButtonHandlers();
        
        ConfigLoader.debugLog('Home screen initialized');
    }


    /* ============================================================
       SECTION 4: BUTTON CLICK HANDLERS
       ============================================================ */
    
    /**
     * Set up click handlers for all circle buttons.
     */
    function setupButtonHandlers() {
        // Get all circle buttons
        const buttons = document.querySelectorAll('.circle-button');
        
        buttons.forEach(button => {
            // Handle both click and touch
            button.addEventListener('click', handleButtonClick);
            button.addEventListener('touchend', handleButtonTouch);
        });
        
        ConfigLoader.debugLog('Button handlers set up for', buttons.length, 'buttons');
    }
    
    /**
     * Set up click handlers for all back buttons.
     */
    function setupBackButtonHandlers() {
        const backButtons = document.querySelectorAll('.back-button');
        
        backButtons.forEach(button => {
            button.addEventListener('click', handleBackButtonClick);
            button.addEventListener('touchend', handleBackButtonTouch);
        });
    }
    
    /**
     * Handle button click event.
     * @param {Event} event - The click event
     */
    function handleButtonClick(event) {
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');
        
        if (action) {
            navigateToAction(action);
        }
    }
    
    /**
     * Handle button touch event.
     * @param {Event} event - The touch event
     */
    function handleButtonTouch(event) {
        // Prevent double-firing
        event.preventDefault();
        
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');
        
        if (action) {
            navigateToAction(action);
        }
    }
    
    /**
     * Handle back button click.
     * @param {Event} event - The click event
     */
    function handleBackButtonClick(event) {
        navigateToAction('home');
    }
    
    /**
     * Handle back button touch.
     * @param {Event} event - The touch event
     */
    function handleBackButtonTouch(event) {
        event.preventDefault();
        navigateToAction('home');
    }


    /* ============================================================
       SECTION 5: NAVIGATION
       ============================================================ */
    
    /**
     * Navigate to a specific action/state.
     * @param {string} action - The button action (e.g., 'temple365')
     */
    function navigateToAction(action) {
        const targetState = BUTTON_ACTIONS[action];
        
        if (!targetState) {
            console.warn('[HomeScreen] Unknown action:', action);
            return;
        }
        
        ConfigLoader.debugLog('Navigating to:', targetState);
        
        // Dispatch event for app.js to handle state change
        window.dispatchEvent(new CustomEvent('navigate', {
            detail: { state: targetState }
        }));
    }
    
    /**
     * Navigate back to home screen.
     */
    function goHome() {
        navigateToAction('home');
    }


    /* ============================================================
       SECTION 6: ACTIVATION / DEACTIVATION
       ============================================================ */
    
    /**
     * Activate the home screen.
     * Called when transitioning to HOME state.
     */
    function activate() {
        _isActive = true;
        
        // Trigger entrance animations by adding a class
        if (_buttonsContainer) {
            _buttonsContainer.classList.add('animate-in');
            
            // Remove animation class after it completes
            setTimeout(() => {
                _buttonsContainer.classList.remove('animate-in');
            }, 1000);
        }
        
        ConfigLoader.debugLog('Home screen activated');
    }
    
    /**
     * Deactivate the home screen.
     * Called when transitioning away from HOME state.
     */
    function deactivate() {
        _isActive = false;
        ConfigLoader.debugLog('Home screen deactivated');
    }
    
    /**
     * Check if home screen is currently active.
     * @returns {boolean} True if active
     */
    function isActive() {
        return _isActive;
    }


    /* ============================================================
       SECTION 7: BUTTON STATE MANAGEMENT
       ============================================================ */
    
    /**
     * Disable a specific button.
     * @param {string} buttonId - The button element ID
     */
    function disableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    }
    
    /**
     * Enable a specific button.
     * @param {string} buttonId - The button element ID
     */
    function enableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    }
    
    /**
     * Set the label text for a button.
     * @param {string} buttonId - The button element ID
     * @param {string} label - The new label text
     */
    function setButtonLabel(buttonId, label) {
        const button = document.getElementById(buttonId);
        if (button) {
            const labelElement = button.querySelector('.button-label');
            if (labelElement) {
                labelElement.textContent = label;
            }
        }
    }


    /* ============================================================
       SECTION 8: DYNAMIC BUTTON CONFIGURATION (FUTURE)
       ============================================================ */
    
    /**
     * Create a new circle button dynamically.
     * @param {Object} config - Button configuration
     * @param {string} config.id - Button ID
     * @param {string} config.action - Button action name
     * @param {string} config.label - Button label text
     * @param {string} config.iconUrl - URL to icon image
     * @param {string} config.gradient - Gradient class name
     * 
     * TODO: Use this to dynamically add buttons from backend config
     */
    function createButton(config) {
        const button = document.createElement('button');
        button.className = 'circle-button';
        button.id = config.id;
        button.setAttribute('data-action', config.action);
        
        button.innerHTML = `
            <div class="circle-button-inner ${config.gradient}">
                <img src="${config.iconUrl}" alt="${config.label}" class="button-icon">
            </div>
            <span class="button-label">${config.label}</span>
        `;
        
        // Add click handler
        button.addEventListener('click', handleButtonClick);
        button.addEventListener('touchend', handleButtonTouch);
        
        // Add to container
        if (_buttonsContainer) {
            _buttonsContainer.appendChild(button);
        }
        
        return button;
    }


    /* ============================================================
       SECTION 9: PUBLIC API
       ============================================================ */
    
    return {
        // Initialization
        init: init,
        
        // Activation
        activate: activate,
        deactivate: deactivate,
        isActive: isActive,
        
        // Navigation
        navigateToAction: navigateToAction,
        goHome: goHome,
        
        // Button management
        disableButton: disableButton,
        enableButton: enableButton,
        setButtonLabel: setButtonLabel,
        createButton: createButton,
        
        // Constants
        BUTTON_ACTIONS: BUTTON_ACTIONS
    };

})();

// Make available globally
window.HomeScreen = HomeScreen;
