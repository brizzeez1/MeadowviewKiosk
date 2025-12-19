/**
 * Upload Portal Configuration
 *
 * This file contains build-time configuration values for the upload portal.
 * Update these values when deploying to production.
 */

const UPLOAD_CONFIG = {
  // Cloud Functions API base URL
  // DEVELOPMENT: Use local emulator
  // PRODUCTION: Use deployed Cloud Functions URL
  apiBaseUrl: 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api',

  // Ward ID (must match Firestore ward document)
  wardId: 'meadowview',

  // Upload limits (per spec decision #10)
  maxFileSize: 100 * 1024 * 1024, // 100MB

  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime', // .mov files
    'video/x-msvideo' // .avi files
  ]
};

// Make available globally
window.UPLOAD_CONFIG = UPLOAD_CONFIG;
