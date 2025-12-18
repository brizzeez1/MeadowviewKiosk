/**
 * Firebase Client SDK Initialization
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
  window.firebaseApp = firebase;
  window.db = db;

  console.log('[Firebase] Initialized');

})();
