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
        BULLETIN_QR_ENABLED: false,  // Replaced with floating QR code
        MISSIONARY_SECTION_ENABLED: true,  // Now a Phase 1 feature

        // Phase 2 features (set to true when ready)
        YOUTH_SECTION_ENABLED: false,
        PRIMARY_SECTION_ENABLED: false,
        MIRACLES_BOARD_ENABLED: false,
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
       // List of temple photo paths
// Randomized order applied at runtime
TEMPLE_PHOTOS: [
    "assets/temple_photos/cordoba_argentina.jpeg",
    "assets/temple_photos/logan_ut.jpeg",
    "assets/temple_photos/gilbert_az_lds.jpeg",
    "assets/temple_photos/bangkok_thailand.jpeg",
    "assets/temple_photos/rome_italy.jpeg",
    "assets/temple_photos/oakland_ca.jpeg",
    "assets/temple_photos/papeete_tahiti.jpeg",
    "assets/temple_photos/idaho falls_id.jpeg",
    "assets/temple_photos/portland_or.jpeg",
    "assets/temple_photos/brasilia_brazil.jpeg",
    "assets/temple_photos/provo city center_ut.jpeg",
    "assets/temple_photos/adelaide_australia.jpeg",
    "assets/temple_photos/las vegas_nv.jpeg",
    "assets/temple_photos/kansas city_mo.jpeg",
    "assets/temple_photos/guayaquil_ecuador.jpeg",
    "assets/temple_photos/fort lauderdale_fl.jpeg",
    "assets/temple_photos/bountiful_ut.jpeg",
    "assets/temple_photos/puebla_mexico.jpeg",
    "assets/temple_photos/manila_philippines.jpeg",
    "assets/temple_photos/sapporo_japan.png",
    "assets/temple_photos/palmyra_ny.jpeg",
    "assets/temple_photos/kirtland_oh.jpeg",
    "assets/temple_photos/belem_brazil.jpeg",
    "assets/temple_photos/san diego_ca.jpeg",
    "assets/temple_photos/freiberg_germany.jpeg",
    "assets/temple_photos/gilbert_az_temple.jpeg",
    "assets/temple_photos/casper_wy.jpeg",
    "assets/temple_photos/laie_hi.jpeg",
    "assets/temple_photos/albuquerque_nm.jpeg",
    "assets/temple_photos/philadelphia_pa.jpeg",
    "assets/temple_photos/salt lake city_ut.jpeg",
    "assets/temple_photos/washington_dc.jpeg"
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
        NAME: "Meadowview Ward",

        // Stake name (optional)
        STAKE: "Gateway Stake",

        // Firestore Ward ID (IMPORTANT: This must match your Firestore ward document ID)
        // This ID is used for all Firebase operations (temple visits, selfies, missionaries)
        WARD_ID: "meadowview_az",

        // Ward bulletin URL (for floating QR code)
        // This is the URL that the QR code will link to
        BULLETIN_URL: "https://app.wardbullet.com/channel/1007701",

        // Custom greeting message (optional)
        GREETING: "Touch Anywhere To Explore"
    },


    /* ============================================================
       SECTION 6.5: MISSIONARY SPOTLIGHT CONFIGURATION
       ============================================================
       Configuration for the Missionary Spotlight feature.

       HOW TO UPDATE MISSIONARIES:
       1. Change MISSIONARY_COUNT to match your current number
       2. Update the MISSIONARIES array with your missionary info
       3. Add/remove missionary objects as needed
       4. Each missionary should have: id, name, mission, language, scripture, photoUrl, galleryFolder
       5. Profile photos are stored in assets/missionary_photos/ folder
       6. Gallery photos are stored in assets/missionary_photos/gallery/{missionary_name}/ folder

       GALLERY FOLDER STRUCTURE:
       - Each missionary has their own gallery subfolder
       - Example: assets/missionary_photos/gallery/kylie/
       - Parents/family can add photos to the missionary's folder
       - Supported formats: .jpg, .jpeg, .png, .gif, .webp

       FUTURE: GOOGLE DRIVE INTEGRATION
       - Gallery photos will be pulled from a shared Google Drive folder
       - Each missionary will have a Drive folder ID instead of local path
       - Parents can upload directly to Google Drive

       FUTURE FEATURES (Coming Soon):
       - Video recording capability (saves to Google Drive folder)
       ============================================================ */

    MISSIONARIES: {
        // Current number of missionaries (CHANGE THIS as missionaries come/go)
        MISSIONARY_COUNT: 15,

        // Missionary data array
        // TODO: In the future, this could be loaded from backend /api/missionaries
        MISSIONARIES_LIST: [
    {
        id: 1,
        name: "Sister Kylie Gorecki",
        mission: "Poland Warsaw Mission",
        language: "Polish",
        scripture: "2 Nephi 2:25",
        photoUrl: "assets/missionary_photos/Kylie_Gorecki_Profile.jpg",
        // Gallery folder path (relative to assets/missionary_photos/)
        // Each missionary should have their own folder: gallery/{name}/
        galleryFolder: "gallery/kylie/",
        // Test photos - in production these would be loaded dynamically
        galleryPhotos: [
            "Kylie_Gorecki_Profile1 (2).JPG",
            "Kylie_Gorecki_mission 1 (1).JPEG",
            "Kylie_Gorecki_mission 1 (2).JPEG",
            "Kylie_Gorecki_mission 1 (2).JPG"
        ]
        /* FUTURE: Google Drive Integration
        googleDriveFolderId: "YOUR_DRIVE_FOLDER_ID_HERE",
        */
    },
    {
        id: 2,
        name: "Sister Emily Johnson",
        mission: "England London Mission",
        language: "English",
        scripture: "Doctrine & Covenants 4:2",
        photoUrl: "assets/missionary_photos/2.png",
        galleryFolder: "gallery/emily_johnson/",
        galleryPhotos: []
    },
    {
        id: 3,
        name: "Elder Michael Davis",
        mission: "Philippines Manila Mission",
        language: "Tagalog",
        scripture: "Moroni 10:4-5",
        photoUrl: "assets/missionary_photos/3.png",
        galleryFolder: "gallery/michael_davis/",
        galleryPhotos: []
    },
    {
        id: 4,
        name: "Elder David Martinez",
        mission: "Mexico Guadalajara Mission",
        language: "Spanish",
        scripture: "Alma 26:12",
        photoUrl: "assets/missionary_photos/4 - Copy.png",
        galleryFolder: "gallery/david_martinez/",
        galleryPhotos: []
    },
    {
        id: 5,
        name: "Sister Sarah Anderson",
        mission: "Japan Tokyo Mission",
        language: "Japanese",
        scripture: "3 Nephi 27:21",
        photoUrl: "assets/missionary_photos/6.png",
        galleryFolder: "gallery/sarah_anderson/",
        galleryPhotos: []
    },
    {
        id: 6,
        name: "Elder James Wilson",
        mission: "Germany Frankfurt Mission",
        language: "German",
        scripture: "Mosiah 2:17",
        photoUrl: "assets/missionary_photos/7.png",
        galleryFolder: "gallery/james_wilson/",
        galleryPhotos: []
    },
    {
        id: 7,
        name: "Elder Robert Taylor",
        mission: "Peru Lima Mission",
        language: "Spanish",
        scripture: "Ether 12:27",
        photoUrl: "assets/missionary_photos/9.png",
        galleryFolder: "gallery/robert_taylor/",
        galleryPhotos: []
    },
    {
        id: 8,
        name: "Sister Jennifer Lee",
        mission: "South Korea Seoul Mission",
        language: "Korean",
        scripture: "Joshua 1:9",
        photoUrl: "assets/missionary_photos/11.png",
        galleryFolder: "gallery/jennifer_lee/",
        galleryPhotos: []
    },
    {
        id: 9,
        name: "Elder Christopher Brown",
        mission: "Argentina Buenos Aires Mission",
        language: "Spanish",
        scripture: "Helaman 5:12",
        photoUrl: "assets/missionary_photos/12.png",
        galleryFolder: "gallery/christopher_brown/",
        galleryPhotos: []
    },
    {
        id: 10,
        name: "Elder Daniel White",
        mission: "France Paris Mission",
        language: "French",
        scripture: "D&C 84:88",
        photoUrl: "assets/missionary_photos/14.png",
        galleryFolder: "gallery/daniel_white/",
        galleryPhotos: []
    },
    {
        id: 11,
        name: "Sister Amanda Thompson",
        mission: "Italy Rome Mission",
        language: "Italian",
        scripture: "1 Nephi 3:7",
        photoUrl: "assets/missionary_photos/17.png",
        galleryFolder: "gallery/amanda_thompson/",
        galleryPhotos: []
    },
    {
        id: 12,
        name: "Elder Matthew Garcia",
        mission: "Chile Santiago Mission",
        language: "Spanish",
        scripture: "Alma 37:37",
        photoUrl: "assets/missionary_photos/18.png",
        galleryFolder: "gallery/matthew_garcia/",
        galleryPhotos: []
    },
    {
        id: 13,
        name: "Elder Joshua Martinez",
        mission: "Taiwan Taipei Mission",
        language: "Mandarin",
        scripture: "Mosiah 18:9",
        photoUrl: "assets/missionary_photos/20.png",
        galleryFolder: "gallery/joshua_martinez/",
        galleryPhotos: []
    },
    {
        id: 14,
        name: "Sister Rachel Harris",
        mission: "Australia Sydney Mission",
        language: "English",
        scripture: "D&C 88:67",
        photoUrl: "assets/missionary_photos/11111.png",
        galleryFolder: "gallery/rachel_harris/",
        galleryPhotos: []
    }
]

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
Object.freeze(KIOSK_CONFIG.MISSIONARIES);
Object.freeze(KIOSK_CONFIG.DEBUG);

// Make available globally
window.KIOSK_CONFIG = KIOSK_CONFIG;
