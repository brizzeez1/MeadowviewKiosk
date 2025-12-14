/* ================================================================
   MISSIONARYDETAIL.JS - INDIVIDUAL MISSIONARY DETAIL VIEW
   ================================================================
   This module handles the detail view for individual missionaries:
   - Displays missionary information (name, mission, language, scripture)
   - Placeholder for future features:
     * Video recording (5 sec countdown, record/stop)
     * Photo carousel from Google Drive
     * Full-size photo viewing with swipe

   PURPOSE:
   Shows detailed information about a selected missionary and
   provides interactive features for ward members to engage with.
   ================================================================ */

const MissionaryDetail = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _contentContainer = null;
    let _currentMissionary = null;
    let _isActive = false;

    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the missionary detail module.
     * Call this once when the app starts.
     */
    function init() {
        _contentContainer = document.getElementById('missionary-detail-content');

        if (!_contentContainer) {
            console.error('[MissionaryDetail] Content container not found!');
            return;
        }

        // Set up back button handler
        setupBackButton();

        ConfigLoader.debugLog('Missionary detail initialized');
    }

    /**
     * Set up the back button handler.
     */
    function setupBackButton() {
        const backButton = document.getElementById('back-to-grid');
        if (backButton) {
            backButton.addEventListener('click', handleBackClick);
            backButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleBackClick();
            });
        }
    }

    /* ============================================================
       SECTION 3: RENDERING
       ============================================================ */

    /**
     * Render the detail view for a missionary.
     * @param {number} missionaryId - The missionary ID
     */
    function renderDetail(missionaryId) {
        if (!_contentContainer) return;

        // Get missionary data
        _currentMissionary = MissionarySpotlight.getMissionaryById(missionaryId);

        if (!_currentMissionary) {
            _contentContainer.innerHTML = '<p class="placeholder-text">Missionary not found.</p>';
            return;
        }

        // Check if this missionary has gallery photos
        const hasGallery = _currentMissionary.galleryPhotos && _currentMissionary.galleryPhotos.length > 0;
        const photoCount = hasGallery ? _currentMissionary.galleryPhotos.length : 0;

        // Get first name for personalized messages section
        const firstName = _currentMissionary.name.split(' ').pop(); // Gets last word (surname) - could also use first name

        // Build the detail view
        _contentContainer.innerHTML = `
            <div class="missionary-detail-header">
                <h2 class="missionary-detail-name">${_currentMissionary.name}</h2>
            </div>

            <div class="missionary-detail-body">
                <div class="missionary-info-section">
                    <div class="info-item">
                        <span class="info-label">Mission:</span>
                        <span class="info-value">${_currentMissionary.mission}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Language:</span>
                        <span class="info-value">${_currentMissionary.language}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Favorite Scripture:</span>
                        <span class="info-value">${_currentMissionary.scripture}</span>
                    </div>
                </div>

                <!-- Photo Gallery Button -->
                <div class="gallery-button-section">
                    <button class="btn-view-gallery" id="btnViewGallery" ${!hasGallery ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <span class="gallery-icon">📸</span>
                        ${hasGallery ? `View Photo Gallery (${photoCount} photos)` : 'No Photos Available'}
                    </button>
                </div>

                <div class="missionary-features-section">
                    <p class="coming-soon-badge">Coming Soon</p>
                    <p class="feature-description">
                        Additional features will include:
                    </p>
                    <ul class="feature-list">
                        <li><strong>Video Messages:</strong> Record a message for the missionary (saves to Google Drive)</li>
                        <li><strong>Messages from ${_currentMissionary.name}:</strong> View video messages sent by the missionary</li>
                    </ul>
                </div>

                <!-- FUTURE: Video Recording Section -->
                <!--
                <div class="video-recording-section">
                    <h3>Record a Video Message</h3>
                    <div class="video-preview"></div>
                    <div class="video-controls">
                        <button class="action-button" id="btn-start-recording">
                            Record
                        </button>
                        <button class="action-button" id="btn-stop-recording" style="display:none;">
                            Stop Recording
                        </button>
                    </div>
                    <div class="countdown-overlay" style="display:none;">
                        <span class="countdown-number">5</span>
                    </div>
                </div>
                -->

                <!-- FUTURE: Photo Carousel Section -->
                <!--
                <div class="photo-carousel-section">
                    <h3>Recent Photos</h3>
                    <div class="carousel-container">
                        <div class="carousel-track">
                            Images will be loaded from Google Drive folder
                        </div>
                    </div>
                    <div class="carousel-controls">
                        <button class="carousel-btn prev">‹</button>
                        <button class="carousel-btn next">›</button>
                    </div>
                </div>
                -->

                <!-- FUTURE IMPLEMENTATION NOTES:

                     VIDEO RECORDING FEATURE:
                     - Use navigator.mediaDevices.getUserMedia() for camera access
                     - Implement 5-second countdown before recording starts
                     - Use MediaRecorder API to capture video
                     - Upload to Google Drive folder (missionary-videos/{missionaryId}/)
                     - Show success message after upload

                     PHOTO CAROUSEL FEATURE:
                     - Pull images from Google Drive folder (missionary-photos/{missionaryId}/)
                     - Use backend endpoint /api/missionaries/{id}/photos
                     - Display in responsive carousel
                     - Click photo to view full-size
                     - Swipe/arrow navigation between photos
                     - Parents can upload via shared Google Drive link
                -->
            </div>
        `;

        // Set up gallery button click handler
        setupGalleryButton();

        ConfigLoader.debugLog('Rendered detail for missionary:', _currentMissionary.name);
    }

    /**
     * Set up the gallery button click handler.
     */
    function setupGalleryButton() {
        const galleryBtn = document.getElementById('btnViewGallery');
        if (galleryBtn && _currentMissionary) {
            const hasGallery = _currentMissionary.galleryPhotos && _currentMissionary.galleryPhotos.length > 0;

            if (hasGallery) {
                galleryBtn.addEventListener('click', handleGalleryClick);
                galleryBtn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    handleGalleryClick();
                });
            }
        }
    }

    /**
     * Handle gallery button click - open the photo gallery.
     */
    function handleGalleryClick() {
        if (!_currentMissionary) return;

        // Check if MissionaryGallery module is available
        if (window.MissionaryGallery && typeof MissionaryGallery.open === 'function') {
            MissionaryGallery.open(_currentMissionary);
        } else {
            console.error('[MissionaryDetail] MissionaryGallery module not found');
        }
    }

    /* ============================================================
       SECTION 4: EVENT HANDLERS
       ============================================================ */

    /**
     * Handle back button click.
     */
    function handleBackClick() {
        // Navigate back to missionary grid
        window.dispatchEvent(new CustomEvent('navigate', {
            detail: { state: 'MISSIONARIES' }
        }));
    }

    /* ============================================================
       SECTION 5: ACTIVATION / DEACTIVATION
       ============================================================ */

    /**
     * Activate the missionary detail view.
     * @param {number} missionaryId - The missionary ID to display
     */
    function activate(missionaryId) {
        _isActive = true;

        // Render the detail view
        renderDetail(missionaryId);

        ConfigLoader.debugLog('Missionary detail activated for ID:', missionaryId);
    }

    /**
     * Deactivate the missionary detail view.
     */
    function deactivate() {
        _isActive = false;
        _currentMissionary = null;
        ConfigLoader.debugLog('Missionary detail deactivated');
    }

    /**
     * Check if missionary detail is currently active.
     * @returns {boolean} True if active
     */
    function isActive() {
        return _isActive;
    }

    /* ============================================================
       SECTION 6: PUBLIC API
       ============================================================ */

    return {
        // Initialization
        init: init,

        // Activation
        activate: activate,
        deactivate: deactivate,
        isActive: isActive,

        // Rendering
        renderDetail: renderDetail
    };

})();

// Make available globally
window.MissionaryDetail = MissionaryDetail;
