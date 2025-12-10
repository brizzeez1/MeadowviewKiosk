/* ================================================================
   SCREENSAVER.JS - SCREENSAVER / ATTRACT MODE LOGIC
   ================================================================
   This module handles the screensaver functionality:
   - Rotating temple photos with crossfade effect
   - "Touch anywhere to begin" prompt animation
   - Touch/click detection to exit screensaver
   
   PURPOSE:
   The screensaver acts as an "attract mode" for the kiosk,
   drawing attention with beautiful temple photos when the
   kiosk is not being used.
   ================================================================ */

const Screensaver = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */
    
    // Array of temple photo URLs
    let _photos = [];
    
    // Current photo index
    let _currentIndex = 0;
    
    // Rotation timer reference
    let _rotationTimer = null;
    
    // Is screensaver currently active?
    let _isActive = false;
    
    // Reference to DOM elements
    let _bgCurrent = null;
    let _bgNext = null;
    let _screenElement = null;


    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */
    
    /**
     * Initialize the screensaver module.
     * Call this once when the app starts.
     */
    function init() {
        // Get DOM elements
        _screenElement = document.getElementById('screensaver-screen');
        _bgCurrent = document.getElementById('screensaver-bg-current');
        _bgNext = document.getElementById('screensaver-bg-next');
        
        if (!_screenElement || !_bgCurrent || !_bgNext) {
            console.error('[Screensaver] Required DOM elements not found!');
            return;
        }
        
        // Load photos from config
        _photos = ConfigLoader.getTemplePhotos();
        
        if (_photos.length === 0) {
            console.warn('[Screensaver] No temple photos configured!');
            // Add a fallback gradient background
            _bgCurrent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            return;
        }
        
        // Set initial background
        setBackground(_bgCurrent, _photos[0]);
        
        // Preload all images
        preloadImages();
        
        // Set up click handler
        setupClickHandler();
        
        ConfigLoader.debugLog('Screensaver initialized with', _photos.length, 'photos');
    }


    /* ============================================================
       SECTION 3: IMAGE MANAGEMENT
       ============================================================ */
    
    /**
     * Preload all temple photos for smooth transitions.
     */
    function preloadImages() {
        _photos.forEach(photoUrl => {
            const img = new Image();
            img.src = photoUrl;
        });
    }
    
    /**
     * Set the background image of an element.
     * @param {HTMLElement} element - The element to update
     * @param {string} imageUrl - URL of the image
     */
    function setBackground(element, imageUrl) {
        element.style.backgroundImage = `url('${imageUrl}')`;
    }
    
    /**
     * Get the next photo index, wrapping around to 0 if needed.
     * @returns {number} The next index
     */
    function getNextIndex() {
        return (_currentIndex + 1) % _photos.length;
    }


    /* ============================================================
       SECTION 4: PHOTO ROTATION
       ============================================================ */
    
    /**
     * Start the photo rotation timer.
     */
    function startRotation() {
        if (_rotationTimer) {
            stopRotation();
        }
        
        if (_photos.length <= 1) {
            // No need to rotate with only one photo
            return;
        }
        
        const interval = ConfigLoader.getRotationInterval();
        
        _rotationTimer = setInterval(() => {
            rotateToNextPhoto();
        }, interval);
        
        ConfigLoader.debugLog('Screensaver rotation started, interval:', interval);
    }
    
    /**
     * Stop the photo rotation timer.
     */
    function stopRotation() {
        if (_rotationTimer) {
            clearInterval(_rotationTimer);
            _rotationTimer = null;
            ConfigLoader.debugLog('Screensaver rotation stopped');
        }
    }
    
    /**
     * Rotate to the next photo with crossfade effect.
     */
    function rotateToNextPhoto() {
        if (_photos.length <= 1) return;
        
        // Calculate next index
        const nextIndex = getNextIndex();
        
        // Prepare the next background
        setBackground(_bgNext, _photos[nextIndex]);
            // Update the printed temple name
    const filename = _photos[nextIndex];
    const name = formatTempleNameFromFilename(filename);
    document.getElementById("temple-name-overlay").innerText = name;

        // Crossfade animation
        // Fade out current, fade in next
        _bgCurrent.style.opacity = '0';
        _bgNext.style.opacity = '1';
        
        // After transition completes, swap the elements
        setTimeout(() => {
            // Update current to show the new image
            setBackground(_bgCurrent, _photos[nextIndex]);
            _bgCurrent.style.opacity = '1';
            _bgNext.style.opacity = '0';
            
            // Update the index
            _currentIndex = nextIndex;
            
        }, 1500); // Match CSS transition duration
        
        ConfigLoader.debugLog('Rotated to photo', nextIndex);
    }


    /* ============================================================
       SECTION 5: INTERACTION HANDLING
       ============================================================ */
    
    /**
     * Set up click/touch handler to exit screensaver.
     */
    function setupClickHandler() {
        if (!_screenElement) return;
        
        // Handle both mouse and touch events
        _screenElement.addEventListener('click', handleInteraction);
        _screenElement.addEventListener('touchstart', handleInteraction);
    }
    
    /**
     * Handle user interaction (touch/click).
     * @param {Event} event - The interaction event
     */
    function handleInteraction(event) {
        // Prevent double-firing on touch devices
        if (event.type === 'touchstart') {
            event.preventDefault();
        }
        
        // Only respond if screensaver is active
        if (!_isActive) return;
        
        ConfigLoader.debugLog('Screensaver interaction detected');
        
        // Notify app.js to transition to home screen
        // This uses a custom event that app.js listens for
        window.dispatchEvent(new CustomEvent('screensaver-exit'));
    }


    /* ============================================================
       SECTION 6: ACTIVATION / DEACTIVATION
       ============================================================ */
    
    /**
     * Activate the screensaver.
     * Called when transitioning to SCREENSAVER state.
     */
    function activate() {
        _isActive = true;
        
        // Reset to first photo
        _currentIndex = 0;
        if (_photos.length > 0) {
            setBackground(_bgCurrent, _photos[0]);
        }
        
        // Start rotation
        startRotation();
        
        ConfigLoader.debugLog('Screensaver activated');
    }
    
    /**
     * Deactivate the screensaver.
     * Called when transitioning away from SCREENSAVER state.
     */
    function deactivate() {
        _isActive = false;
        
        // Stop rotation
        stopRotation();
        
        ConfigLoader.debugLog('Screensaver deactivated');
    }
    
    /**
     * Check if screensaver is currently active.
     * @returns {boolean} True if active
     */
    function isActive() {
        return _isActive;
    }


    /* ============================================================
       SECTION 7: PHOTO MANAGEMENT (FOR FUTURE USE)
       ============================================================ */
    
    /**
     * Set a new list of photos.
     * @param {Array<string>} photoUrls - Array of image URLs
     * 
     * TODO: Use this when loading photos from backend API
     */
    function setPhotos(photoUrls) {
        _photos = photoUrls;
        _currentIndex = 0;
        
        if (_photos.length > 0) {
            setBackground(_bgCurrent, _photos[0]);
            preloadImages();
        }
        
        // Restart rotation if active
        if (_isActive) {
            startRotation();
        }
    }
    
    /**
     * Add a photo to the rotation.
     * @param {string} photoUrl - URL of the photo to add
     */
    function addPhoto(photoUrl) {
        _photos.push(photoUrl);
        
        // Preload the new image
        const img = new Image();
        img.src = photoUrl;
    }
    
    /**
     * Get the current photo count.
     * @returns {number} Number of photos
     */
    function getPhotoCount() {
        return _photos.length;
    }
