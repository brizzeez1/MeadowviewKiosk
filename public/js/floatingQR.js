/* ================================================================
   FLOATINGQR.JS - PERSISTENT FLOATING QR CODE COMPONENT
   ================================================================
   This module creates and manages a floating QR code that:
   - Stays in the top right corner at all times
   - Appears on every screen including screensaver
   - Links to the ward bulletin URL
   - Has a subtle white/cream color to blend with theme
   - Brightens slightly when touched/hovered
   - Shows "Ward Bulletin" label below the QR code

   PURPOSE:
   Provides constant access to the ward bulletin via QR code
   without requiring users to navigate to a specific screen.
   ================================================================ */

const FloatingQR = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _qrContainer = null;
    let _qrCode = null;
    let _bulletinUrl = '';
    let _brightnessTimer = null;

    /* ============================================================
       SECTION 2: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the floating QR code.
     * Call this once when the app starts.
     */
    function init() {
        // Get bulletin URL from config
        if (window.KIOSK_CONFIG && window.KIOSK_CONFIG.ORGANIZATION) {
            _bulletinUrl = window.KIOSK_CONFIG.ORGANIZATION.BULLETIN_URL;
        } else {
            console.error('[FloatingQR] No bulletin URL in config!');
            return;
        }

        // Create the floating QR container
        createQRContainer();

        // Generate the QR code
        generateQRCode();

        ConfigLoader.debugLog('Floating QR code initialized with URL:', _bulletinUrl);
    }

    /* ============================================================
       SECTION 3: DOM CREATION
       ============================================================ */

    /**
     * Create the floating QR code container and add it to the DOM.
     */
    function createQRContainer() {
        // Create container element
        _qrContainer = document.createElement('div');
        _qrContainer.id = 'floating-qr-container';
        _qrContainer.className = 'floating-qr-container';

        // Create QR code holder
        const qrHolder = document.createElement('div');
        qrHolder.id = 'floating-qr-code';
        qrHolder.className = 'floating-qr-code';

        // Create label
        const qrLabel = document.createElement('div');
        qrLabel.className = 'floating-qr-label';
        qrLabel.textContent = 'Ward Bulletin';

        // Append elements
        _qrContainer.appendChild(qrHolder);
        _qrContainer.appendChild(qrLabel);

        // Add to body (so it appears above all screens)
        document.body.appendChild(_qrContainer);

        // Set up hover/touch effects
        setupInteractions();
    }

    /**
     * Set up hover and touch interactions.
     */
    function setupInteractions() {
        if (!_qrContainer) return;

        // Mouse hover
        _qrContainer.addEventListener('mouseenter', handleHoverStart);
        _qrContainer.addEventListener('mouseleave', handleHoverEnd);

        // Touch and click (for scanning time)
        _qrContainer.addEventListener('touchstart', handleTouchStart);
        _qrContainer.addEventListener('click', handleClick);
    }

    /* ============================================================
       SECTION 4: QR CODE GENERATION
       ============================================================ */

    /**
     * Generate the QR code using QRCode.js library.
     */
    function generateQRCode() {
        const qrCodeElement = document.getElementById('floating-qr-code');

        if (!qrCodeElement) {
            console.error('[FloatingQR] QR code element not found!');
            return;
        }

        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            console.error('[FloatingQR] QRCode library not loaded!');
            qrCodeElement.innerHTML = '<p class="placeholder-text">QR library missing</p>';
            return;
        }

        // Clear any existing QR code
        qrCodeElement.innerHTML = '';

        // Generate new QR code
        try {
            _qrCode = new QRCode(qrCodeElement, {
                text: _bulletinUrl,
                width: 100,
                height: 100,
                colorDark: '#000000',  // Black for scannability
                colorLight: 'transparent',
                correctLevel: QRCode.CorrectLevel.M
            });

            ConfigLoader.debugLog('QR code generated successfully');
        } catch (error) {
            console.error('[FloatingQR] Error generating QR code:', error);
            qrCodeElement.innerHTML = '<p class="placeholder-text">QR error</p>';
        }
    }

    /* ============================================================
       SECTION 5: EVENT HANDLERS
       ============================================================ */

    /**
     * Handle mouse hover start (brighten the QR code).
     */
    function handleHoverStart() {
        if (_qrContainer) {
            _qrContainer.classList.add('hovered');
        }
    }

    /**
     * Handle mouse hover end (dim the QR code).
     */
    function handleHoverEnd() {
        if (_qrContainer) {
            // Only dim if there's no active timer (from touch/click)
            if (!_brightnessTimer) {
                _qrContainer.classList.remove('hovered');
            }
        }
    }

    /**
     * Handle touch start (brighten and stay bright for 10 seconds).
     */
    function handleTouchStart(event) {
        event.preventDefault();
        activateBrightMode();
    }

    /**
     * Handle click (brighten and stay bright for 10 seconds).
     */
    function handleClick() {
        activateBrightMode();
    }

    /**
     * Activate bright mode for 10 seconds (for scanning).
     */
    function activateBrightMode() {
        if (!_qrContainer) return;

        // Add hovered class
        _qrContainer.classList.add('hovered');

        // Clear any existing timer
        if (_brightnessTimer) {
            clearTimeout(_brightnessTimer);
        }

        // Set timer to remove hovered class after 10 seconds
        _brightnessTimer = setTimeout(() => {
            if (_qrContainer) {
                _qrContainer.classList.remove('hovered');
            }
            _brightnessTimer = null;
        }, 10000);

        ConfigLoader.debugLog('QR code bright mode activated for 10 seconds');
    }

    /* ============================================================
       SECTION 6: VISIBILITY CONTROL
       ============================================================ */

    /**
     * Show the floating QR code.
     */
    function show() {
        if (_qrContainer) {
            _qrContainer.style.display = 'flex';
        }
    }

    /**
     * Hide the floating QR code.
     */
    function hide() {
        if (_qrContainer) {
            _qrContainer.style.display = 'none';
        }
    }

    /**
     * Update the QR code URL.
     * @param {string} newUrl - The new URL to encode
     */
    function updateUrl(newUrl) {
        _bulletinUrl = newUrl;
        generateQRCode();
    }

    /* ============================================================
       SECTION 7: PUBLIC API
       ============================================================ */

    return {
        // Initialization
        init: init,

        // Visibility
        show: show,
        hide: hide,

        // Updates
        updateUrl: updateUrl
    };

})();

// Make available globally
window.FloatingQR = FloatingQR;
