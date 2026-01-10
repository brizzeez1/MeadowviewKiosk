/* ================================================================
   MISSIONARYGALLERY.JS - PHOTO + VIDEO GALLERIES
   ================================================================
   Photo gallery source (Firestore):
     wards/{wardId}/missionaries/{missionaryId}/gallery

   Video gallery source (Firebase Storage):
     wards/{wardId}/missionaries/{missionaryId}/kioskContent/videos/

   Uses existing overlay in index.html for photos:
   - #missionaryGalleryOverlay, #galleryCurrentImage, #galleryPrevBtn, #galleryNextBtn, #galleryCloseBtn, #galleryCounter

   Creates its own overlay for videos (so we don’t break your photo overlay).

   ================================================================ */

const MissionaryGallery = (function () {
  'use strict';

  // ---- config ----
  let _wardId = 'meadowview_az';

  // ---- photo overlay DOM (already in index.html) ----
  let p_overlay, p_img, p_prevBtn, p_nextBtn, p_closeBtn, p_counter, p_imageContainer, p_swipeHint;

  // ---- photo state ----
  let p_items = [];
  let p_index = 0;
  let p_unsub = null;
  let p_isOpen = false;

  // ---- video overlay DOM (created by this module) ----
  let v_overlay, v_video, v_prevBtn, v_nextBtn, v_closeBtn, v_counter, v_status;

  // ---- video state ----
  let v_items = []; // array of download URLs
  let v_index = 0;
  let v_isOpen = false;

  // ---- swipe ----
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 40;

  function init() {
    // Ward ID
    try {
      const cfgWardId =
        (window.KIOSK_CONFIG && window.KIOSK_CONFIG.ORGANIZATION && window.KIOSK_CONFIG.ORGANIZATION.WARD_ID) ||
        (window.APP_CONFIG && window.APP_CONFIG.WARD_ID);
      if (cfgWardId) _wardId = cfgWardId;
    } catch (_) {}

    // Photo overlay elements
    p_overlay = document.getElementById('missionaryGalleryOverlay');
    p_img = document.getElementById('galleryCurrentImage');
    p_prevBtn = document.getElementById('galleryPrevBtn');
    p_nextBtn = document.getElementById('galleryNextBtn');
    p_closeBtn = document.getElementById('galleryCloseBtn');
    p_counter = document.getElementById('galleryCounter');
    p_swipeHint = document.getElementById('gallerySwipeHint');
    p_imageContainer = p_overlay ? p_overlay.querySelector('.gallery-image-container') : null;

    if (p_overlay && p_img && p_prevBtn && p_nextBtn && p_closeBtn && p_counter) {
      p_prevBtn.addEventListener('click', (e) => { e.preventDefault(); photoPrev(); });
      p_nextBtn.addEventListener('click', (e) => { e.preventDefault(); photoNext(); });
      p_closeBtn.addEventListener('click', (e) => { e.preventDefault(); closePhotos(); });

      p_overlay.addEventListener('click', (e) => {
        if (e.target === p_overlay) closePhotos();
      });

      document.addEventListener('keydown', (e) => {
        if (p_isOpen) {
          if (e.key === 'Escape') closePhotos();
          if (e.key === 'ArrowLeft') photoPrev();
          if (e.key === 'ArrowRight') photoNext();
        }
        if (v_isOpen) {
          if (e.key === 'Escape') closeVideos();
          if (e.key === 'ArrowLeft') videoPrev();
          if (e.key === 'ArrowRight') videoNext();
        }
      });

      if (p_imageContainer) {
        p_imageContainer.addEventListener('touchstart', onTouchStart, { passive: true });
        p_imageContainer.addEventListener('touchend', (e) => onTouchEnd(e, 'photo'), { passive: true });
      }
    } else {
      console.warn('[MissionaryGallery] Photo overlay elements not found (index.html).');
    }

    // Create video overlay (separate so photo overlay stays unchanged)
    createVideoOverlay();

    console.log('[MissionaryGallery] Initialized (photo + video)');
  }

  // =========================================================
  // Photos (Firestore)
  // =========================================================

  function open(missionaryOrId) { // Backwards compatible: open() = photos
    openPhotos(missionaryOrId);
  }

  function openPhotos(missionaryOrId) {
    const missionaryId = normalizeMissionaryId(missionaryOrId);
    if (!missionaryId) return;

    if (!p_overlay) {
      console.error('[MissionaryGallery] Photo overlay missing.');
      return;
    }

    p_items = [];
    p_index = 0;
    p_isOpen = true;
    showPhotoOverlay(true);
    setPhotoPlaceholder('Loading photos…');
    subscribeToPhotoGallery(missionaryId);
  }

  function closePhotos() {
    p_isOpen = false;
    showPhotoOverlay(false);
    unsubPhotos();
    p_items = [];
    p_index = 0;
  }

  function subscribeToPhotoGallery(missionaryId) {
    unsubPhotos();

    if (!window.firebase || !window.firebase.firestore) {
      setPhotoPlaceholder('Gallery unavailable (Firestore not ready).');
      return;
    }

    const db = window.firebase.firestore();
    p_unsub = db.collection('wards').doc(_wardId)
      .collection('missionaries').doc(String(missionaryId))
      .collection('gallery')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
          p_items = items;

          if (!p_items.length) {
            setPhotoPlaceholder('No photos yet.');
            updatePhotoCounter();
            updatePhotoNav();
            return;
          }

          if (p_index >= p_items.length) p_index = p_items.length - 1;
          renderPhoto();
        },
        (err) => {
          console.error('[MissionaryGallery] Photo listener error:', err);
          setPhotoPlaceholder('Error loading photos.');
        }
      );
  }

  function renderPhoto() {
    if (!p_items.length) return;

    if (p_swipeHint) {
      const hidden = sessionStorage.getItem('mg_swipe_hint_hidden') === '1';
      p_swipeHint.style.display = hidden ? 'none' : 'block';
    }

    const item = p_items[p_index];
    updatePhotoCounter();
    updatePhotoNav();

    resolveToDisplayUrl(item.url)
      .then((displayUrl) => {
        if (!p_isOpen) return;
        if (!displayUrl) {
          setPhotoPlaceholder('Photo unavailable.');
          return;
        }
        p_img.src = displayUrl;
        p_img.alt = item.caption || 'Missionary photo';
      })
      .catch(() => setPhotoPlaceholder('Photo unavailable.'));
  }

  function photoPrev() {
    if (!p_items.length) return;
    p_index = (p_index - 1 + p_items.length) % p_items.length;
    markSwipeHintUsed();
    renderPhoto();
  }

  function photoNext() {
    if (!p_items.length) return;
    p_index = (p_index + 1) % p_items.length;
    markSwipeHintUsed();
    renderPhoto();
  }

  function updatePhotoCounter() {
    if (!p_counter) return;
    if (!p_items.length) p_counter.textContent = '0 of 0';
    else p_counter.textContent = `${p_index + 1} of ${p_items.length}`;
  }

  function updatePhotoNav() {
    if (!p_prevBtn || !p_nextBtn) return;
    const hasMany = p_items.length > 1;
    p_prevBtn.disabled = !hasMany;
    p_nextBtn.disabled = !hasMany;
  }

  function setPhotoPlaceholder(msg) {
    if (p_img) {
      p_img.src = '';
      p_img.alt = msg || 'Gallery';
    }
  }

  function showPhotoOverlay(show) {
    p_overlay.style.display = show ? 'flex' : 'none';
    p_overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function unsubPhotos() {
    if (p_unsub) {
      p_unsub();
      p_unsub = null;
    }
  }

  // =========================================================
  // Videos (Storage list)
  // =========================================================

  function openVideos(missionaryOrId) {
    const missionaryId = normalizeMissionaryId(missionaryOrId);
    if (!missionaryId) return;

    if (!v_overlay) {
      console.error('[MissionaryGallery] Video overlay missing.');
      return;
    }

    if (!window.firebase || !window.firebase.storage) {
      openVideoOverlayWithStatus('Videos unavailable (Storage not ready).');
      return;
    }

    v_items = [];
    v_index = 0;
    v_isOpen = true;

    openVideoOverlayWithStatus('Loading videos…');

    const storage = window.firebase.storage();
    const folderPath = `wards/${_wardId}/missionaries/${String(missionaryId)}/kioskContent/videos`;
    const folderRef = storage.ref().child(folderPath);

    folderRef.listAll()
      .then(async (res) => {
        if (!v_isOpen) return;

        if (!res.items.length) {
          openVideoOverlayWithStatus('No videos available yet.');
          updateVideoCounter();
          updateVideoNav();
          return;
        }

        // Resolve download URLs
        const urls = [];
        for (const itemRef of res.items) {
          try {
            const url = await itemRef.getDownloadURL();
            urls.push(url);
          } catch (e) {
            console.warn('[MissionaryGallery] Could not get video URL:', itemRef.fullPath, e);
          }
        }

        // Simple ordering: by URL (often includes filename with timestamp)
        urls.sort();
        v_items = urls;

        if (!v_items.length) {
          openVideoOverlayWithStatus('No playable videos found.');
          updateVideoCounter();
          updateVideoNav();
          return;
        }

        renderVideo();
      })
      .catch((err) => {
        console.error('[MissionaryGallery] listAll videos error:', err);
        openVideoOverlayWithStatus('Error loading videos.');
      });
  }

  function closeVideos() {
    v_isOpen = false;
    if (v_overlay) v_overlay.classList.add('hidden');
    if (v_video) {
      v_video.pause();
      v_video.src = '';
      v_video.load();
    }
    v_items = [];
    v_index = 0;
  }

  function renderVideo() {
    if (!v_items.length) return;
    updateVideoCounter();
    updateVideoNav();

    const url = v_items[v_index];
    v_status.textContent = '';
    v_video.src = url;
    v_video.load();
    v_video.play().catch(() => {
      // autoplay might be blocked in some contexts; controls still work
    });
  }

  function videoPrev() {
    if (!v_items.length) return;
    v_index = (v_index - 1 + v_items.length) % v_items.length;
    renderVideo();
  }

  function videoNext() {
    if (!v_items.length) return;
    v_index = (v_index + 1) % v_items.length;
    renderVideo();
  }

  function updateVideoCounter() {
    if (!v_counter) return;
    if (!v_items.length) v_counter.textContent = '0 of 0';
    else v_counter.textContent = `${v_index + 1} of ${v_items.length}`;
  }

  function updateVideoNav() {
    if (!v_prevBtn || !v_nextBtn) return;
    const hasMany = v_items.length > 1;
    v_prevBtn.disabled = !hasMany;
    v_nextBtn.disabled = !hasMany;
  }

  function openVideoOverlayWithStatus(message) {
    v_overlay.classList.remove('hidden');
    v_status.textContent = message || '';
    v_video.src = '';
    v_video.load();
    updateVideoCounter();
    updateVideoNav();
  }

  function createVideoOverlay() {
    const html = `
      <div id="missionaryVideoGalleryOverlay" class="modal-backdrop hidden" style="z-index: 9999;">
        <div class="modal" style="width: min(1100px, 92vw); max-height: 92vh;">
          <button class="modal-close" id="videoGalleryCloseBtn">×</button>
          <h2 class="modal-title">Missionary Videos</h2>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div id="videoGalleryCounter" style="font-weight:600;">0 of 0</div>
              <div id="videoGalleryStatus" style="opacity:0.8;"></div>
            </div>

            <video id="videoGalleryPlayer" controls playsinline style="width:100%; border-radius:12px; background:#000;"></video>

            <div style="display:flex; justify-content:space-between; gap:12px;">
              <button class="btn btn-secondary" id="videoGalleryPrevBtn">◀ Previous</button>
              <button class="btn btn-secondary" id="videoGalleryNextBtn">Next ▶</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    v_overlay = document.getElementById('missionaryVideoGalleryOverlay');
    v_video = document.getElementById('videoGalleryPlayer');
    v_prevBtn = document.getElementById('videoGalleryPrevBtn');
    v_nextBtn = document.getElementById('videoGalleryNextBtn');
    v_closeBtn = document.getElementById('videoGalleryCloseBtn');
    v_counter = document.getElementById('videoGalleryCounter');
    v_status = document.getElementById('videoGalleryStatus');

    v_prevBtn.addEventListener('click', (e) => { e.preventDefault(); videoPrev(); });
    v_nextBtn.addEventListener('click', (e) => { e.preventDefault(); videoNext(); });
    v_closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeVideos(); });

    v_overlay.addEventListener('click', (e) => {
      if (e.target === v_overlay) closeVideos();
    });

    // Swipe on video overlay (optional)
    v_video.addEventListener('touchstart', onTouchStart, { passive: true });
    v_video.addEventListener('touchend', (e) => onTouchEnd(e, 'video'), { passive: true });
  }

  // =========================================================
  // Shared helpers
  // =========================================================

  function normalizeMissionaryId(m) {
    if (m == null) return null;
    if (typeof m === 'object') {
      return m.firestoreId != null ? String(m.firestoreId)
        : m.id != null ? String(m.id)
        : null;
    }
    return String(m);
  }

  async function resolveToDisplayUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;

    if (url.startsWith('gs://')) {
      if (!window.firebase || !window.firebase.storage) return '';
      const storageRef = window.firebase.storage().refFromURL(url);
      return await storageRef.getDownloadURL();
    }
    return '';
  }

  function onTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e, mode) {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx > SWIPE_THRESHOLD) {
      if (mode === 'photo') photoPrev();
      else videoPrev();
    } else if (dx < -SWIPE_THRESHOLD) {
      if (mode === 'photo') photoNext();
      else videoNext();
    }
    markSwipeHintUsed();
  }

  function markSwipeHintUsed() {
    if (p_swipeHint) {
      p_swipeHint.style.display = 'none';
      sessionStorage.setItem('mg_swipe_hint_hidden', '1');
    }
  }

  return {
    init,
    open,         // photos (compat)
    openPhotos,   // explicit photos
    closePhotos,
    openVideos,   // storage-backed kiosk video gallery
    closeVideos
  };
})();

window.MissionaryGallery = MissionaryGallery;
