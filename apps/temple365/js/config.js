/**
 * Temple 365 Configuration
 *
 * Build-time config: wardId and apiBaseUrl only
 * Runtime config: loaded from Firestore via API
 */

const TEMPLE365_CONFIG = {
  // Build-time configuration (minimal)
  wardId: 'wUdBrGwVvafFGZFyxvFm',  // Production ward ID
  apiBaseUrl: 'https://us-central1-meadowview-kiosk.cloudfunctions.net/api',  // Production Cloud Functions URL

  // Mode detection from URL parameter
  isKioskMode: false,
  mode: 'phone'
};

// Detect kiosk mode from URL parameter
(function() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');

    if (modeParam === 'kiosk') {
      TEMPLE365_CONFIG.isKioskMode = true;
      TEMPLE365_CONFIG.mode = 'kiosk';
      console.log('[Config] Running in KIOSK mode');
    } else {
      console.log('[Config] Running in PHONE mode');
    }
  } catch (e) {
    // Fallback for older browsers
    if (window.location.search.indexOf('mode=kiosk') !== -1) {
      TEMPLE365_CONFIG.isKioskMode = true;
      TEMPLE365_CONFIG.mode = 'kiosk';
      console.log('[Config] Running in KIOSK mode (fallback detection)');
    }
  }
})();

// Make available globally
window.TEMPLE365_CONFIG = TEMPLE365_CONFIG;
