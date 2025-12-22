/* ================================================================
   APICLIENT.JS - BACKEND API CLIENT
   ================================================================
   This module handles all HTTP communication with the Python backend.
   
   PURPOSE:
   - Centralized API calls to the backend
   - Consistent error handling
   - Easy to swap between local and remote backends
   - Prepared for future Google Drive integration
   
   CURRENT STATUS:
   All functions are stubbed and return placeholder data.
   The actual backend calls are in place but the backend
   returns TODO responses until implemented.
   
   USAGE:
     // Get temple visits
     const visits = await ApiClient.getTempleVisits();
     
     // Post a new temple visit
     const result = await ApiClient.postTempleVisit({ date: '2024-01-15', count: 5 });
   ================================================================ */

const ApiClient = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE HELPER FUNCTIONS
       ============================================================ */
    
    /**
     * Get the base URL from config.
     * @returns {string} API base URL
     */
    function getBaseUrl() {
        return ConfigLoader.getApiBaseUrl();
    }
    
    /**
     * Get the timeout from config.
     * @returns {number} Timeout in milliseconds
     */
    function getTimeout() {
        return ConfigLoader.getApiTimeout();
    }
    
    /**
     * Log API calls if debug logging is enabled.
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data (optional)
     */
    function logApiCall(method, endpoint, data = null) {
        if (ConfigLoader.shouldLogApiCalls()) {
            console.log(`[API] ${method} ${endpoint}`, data || '');
        }
    }
    
    /**
     * Make an HTTP request to the backend.
     * @param {string} endpoint - API endpoint (e.g., "/api/temple-visits")
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async function makeRequest(endpoint, options = {}) {
        const url = `${getBaseUrl()}${endpoint}`;
        const timeout = getTimeout();
        
        // Set up default options
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const fetchOptions = { ...defaultOptions, ...options };
        
        logApiCall(fetchOptions.method, endpoint, options.body);
        
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            
            if (ConfigLoader.shouldLogApiCalls()) {
                console.log(`[API] Response:`, data);
            }
            
            return data;
            
        } catch (error) {
            // Handle different error types
            if (error.name === 'AbortError') {
                console.error(`[API] Request timeout: ${endpoint}`);
                return { status: 'error', message: 'Request timed out' };
            }
            
            if (error.message.includes('Failed to fetch')) {
                console.error(`[API] Network error - Is the backend running?`);
                console.error(`[API] Expected backend at: ${getBaseUrl()}`);
                return { 
                    status: 'error', 
                    message: 'Cannot connect to backend. Make sure Python server is running.' 
                };
            }
            
            console.error(`[API] Error calling ${endpoint}:`, error);
            return { status: 'error', message: error.message };
        }
    }


    /* ============================================================
       SECTION 2: TEMPLE VISITS API
       ============================================================
       Endpoints for Temple 365 tracking feature.
       
       TODO: Implement real data storage in backend.
       ============================================================ */
    
    /**
     * Get all temple visits.
     * @returns {Promise<Object>} List of temple visits
     * 
     * Expected response format:
     * {
     *   status: "ok",
     *   data: [
     *     { id: 1, date: "2024-01-15", count: 5, notes: "..." },
     *     ...
     *   ]
     * }
     */
    async function getTempleVisits() {
        // TODO: This will return real data once backend is implemented
        return await makeRequest('/api/temple-visits');
    }
    
    /**
     * Post a new temple visit record.
     * @param {Object} visitData - Visit data
     * @param {string} visitData.date - Date of visit (YYYY-MM-DD)
     * @param {number} visitData.count - Number of people who attended
     * @param {string} visitData.notes - Optional notes
     * @returns {Promise<Object>} Result of the operation
     * 
     * TODO: Implement in backend to save to local storage or Google Drive
     */
    async function postTempleVisit(visitData) {
        return await makeRequest('/api/temple-visits', {
            method: 'POST',
            body: JSON.stringify(visitData)
        });
    }


    /* ============================================================
       SECTION 3: SELFIES API
       ============================================================
       Endpoints for selfie capture feature.
       
       TODO: Implement camera capture on frontend.
       TODO: Implement image storage on backend.
       ============================================================ */
    
    /**
     * Get all selfies.
     * @returns {Promise<Object>} List of selfie metadata
     * 
     * Expected response format:
     * {
     *   status: "ok",
     *   data: [
     *     { id: 1, filename: "selfie_001.jpg", timestamp: "...", caption: "..." },
     *     ...
     *   ]
     * }
     */
    async function getSelfies() {
        // TODO: Will return list of selfie metadata once implemented
        return await makeRequest('/api/selfies');
    }
    
    /**
     * Upload a new selfie.
     * @param {Object} selfieData - Selfie data
     * @param {string} selfieData.imageBase64 - Base64-encoded image data
     * @param {string} selfieData.caption - Optional caption
     * @returns {Promise<Object>} Result of the upload
     * 
     * TODO: Implement image upload to backend
     * TODO: Handle large image files appropriately
     * TODO: Add image compression on frontend before upload
     */
    async function postSelfie(selfieData) {
        return await makeRequest('/api/selfies', {
            method: 'POST',
            body: JSON.stringify(selfieData)
        });
    }


    /* ============================================================
       SECTION 4: MIRACLES API (PHASE 2)
       ============================================================
       Endpoints for the Miracles Board feature.
       
       TODO: Enable when MIRACLES_BOARD_ENABLED = true
       ============================================================ */
    
    /**
     * Get all miracle stories.
     * @returns {Promise<Object>} List of miracle entries
     */
    async function getMiracles() {
        // TODO: Implement when Phase 2 is ready
        return await makeRequest('/api/miracles');
    }
    
    /**
     * Post a new miracle story.
     * @param {Object} miracleData - Miracle entry data
     * @param {string} miracleData.title - Title of the miracle
     * @param {string} miracleData.story - The miracle story
     * @param {string} miracleData.author - Author name (optional, can be anonymous)
     * @returns {Promise<Object>} Result of the operation
     */
    async function postMiracle(miracleData) {
        return await makeRequest('/api/miracles', {
            method: 'POST',
            body: JSON.stringify(miracleData)
        });
    }


    /* ============================================================
       SECTION 5: MISSIONS API (PHASE 2)
       ============================================================
       Endpoints for the Missionary Spotlight feature.
       
       TODO: Enable when MISSIONARY_SECTION_ENABLED = true
       ============================================================ */
    
    /**
     * Get all missionaries.
     * @returns {Promise<Object>} List of missionaries and their missions
     * 
     * Expected response format:
     * {
     *   status: "ok",
     *   data: [
     *     { 
     *       id: 1, 
     *       name: "Elder Smith", 
     *       mission: "Brazil São Paulo North",
     *       startDate: "2024-01-15",
     *       photoUrl: "...",
     *       location: { lat: -23.5505, lng: -46.6333 }
     *     },
     *     ...
     *   ]
     * }
     */
    async function getMissions() {
        // TODO: Implement when Phase 2 is ready
        return await makeRequest('/api/missions');
    }


    /* ============================================================
       SECTION 6: CALENDAR API (PHASE 2)
       ============================================================
       Endpoints for the Ward Calendar feature.
       
       TODO: Enable when WARD_CALENDAR_ENABLED = true
       TODO: Consider integration with Google Calendar API
       ============================================================ */
    
    /**
     * Get calendar events.
     * @param {Object} options - Query options
     * @param {string} options.startDate - Start date filter (YYYY-MM-DD)
     * @param {string} options.endDate - End date filter (YYYY-MM-DD)
     * @returns {Promise<Object>} List of calendar events
     */
    async function getCalendarEvents(options = {}) {
        // Build query string if options provided
        let endpoint = '/api/calendar';
        const params = new URLSearchParams();
        
        if (options.startDate) {
            params.append('start', options.startDate);
        }
        if (options.endDate) {
            params.append('end', options.endDate);
        }
        
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        
        // TODO: Implement when Phase 2 is ready
        return await makeRequest(endpoint);
    }


    /* ============================================================
       SECTION 7: CONFIGURATION API
       ============================================================
       Endpoint to fetch backend configuration.
       
       This could be used to sync settings between frontend and backend,
       or to load dynamic configuration from a central source.
       ============================================================ */
    
    /**
     * Get backend configuration.
     * @returns {Promise<Object>} Backend configuration values
     * 
     * TODO: Use this to dynamically load:
     * - Temple photos list
     * - Ward name and information
     * - Feature flags from backend
     */
    async function getConfig() {
        return await makeRequest('/api/config');
    }


    /* ============================================================
       SECTION 8: TEMPLE PHOTOS API (FUTURE)
       ============================================================
       Endpoint to get the list of temple photos for screensaver.
       
       TODO: Implement this to load photos dynamically instead of
             hard-coding in config.js
       ============================================================ */
    
    /**
     * Get list of temple photos for screensaver.
     * @returns {Promise<Object>} List of photo URLs/paths
     */
    async function getTemplePhotos() {
        // TODO: Implement backend endpoint /api/temple-photos
        // For now, return data from local config
        return {
            status: 'ok',
            data: ConfigLoader.getTemplePhotos()
        };
    }


    /* ============================================================
       SECTION 9: HEALTH CHECK
       ============================================================
       Simple endpoint to check if backend is running.
       ============================================================ */
    
    /**
     * Check if the backend is reachable.
     * @returns {Promise<boolean>} True if backend is available
     */
    async function checkHealth() {
        try {
            const response = await makeRequest('/api/config');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }


    /* ============================================================
       SECTION 10: PUBLIC API
       ============================================================ */
    
    return {
        // Temple Visits (Phase 1)
        getTempleVisits: getTempleVisits,
        postTempleVisit: postTempleVisit,
        
        // Selfies (Phase 1)
        getSelfies: getSelfies,
        postSelfie: postSelfie,
        
        // Miracles (Phase 2)
        getMiracles: getMiracles,
        postMiracle: postMiracle,
        
        // Missions (Phase 2)
        getMissions: getMissions,
        
        // Calendar (Phase 2)
        getCalendarEvents: getCalendarEvents,
        
        // Configuration
        getConfig: getConfig,
        getTemplePhotos: getTemplePhotos,
        
        // Health check
        checkHealth: checkHealth
    };

})();

// Make available globally
window.ApiClient = ApiClient;
