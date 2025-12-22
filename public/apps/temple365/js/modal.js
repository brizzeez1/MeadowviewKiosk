/**
 * Temple 365 Visit Modal
 *
 * Modal for logging temple visits with keyboard integration
 *
 * FIXES APPLIED (Phase 4 Patch):
 * - Keyboard docked directly under name input (not at bottom of modal body)
 * - Modal flex layout to keep footer visible
 * - "Already visible" guard to prevent double-show
 */

(function() {
  'use strict';

  let _modal = null;
  let _inputName = null;
  let _btnSave = null;
  let _btnCancel = null;
  let _keyboardMount = null;
  let _selectedSquareNumber = null;
  let _config = null;

  /**
   * Initialize the modal
   */
  function init(config) {
    _config = config;

    _modal = document.getElementById('visitModal');
    _inputName = document.getElementById('inputName');
    _btnSave = document.getElementById('btnSaveVisit');
    _btnCancel = document.getElementById('btnCancelVisit');
    _keyboardMount = document.getElementById('keyboardMount');

    if (!_modal || !_inputName || !_btnSave || !_btnCancel) {
      console.error('[Modal] Required elements not found');
      return;
    }

    // Event listeners
    _btnSave.addEventListener('click', handleSave);
    _btnCancel.addEventListener('click', handleCancel);

    // Keyboard integration for kiosk mode
    if (_config.isKioskMode && _keyboardMount) {
      console.log('[Modal] Kiosk mode - setting up keyboard integration');

      // Show keyboard on focus
      _inputName.addEventListener('focus', showKeyboardIfKiosk);

      // Also show keyboard on click (for touch devices)
      _inputName.addEventListener('click', showKeyboardIfKiosk);
    }

    console.log('[Modal] Initialized');
  }

  /**
   * Show keyboard if in kiosk mode (with double-show guard)
   */
  function showKeyboardIfKiosk() {
    if (!_config.isKioskMode) return;
    if (!window.OnScreenKeyboard) {
      console.warn('[Modal] OnScreenKeyboard not loaded');
      return;
    }
    if (!_keyboardMount) {
      console.warn('[Modal] Keyboard mount point not found');
      return;
    }

    // CRITICAL FIX: Guard against double-show (focus + click on same tap)
    if (window.OnScreenKeyboard.isVisible()) {
      console.log('[Modal] Keyboard already visible, skipping double-show');
      return;
    }

    console.log('[Modal] Showing keyboard');
    _keyboardMount.style.display = 'block';
    window.OnScreenKeyboard.show(_inputName, _keyboardMount);
  }

  /**
   * Show the modal
   * @param {number|null} squareNumber - Pre-selected square number (or null for bonus)
   */
  function show(squareNumber = null) {
    _selectedSquareNumber = squareNumber;

    // Update modal title
    const title = _modal.querySelector('.modal-title');
    if (title) {
      if (squareNumber === null) {
        title.textContent = 'Log Bonus Visit';
      } else {
        title.textContent = `Log Visit - Square ${squareNumber}`;
      }
    }

    // Clear input
    _inputName.value = '';
    _inputName.focus();

    // Show modal
    _modal.style.display = 'flex';

    console.log('[Modal] Showing modal for square:', squareNumber);
  }

  /**
   * Hide the modal
   */
  function hide() {
    _modal.style.display = 'none';
    _selectedSquareNumber = null;
    _inputName.value = '';

    // Hide keyboard if shown
    if (_config.isKioskMode && window.OnScreenKeyboard) {
      window.OnScreenKeyboard.hide();
    }

    console.log('[Modal] Modal hidden');
  }

  /**
   * Handle save button click
   */
  async function handleSave() {
    const name = _inputName.value.trim();

    if (!name) {
      alert('Please enter your name');
      return;
    }

    // Format name (Title Case assist for lowercase, preserve intentional capitals)
    const formattedName = formatName(name);

    // Disable button during save
    _btnSave.disabled = true;
    _btnSave.textContent = 'Saving...';

    try {
      // Call API to log visit
      const result = await window.Temple365API.logVisit(
        formattedName,
        _selectedSquareNumber,
        null // No selfie support yet (Phase 6)
      );

      console.log('[Modal] Visit saved:', result);

      // Hide modal
      hide();

      // Show celebration
      if (window.Temple365Celebration) {
        window.Temple365Celebration.celebrate(result);
      }

      // Emit postMessage if in kiosk mode
      if (_config.isKioskMode) {
        emitPostMessage(result, formattedName);
      }

    } catch (error) {
      console.error('[Modal] Error saving visit:', error);
      alert('Failed to save visit. Please try again.');
    } finally {
      _btnSave.disabled = false;
      _btnSave.textContent = 'Save Visit';
    }
  }

  /**
   * Handle cancel button click
   */
  function handleCancel() {
    hide();
  }

  /**
   * Format name (Title Case assist, preserve intentional capitals)
   * Per spec Section 4.1.3 - Locked Decision #5
   */
  function formatName(name) {
    const trimmed = name.trim();

    // Count uppercase letters
    const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length;
    const totalLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;

    // If user used 2+ capitals, keep as-is (they know what they want)
    if (uppercaseCount > 1) {
      console.log('[Modal] Name has multiple capitals, preserving:', trimmed);
      return trimmed;
    }

    // If mostly lowercase, apply Title Case assist
    if (totalLetters > 0 && uppercaseCount <= 1) {
      const titleCased = trimmed.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');

      console.log('[Modal] Applied Title Case:', trimmed, '->', titleCased);
      return titleCased;
    }

    // Fallback: return as-is
    return trimmed;
  }

  /**
   * Emit postMessage to parent kiosk
   * @param {Object} result - API result
   * @param {string} name - Visitor name
   */
  function emitPostMessage(result, name) {
    const message = {
      source: 'Temple365',
      type: 'TEMPLE_VISIT_LOGGED',
      wardId: _config.wardId,
      name: name,
      assignedSquareNumber: result.data.assignedSquareNumber,
      isBonusVisit: result.data.isBonusVisit,
      totalVisits: result.data.totalVisits,
      squaresFilled: result.data.squaresFilled,
      collisionResolved: result.data.collisionResolved || false,
      hasSelfieDuringSave: false // No selfie support yet
    };

    console.log('[Modal] Emitting postMessage:', message);

    // Security fix: Send to same origin (kiosk and iframe served from same Firebase Hosting)
    // This prevents malicious sites from embedding the iframe and intercepting visit data
    const targetOrigin = window.location.origin;
    window.parent.postMessage(message, targetOrigin);
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  window.Temple365Modal = {
    init,
    show,
    hide
  };

  console.log('[Modal] Module loaded');

})();
