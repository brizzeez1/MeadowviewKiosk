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
  apiKey: "AIzaSyAXug2sBsY5ykMD-iXJ2avVum-6Vxes9G0",
  authDomain: "ward-kiosk-test.firebaseapp.com",
  projectId: "ward-kiosk-test",
  storageBucket: "ward-kiosk-test.firebasestorage.app",
  messagingSenderId: "878995729690",
  appId: "1:878995729690:web:688fb6f7b7ddc23850d0a3",
  measurementId: "G-8TBHFDWMXM"
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
