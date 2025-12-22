/* ================================================================
   MISSIONARYGALLERY.JS - MISSIONARY PHOTO GALLERY
   ================================================================
   This module handles displaying missionary gallery photos:
   - Real-time updates from Firestore
   - Newest photos first (per spec decision #12)
   - Infinite scroll/pagination support
   - Full-screen photo viewer

   PURPOSE:
   Shows gallery photos uploaded by family/friends for a specific
   missionary, with real-time updates as new photos are uploaded.

   PHASE 7: Initial implementation
   ================================================================ */

const MissionaryGallery = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _galleryContainer = null;
    let _currentMissionaryId = null;
    let _photos = [];
    let _unsubscribeGallery = null;
    let _isActive = false;

    // Pagination
    let _lastDoc = null;
    let _hasMore = true;
    const PHOTOS_PER_PAGE = 20;

    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the missionary gallery module.
     * Call this once when the app starts.
     */
    function init() {
        _galleryContainer = document.getElementById('missionary-gallery-grid');

        if (!_galleryContainer) {
            console.error('[MissionaryGallery] Gallery container not found!');
            return;
        }

        console.log('[MissionaryGallery] Initialized');
    }

    /* ============================================================
       SECTION 3: DATA LOADING (FIRESTORE)
       ============================================================ */

    /**
     * Load gallery photos for a missionary from Firestore.
     * @param {string} missionaryId - Firestore document ID of missionary
     */
    function loadGalleryPhotos(missionaryId) {
        // Unsubscribe from previous listener if exists
        if (_unsubscribeGallery) {
            _unsubscribeGallery();
            _unsubscribeGallery = null;
        }

        _currentMissionaryId = missionaryId;
        _photos = [];
        _lastDoc = null;
        _hasMore = true;

        // Check if Firebase/Firestore is available
        if (!window.firebase || !window.firebase.firestore) {
            console.error('[MissionaryGallery] Firebase not initialized');
            renderGallery();
            return;
        }

        // Get ward ID from config or use default
        const wardId = (window.KIOSK_CONFIG && window.KIOSK_CONFIG.ORGANIZATION && window.KIOSK_CONFIG.ORGANIZATION.WARD_ID) || 'meadowview';

        console.log('[MissionaryGallery] Loading gallery for missionary:', missionaryId);

        const db = window.firebase.firestore();

        // Subscribe to gallery photos, sorted by newest first (per spec decision #12)
        _unsubscribeGallery = db.collection('wards')
            .doc(wardId)
            .collection('missionaries')
            .doc(missionaryId)
            .collection('gallery')
            .orderBy('createdAt', 'desc')  // Newest first
            .limit(PHOTOS_PER_PAGE)
            .onSnapshot(
                (snapshot) => {
                    const photos = [];
                    snapshot.forEach((doc) => {
                        photos.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });

                    console.log('[MissionaryGallery] Gallery photos loaded:', photos.length);
                    _photos = photos;
                    _lastDoc = snapshot.docs[snapshot.docs.length - 1];
                    _hasMore = snapshot.docs.length === PHOTOS_PER_PAGE;

                    renderGallery();
                },
                (error) => {
                    console.error('[MissionaryGallery] Error loading gallery:', error);
                    renderGallery();
                }
            );
    }

    /* ============================================================
       SECTION 4: RENDERING
       ============================================================ */

    /**
     * Render the gallery grid.
     */
    function renderGallery() {
        if (!_galleryContainer) return;

        // Clear existing content
        _galleryContainer.innerHTML = '';

        if (_photos.length === 0) {
            _galleryContainer.innerHTML = '<p class="placeholder-text">No photos yet. Family and friends can upload photos to the missionary portal.</p>';
            return;
        }

        // Create photo tiles
        _photos.forEach((photo, index) => {
            const tile = createPhotoTile(photo, index);
            _galleryContainer.appendChild(tile);
        });

        console.log('[MissionaryGallery] Rendered', _photos.length, 'photos');
    }

    /**
     * Create a photo tile element.
     * @param {Object} photo - Photo data
     * @param {number} index - Photo index
     * @returns {HTMLElement} - Photo tile element
     */
    function createPhotoTile(photo, index) {
        const tile = document.createElement('div');
        tile.className = 'gallery-photo-tile';
        tile.setAttribute('data-photo-id', photo.id);

        // Photo image
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.caption || 'Missionary photo';
        img.className = 'gallery-photo';

        tile.appendChild(img);

        // Caption overlay (if exists)
        if (photo.caption) {
            const caption = document.createElement('div');
            caption.className = 'gallery-photo-caption';
            caption.textContent = photo.caption;
            tile.appendChild(caption);
        }

        return tile;
    }

    /* ============================================================
       SECTION 5: ACTIVATION / DEACTIVATION
       ============================================================ */

    /**
     * Activate the gallery for a specific missionary.
     * @param {string} missionaryId - Firestore document ID
     */
    function activate(missionaryId) {
        _isActive = true;
        loadGalleryPhotos(missionaryId);
        console.log('[MissionaryGallery] Activated for missionary:', missionaryId);
    }

    /**
     * Deactivate the gallery.
     */
    function deactivate() {
        _isActive = false;

        // Unsubscribe from Firestore
        if (_unsubscribeGallery) {
            _unsubscribeGallery();
            _unsubscribeGallery = null;
        }

        // Clear data
        _photos = [];
        _currentMissionaryId = null;

        console.log('[MissionaryGallery] Deactivated');
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

        // Rendering
        renderGallery: renderGallery
    };

})();

// Make available globally
window.MissionaryGallery = MissionaryGallery;
