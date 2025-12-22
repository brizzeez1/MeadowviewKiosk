/* ================================================================
   MISSIONARY VIDEO RECORDER - PHASE 9
   ================================================================
   Kiosk webcam video recording for missionary messages.

   FEATURES:
   - 30-second maximum recording (locked decision #11)
   - Countdown timer showing remaining time
   - Preview before upload
   - Upload to Firebase Cloud Storage
   - Auto-publish to missionary gallery

   PURPOSE:
   Enable ward members to record short video messages for
   missionaries directly on the kiosk touchscreen.
   ================================================================ */

const MissionaryVideoRecorder = (function() {
    'use strict';

    /* ============================================================
       SECTION 1: PRIVATE VARIABLES
       ============================================================ */

    let _isRecording = false;
    let _mediaRecorder = null;
    let _mediaStream = null;
    let _recordedChunks = [];
    let _recordingStartTime = null;
    let _timerInterval = null;
    let _currentMissionary = null;

    // Constants
    const MAX_RECORDING_DURATION_MS = 30 * 1000; // 30 seconds (spec decision #11)
    const MAX_RECORDING_DURATION_SEC = 30;

    /* ============================================================
       SECTION 2: DOM ELEMENTS
       ============================================================ */

    const elements = {
        modal: null,
        videoPreview: null,
        startButton: null,
        stopButton: null,
        retakeButton: null,
        useButton: null,
        closeButton: null,
        timerDisplay: null,
        statusMessage: null,
        recordingIndicator: null
    };

    /* ============================================================
       SECTION 3: INITIALIZATION
       ============================================================ */

    /**
     * Initialize the video recorder module
     */
    function init() {
        console.log('[MissionaryVideoRecorder] Initializing...');
        createModalHTML();
        cacheElements();
        attachEventListeners();
        console.log('[MissionaryVideoRecorder] Ready');
    }

    /**
     * Create the video recording modal HTML
     */
    function createModalHTML() {
        const modalHTML = `
            <div id="video-recorder-modal" class="modal-backdrop hidden">
                <div class="modal video-recorder-modal">
                    <button class="modal-close" id="video-recorder-close">×</button>

                    <h2 class="modal-title">Record Video Message</h2>
                    <p class="modal-subtitle" id="video-recorder-missionary-name"></p>

                    <!-- Video Preview -->
                    <div class="video-preview-container">
                        <video id="video-recorder-preview" autoplay playsinline muted></video>

                        <!-- Recording Indicator -->
                        <div class="recording-indicator hidden" id="video-recorder-indicator">
                            <span class="rec-dot"></span>
                            <span class="rec-text">REC</span>
                        </div>

                        <!-- Timer Display -->
                        <div class="recording-timer hidden" id="video-recorder-timer">
                            <span class="timer-text">0:30</span>
                        </div>
                    </div>

                    <!-- Status Message -->
                    <p class="video-status-message" id="video-recorder-status"></p>

                    <!-- Controls -->
                    <div class="video-controls">
                        <button type="button" class="btn btn-secondary" id="video-recorder-retake" style="display: none;">
                            Retake
                        </button>
                        <button type="button" class="btn btn-kiosk-blue" id="video-recorder-start">
                            Start Recording
                        </button>
                        <button type="button" class="btn btn-danger" id="video-recorder-stop" style="display: none;">
                            Stop Recording
                        </button>
                        <button type="button" class="btn btn-kiosk-blue" id="video-recorder-use" style="display: none;">
                            Upload Video
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert into DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements.modal = document.getElementById('video-recorder-modal');
        elements.videoPreview = document.getElementById('video-recorder-preview');
        elements.startButton = document.getElementById('video-recorder-start');
        elements.stopButton = document.getElementById('video-recorder-stop');
        elements.retakeButton = document.getElementById('video-recorder-retake');
        elements.useButton = document.getElementById('video-recorder-use');
        elements.closeButton = document.getElementById('video-recorder-close');
        elements.timerDisplay = document.getElementById('video-recorder-timer');
        elements.statusMessage = document.getElementById('video-recorder-status');
        elements.recordingIndicator = document.getElementById('video-recorder-indicator');
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        elements.startButton.addEventListener('click', handleStartRecording);
        elements.stopButton.addEventListener('click', handleStopRecording);
        elements.retakeButton.addEventListener('click', handleRetake);
        elements.useButton.addEventListener('click', handleUpload);
        elements.closeButton.addEventListener('click', handleClose);
    }

    /* ============================================================
       SECTION 4: CAMERA ACCESS
       ============================================================ */

    /**
     * Request webcam access and start preview
     */
    async function startCameraPreview() {
        try {
            _mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });

            elements.videoPreview.srcObject = _mediaStream;
            elements.statusMessage.textContent = 'Camera ready. Click "Start Recording" when you\'re ready.';

        } catch (error) {
            console.error('[MissionaryVideoRecorder] Camera access error:', error);
            elements.statusMessage.textContent = 'Error: Could not access camera. Please check permissions.';
            elements.startButton.disabled = true;
        }
    }

    /**
     * Stop camera and release resources
     */
    function stopCamera() {
        if (_mediaStream) {
            _mediaStream.getTracks().forEach(track => track.stop());
            _mediaStream = null;
        }

        elements.videoPreview.srcObject = null;
    }

    /* ============================================================
       SECTION 5: RECORDING LOGIC
       ============================================================ */

    /**
     * Start video recording
     */
    async function handleStartRecording() {
        if (!_mediaStream) {
            console.error('[MissionaryVideoRecorder] No media stream available');
            return;
        }

        try {
            // Reset recorded chunks
            _recordedChunks = [];

            // Create MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };

            _mediaRecorder = new MediaRecorder(_mediaStream, options);

            // Handle data available
            _mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    _recordedChunks.push(event.data);
                }
            };

            // Handle recording stop
            _mediaRecorder.onstop = handleRecordingComplete;

            // Start recording
            _mediaRecorder.start();
            _isRecording = true;
            _recordingStartTime = Date.now();

            // Update UI
            elements.startButton.style.display = 'none';
            elements.stopButton.style.display = 'inline-block';
            elements.recordingIndicator.classList.remove('hidden');
            elements.timerDisplay.classList.remove('hidden');
            elements.statusMessage.textContent = 'Recording... Tap "Stop" when finished.';

            // Start timer
            startTimer();

            console.log('[MissionaryVideoRecorder] Recording started');

        } catch (error) {
            console.error('[MissionaryVideoRecorder] Recording start error:', error);
            elements.statusMessage.textContent = 'Error starting recording. Please try again.';
        }
    }

    /**
     * Stop video recording
     */
    function handleStopRecording() {
        if (_mediaRecorder && _isRecording) {
            _mediaRecorder.stop();
            _isRecording = false;
            stopTimer();

            // Update UI
            elements.stopButton.style.display = 'none';
            elements.recordingIndicator.classList.add('hidden');
            elements.timerDisplay.classList.add('hidden');

            console.log('[MissionaryVideoRecorder] Recording stopped');
        }
    }

    /**
     * Handle recording complete
     */
    function handleRecordingComplete() {
        console.log('[MissionaryVideoRecorder] Recording complete, chunks:', _recordedChunks.length);

        // Create blob from recorded chunks
        const blob = new Blob(_recordedChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);

        // Stop camera stream
        stopCamera();

        // Show video playback
        elements.videoPreview.srcObject = null;
        elements.videoPreview.src = videoUrl;
        elements.videoPreview.muted = false;
        elements.videoPreview.controls = true;
        elements.videoPreview.loop = true;

        // Update UI
        elements.retakeButton.style.display = 'inline-block';
        elements.useButton.style.display = 'inline-block';
        elements.statusMessage.textContent = 'Preview your video. Tap "Upload Video" to save or "Retake" to record again.';

        // Store blob for upload
        elements.videoPreview._recordedBlob = blob;
    }

    /* ============================================================
       SECTION 6: TIMER
       ============================================================ */

    /**
     * Start recording timer (counts down from 30 seconds)
     */
    function startTimer() {
        updateTimerDisplay(MAX_RECORDING_DURATION_SEC);

        _timerInterval = setInterval(() => {
            const elapsed = Date.now() - _recordingStartTime;
            const remaining = Math.max(0, MAX_RECORDING_DURATION_MS - elapsed);
            const remainingSec = Math.ceil(remaining / 1000);

            updateTimerDisplay(remainingSec);

            // Auto-stop at 30 seconds (spec decision #11)
            if (remaining <= 0) {
                console.log('[MissionaryVideoRecorder] 30-second limit reached, auto-stopping');
                handleStopRecording();
            }
        }, 100);
    }

    /**
     * Stop recording timer
     */
    function stopTimer() {
        if (_timerInterval) {
            clearInterval(_timerInterval);
            _timerInterval = null;
        }
    }

    /**
     * Update timer display
     * @param {number} seconds - Remaining seconds
     */
    function updateTimerDisplay(seconds) {
        const timerText = elements.timerDisplay.querySelector('.timer-text');
        if (timerText) {
            timerText.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /* ============================================================
       SECTION 7: RETAKE & UPLOAD
       ============================================================ */

    /**
     * Handle retake button click
     */
    async function handleRetake() {
        // Reset video preview
        elements.videoPreview.src = '';
        elements.videoPreview.controls = false;
        elements.videoPreview.muted = true;
        elements.videoPreview._recordedBlob = null;

        // Reset recorded chunks
        _recordedChunks = [];

        // Restart camera preview
        await startCameraPreview();

        // Update UI
        elements.retakeButton.style.display = 'none';
        elements.useButton.style.display = 'none';
        elements.startButton.style.display = 'inline-block';
        elements.statusMessage.textContent = 'Camera ready. Click "Start Recording" when you\'re ready.';
    }

    /**
     * Handle upload button click
     */
    async function handleUpload() {
        const blob = elements.videoPreview._recordedBlob;

        if (!blob) {
            console.error('[MissionaryVideoRecorder] No video blob available');
            return;
        }

        if (!_currentMissionary) {
            console.error('[MissionaryVideoRecorder] No missionary selected');
            return;
        }

        // Disable buttons during upload
        elements.useButton.disabled = true;
        elements.retakeButton.disabled = true;
        elements.statusMessage.textContent = 'Uploading video...';

        try {
            // Request signed upload URL from Cloud Function
            const wardId = (window.KIOSK_CONFIG && window.KIOSK_CONFIG.ORGANIZATION && window.KIOSK_CONFIG.ORGANIZATION.WARD_ID) || 'meadowview';
            const apiBaseUrl = (window.KIOSK_CONFIG && window.KIOSK_CONFIG.API && window.KIOSK_CONFIG.API.BASE_URL) || '/api';

            const response = await fetch(`${apiBaseUrl}/v1/missionary/kiosk/requestVideoUpload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wardId: wardId,
                    missionaryId: _currentMissionary.firestoreId,
                    fileSizeBytes: blob.size,
                    contentType: blob.type
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl } = await response.json();

            // Upload video to Cloud Storage using signed URL
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': blob.type
                },
                body: blob
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload video');
            }

            console.log('[MissionaryVideoRecorder] Video uploaded successfully');

            // Show success
            elements.statusMessage.textContent = '✓ Video uploaded successfully!';

            // Close modal after 2 seconds
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('[MissionaryVideoRecorder] Upload error:', error);
            elements.statusMessage.textContent = 'Error uploading video. Please try again.';
            elements.useButton.disabled = false;
            elements.retakeButton.disabled = false;
        }
    }

    /* ============================================================
       SECTION 8: MODAL CONTROL
       ============================================================ */

    /**
     * Open video recorder for a missionary
     * @param {Object} missionary - Missionary object
     */
    async function open(missionary) {
        if (!missionary) {
            console.error('[MissionaryVideoRecorder] No missionary provided');
            return;
        }

        _currentMissionary = missionary;

        // Update modal title
        const missionaryNameElem = document.getElementById('video-recorder-missionary-name');
        if (missionaryNameElem) {
            missionaryNameElem.textContent = `Record a message for ${missionary.name}`;
        }

        // Reset UI
        elements.startButton.style.display = 'inline-block';
        elements.stopButton.style.display = 'none';
        elements.retakeButton.style.display = 'none';
        elements.useButton.style.display = 'none';
        elements.useButton.disabled = false;
        elements.retakeButton.disabled = false;
        elements.recordingIndicator.classList.add('hidden');
        elements.timerDisplay.classList.add('hidden');
        elements.videoPreview.controls = false;
        elements.videoPreview.muted = true;
        elements.statusMessage.textContent = 'Initializing camera...';

        // Show modal
        elements.modal.classList.remove('hidden');

        // Start camera preview
        await startCameraPreview();
    }

    /**
     * Close video recorder modal
     */
    function handleClose() {
        // Stop any ongoing recording
        if (_isRecording) {
            handleStopRecording();
        }

        // Stop camera
        stopCamera();

        // Stop timer
        stopTimer();

        // Hide modal
        elements.modal.classList.add('hidden');

        // Reset state
        _currentMissionary = null;
        _recordedChunks = [];
        elements.videoPreview.src = '';
        elements.videoPreview._recordedBlob = null;

        console.log('[MissionaryVideoRecorder] Closed');
    }

    /* ============================================================
       SECTION 9: PUBLIC API
       ============================================================ */

    return {
        init: init,
        open: open
    };

})();

// Make available globally
window.MissionaryVideoRecorder = MissionaryVideoRecorder;
