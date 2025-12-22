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
// Ensure anonymous auth for kiosk
firebase.auth().signInAnonymously()
  .then(() => console.log("[Auth] Signed in anonymously"))
  .catch((err) => console.error("[Auth] Anonymous sign-in failed", err));
  // Get Firestore instance
  const db = firebase.firestore();

  // Make available globally
  window.firebase = firebase;
  window.db = db;

  console.log('[Firebase Kiosk] Initialized');
  console.log('[Firebase Kiosk] Firestore ready for missionary data and selfies');


})();
