/* ================================================================
   MISSIONARY VIDEO RECORDER - PHASE 9 (DROP-IN FIXED VERSION)
   ================================================================
   Kiosk webcam video recording for missionary messages.

   FEATURES:
   - 30-second maximum recording
   - Countdown timer showing remaining time
   - Preview plays ONCE for review (no looping)
   - Replay + Retake + Upload controls
   - Upload directly to Firebase Cloud Storage (no backend needed)
   - Null-safe initialization (never breaks kiosk init)
   - Modal closes on backdrop tap + ESC

   STORAGE PATHS:
   - Kiosk-recorded messages (ward -> missionary inbox):
     wards/{wardId}/missionaries/{missionaryId}/wardToMissionary/videos/{timestamp}_{rand}.webm
   ================================================================ */

const MissionaryVideoRecorder = (function () {
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
  const MAX_RECORDING_DURATION_MS = 30 * 1000; // 30 seconds
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
    replayButton: null,
    useButton: null,
    closeButton: null,
    timerDisplay: null,
    statusMessage: null,
    recordingIndicator: null
  };

  /* ============================================================
     SECTION 3: INITIALIZATION
     ============================================================ */

  function init() {
    console.log('[MissionaryVideoRecorder] Initializing...');
    createModalHTML();
    cacheElements();
    attachEventListeners();
    console.log('[MissionaryVideoRecorder] Ready');
  }

  function createModalHTML() {
    // If it's already on the page, don't create a second copy
    if (document.getElementById('video-recorder-modal')) return;

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
            <button type="button"
                    class="btn btn-secondary"
                    id="video-recorder-retake"
                    style="display:none; padding: 14px 26px; font-size: 18px;">
              Retake
            </button>

            <button type="button"
                    class="btn btn-secondary"
                    id="video-recorder-replay"
                    style="display:none; padding: 12px 22px; font-size: 16px;">
              Replay
            </button>

            <button type="button" class="btn btn-kiosk-blue" id="video-recorder-start">
              Start Recording
            </button>

            <button type="button" class="btn btn-danger" id="video-recorder-stop" style="display:none;">
              Stop Recording
            </button>

            <button type="button" class="btn btn-kiosk-blue" id="video-recorder-use" style="display:none;">
              Upload Video
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function cacheElements() {
    elements.modal = document.getElementById('video-recorder-modal');
    elements.videoPreview = document.getElementById('video-recorder-preview');
    elements.startButton = document.getElementById('video-recorder-start');
    elements.stopButton = document.getElementById('video-recorder-stop');
    elements.retakeButton = document.getElementById('video-recorder-retake');
    elements.replayButton = document.getElementById('video-recorder-replay');
    elements.useButton = document.getElementById('video-recorder-use');
    elements.closeButton = document.getElementById('video-recorder-close');
    elements.timerDisplay = document.getElementById('video-recorder-timer');
    elements.statusMessage = document.getElementById('video-recorder-status');
    elements.recordingIndicator = document.getElementById('video-recorder-indicator');
  }

  function attachEventListeners() {
    // Null-safe: if required elements are missing, DON'T crash kiosk init
    const required = [
      ['modal', elements.modal],
      ['videoPreview', elements.videoPreview],
      ['startButton', elements.startButton],
      ['stopButton', elements.stopButton],
      ['retakeButton', elements.retakeButton],
      ['useButton', elements.useButton],
      ['closeButton', elements.closeButton],
      ['timerDisplay', elements.timerDisplay],
      ['statusMessage', elements.statusMessage],
      ['recordingIndicator', elements.recordingIndicator]
    ];

    const missing = required.filter(([, el]) => !el).map(([name]) => name);

    if (missing.length) {
      console.error('[MissionaryVideoRecorder] Missing DOM elements:', missing.join(', '));
      console.error('[MissionaryVideoRecorder] Recorder will not initialize, but kiosk will continue.');
      return;
    }

    // Buttons
    elements.startButton.addEventListener('click', handleStartRecording);
    elements.stopButton.addEventListener('click', handleStopRecording);
    elements.retakeButton.addEventListener('click', handleRetake);
    elements.useButton.addEventListener('click', handleUpload);
    elements.closeButton.addEventListener('click', handleClose);

    // Replay
    if (elements.replayButton) {
      elements.replayButton.addEventListener('click', () => {
        try {
          elements.videoPreview.pause();
          elements.videoPreview.currentTime = 0;
          elements.videoPreview.play().catch(() => {});
        } catch (_) {}
      });
    }

    // Close when tapping the backdrop (outside modal)
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) handleClose();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.modal && !elements.modal.classList.contains('hidden')) {
        handleClose();
      }
    });
  }

  /* ============================================================
     SECTION 4: CAMERA ACCESS
     ============================================================ */

  async function startCameraPreview() {
    try {
      _mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });

      elements.videoPreview.srcObject = _mediaStream;
      elements.videoPreview.muted = true;
      elements.videoPreview.controls = false;

      elements.statusMessage.textContent = 'Camera ready. Tap "Start Recording" when you\'re ready.';

    } catch (error) {
      console.error('[MissionaryVideoRecorder] Camera access error:', error);
      elements.statusMessage.textContent = 'Error: Could not access camera. Please check permissions.';
      // Still allow user to close (backdrop / X / ESC)
    }
  }

  function stopCamera() {
    if (_mediaStream) {
      _mediaStream.getTracks().forEach((track) => track.stop());
      _mediaStream = null;
    }
    if (elements.videoPreview) {
      elements.videoPreview.srcObject = null;
    }
  }

  /* ============================================================
     SECTION 5: RECORDING CONTROL
     ============================================================ */

  function handleStartRecording() {
    if (!_mediaStream) {
      elements.statusMessage.textContent = 'Camera not available. Please check permissions.';
      return;
    }

    try {
      // Reset
      _recordedChunks = [];
      _recordingStartTime = Date.now();

      // Hide review buttons
      if (elements.replayButton) elements.replayButton.style.display = 'none';
      elements.retakeButton.style.display = 'none';
      elements.useButton.style.display = 'none';
      elements.useButton.disabled = false;
      elements.retakeButton.disabled = false;

      // Recorder
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      _mediaRecorder = new MediaRecorder(_mediaStream, options);

      _mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) _recordedChunks.push(event.data);
      };

      _mediaRecorder.onstop = handleRecordingComplete;

      _mediaRecorder.start();
      _isRecording = true;

      // UI
      elements.startButton.style.display = 'none';
      elements.stopButton.style.display = 'inline-block';
      elements.recordingIndicator.classList.remove('hidden');
      elements.timerDisplay.classList.remove('hidden');
      elements.statusMessage.textContent = 'Recording... Tap "Stop" when finished.';

      startTimer();
      console.log('[MissionaryVideoRecorder] Recording started');

    } catch (error) {
      console.error('[MissionaryVideoRecorder] Recording start error:', error);
      elements.statusMessage.textContent = 'Error starting recording. Please try again.';
    }
  }

  function handleStopRecording() {
    if (_mediaRecorder && _isRecording) {
      _mediaRecorder.stop();
      _isRecording = false;
      stopTimer();

      elements.stopButton.style.display = 'none';
      elements.recordingIndicator.classList.add('hidden');
      elements.timerDisplay.classList.add('hidden');

      console.log('[MissionaryVideoRecorder] Recording stopped');
    }
  }

  function handleRecordingComplete() {
    console.log('[MissionaryVideoRecorder] Recording complete, chunks:', _recordedChunks.length);

    const blob = new Blob(_recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);

    // Stop camera stream so we can play the recorded video cleanly
    stopCamera();

    // Show recorded playback (review)
    elements.videoPreview.srcObject = null;
    elements.videoPreview.src = videoUrl;
    elements.videoPreview.muted = false;
    elements.videoPreview.controls = true;
    elements.videoPreview.loop = false; // IMPORTANT: do not loop

    // Store blob for upload
    elements.videoPreview._recordedBlob = blob;

    // Show UI buttons
    elements.retakeButton.style.display = 'inline-block';
    elements.useButton.style.display = 'inline-block';
    if (elements.replayButton) elements.replayButton.style.display = 'inline-block';

    elements.statusMessage.textContent =
      'Preview your video. Tap "Upload Video" to save, "Replay" to watch again, or "Retake" to record again.';

    // Play once for review, then stop
    try {
      elements.videoPreview.currentTime = 0;
      elements.videoPreview.play().catch(() => {});
      elements.videoPreview.onended = () => {
        try {
          elements.videoPreview.pause();
        } catch (_) {}
      };
    } catch (_) {}
  }

  /* ============================================================
     SECTION 6: TIMER
     ============================================================ */

  function startTimer() {
    updateTimerDisplay(MAX_RECORDING_DURATION_SEC);

    _timerInterval = setInterval(() => {
      const elapsed = Date.now() - _recordingStartTime;
      const remaining = Math.max(0, MAX_RECORDING_DURATION_MS - elapsed);
      const remainingSec = Math.ceil(remaining / 1000);

      updateTimerDisplay(remainingSec);

      if (remaining <= 0) {
        console.log('[MissionaryVideoRecorder] 30-second limit reached, auto-stopping');
        handleStopRecording();
      }
    }, 100);
  }

  function stopTimer() {
    if (_timerInterval) {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }
  }

  function updateTimerDisplay(seconds) {
    const timerText = elements.timerDisplay.querySelector('.timer-text');
    if (timerText) timerText.textContent = `0:${seconds.toString().padStart(2, '0')}`;
  }

  /* ============================================================
     SECTION 7: RETAKE & UPLOAD
     ============================================================ */

  async function handleRetake() {
    // Hide replay when starting over
    if (elements.replayButton) elements.replayButton.style.display = 'none';

    // Reset video preview
    try {
      elements.videoPreview.pause();
    } catch (_) {}
    elements.videoPreview.src = '';
    elements.videoPreview.controls = false;
    elements.videoPreview.muted = true;
    elements.videoPreview._recordedBlob = null;

    // Reset recorded chunks
    _recordedChunks = [];

    // UI reset
    elements.retakeButton.style.display = 'none';
    elements.useButton.style.display = 'none';
    elements.startButton.style.display = 'inline-block';
    elements.useButton.disabled = false;
    elements.retakeButton.disabled = false;

    elements.statusMessage.textContent = 'Initializing camera...';
    await startCameraPreview();
  }

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

    if (!window.firebase || !window.firebase.storage || !window.firebase.firestore) {
      console.error('[MissionaryVideoRecorder] Firebase not ready (storage/firestore)');
      elements.statusMessage.textContent = 'Error: Firebase not ready. Please try again.';
      return;
    }

    // Stop playback during upload
    try {
      elements.videoPreview.pause();
      elements.videoPreview.currentTime = 0;
    } catch (_) {}

    // Disable buttons during upload
    elements.useButton.disabled = true;
    elements.retakeButton.disabled = true;
    if (elements.replayButton) elements.replayButton.disabled = true;

    elements.statusMessage.textContent = 'Uploading video...';

    try {
      const wardId =
        (window.KIOSK_CONFIG && window.KIOSK_CONFIG.ORGANIZATION && window.KIOSK_CONFIG.ORGANIZATION.WARD_ID) ||
        'meadowview_az';

      const missionaryId = String(_currentMissionary.firestoreId || _currentMissionary.id);

      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 10);
      const storagePath = `wards/${wardId}/missionaries/${missionaryId}/wardToMissionary/videos/${ts}_${rand}.webm`;

      const storage = window.firebase.storage();
      const fileRef = storage.ref().child(storagePath);

      await fileRef.put(blob, {
        contentType: blob.type || 'video/webm'
      });

      const downloadUrl = await fileRef.getDownloadURL();

      // Optional: write a record so your future missionary portal can list videos
      const db = window.firebase.firestore();
      await db
        .collection('wards')
        .doc(wardId)
        .collection('missionaries')
        .doc(missionaryId)
        .collection('wardToMissionaryVideos')
        .add({
          storagePath,
          url: downloadUrl,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          source: 'kiosk'
        });

      console.log('[MissionaryVideoRecorder] Video uploaded successfully:', storagePath);

      elements.statusMessage.textContent = '✓ Video uploaded successfully!';

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('[MissionaryVideoRecorder] Upload error:', error);
      elements.statusMessage.textContent = 'Error uploading video. Please try again.';

      elements.useButton.disabled = false;
      elements.retakeButton.disabled = false;
      if (elements.replayButton) elements.replayButton.disabled = false;
    }
  }

  /* ============================================================
     SECTION 8: MODAL CONTROL
     ============================================================ */

  async function open(missionary) {
    if (!missionary) {
      console.error('[MissionaryVideoRecorder] No missionary provided');
      return;
    }

    _currentMissionary = missionary;

    const missionaryNameElem = document.getElementById('video-recorder-missionary-name');
    if (missionaryNameElem) missionaryNameElem.textContent = `Record a message for ${missionary.name}`;

    // Reset UI
    elements.startButton.style.display = 'inline-block';
    elements.stopButton.style.display = 'none';
    elements.retakeButton.style.display = 'none';
    elements.useButton.style.display = 'none';
    if (elements.replayButton) {
      elements.replayButton.style.display = 'none';
      elements.replayButton.disabled = false;
    }

    elements.useButton.disabled = false;
    elements.retakeButton.disabled = false;
    elements.recordingIndicator.classList.add('hidden');
    elements.timerDisplay.classList.add('hidden');

    elements.videoPreview.controls = false;
    elements.videoPreview.muted = true;
    elements.videoPreview.loop = false;
    elements.videoPreview._recordedBlob = null;
    elements.videoPreview.onended = null;

    elements.statusMessage.textContent = 'Initializing camera...';

    // Show modal
    elements.modal.classList.remove('hidden');

    // Start camera preview
    await startCameraPreview();
  }

  function handleClose() {
    // Stop any ongoing recording
    if (_isRecording) handleStopRecording();

    stopCamera();
    stopTimer();

    if (elements.modal) elements.modal.classList.add('hidden');

    _currentMissionary = null;
    _recordedChunks = [];

    try {
      if (elements.videoPreview) {
        elements.videoPreview.pause();
        elements.videoPreview.src = '';
        elements.videoPreview.srcObject = null;
        elements.videoPreview._recordedBlob = null;
        elements.videoPreview.onended = null;
      }
    } catch (_) {}

    console.log('[MissionaryVideoRecorder] Closed');
  }

  /* ============================================================
     SECTION 9: PUBLIC API
     ============================================================ */

  return {
    init,
    open,
    close: handleClose,
    isOpen: () => elements.modal && !elements.modal.classList.contains('hidden')
  };

})();

// Make available globally
window.MissionaryVideoRecorder = MissionaryVideoRecorder;