function formatTempleNameFromFilename(path) {
  // Extract file name only
  let filename = path.split("/").pop().split(".")[0];

  // Replace hyphens with underscores for consistent parsing
  filename = filename.replace(/-/g, "_");

  // Remove any part starting with _temple
  let core = filename.split("_temple")[0];

  // Split into pieces like ["az", "gilbert"] OR ["belem", "brazil"]
  let parts = core.split("_");

  // If the first part is a US state abbreviation
  const usStates = [
    "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks","ky","la",
    "me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj","nm","ny","nc","nd","oh","ok",
    "or","pa","ri","sc","sd","tn","tx","ut","vt","va","wa","wv","wi","wy"
  ];

  // Case 1: US state first (e.g., ["az", "gilbert"])
  if (usStates.includes(parts[0])) {
    const state = parts[0].toUpperCase();
    const cityParts = parts.slice(1);
    const city = cityParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    return `${city} ${state}`;
  }

  // Case 2: International (e.g., ["belem", "brazil"])
  const city = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const country = parts[1] 
    ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) 
    : "";

  return `${city} ${country}`.trim();
}


    /* ============================================================
       SECTION 8: PUBLIC API
       ============================================================ */
    
    return {
        // Initialization
        init: init,
        
        // Activation
        activate: activate,
        deactivate: deactivate,
        isActive: isActive,
        
        // Rotation control
        startRotation: startRotation,
        stopRotation: stopRotation,
        rotateToNextPhoto: rotateToNextPhoto,
        
        // Photo management (for future API integration)
        setPhotos: setPhotos,
        addPhoto: addPhoto,
        getPhotoCount: getPhotoCount
    };

})();

// Make available globally
window.Screensaver = Screensaver;
