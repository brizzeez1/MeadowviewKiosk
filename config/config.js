/* ================================================================
   CONFIG.JS - FRONTEND CONFIGURATION
   ================================================================
   This file contains all configuration values for the kiosk app.
   
   HOW TO USE:
   - Edit values below to customize the app behavior
   - These values are used throughout the JavaScript files
   - The backend has a separate config.py file that should 
     stay in sync with these values where applicable
   
   SECTIONS:
   1. API Configuration
   2. Storage Configuration  
   3. Feature Flags (Phase 1 & Phase 2)
   4. Screensaver Settings
   5. Inactivity Timer Settings
   6. Ward/Organization Info
   ================================================================ */

const KIOSK_CONFIG = {

    /* ============================================================
       SECTION 1: API CONFIGURATION
       ============================================================
       Settings for connecting to the Python backend.
       
       HOSTING OPTIONS:
       
       Option A - Local Backend (Default):
         API_BASE_URL: "http://localhost:5000"
         The Python backend runs on the same machine as the kiosk.
       
       Option B - Remote Backend:
         API_BASE_URL: "https://your-server.com"
         If you host the backend on a separate server.
       
       Option C - Google Apps Script:
         API_BASE_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
         If you use Google Apps Script instead of Python.
         
       TODO: Add authentication token support if needed for remote hosting.
       ============================================================ */
    
    API_BASE_URL: "http://localhost:5000",
    
    // Request timeout in milliseconds
    API_TIMEOUT: 10000,


    /* ============================================================
       SECTION 2: STORAGE CONFIGURATION
       ============================================================
       Determines where data (selfies, temple visits, etc.) is stored.
       
       OPTIONS:
       - "local"       : Store on the kiosk's local filesystem
       - "googleDrive" : Store in Google Drive (requires setup)
       
       TODO: Implement Google Drive integration in apiClient.js
             and backend/storage_google_drive.py
       ============================================================ */
    
    STORAGE_MODE: "local",  // "local" | "googleDrive"


    /* ============================================================
       SECTION 3: FEATURE FLAGS
       ============================================================
       Enable or disable features by setting true/false.
       
       PHASE 1 FEATURES (enabled by default):
       - Temple 365 tracking
       - Selfie capture
       - Ward bulletin QR code
       
       PHASE 2 FEATURES (disabled by default):
       - Youth section
       - Primary section  
       - Miracles board
       - Missionary spotlight
       - Ward calendar
       
       To enable a Phase 2 feature:
       1. Set the flag to true below
       2. The button will automatically appear on the home screen
       3. You may need to implement the backend endpoint
       ============================================================ */
    
    FEATURE_FLAGS: {
        // Phase 1 features
        TEMPLE_365_ENABLED: true,
        SELFIE_CAPTURE_ENABLED: true,
        BULLETIN_QR_ENABLED: true,
        
        // Phase 2 features (set to true when ready)
        YOUTH_SECTION_ENABLED: false,
        PRIMARY_SECTION_ENABLED: false,
        MIRACLES_BOARD_ENABLED: false,
        MISSIONARY_SECTION_ENABLED: false,
        WARD_CALENDAR_ENABLED: false
    },


    /* ============================================================
       SECTION 4: SCREENSAVER SETTINGS
       ============================================================
       Configuration for the screensaver / attract mode.
       
       TEMPLE_PHOTOS:
       - List of image paths for the rotating background
       - Add more photos by placing them in /assets/temple_photos/
         and adding the path here
       
       TODO: In the future, load this list from the backend
             via /api/temple-photos endpoint
       ============================================================ */
    
    SCREENSAVER: {
        // Time between photo transitions (in milliseconds)
        // Default: 12000 (12 seconds)
        ROTATION_INTERVAL: 12000,
        
        // Transition duration for crossfade (in milliseconds)
        TRANSITION_DURATION: 1500,
        
        // List of temple photo paths
        // Add your own photos here!
        TEMPLE_PHOTOS: [
            "assets/temple_photos/placeholder1.jpg",
            "assets/temple_photos/placeholder2.jpg",
            "assets/temple_photos/placeholder3.jpg"
            // TODO: Add more temple photos
            // "assets/temple_photos/salt_lake_temple.jpg",
            // "assets/temple_photos/provo_temple.jpg",
        ],
        
        // Enable/disable the slow zoom animation
        ENABLE_ZOOM_EFFECT: true
    },


    /* ============================================================
       SECTION 5: INACTIVITY TIMER SETTINGS
       ============================================================
       After a period of no interaction, the app returns to
       the screensaver automatically.
       
       INACTIVITY_TIMEOUT:
       - Time in milliseconds before returning to screensaver
       - Default: 60000 (60 seconds / 1 minute)
       - Set to 0 to disable auto-return
       ============================================================ */
    
    INACTIVITY: {
        // Timeout before returning to screensaver (milliseconds)
        TIMEOUT: 60000,
        
        // Enable/disable the inactivity timer
        ENABLED: true
    },


    /* ============================================================
       SECTION 6: WARD / ORGANIZATION INFO
       ============================================================
       Customize these values for your ward/branch.
       
       TODO: These values could be loaded from the backend
             configuration endpoint /api/config in the future.
       ============================================================ */
    
    ORGANIZATION: {
        // Ward/Branch name (displayed on home screen)
        NAME: "Welcome",
        
        // Stake name (optional)
        STAKE: "",
        
        // Ward bulletin URL (for QR code)
        // This is the URL that the QR code will link to
        BULLETIN_URL: "https://bulletin.yourward.org",
        
        // Custom greeting message (optional)
        GREETING: "Touch anywhere to begin"
    },


    /* ============================================================
       SECTION 7: DEBUG SETTINGS
       ============================================================
       Settings for development and troubleshooting.
       Set DEBUG_MODE to false for production use.
       ============================================================ */
    
    DEBUG: {
        // Enable debug logging to console
        DEMO_MODE: true,
        DEBUG_MODE: false,
        
        // Show state changes in console
        LOG_STATE_CHANGES: false,
        
        // Show API calls in console
        LOG_API_CALLS: false
    }
};


/* ================================================================
   MAKE CONFIG AVAILABLE GLOBALLY
   ================================================================
   The config object is attached to the window for easy access
   from any JavaScript file.
   
   Usage in other files:
     const apiUrl = window.KIOSK_CONFIG.API_BASE_URL;
     const isDebug = window.KIOSK_CONFIG.DEBUG.DEBUG_MODE;
   ================================================================ */

// Freeze the config to prevent accidental modifications
Object.freeze(KIOSK_CONFIG);
Object.freeze(KIOSK_CONFIG.FEATURE_FLAGS);
Object.freeze(KIOSK_CONFIG.SCREENSAVER);
Object.freeze(KIOSK_CONFIG.INACTIVITY);
Object.freeze(KIOSK_CONFIG.ORGANIZATION);
Object.freeze(KIOSK_CONFIG.DEBUG);

// Make available globally
window.KIOSK_CONFIG = KIOSK_CONFIG;
