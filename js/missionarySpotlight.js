/* ================================================================
   MISSIONARYSPOTLIGHT.JS - MISSIONARY GRID VIEW
   ================================================================
   This module handles the missionary grid/spotlight feature:
   - Displays a grid of missionary squares
   - Auto-calculates grid layout based on missionary count
   - Shows missionary photos or silhouette placeholders
   - Handles clicks to navigate to individual missionary details

   PURPOSE:
   Shows all current missionaries from the ward in an organized
   grid layout that auto-sizes to fit all missionaries on screen.
   ================================================================ */

const MissionarySpotlight = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _gridContainer = null;
    let _missionaries = [];
    let _isActive = false;
    let _scrollHintDismissed = false;
    let _hideHintOnScrollHandler = null;

    // PHASE 5 FIX: Scroll detection to prevent accidental taps
    let _touchStartY = 0;
    let _hasScrolled = false;
    let _scrollEndTimer = null;

    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the missionary spotlight module.
     * Call this once when the app starts.
     */
    function init() {
        _gridContainer = document.getElementById('missionary-grid');

        if (!_gridContainer) {
            console.error('[MissionarySpotlight] Grid container not found!');
            return;
        }

        // Load missionary data from config
        loadMissionaryData();

        // PHASE 5 FIX: Set up scroll detection
        setupScrollDetection();

        ConfigLoader.debugLog('Missionary spotlight initialized');
    }

    /**
     * PHASE 5 FIX: Set up pointer event listeners for scroll detection.
     * Supports both touch and mouse/trackpad input.
     */
    function setupScrollDetection() {
        if (!_gridContainer) return;

        // Track pointer down (start of potential scroll)
        _gridContainer.addEventListener('pointerdown', (e) => {
            _touchStartY = e.clientY;
            _hasScrolled = false;
        }, { passive: true });

        // Track pointer movement (detect scrolling)
        _gridContainer.addEventListener('pointermove', (e) => {
            const deltaY = Math.abs(e.clientY - _touchStartY);
            if (deltaY > 10) {
                _hasScrolled = true;
            }
        }, { passive: true });

        // Clear scroll flag after scroll ends
        _gridContainer.addEventListener('scroll', () => {
            clearTimeout(_scrollEndTimer);
            _scrollEndTimer = setTimeout(() => {
                _hasScrolled = false;
            }, 100);
        }, { passive: true });
    }

    /* ============================================================
       SECTION 3: DATA LOADING
       ============================================================ */

    /**
     * Load missionary data from the config.
     */
    function loadMissionaryData() {
        if (window.KIOSK_CONFIG && window.KIOSK_CONFIG.MISSIONARIES) {
            _missionaries = window.KIOSK_CONFIG.MISSIONARIES.MISSIONARIES_LIST || [];
            ConfigLoader.debugLog('Loaded', _missionaries.length, 'missionaries');
        } else {
            console.error('[MissionarySpotlight] No missionary data in config!');
            _missionaries = [];
        }
    }

    /* ============================================================
       SECTION 4: GRID LAYOUT CALCULATION
       ============================================================ */

    /**
     * Calculate the optimal grid layout (columns x rows).
     * @param {number} count - Number of missionaries
     * @returns {Object} - { cols, rows }
     */
    function calculateGridLayout(count) {
        if (count === 0) return { cols: 0, rows: 0 };

        // Try to make a roughly square grid
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);

        return { cols, rows };
    }

    /* ============================================================
       SECTION 5: GRID RENDERING
       ============================================================ */

    /**
     * Render the missionary grid.
     */
    function renderGrid() {
        if (!_gridContainer) return;

        // Clear existing content
        _gridContainer.innerHTML = '';

        if (_missionaries.length === 0) {
            _gridContainer.innerHTML = '<p class="placeholder-text">No missionaries configured yet.</p>';
            return;
        }

        // Calculate grid layout
        const layout = calculateGridLayout(_missionaries.length);

        // Use fr units for columns to distribute width evenly
        // Use auto for rows to allow natural height and scrolling
        _gridContainer.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
        _gridContainer.style.gridTemplateRows = `repeat(${layout.rows}, auto)`;

        // Create missionary squares
        _missionaries.forEach(missionary => {
            const square = createMissionarySquare(missionary);
            _gridContainer.appendChild(square);
        });

        ConfigLoader.debugLog('Rendered', _missionaries.length, 'missionary squares in',
                             `${layout.cols}x${layout.rows}`, 'grid (responsive fr-based layout)');

        _scrollHintDismissed = false;
        scheduleScrollHintUpdate();
    }

    /**
     * Create a missionary square element.
     * @param {Object} missionary - The missionary data
     * @returns {HTMLElement} - The square element
     */
    function createMissionarySquare(missionary) {
        const square = document.createElement('div');
        square.className = 'missionary-square';
        square.setAttribute('data-missionary-id', missionary.id);

        // Photo container
        const photoContainer = document.createElement('div');
        photoContainer.className = 'missionary-photo-container';

        if (missionary.photoUrl) {
            // Use actual photo
            const img = document.createElement('img');
            img.src = missionary.photoUrl;
            img.alt = missionary.name;
            img.className = 'missionary-photo';
            photoContainer.appendChild(img);
        } else {
            // Use silhouette placeholder
            const silhouette = createSilhouetteSVG();
            photoContainer.innerHTML = silhouette;
        }

        square.appendChild(photoContainer);

        // Name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'missionary-name-label';
        nameLabel.textContent = missionary.name;
        square.appendChild(nameLabel);

        // PHASE 5 FIX: Click handler with scroll detection
        square.addEventListener('click', (e) => {
            // Ignore clicks that were actually scrolls
            if (_hasScrolled) {
                console.log('[MissionarySpotlight] Click ignored (was scrolling)');
                return;
            }
            handleMissionaryClick(missionary.id);
        });

        // Keep touchend for better touch response (when not scrolling)
        square.addEventListener('touchend', (e) => {
            if (_hasScrolled) {
                return;
            }
            e.preventDefault();
            handleMissionaryClick(missionary.id);
        });

        return square;
    }

    /**
     * Wait for layout to settle, then update the scroll hint visibility.
     * Uses double RAF to ensure grid dimensions reflect any late layout changes.
     */
    function scheduleScrollHintUpdate() {
        requestAnimationFrame(() => {
            requestAnimationFrame(updateScrollHint);
        });
    }

    /**
     * Toggle the scroll hint based on overflow and hide after the first scroll.
     */
    function updateScrollHint() {
        if (!_gridContainer) return;

        const hintEl = document.getElementById('missionary-scroll-hint');
        if (!hintEl) return;

        const images = _gridContainer.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete) return;
            img.addEventListener('load', scheduleScrollHintUpdate, { once: true });
        });

        const canScroll = _gridContainer.scrollHeight > _gridContainer.clientHeight;
        const shouldHide = !canScroll || _scrollHintDismissed;

        hintEl.classList.toggle('hidden', shouldHide);

        if (shouldHide) return;

        if (_hideHintOnScrollHandler) {
            _gridContainer.removeEventListener('scroll', _hideHintOnScrollHandler);
        }

        _hideHintOnScrollHandler = () => {
            if (_gridContainer.scrollTop !== 0) {
                _scrollHintDismissed = true;
                hintEl.classList.add('hidden');
            }
        };

        _gridContainer.addEventListener('scroll', _hideHintOnScrollHandler, { once: true });
    }

    /**
     * Create a silhouette placeholder SVG.
     * @returns {string} - SVG markup
     */
    function createSilhouetteSVG() {
        return `
            <svg class="missionary-silhouette" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Head circle -->
                <circle cx="50" cy="35" r="15" fill="var(--color-text-muted)" opacity="0.3"/>
                <!-- Shoulders/body -->
                <ellipse cx="50" cy="70" rx="25" ry="20" fill="var(--color-text-muted)" opacity="0.3"/>
            </svg>
        `;
    }

    /* ============================================================
       SECTION 6: EVENT HANDLERS
       ============================================================ */

    /**
     * Handle click on a missionary square.
     * @param {number} missionaryId - The missionary ID
     */
    function handleMissionaryClick(missionaryId) {
        ConfigLoader.debugLog('Missionary clicked:', missionaryId);

        // Dispatch event for app.js to handle navigation
        window.dispatchEvent(new CustomEvent('navigate-missionary-detail', {
            detail: { missionaryId }
        }));
    }

    /* ============================================================
       SECTION 7: ACTIVATION / DEACTIVATION
       ============================================================ */

    /**
     * Activate the missionary spotlight view.
     * Called when transitioning to MISSIONARIES state.
     */
    function activate() {
        _isActive = true;

        // Render the grid
        renderGrid();

        ConfigLoader.debugLog('Missionary spotlight activated');
    }

    /**
     * Deactivate the missionary spotlight view.
     */
    function deactivate() {
        _isActive = false;
        ConfigLoader.debugLog('Missionary spotlight deactivated');
    }

    /**
     * Check if missionary spotlight is currently active.
     * @returns {boolean} True if active
     */
    function isActive() {
        return _isActive;
    }

    /* ============================================================
       SECTION 8: DATA RETRIEVAL
       ============================================================ */

    /**
     * Get a missionary by ID.
     * @param {number} id - The missionary ID
     * @returns {Object|null} - The missionary object or null
     */
    function getMissionaryById(id) {
        return _missionaries.find(m => m.id === id) || null;
    }

    /**
     * Get all missionaries.
     * @returns {Array} - Array of missionary objects
     */
    function getAllMissionaries() {
        return [..._missionaries];
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

        // Data access
        getMissionaryById: getMissionaryById,
        getAllMissionaries: getAllMissionaries,

        // Rendering
        renderGrid: renderGrid
    };

})();

// Make available globally
window.MissionarySpotlight = MissionarySpotlight;
