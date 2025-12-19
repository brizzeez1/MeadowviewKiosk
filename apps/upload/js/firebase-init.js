/**
 * Firebase Client SDK Initialization (Upload Portal)
 *
 * Initializes Firebase for the upload portal to enable:
 * - Direct file uploads to Cloud Storage
 * - API calls to Cloud Functions for token validation
 *
 * IMPORTANT: Replace firebaseConfig with your actual project values
 */

(function() {
  'use strict';

  // Firebase configuration
  // Get these values from Firebase Console → Project Settings
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Get Storage instance
  const storage = firebase.storage();

  // Make available globally
  window.firebase = firebase;
  window.storage = storage;

  console.log('[Firebase Upload] Initialized');

})();
