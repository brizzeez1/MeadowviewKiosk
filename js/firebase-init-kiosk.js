/**
 * Firebase Client SDK Initialization (Kiosk)
 *
 * Initializes Firebase for the kiosk application to enable:
 * - Real-time missionary data from Firestore (Phase 7)
 * - Missionary gallery photo display
 * - Selfie uploads to Cloud Storage (Phase 6)
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

  // Get Firestore instance
  const db = firebase.firestore();

  // Make available globally
  window.firebase = firebase;
  window.db = db;

  console.log('[Firebase Kiosk] Initialized');
  console.log('[Firebase Kiosk] Firestore ready for missionary data and selfies');

})();
