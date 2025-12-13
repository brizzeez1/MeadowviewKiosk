/* ================================================================
   TEMPLE365VIDEO.JS - PRESIDENT NELSON VIDEO MODULE
   ================================================================
   Handles the video playback for the Temple 365 screen.

   BEHAVIOR:
   - Video starts only when user taps "Start Video"
   - When video ends, button changes to "Play Again"
   - Does not autoplay or loop
   ================================================================ */

const Temple365Video = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _videoElement = null;
    let _playButton = null;
    let _isInitialized = false;


    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the video module.
     */
    function init() {
        _videoElement = document.getElementById('presidentNelsonVideo');
        _playButton = document.getElementById('videoPlayBtn');

        if (!_videoElement || !_playButton) {
            console.warn('[Temple365Video] Video elements not found');
            return;
        }

        // Set up event listeners
        setupEventListeners();

        _isInitialized = true;
        console.log('[Temple365Video] Initialized');
    }

    /**
     * Set up event listeners.
     */
    function setupEventListeners() {
        // Play button click
        _playButton.addEventListener('click', handlePlayClick);

        // Video ended
        _videoElement.addEventListener('ended', handleVideoEnded);

        // Video playing
        _videoElement.addEventListener('play', handleVideoPlay);

        // Video paused
        _videoElement.addEventListener('pause', handleVideoPause);

        // Video error
        _videoElement.addEventListener('error', handleVideoError);
    }


    /* ============================================================
       SECTION 3: EVENT HANDLERS
       ============================================================ */

    /**
     * Handle play button click.
     */
    function handlePlayClick() {
        if (!_videoElement) return;

        if (_videoElement.paused || _videoElement.ended) {
            // Start or restart video
            if (_videoElement.ended) {
                _videoElement.currentTime = 0;
            }
            _videoElement.play()
                .catch(err => {
                    console.error('[Temple365Video] Play failed:', err);
                    _playButton.textContent = 'Unable to play';
                });
        } else {
            // Pause if currently playing
            _videoElement.pause();
        }
    }

    /**
     * Handle video play event.
     */
    function handleVideoPlay() {
        _playButton.textContent = 'Pause Video';
    }

    /**
     * Handle video pause event.
     */
    function handleVideoPause() {
        if (!_videoElement.ended) {
            _playButton.textContent = 'Resume Video';
        }
    }

    /**
     * Handle video ended event.
     */
    function handleVideoEnded() {
        console.log('[Temple365Video] Video ended');
        _playButton.textContent = 'Play Again';
    }

    /**
     * Handle video error.
     */
    function handleVideoError(e) {
        console.error('[Temple365Video] Video error:', e);
        _playButton.textContent = 'Video unavailable';
        _playButton.disabled = true;
    }


    /* ============================================================
       SECTION 4: ACTIVATION / DEACTIVATION
       ============================================================ */

    /**
     * Activate the video module.
     * Called when Temple 365 screen is shown.
     */
    function activate() {
        if (!_isInitialized) {
            init();
        }

        // Reset button text
        if (_playButton && _videoElement) {
            if (_videoElement.ended || _videoElement.currentTime === 0) {
                _playButton.textContent = 'Start Video';
            }
        }
    }

    /**
     * Deactivate the video module.
     * Called when navigating away from Temple 365 screen.
     */
    function deactivate() {
        // Pause video when leaving
        if (_videoElement && !_videoElement.paused) {
            _videoElement.pause();
        }

        // Reset to start
        if (_videoElement) {
            _videoElement.currentTime = 0;
        }

        // Reset button
        if (_playButton) {
            _playButton.textContent = 'Start Video';
        }
    }


    /* ============================================================
       SECTION 5: PUBLIC API
       ============================================================ */

    return {
        init: init,
        activate: activate,
        deactivate: deactivate
    };

})();

// Make available globally
window.Temple365Video = Temple365Video;
