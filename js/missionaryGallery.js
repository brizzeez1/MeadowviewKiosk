/* ================================================================
   MISSIONARYGALLERY.JS - PHOTO GALLERY VIEWER FOR MISSIONARIES
   ================================================================
   This module handles the fullscreen photo gallery for missionaries:
   - Displays photos from the missionary's gallery folder
   - Swipe navigation (touch) and arrow buttons
   - Swipe hint animation that disappears after first interaction
   - Photo counter (e.g., "2 of 4")
   - Close button to return to profile

   CURRENT: Photos are loaded from local assets folder
   FUTURE: Will integrate with Google Drive for remote photo storage

   FOLDER STRUCTURE:
   - Each missionary has their own gallery folder
   - Path: assets/missionary_photos/gallery/{missionary_name}/
   - Photos are listed in config.js galleryPhotos array

   ================================================================ */

const MissionaryGallery = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _overlay = null;
    let _imageContainer = null;
    let _currentImage = null;
    let _counter = null;
    let _closeBtn = null;
    let _prevBtn = null;
    let _nextBtn = null;
    let _swipeHint = null;

    let _photos = [];
    let _currentIndex = 0;
    let _missionaryName = '';
    let _galleryFolder = '';
    let _hasInteracted = false;
    let _isOpen = false;

    // Touch/Mouse handling
    let _touchStartX = 0;
    let _touchStartY = 0;
    let _touchEndX = 0;
    let _isDragging = false;
    const SWIPE_THRESHOLD = 50;

    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the gallery module.
     * Call this once when the app starts.
     */
    function init() {
        _overlay = document.getElementById('missionaryGalleryOverlay');

        if (!_overlay) {
            console.warn('[MissionaryGallery] Gallery overlay not found in DOM');
            return;
        }

        _imageContainer = _overlay.querySelector('.gallery-image-container');
        _currentImage = document.getElementById('galleryCurrentImage');
        _counter = document.getElementById('galleryCounter');
        _closeBtn = document.getElementById('galleryCloseBtn');
        _prevBtn = document.getElementById('galleryPrevBtn');
        _nextBtn = document.getElementById('galleryNextBtn');
        _swipeHint = document.getElementById('gallerySwipeHint');

        setupEventListeners();

        console.log('[MissionaryGallery] Initialized');
    }

    /**
     * Set up event listeners for navigation and touch.
     */
    function setupEventListeners() {
        // Close button
        if (_closeBtn) {
            _closeBtn.addEventListener('click', close);
            _closeBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                close();
            });
        }

        // Navigation arrows
        if (_prevBtn) {
            _prevBtn.addEventListener('click', showPrevious);
            _prevBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                showPrevious();
            });
        }

        if (_nextBtn) {
            _nextBtn.addEventListener('click', showNext);
            _nextBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                showNext();
            });
        }

        // Touch events for swipe
        if (_imageContainer) {
            _imageContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
            _imageContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

            // Mouse events for swipe (for testing without touchscreen)
            _imageContainer.addEventListener('mousedown', handleMouseDown);
            _imageContainer.addEventListener('mousemove', handleMouseMove);
            _imageContainer.addEventListener('mouseup', handleMouseUp);
            _imageContainer.addEventListener('mouseleave', handleMouseUp);
        }

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Close on overlay background click
        if (_overlay) {
            _overlay.addEventListener('click', function(e) {
                if (e.target === _overlay) {
                    close();
                }
            });
        }
    }

    /* ============================================================
       SECTION 3: GALLERY OPERATIONS
       ============================================================ */

    /**
     * Open the gallery for a missionary.
     * @param {Object} missionary - The missionary object with gallery data
     */
    function open(missionary) {
        if (!missionary) {
            console.error('[MissionaryGallery] No missionary data provided');
            return;
        }

        _missionaryName = missionary.name || 'Missionary';
        _galleryFolder = missionary.galleryFolder || '';
        _photos = missionary.galleryPhotos || [];

        // If no photos in config, try to use a default message
        if (_photos.length === 0) {
            console.warn('[MissionaryGallery] No photos available for', _missionaryName);
            showNoPhotosMessage();
            return;
        }

        _currentIndex = 0;
        _hasInteracted = false;
        _isOpen = true;

        // Show the overlay
        if (_overlay) {
            _overlay.classList.add('visible');
        }

        // Show swipe hint
        if (_swipeHint) {
            _swipeHint.classList.remove('hidden');
            _swipeHint.classList.add('visible');
        }

        // Load the first photo
        loadCurrentPhoto();

        console.log('[MissionaryGallery] Opened gallery for', _missionaryName, 'with', _photos.length, 'photos');
    }

    /**
     * Close the gallery.
     */
    function close() {
        _isOpen = false;

        if (_overlay) {
            _overlay.classList.remove('visible');
        }

        // Reset state
        _photos = [];
        _currentIndex = 0;
        _hasInteracted = false;

        console.log('[MissionaryGallery] Closed');
    }

    /**
     * Load and display the current photo.
     */
    function loadCurrentPhoto() {
        if (!_currentImage || _photos.length === 0) return;

        const photoFilename = _photos[_currentIndex];
        const basePath = 'assets/missionary_photos/';
        const fullPath = basePath + _galleryFolder + photoFilename;

        /* FUTURE: Google Drive Integration
        // When using Google Drive, construct URL like this:
        // const driveFileId = photoFilename; // Would be the Drive file ID
        // const fullPath = `https://lh3.googleusercontent.com/d/${driveFileId}=s1200`;
        */

        // Add loading state
        _currentImage.classList.add('loading');

        _currentImage.onload = function() {
            _currentImage.classList.remove('loading');
        };

        _currentImage.onerror = function() {
            console.error('[MissionaryGallery] Failed to load image:', fullPath);
            _currentImage.src = 'assets/placeholder.png'; // Fallback
            _currentImage.classList.remove('loading');
        };

        _currentImage.src = fullPath;
        _currentImage.alt = _missionaryName + ' - Photo ' + (_currentIndex + 1);

        // Update counter
        updateCounter();
    }

    /**
     * Update the photo counter display.
     */
    function updateCounter() {
        if (_counter) {
            _counter.textContent = (_currentIndex + 1) + ' of ' + _photos.length;
        }
    }

    /**
     * Show the previous photo.
     */
    function showPrevious() {
        if (_photos.length <= 1) return;

        hideSwipeHint();

        _currentIndex = (_currentIndex - 1 + _photos.length) % _photos.length;
        loadCurrentPhoto();
    }

    /**
     * Show the next photo.
     */
    function showNext() {
        if (_photos.length <= 1) return;

        hideSwipeHint();

        _currentIndex = (_currentIndex + 1) % _photos.length;
        loadCurrentPhoto();
    }

    /**
     * Hide the swipe hint after first interaction.
     */
    function hideSwipeHint() {
        if (!_hasInteracted && _swipeHint) {
            _hasInteracted = true;
            _swipeHint.classList.remove('visible');
            _swipeHint.classList.add('hidden');
        }
    }

    /**
     * Show message when no photos are available.
     */
    function showNoPhotosMessage() {
        // Could show a modal or alert here
        alert('No photos available for ' + _missionaryName + ' yet.');
    }

    /* ============================================================
       SECTION 4: TOUCH HANDLING
       ============================================================ */

    /**
     * Handle touch start event.
     */
    function handleTouchStart(e) {
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
    }

    /**
     * Handle touch end event and determine swipe direction.
     */
    function handleTouchEnd(e) {
        if (!_isOpen) return;

        _touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = _touchStartX - _touchEndX;
        const diffY = _touchStartY - touchEndY;

        // Only register horizontal swipes (ignore vertical scrolling)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
            e.preventDefault();

            if (diffX > 0) {
                // Swiped left - show next
                showNext();
            } else {
                // Swiped right - show previous
                showPrevious();
            }
        }
    }

    /* ============================================================
       SECTION 4B: MOUSE HANDLING (for desktop/testing)
       ============================================================ */

    /**
     * Handle mouse down event (start drag).
     */
    function handleMouseDown(e) {
        if (!_isOpen) return;

        // Only respond to left mouse button
        if (e.button !== 0) return;

        _isDragging = true;
        _touchStartX = e.clientX;
        _touchStartY = e.clientY;

        // Prevent default to avoid text selection
        e.preventDefault();
    }

    /**
     * Handle mouse move event (during drag).
     */
    function handleMouseMove(e) {
        if (!_isDragging || !_isOpen) return;

        // Track current position (for visual feedback if needed)
        _touchEndX = e.clientX;
    }

    /**
     * Handle mouse up event (end drag, determine swipe).
     */
    function handleMouseUp(e) {
        if (!_isDragging || !_isOpen) return;

        _isDragging = false;
        _touchEndX = e.clientX;
        const touchEndY = e.clientY;

        const diffX = _touchStartX - _touchEndX;
        const diffY = _touchStartY - touchEndY;

        // Only register horizontal swipes (ignore vertical)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) {
                // Dragged left - show next
                showNext();
            } else {
                // Dragged right - show previous
                showPrevious();
            }
        }
    }

    /**
     * Handle keyboard navigation.
     */
    function handleKeydown(e) {
        if (!_isOpen) return;

        switch (e.key) {
            case 'ArrowLeft':
                showPrevious();
                break;
            case 'ArrowRight':
                showNext();
                break;
            case 'Escape':
                close();
                break;
        }
    }

    /* ============================================================
       SECTION 5: FUTURE GOOGLE DRIVE INTEGRATION
       ============================================================ */

    /*
    FUTURE: Google Drive Integration

    When ready to implement Google Drive integration:

    1. Each missionary will have a googleDriveFolderId in their config

    2. Create a function to fetch photos from Drive:

    async function loadPhotosFromDrive(folderId) {
        // Option A: Use Google Drive API directly (requires OAuth)
        // const response = await fetch(
        //     `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=YOUR_API_KEY`
        // );
        // const data = await response.json();
        // return data.files.map(file => file.id);

        // Option B: Use a backend endpoint that handles auth
        // const response = await fetch(`/api/missionaries/${missionaryId}/photos`);
        // const data = await response.json();
        // return data.photos;
    }

    3. Modify the open() function to:
       - Check if missionary has googleDriveFolderId
       - If yes, call loadPhotosFromDrive()
       - Otherwise, fall back to local galleryPhotos array

    4. For image URLs, use Google's content delivery:
       const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=s1200`;

    5. Consider caching the photo list to avoid repeated API calls
    */

    /* ============================================================
       SECTION 6: PUBLIC API
       ============================================================ */

    return {
        init: init,
        open: open,
        close: close,
        showNext: showNext,
        showPrevious: showPrevious,
        isOpen: function() { return _isOpen; }
    };

})();

// Make available globally
window.MissionaryGallery = MissionaryGallery;
