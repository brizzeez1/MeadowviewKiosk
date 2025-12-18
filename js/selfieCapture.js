/* ================================================================
   SELFIECAPTURE.JS - WEBCAM SELFIE CAPTURE MODULE
   ================================================================
   Handles webcam access, preview, countdown, capture, and upload
   for the kiosk selfie mosaic feature.

   DEPENDENCIES:
   - Views.js for screen management
   - Firebase Cloud Functions for upload (Phase 6)
   ================================================================ */

const SelfieCapture = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: CONFIGURATION
       ============================================================ */

    // Firebase Cloud Functions API URL (Phase 6 - Selfie Upload Pipeline)
    // TODO: Update these values to match your Firebase project
    const FIREBASE_API_BASE_URL = 'https://us-central1-your-project.cloudfunctions.net/api';
    const WARD_ID = 'meadowview';  // CHANGE for each ward deployment

    // Camera constraints
    const CAMERA_CONSTRAINTS = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 960 },
            facingMode: 'user'  // Front camera
        },
        audio: false
    };

    // Countdown duration (seconds)
    const COUNTDOWN_SECONDS = 3;


    /* ============================================================
       SECTION 2: PRIVATE VARIABLES
       ============================================================ */

    let _videoElement = null;
    let _canvasElement = null;
    let _previewImg = null;
    let _captureBtn = null;
    let _countdownOverlay = null;
    let _countdownNumber = null;
    let _errorOverlay = null;
    let _errorMsg = null;
    let _statusElement = null;
    let _confirmModal = null;
    let _successModal = null;

    let _mediaStream = null;
    let _isCapturing = false;
    let _capturedBlob = null;
    let _isInitialized = false;


    /* ============================================================
       SECTION 3: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the selfie capture module.
     * Called once when the app starts.
     */
    function init() {
        // Get DOM elements
        _videoElement = document.getElementById('selfieVideo');
        _canvasElement = document.getElementById('selfieCanvas');
        _previewImg = document.getElementById('selfiePreviewImg');
        _captureBtn = document.getElementById('selfieCaptureBtn');
        _countdownOverlay = document.getElementById('selfieCountdown');
        _countdownNumber = document.getElementById('countdownNumber');
        _errorOverlay = document.getElementById('selfieError');
        _errorMsg = document.getElementById('selfieErrorMsg');
        _statusElement = document.getElementById('selfieStatus');
        _confirmModal = document.getElementById('selfieConfirmModal');
        _successModal = document.getElementById('selfieSuccessModal');

        if (!_videoElement || !_canvasElement || !_captureBtn) {
            console.warn('[SelfieCapture] Required DOM elements not found');
            return;
        }

        // Set up event listeners
        setupEventListeners();

        _isInitialized = true;
        console.log('[SelfieCapture] Initialized');
    }

    /**
     * Set up all event listeners.
     */
    function setupEventListeners() {
        // Capture button
        if (_captureBtn) {
            _captureBtn.addEventListener('click', handleCaptureClick);
        }

        // Confirmation modal buttons
        const confirmYes = document.getElementById('selfieConfirmYes');
        const confirmNo = document.getElementById('selfieConfirmNo');

        if (confirmYes) {
            confirmYes.addEventListener('click', handleConfirmYes);
        }
        if (confirmNo) {
            confirmNo.addEventListener('click', handleConfirmNo);
        }

        // Success modal button
        const successOk = document.getElementById('selfieSuccessOk');
        if (successOk) {
            successOk.addEventListener('click', handleSuccessOk);
        }
    }


    /* ============================================================
       SECTION 4: CAMERA MANAGEMENT
       ============================================================ */

    /**
     * Start the camera and show preview.
     */
    async function startCamera() {
        console.log('[SelfieCapture] Starting camera...');

        // Reset UI state
        hideError();
        setStatus('Starting camera...');

        try {
            // Request camera access
            _mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

            // Connect stream to video element
            _videoElement.srcObject = _mediaStream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                _videoElement.onloadedmetadata = () => {
                    _videoElement.play();
                    resolve();
                };
            });

            // Show video, hide preview image
            _videoElement.style.display = 'block';
            _previewImg.style.display = 'none';

            // Update canvas size to match video
            _canvasElement.width = _videoElement.videoWidth;
            _canvasElement.height = _videoElement.videoHeight;

            setStatus('');
            updateButtonState('ready');

            console.log('[SelfieCapture] Camera started successfully');

        } catch (error) {
            console.error('[SelfieCapture] Camera error:', error);
            showError(getCameraErrorMessage(error));
            updateButtonState('error');
        }
    }

    /**
     * Stop the camera and release resources.
     */
    function stopCamera() {
        console.log('[SelfieCapture] Stopping camera...');

        if (_mediaStream) {
            _mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            _mediaStream = null;
        }

        if (_videoElement) {
            _videoElement.srcObject = null;
        }

        // Reset state
        _capturedBlob = null;
        _isCapturing = false;

        console.log('[SelfieCapture] Camera stopped');
    }

    /**
     * Get a user-friendly error message for camera errors.
     */
    function getCameraErrorMessage(error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return 'Camera access denied. Please allow camera permissions and try again.';
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return 'No camera found. Please ensure a webcam is connected.';
        }
        if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            return 'Camera is in use by another application. Please close other apps using the camera.';
        }
        return 'Unable to access camera. Please check your camera connection.';
    }


    /* ============================================================
       SECTION 5: CAPTURE FLOW
       ============================================================ */

    /**
     * Handle capture button click.
     */
    function handleCaptureClick() {
        if (_isCapturing) return;

        // Check current button state
        const btnText = _captureBtn.textContent.trim();

        if (btnText === 'Take Selfie' || btnText === 'Take another Selfie?') {
            startCountdown();
        }
    }

    /**
     * Start the 3-2-1 countdown.
     */
    function startCountdown() {
        _isCapturing = true;
        updateButtonState('counting');

        let count = COUNTDOWN_SECONDS;

        // Show countdown overlay
        _countdownOverlay.classList.add('active');
        _countdownNumber.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;

            if (count > 0) {
                _countdownNumber.textContent = count;
            } else {
                // Countdown complete - capture!
                clearInterval(countdownInterval);
                _countdownOverlay.classList.remove('active');
                capturePhoto();
            }
        }, 1000);
    }

    /**
     * Capture a photo from the video stream.
     */
    function capturePhoto() {
        console.log('[SelfieCapture] Capturing photo...');

        const ctx = _canvasElement.getContext('2d');

        // Draw video frame to canvas (flip horizontally to match preview)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(_videoElement, -_canvasElement.width, 0, _canvasElement.width, _canvasElement.height);
        ctx.restore();

        // Convert to blob
        _canvasElement.toBlob((blob) => {
            _capturedBlob = blob;

            // Show captured image preview
            const imgUrl = URL.createObjectURL(blob);
            _previewImg.src = imgUrl;
            _previewImg.style.display = 'block';
            _videoElement.style.display = 'none';

            // Show confirmation modal
            showConfirmModal();

            _isCapturing = false;

        }, 'image/jpeg', 0.85);
    }


    /* ============================================================
       SECTION 6: CONFIRMATION HANDLING
       ============================================================ */

    /**
     * Show the confirmation modal.
     */
    function showConfirmModal() {
        if (_confirmModal) {
            _confirmModal.classList.remove('hidden');
        }
    }

    /**
     * Hide the confirmation modal.
     */
    function hideConfirmModal() {
        if (_confirmModal) {
            _confirmModal.classList.add('hidden');
        }
    }

    /**
     * Handle "Yes" button on confirmation modal.
     */
    async function handleConfirmYes() {
        hideConfirmModal();
        setStatus('Uploading photo...');
        updateButtonState('uploading');

        try {
            const result = await uploadSelfie(_capturedBlob);

            if (result.success) {
                showSuccessModal();
                updateButtonState('another');
            } else {
                setStatus('Upload failed: ' + (result.message || 'Unknown error'));
                updateButtonState('ready');
            }
        } catch (error) {
            console.error('[SelfieCapture] Upload error:', error);
            setStatus('Upload failed. Please try again.');
            updateButtonState('ready');
        }

        // Return to live preview
        returnToLivePreview();
    }

    /**
     * Handle "No" button on confirmation modal.
     */
    function handleConfirmNo() {
        hideConfirmModal();

        // Discard captured image
        _capturedBlob = null;

        // Return to live preview
        returnToLivePreview();
        updateButtonState('ready');
    }

    /**
     * Return to live camera preview.
     */
    function returnToLivePreview() {
        _previewImg.style.display = 'none';
        _videoElement.style.display = 'block';
    }


    /* ============================================================
       SECTION 7: UPLOAD TO FIREBASE CLOUD STORAGE
       ============================================================
       Phase 6 - Selfie Upload Pipeline

       Flow:
       1. Request signed upload URL from Cloud Function
       2. Upload image directly to Cloud Storage
       3. Storage trigger creates Firestore document and updates stats
       4. NO visit document is created (selfie-only upload)
       ============================================================ */

    /**
     * Upload selfie via Firebase Cloud Storage.
     * @param {Blob} imageBlob - The captured image blob
     * @returns {Promise<Object>} - Upload result
     */
    async function uploadSelfie(imageBlob) {
        console.log('[SelfieCapture] Uploading selfie via Firebase...');

        try {
            // Step 1: Request signed upload URL from Cloud Function
            console.log('[SelfieCapture] Requesting signed upload URL...');
            const signedUrlResponse = await fetch(`${FIREBASE_API_BASE_URL}/v1/mosaic/requestSelfieUpload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wardId: WARD_ID,
                    mode: 'kiosk',
                    uploadedBy: null  // Anonymous kiosk upload
                })
            });

            if (!signedUrlResponse.ok) {
                const errorData = await signedUrlResponse.json();
                throw new Error(errorData.error || `Failed to get upload URL: ${signedUrlResponse.status}`);
            }

            const signedUrlData = await signedUrlResponse.json();
            console.log('[SelfieCapture] Received signed URL');

            if (!signedUrlData.success || !signedUrlData.data.uploadUrl) {
                throw new Error('Invalid response from server');
            }

            const { uploadUrl, metadata } = signedUrlData.data;

            // Step 2: Upload image directly to Cloud Storage using signed URL
            console.log('[SelfieCapture] Uploading to Cloud Storage...');
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'image/jpeg',
                    // Include metadata as custom headers
                    'x-goog-meta-wardId': metadata.wardId,
                    'x-goog-meta-mode': metadata.mode,
                    'x-goog-meta-uploadSessionId': metadata.uploadSessionId,
                    'x-goog-meta-requestedAt': metadata.requestedAt
                },
                body: imageBlob
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            console.log('[SelfieCapture] Upload successful');

            // Step 3: Storage trigger will automatically create Firestore doc
            // Return success (no need to wait for trigger)
            return {
                success: true,
                message: 'Selfie uploaded successfully'
            };

        } catch (error) {
            console.error('[SelfieCapture] Upload error:', error);
            return {
                success: false,
                message: error.message || 'Upload failed'
            };
        }
    }


    /* ============================================================
       SECTION 8: SUCCESS HANDLING
       ============================================================ */

    /**
     * Show the success modal.
     */
    function showSuccessModal() {
        if (_successModal) {
            _successModal.classList.remove('hidden');
        }
    }

    /**
     * Hide the success modal.
     */
    function hideSuccessModal() {
        if (_successModal) {
            _successModal.classList.add('hidden');
        }
    }

    /**
     * Handle OK button on success modal.
     */
    function handleSuccessOk() {
        hideSuccessModal();
        setStatus('');
    }


    /* ============================================================
       SECTION 9: UI HELPERS
       ============================================================ */

    /**
     * Update the capture button state.
     */
    function updateButtonState(state) {
        if (!_captureBtn) return;

        switch (state) {
            case 'ready':
                _captureBtn.textContent = 'Take Selfie';
                _captureBtn.disabled = false;
                break;
            case 'counting':
                _captureBtn.textContent = 'Get ready...';
                _captureBtn.disabled = true;
                break;
            case 'uploading':
                _captureBtn.textContent = 'Uploading...';
                _captureBtn.disabled = true;
                break;
            case 'another':
                _captureBtn.textContent = 'Take another Selfie?';
                _captureBtn.disabled = false;
                break;
            case 'error':
                _captureBtn.textContent = 'Camera Error';
                _captureBtn.disabled = true;
                break;
        }
    }

    /**
     * Set the status message.
     */
    function setStatus(message) {
        if (_statusElement) {
            _statusElement.textContent = message;
        }
    }

    /**
     * Show error overlay.
     */
    function showError(message) {
        if (_errorOverlay && _errorMsg) {
            _errorMsg.textContent = message;
            _errorOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide error overlay.
     */
    function hideError() {
        if (_errorOverlay) {
            _errorOverlay.style.display = 'none';
        }
    }


    /* ============================================================
       SECTION 10: ACTIVATION / DEACTIVATION
       ============================================================ */

    /**
     * Activate the selfie capture view.
     * Called when navigating to the selfie screen.
     */
    function activate() {
        console.log('[SelfieCapture] Activating...');

        if (!_isInitialized) {
            init();
        }

        // Start camera
        startCamera();
    }

    /**
     * Deactivate the selfie capture view.
     * Called when navigating away from the selfie screen.
     */
    function deactivate() {
        console.log('[SelfieCapture] Deactivating...');

        // Stop camera
        stopCamera();

        // Hide modals
        hideConfirmModal();
        hideSuccessModal();

        // Reset UI
        setStatus('');
        updateButtonState('ready');
    }


    /* ============================================================
       SECTION 11: PUBLIC API
       ============================================================ */

    return {
        init: init,
        activate: activate,
        deactivate: deactivate,
        startCamera: startCamera,
        stopCamera: stopCamera
    };

})();

// Make available globally
window.SelfieCapture = SelfieCapture;
