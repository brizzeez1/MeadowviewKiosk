/* ================================================================
   MISSIONARYDETAIL.JS - INDIVIDUAL MISSIONARY DETAIL VIEW
   ================================================================
   This module handles the detail view for individual missionaries:
   - Displays missionary information (name, mission, language, scripture)
   - Photo gallery (from Firestore/Storage via MissionaryGallery)
   - Missionary videos gallery (kiosk-display videos via MissionaryGallery.openVideos)
   - Video recording modal (kiosk -> missionary via MissionaryVideoRecorder)

   UI FIXES INCLUDED:
   - Scrollable detail container so content never gets cut off
   - Wider tray/card to use side space
   - Action buttons in a single row across the bottom:
     Photo Gallery | View Missionary Videos | Record Video Message
   ================================================================ */

const MissionaryDetail = (function () {
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

    // Make detail view scrollable so content never gets cut off
    _contentContainer.style.overflowY = 'auto';
    _contentContainer.style.maxHeight = 'calc(100vh - 120px)'; // leaves room for kiosk chrome
    _contentContainer.style.paddingBottom = '40px';

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
    const hasGallery =
      _currentMissionary.galleryPhotos && _currentMissionary.galleryPhotos.length > 0;
    const photoCount = hasGallery ? _currentMissionary.galleryPhotos.length : 0;

    // Build the detail view (wider tray + button row)
    _contentContainer.innerHTML = `
      <div class="missionary-detail" style="max-width: 1200px; width: 92%; margin: 0 auto;">
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

          <!-- ACTION BUTTON ROW -->
          <div style="
            display:flex;
            gap:18px;
            justify-content:center;
            align-items:stretch;
            margin: 22px auto 10px auto;
            width: 100%;
            max-width: 1100px;
            flex-wrap: wrap;
          ">
            <button class="btn-view-gallery"
                    id="btnViewGallery"
                    ${!hasGallery ? 'disabled style="opacity:0.5; cursor:not-allowed; flex:1; min-width:260px;"' : 'style="flex:1; min-width:260px;"'}>
              <span class="gallery-icon">📸</span>
              ${hasGallery ? `View Photo Gallery (${photoCount} photos)` : 'No Photos Available'}
            </button>

            <button class="btn-view-gallery"
                    id="btnViewVideoGallery"
                    style="flex:1; min-width:260px;">
              <span class="gallery-icon">📼</span>
              View Missionary Videos
            </button>

            <button class="btn-view-gallery"
                    id="btnRecordVideo"
                    style="flex:1; min-width:260px;">
              <span class="gallery-icon">🎥</span>
              Record Video Message
            </button>
          </div>

          <div class="missionary-features-section">
            <p class="coming-soon-badge">Coming Soon</p>
            <p class="feature-description">Additional features will include:</p>
            <ul class="feature-list">
              <li><strong>Messages from ${_currentMissionary.name}:</strong> View video messages sent by the missionary</li>
            </ul>
          </div>

          <div style="height: 20px;"></div>
        </div>
      </div>
    `;

    // Set up button click handlers
    setupGalleryButton();
    setupVideoRecordingButton();

    ConfigLoader.debugLog('Rendered detail for missionary:', _currentMissionary.name);
  }

  /**
   * Set up the gallery button click handler.
   */
  function setupGalleryButton() {
    const galleryBtn = document.getElementById('btnViewGallery');
    const btnViewVideoGallery = document.getElementById('btnViewVideoGallery');

    if (btnViewVideoGallery) {
      btnViewVideoGallery.addEventListener('click', handleVideoGalleryClick);
      btnViewVideoGallery.addEventListener('touchend', function (e) {
        e.preventDefault();
        handleVideoGalleryClick();
      });
    }

    if (galleryBtn && _currentMissionary) {
      const hasGallery =
        _currentMissionary.galleryPhotos && _currentMissionary.galleryPhotos.length > 0;

      if (hasGallery) {
        galleryBtn.addEventListener('click', handleGalleryClick);
        galleryBtn.addEventListener('touchend', function (e) {
          e.preventDefault();
          handleGalleryClick();
        });
      }
    }
  }

  /**
   * Set up the video recording button click handler.
   */
  function setupVideoRecordingButton() {
    const videoBtn = document.getElementById('btnRecordVideo');
    if (videoBtn && _currentMissionary) {
      videoBtn.addEventListener('click', handleVideoRecordingClick);
      videoBtn.addEventListener('touchend', function (e) {
        e.preventDefault();
        handleVideoRecordingClick();
      });
    }
  }

  /**
   * Handle video gallery click (missionary/family submitted videos shown on kiosk).
   */
  function handleVideoGalleryClick() {
    if (!_currentMissionary) return;

    if (window.MissionaryGallery && typeof MissionaryGallery.openVideos === 'function') {
      MissionaryGallery.openVideos(_currentMissionary);
    } else {
      console.error('[MissionaryDetail] MissionaryGallery.openVideos not found');
    }
  }

  /**
   * Handle gallery button click - open the photo gallery.
   */
  function handleGalleryClick() {
    if (!_currentMissionary) return;

    if (window.MissionaryGallery && typeof MissionaryGallery.open === 'function') {
      MissionaryGallery.open(_currentMissionary);
    } else {
      console.error('[MissionaryDetail] MissionaryGallery module not found');
    }
  }

  /**
   * Handle video recording button click - open the video recorder modal.
   */
  function handleVideoRecordingClick() {
    if (!_currentMissionary) return;

    if (window.MissionaryVideoRecorder && typeof MissionaryVideoRecorder.open === 'function') {
      MissionaryVideoRecorder.open(_currentMissionary);
    } else {
      console.error('[MissionaryDetail] MissionaryVideoRecorder module not found');
    }
  }

  /* ============================================================
     SECTION 4: EVENT HANDLERS
     ============================================================ */

  /**
   * Handle back button click.
   */
  function handleBackClick() {
    window.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { state: 'MISSIONARIES' }
      })
    );
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
    init,
    activate,
    deactivate,
    isActive,
    renderDetail
  };
})();

// Make available globally
window.MissionaryDetail = MissionaryDetail;
