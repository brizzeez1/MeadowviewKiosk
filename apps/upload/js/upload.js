/**
 * Upload Portal - Main Application Logic
 *
 * Handles:
 * - Token validation
 * - File selection and validation
 * - Direct uploads to Cloud Storage via signed URLs
 * - Progress tracking and UI updates
 */

(function() {
  'use strict';

  /* ============================================================
     STATE
     ============================================================ */
  let _token = null;
  let _missionaryId = null;
  let _missionaryInfo = null;
  let _selectedFiles = [];

  /* ============================================================
     DOM ELEMENTS
     ============================================================ */
  const elements = {
    // Screens
    tokenScreen: document.getElementById('token-screen'),
    uploadScreen: document.getElementById('upload-screen'),

    // Token form
    tokenForm: document.getElementById('token-form'),
    tokenInput: document.getElementById('token-input'),
    tokenError: document.getElementById('token-error'),
    tokenSubmit: document.getElementById('token-submit'),

    // Missionary info
    missionaryName: document.getElementById('missionary-name'),
    missionaryMission: document.getElementById('missionary-mission'),

    // Upload zone
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    uploadButton: document.getElementById('upload-button'),

    // Progress
    uploadProgress: document.getElementById('upload-progress'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),

    // Success
    successMessage: document.getElementById('success-message'),
    uploadMore: document.getElementById('upload-more'),

    // Navigation
    changeMissionaryLink: document.getElementById('change-missionary-link')
  };

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  function init() {
    console.log('[Upload] Initializing...');

    // Check URL for token parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      // Auto-fill token input and try to validate
      elements.tokenInput.value = tokenFromUrl;
      validateToken(tokenFromUrl);
    }

    // Event listeners
    elements.tokenForm.addEventListener('submit', handleTokenSubmit);
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadButton.addEventListener('click', handleUpload);
    elements.uploadMore.addEventListener('click', resetUploadForm);
    elements.changeMissionaryLink.addEventListener('click', resetToTokenScreen);

    // Drag and drop
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);

    console.log('[Upload] Ready');
  }

  /* ============================================================
     TOKEN VALIDATION
     ============================================================ */
  async function handleTokenSubmit(e) {
    e.preventDefault();

    const token = elements.tokenInput.value.trim();

    if (!token) {
      showTokenError('Please enter an upload code');
      return;
    }

    await validateToken(token);
  }

  async function validateToken(token) {
    console.log('[Upload] Validating token...');

    // Disable form
    elements.tokenSubmit.disabled = true;
    elements.tokenSubmit.textContent = 'Validating...';
    hideTokenError();

    try {
      const response = await fetch(`${UPLOAD_CONFIG.apiBaseUrl}/v1/missionary/validateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();

      if (data.valid) {
        // Token is valid
        _token = token;
        _missionaryId = data.missionary.id;
        _missionaryInfo = data.missionary;

        console.log('[Upload] Token validated:', _missionaryInfo.name);

        // Show upload screen
        showUploadScreen();
      } else {
        showTokenError('Invalid upload code. Please check and try again.');
        elements.tokenSubmit.disabled = false;
        elements.tokenSubmit.textContent = 'Continue';
      }

    } catch (error) {
      console.error('[Upload] Token validation error:', error);
      showTokenError('Unable to validate code. Please check your internet connection and try again.');
      elements.tokenSubmit.disabled = false;
      elements.tokenSubmit.textContent = 'Continue';
    }
  }

  function showTokenError(message) {
    elements.tokenError.textContent = message;
    elements.tokenError.style.display = 'block';
  }

  function hideTokenError() {
    elements.tokenError.style.display = 'none';
  }

  /* ============================================================
     SCREEN TRANSITIONS
     ============================================================ */
  function showUploadScreen() {
    // Update missionary info
    elements.missionaryName.textContent = _missionaryInfo.name;
    elements.missionaryMission.textContent = _missionaryInfo.mission;

    // Switch screens
    elements.tokenScreen.classList.remove('active');
    elements.uploadScreen.classList.add('active');
  }

  function resetToTokenScreen() {
    // Clear state
    _token = null;
    _missionaryId = null;
    _missionaryInfo = null;
    _selectedFiles = [];

    // Clear form
    elements.tokenInput.value = '';
    elements.tokenSubmit.disabled = false;
    elements.tokenSubmit.textContent = 'Continue';
    hideTokenError();

    // Clear file list
    renderFileList();

    // Switch screens
    elements.uploadScreen.classList.remove('active');
    elements.tokenScreen.classList.add('active');
  }

  /* ============================================================
     FILE SELECTION
     ============================================================ */
  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }

  function addFiles(files) {
    files.forEach(file => {
      // Validate file
      if (!validateFile(file)) {
        return;
      }

      // Add to selected files
      _selectedFiles.push(file);
    });

    // Update UI
    renderFileList();

    // Show upload button if files selected
    if (_selectedFiles.length > 0) {
      elements.uploadButton.style.display = 'block';
    }
  }

  function validateFile(file) {
    // Check file size (100MB max per spec decision #10)
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
      return false;
    }

    // Check file type - ACCEPT EMPTY MIME TYPES (iPhone HEIC fix per spec)
    // iPhone HEIC files may have empty file.type, so validate by extension as fallback
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.mp4', '.mov', '.avi'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = file.type && UPLOAD_CONFIG.allowedMimeTypes.includes(file.type);

    // Accept if EITHER MIME type is valid OR extension is valid (handles empty MIME)
    if (!hasValidMimeType && !hasValidExtension) {
      alert(`File "${file.name}" is not a supported type. Please upload images (.jpg, .png, .heic) or videos (.mp4, .mov) only.`);
      return false;
    }

    return true;
  }

  function inferContentTypeFromExtension(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo'
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  function removeFile(index) {
    _selectedFiles.splice(index, 1);
    renderFileList();

    // Hide upload button if no files
    if (_selectedFiles.length === 0) {
      elements.uploadButton.style.display = 'none';
    }
  }

  function renderFileList() {
    if (_selectedFiles.length === 0) {
      elements.fileList.innerHTML = '';
      return;
    }

    const html = _selectedFiles.map((file, index) => {
      const isVideo = file.type.startsWith('video/');
      const icon = isVideo ? '🎬' : '🖼️';
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);

      return `
        <div class="file-item">
          <div class="file-icon">${icon}</div>
          <div class="file-info">
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div class="file-size">${sizeInMB} MB</div>
          </div>
          <button type="button" class="file-remove" onclick="UploadApp.removeFile(${index})">×</button>
        </div>
      `;
    }).join('');

    elements.fileList.innerHTML = html;
  }

  /* ============================================================
     FILE UPLOAD
     ============================================================ */
  async function handleUpload() {
    console.log('[Upload] Starting upload:', _selectedFiles.length, 'files');

    // Hide upload button
    elements.uploadButton.style.display = 'none';

    // Show progress
    elements.uploadProgress.style.display = 'block';
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = 'Preparing upload...';

    try {
      let uploadedCount = 0;

      for (let i = 0; i < _selectedFiles.length; i++) {
        const file = _selectedFiles[i];

        // Update progress text
        elements.progressText.textContent = `Uploading ${i + 1} of ${_selectedFiles.length}...`;

        // Upload file
        await uploadFile(file);

        uploadedCount++;

        // Update progress bar
        const progress = (uploadedCount / _selectedFiles.length) * 100;
        elements.progressFill.style.width = `${progress}%`;
      }

      // Upload complete
      console.log('[Upload] All files uploaded successfully');
      showSuccess();

    } catch (error) {
      console.error('[Upload] Upload failed:', error);
      alert('Upload failed. Please try again.');

      // Reset UI
      elements.uploadProgress.style.display = 'none';
      elements.uploadButton.style.display = 'block';
    }
  }

  async function uploadFile(file) {
    console.log('[Upload] Uploading file:', file.name);

    // Infer content type from extension if file.type is empty (iPhone HEIC fix)
    const effectiveContentType = file.type || inferContentTypeFromExtension(file.name);

    // Step 1: Request signed URL from Cloud Function
    const signedUrlResponse = await fetch(`${UPLOAD_CONFIG.apiBaseUrl}/v1/missionary/requestUpload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: _token,
        fileName: file.name,
        contentType: effectiveContentType,
        fileSizeBytes: file.size
      })
    });

    if (!signedUrlResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl } = await signedUrlResponse.json();

    // Step 2: Upload file directly to Cloud Storage using signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': effectiveContentType
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    console.log('[Upload] File uploaded:', file.name);
  }

  function showSuccess() {
    // Hide progress
    elements.uploadProgress.style.display = 'none';

    // Show success message
    elements.successMessage.style.display = 'block';
  }

  function resetUploadForm() {
    // Clear files
    _selectedFiles = [];
    elements.fileInput.value = '';
    renderFileList();

    // Hide success
    elements.successMessage.style.display = 'none';

    // Show upload zone
    elements.uploadButton.style.display = 'none';
  }

  /* ============================================================
     UTILITIES
     ============================================================ */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.UploadApp = {
    removeFile: removeFile
  };

  /* ============================================================
     INIT ON LOAD
     ============================================================ */
  document.addEventListener('DOMContentLoaded', init);

})();
