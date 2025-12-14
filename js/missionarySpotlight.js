/* ================================================================
   MISSIONARYSPOTLIGHT.JS - MISSIONARY GRID VIEW
   ================================================================
   Handles the missionary grid view:
   - Displays all missionaries in a responsive grid
   - Supports mouse wheel scrolling AND touch drag scrolling
   - Prevents accidental taps while scrolling
   - Navigates to missionary detail view on intentional tap
   ================================================================ */

const MissionarySpotlight = (function () {
  'use strict';

  /* ============================================================
     SECTION 1: PRIVATE VARIABLES
     ============================================================ */

  let _gridContainer = null;
  let _missionaries = [];
  let _isActive = false;

  // Scroll hint handling
  let _scrollHintDismissed = false;
  let _hideHintOnScrollHandler = null;

  // Drag-to-scroll state
  let _isDraggingScroll = false;
  let _dragStartY = 0;
  let _dragStartScrollTop = 0;
  let _dragMoved = false;

  /* ============================================================
     SECTION 2: INITIALIZATION
     ============================================================ */

  function init() {
    _gridContainer = document.getElementById('missionary-grid');

    if (!_gridContainer) {
      console.error('[MissionarySpotlight] Grid container not found!');
      return;
    }

    enableDragToScroll(_gridContainer);
    loadMissionaryData();

    ConfigLoader.debugLog('Missionary spotlight initialized');
  }

  /* ============================================================
     SECTION 3: DRAG-TO-SCROLL (TOUCH + MOUSE)
     ============================================================ */

  function enableDragToScroll(container) {
    container.style.cursor = 'grab';

    container.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      _isDraggingScroll = true;
      _dragMoved = false;
      _dragStartY = e.clientY;
      _dragStartScrollTop = container.scrollTop;

      container.setPointerCapture(e.pointerId);
      container.style.cursor = 'grabbing';
    });

    container.addEventListener(
      'pointermove',
      (e) => {
        if (!_isDraggingScroll) return;

        const deltaY = e.clientY - _dragStartY;
        if (Math.abs(deltaY) > 6) _dragMoved = true;

        container.scrollTop = _dragStartScrollTop - deltaY;
        e.preventDefault();
      },
      { passive: false }
    );

    function endDrag(e) {
      if (!_isDraggingScroll) return;
      _isDraggingScroll = false;
      container.style.cursor = 'grab';

      try {
        container.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
  }

  /* ============================================================
     SECTION 4: DATA LOADING
     ============================================================ */

  function loadMissionaryData() {
    if (
      window.KIOSK_CONFIG &&
      window.KIOSK_CONFIG.MISSIONARIES &&
      Array.isArray(window.KIOSK_CONFIG.MISSIONARIES.MISSIONARIES_LIST)
    ) {
      _missionaries = window.KIOSK_CONFIG.MISSIONARIES.MISSIONARIES_LIST;
      ConfigLoader.debugLog('Loaded', _missionaries.length, 'missionaries');
    } else {
      console.error('[MissionarySpotlight] No missionary data found in config!');
      _missionaries = [];
    }
  }

  /* ============================================================
     SECTION 5: GRID LAYOUT
     ============================================================ */

  function calculateGridLayout(count) {
    if (count === 0) return { cols: 0, rows: 0 };

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { cols, rows };
  }

  /* ============================================================
     SECTION 6: GRID RENDERING
     ============================================================ */

  function renderGrid() {
    if (!_gridContainer) return;

    _gridContainer.innerHTML = '';

    if (_missionaries.length === 0) {
      _gridContainer.innerHTML =
        '<p class="placeholder-text">No missionaries configured.</p>';
      return;
    }

    const layout = calculateGridLayout(_missionaries.length);
    _gridContainer.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
    _gridContainer.style.gridTemplateRows = `repeat(${layout.rows}, auto)`;

    _missionaries.forEach((missionary) => {
      _gridContainer.appendChild(createMissionarySquare(missionary));
    });

    _scrollHintDismissed = false;
    scheduleScrollHintUpdate();
  }

  function createMissionarySquare(missionary) {
    const square = document.createElement('div');
    square.className = 'missionary-square';
    square.dataset.missionaryId = missionary.id;

    const photoContainer = document.createElement('div');
    photoContainer.className = 'missionary-photo-container';

    if (missionary.photoUrl) {
      const img = document.createElement('img');
      img.src = missionary.photoUrl;
      img.alt = missionary.name;
      img.className = 'missionary-photo';
      photoContainer.appendChild(img);
    } else {
      photoContainer.innerHTML = createSilhouetteSVG();
    }

    square.appendChild(photoContainer);

    const nameLabel = document.createElement('div');
    nameLabel.className = 'missionary-name-label';
    nameLabel.textContent = missionary.name;
    square.appendChild(nameLabel);

    square.addEventListener('click', () => {
      if (_dragMoved) return;
      handleMissionaryClick(missionary.id);
    });

    square.addEventListener('touchend', (e) => {
      if (_dragMoved) return;
      e.preventDefault();
      handleMissionaryClick(missionary.id);
    });

    return square;
  }

  /* ============================================================
     SECTION 7: SCROLL HINT
     ============================================================ */

  function scheduleScrollHintUpdate() {
    requestAnimationFrame(() => {
      requestAnimationFrame(updateScrollHint);
    });
  }

  function updateScrollHint() {
    const hintEl = document.getElementById('missionary-scroll-hint');
    if (!hintEl || !_gridContainer) return;

    const canScroll =
      _gridContainer.scrollHeight > _gridContainer.clientHeight;
    const shouldHide = !canScroll || _scrollHintDismissed;

    hintEl.classList.toggle('hidden', shouldHide);
    if (shouldHide) return;

    if (_hideHintOnScrollHandler) {
      _gridContainer.removeEventListener(
        'scroll',
        _hideHintOnScrollHandler
      );
    }

    _hideHintOnScrollHandler = () => {
      if (_gridContainer.scrollTop !== 0) {
        _scrollHintDismissed = true;
        hintEl.classList.add('hidden');
      }
    };

    _gridContainer.addEventListener(
      'scroll',
      _hideHintOnScrollHandler,
      { once: true }
    );
  }

  /* ============================================================
     SECTION 8: UTILITIES
     ============================================================ */

  function createSilhouetteSVG() {
    return `
      <svg class="missionary-silhouette" viewBox="0 0 100 100">
        <circle cx="50" cy="35" r="15" opacity="0.3"/>
        <ellipse cx="50" cy="70" rx="25" ry="20" opacity="0.3"/>
      </svg>
    `;
  }

  function handleMissionaryClick(missionaryId) {
    window.dispatchEvent(
      new CustomEvent('navigate-missionary-detail', {
        detail: { missionaryId },
      })
    );
  }

  /* ============================================================
     SECTION 9: ACTIVATION
     ============================================================ */

  function activate() {
    _isActive = true;
    renderGrid();
  }

  function deactivate() {
    _isActive = false;
  }

  function isActive() {
    return _isActive;
  }

  function getMissionaryById(id) {
    return _missionaries.find((m) => m.id === id) || null;
  }

  function getAllMissionaries() {
    return [..._missionaries];
  }

  /* ============================================================
     SECTION 10: PUBLIC API
     ============================================================ */

  return {
    init,
    activate,
    deactivate,
    isActive,
    getMissionaryById,
    getAllMissionaries,
    renderGrid,
  };
})();

window.MissionarySpotlight = MissionarySpotlight;
