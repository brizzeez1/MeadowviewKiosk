/* ================================================================
   CONFIGLOADER.JS - CONFIGURATION LOADER & VALIDATOR
   ================================================================
   This module loads and validates the frontend configuration.
   
   PURPOSE:
   - Provides easy access to config values
   - Validates required config fields exist
   - Provides fallback defaults if values are missing
   - Logs helpful debug info during development
   
   USAGE:
     // Get a config value
     const apiUrl = ConfigLoader.getApiBaseUrl();
     const isEnabled = ConfigLoader.isFeatureEnabled('TEMPLE_365_ENABLED');
   ================================================================ */

const ConfigLoader = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */
    
    // Reference to the global config object
    let _config = null;
    
    // Default values (used as fallbacks)
    const DEFAULTS = {
        API_BASE_URL: "http://localhost:5000",
        API_TIMEOUT: 10000,
        STORAGE_MODE: "local",
        INACTIVITY_TIMEOUT: 60000,
        ROTATION_INTERVAL: 12000
    };


    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */
    
    /**
     * Initialize the config loader.
     * Called automatically when the module loads.
     * @returns {boolean} True if config loaded successfully
     */
    function init() {
        // Check if global config exists
        if (typeof window.KIOSK_CONFIG === 'undefined') {
            console.error('[ConfigLoader] ERROR: KIOSK_CONFIG not found!');
            console.error('[ConfigLoader] Make sure config.js is loaded before this file.');
            return false;
        }
        
        _config = window.KIOSK_CONFIG;
        
        // Validate required fields
        if (!validateConfig()) {
            console.warn('[ConfigLoader] Config validation found issues. Using defaults where needed.');
        }
        
        if (isDebugMode()) {
            console.log('[ConfigLoader] Configuration loaded successfully:', _config);
        }
        
        return true;
    }


    /* ============================================================
       SECTION 3: VALIDATION
       ============================================================ */
    
    /**
     * Validate that all required config fields exist.
     * @returns {boolean} True if all required fields are present
     */
    function validateConfig() {
        let isValid = true;
        
        // Check required top-level fields
        const requiredFields = ['API_BASE_URL', 'STORAGE_MODE', 'FEATURE_FLAGS'];
        
        requiredFields.forEach(field => {
            if (_config[field] === undefined) {
                console.warn(`[ConfigLoader] Missing required field: ${field}`);
                isValid = false;
            }
        });
        
        // Check feature flags exist
        if (_config.FEATURE_FLAGS) {
            const requiredFlags = [
                'TEMPLE_365_ENABLED',
                'SELFIE_CAPTURE_ENABLED', 
                'BULLETIN_QR_ENABLED'
            ];
            
            requiredFlags.forEach(flag => {
                if (_config.FEATURE_FLAGS[flag] === undefined) {
                    console.warn(`[ConfigLoader] Missing feature flag: ${flag}`);
                    isValid = false;
                }
            });
        }
        
        return isValid;
    }


    /* ============================================================
       SECTION 4: GETTER METHODS
       ============================================================ */
    
    /**
     * Get the API base URL.
     * @returns {string} The API base URL
     */
    function getApiBaseUrl() {
        return _config?.API_BASE_URL || DEFAULTS.API_BASE_URL;
    }
    
    /**
     * Get the API timeout in milliseconds.
     * @returns {number} Timeout in milliseconds
     */
    function getApiTimeout() {
        return _config?.API_TIMEOUT || DEFAULTS.API_TIMEOUT;
    }
    
    /**
     * Get the storage mode.
     * @returns {string} "local" or "googleDrive"
     */
    function getStorageMode() {
        return _config?.STORAGE_MODE || DEFAULTS.STORAGE_MODE;
    }
    
    /**
     * Check if a feature is enabled.
     * @param {string} featureName - Name of the feature flag
     * @returns {boolean} True if feature is enabled
     */
    function isFeatureEnabled(featureName) {
        return _config?.FEATURE_FLAGS?.[featureName] === true;
    }
    
    /**
     * Get the screensaver rotation interval.
     * @returns {number} Interval in milliseconds
     */
    function getRotationInterval() {
        return _config?.SCREENSAVER?.ROTATION_INTERVAL || DEFAULTS.ROTATION_INTERVAL;
    }
    
    /**
     * Get the list of temple photos for the screensaver.
     * @returns {Array<string>} Array of image paths
     */
    function getTemplePhotos() {
        return _config?.SCREENSAVER?.TEMPLE_PHOTOS || [];
    }
    
    /**
     * Get the inactivity timeout.
     * @returns {number} Timeout in milliseconds
     */
    function getInactivityTimeout() {
        return _config?.INACTIVITY?.TIMEOUT || DEFAULTS.INACTIVITY_TIMEOUT;
    }
    
    /**
     * Check if inactivity timer is enabled.
     * @returns {boolean} True if enabled
     */
    function isInactivityEnabled() {
        return _config?.INACTIVITY?.ENABLED !== false;
    }
    
    /**
     * Get organization/ward name.
     * @returns {string} Organization name
     */
    function getOrganizationName() {
        return _config?.ORGANIZATION?.NAME || "Welcome";
    }
    
    /**
     * Get bulletin URL.
     * @returns {string} Bulletin URL
     */
    function getBulletinUrl() {
        return _config?.ORGANIZATION?.BULLETIN_URL || "";
    }
    
    /**
     * Get the greeting text for screensaver.
     * @returns {string} Greeting message
     */
    function getGreeting() {
        return _config?.ORGANIZATION?.GREETING || "Touch anywhere to begin";
    }
    
    /**
     * Check if debug mode is enabled.
     * @returns {boolean} True if debug mode is on
     */
    function isDebugMode() {
        return _config?.DEBUG?.DEBUG_MODE === true;
    }
    
    /**
     * Check if state change logging is enabled.
     * @returns {boolean} True if state logging is on
     */
    function shouldLogStateChanges() {
        return _config?.DEBUG?.LOG_STATE_CHANGES === true;
    }
    
    /**
     * Check if API call logging is enabled.
     * @returns {boolean} True if API logging is on
     */
    function shouldLogApiCalls() {
        return _config?.DEBUG?.LOG_API_CALLS === true;
    }
    
    /**
     * Get the entire config object (read-only).
     * @returns {Object} The full config object
     */
    function getFullConfig() {
        return { ..._config };
    }


    /* ============================================================
       SECTION 5: HELPER METHODS
       ============================================================ */
    
    /**
     * Log a debug message if debug mode is enabled.
     * @param {string} message - Message to log
     * @param {any} data - Optional data to include
     */
    function debugLog(message, data = null) {
        if (isDebugMode()) {
            if (data) {
                console.log(`[Debug] ${message}`, data);
            } else {
                console.log(`[Debug] ${message}`);
            }
        }
    }


    /* ============================================================
       SECTION 6: AUTO-INITIALIZE ON LOAD
       ============================================================ */
    
    // Initialize when this script loads
    init();


    /* ============================================================
       SECTION 7: PUBLIC API
       ============================================================ */
    
    return {
        // Initialization
        init: init,
        validateConfig: validateConfig,
        
        // API settings
        getApiBaseUrl: getApiBaseUrl,
        getApiTimeout: getApiTimeout,
        
        // Storage settings
        getStorageMode: getStorageMode,
        
        // Feature flags
        isFeatureEnabled: isFeatureEnabled,
        
        // Screensaver settings
        getRotationInterval: getRotationInterval,
        getTemplePhotos: getTemplePhotos,
        
        // Inactivity settings
        getInactivityTimeout: getInactivityTimeout,
        isInactivityEnabled: isInactivityEnabled,
        
        // Organization info
        getOrganizationName: getOrganizationName,
        getBulletinUrl: getBulletinUrl,
        getGreeting: getGreeting,
        
        // Debug settings
        isDebugMode: isDebugMode,
        shouldLogStateChanges: shouldLogStateChanges,
        shouldLogApiCalls: shouldLogApiCalls,
        
        // Utilities
        getFullConfig: getFullConfig,
        debugLog: debugLog
    };

})();

// Make available globally
window.ConfigLoader = ConfigLoader;
