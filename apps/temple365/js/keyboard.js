/**
 * On-Screen Keyboard for Kiosk Mode
 *
 * FIXES APPLIED (Phase 4 Patch):
 * - Done key crash fixed: dispatchEvent BEFORE hide()
 * - Idempotent initialization
 * - Auto-init in show() if not initialized
 * - setSelectionRange wrapped in try/catch
 * - Double-show protection in modal.js
 */

(function() {
  'use strict';

  let _targetInput = null;
  let _container = null;
  let _isShiftActive = false;
  let _isInitialized = false;

  const KEYBOARD_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
    ['SPACE', 'DONE']
  ];

  /**
   * Initialize the keyboard (idempotent)
   */
  function init() {
    if (_isInitialized) {
      console.log('[OnScreenKeyboard] Already initialized');
      return;
    }

    console.log('[OnScreenKeyboard] Initializing...');
    _isInitialized = true;
  }

  /**
   * Show the keyboard for a given input element
   * @param {HTMLInputElement} inputElement - Input to attach keyboard to
   * @param {HTMLElement} containerElement - Container to render keyboard in
   */
  function show(inputElement, containerElement) {
    // Auto-init if not initialized
    if (!_isInitialized) {
      console.log('[OnScreenKeyboard] Auto-initializing...');
      init();
    }

    // Don't show if already visible for the same input
    if (_targetInput === inputElement && isVisible()) {
      console.log('[OnScreenKeyboard] Already visible for this input');
      return;
    }

    console.log('[OnScreenKeyboard] Showing keyboard');

    _targetInput = inputElement;
    _container = containerElement;
    _isShiftActive = false;

    // Clear container and render keyboard
    _container.innerHTML = '';
    const keyboardEl = createKeyboardElement();
    _container.appendChild(keyboardEl);

    // Show container
    _container.style.display = 'block';

    // Focus the input
    _targetInput.focus();
  }

  /**
   * Hide the keyboard
   */
  function hide() {
    console.log('[OnScreenKeyboard] Hiding keyboard');

    if (_container) {
      _container.style.display = 'none';
      _container.innerHTML = '';
    }

    _targetInput = null;
    _container = null;
    _isShiftActive = false;
  }

  /**
   * Check if keyboard is currently visible
   * @returns {boolean}
   */
  function isVisible() {
    return _container && _container.style.display !== 'none';
  }

  /**
   * Create the keyboard DOM element
   * @returns {HTMLElement}
   */
  function createKeyboardElement() {
    const keyboard = document.createElement('div');
    keyboard.className = 'on-screen-keyboard';

    KEYBOARD_LAYOUT.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      row.forEach((key) => {
        const keyEl = createKeyElement(key);
        rowEl.appendChild(keyEl);
      });

      keyboard.appendChild(rowEl);
    });

    return keyboard;
  }

  /**
   * Create a single key element
   * @param {string} key - Key label
   * @returns {HTMLElement}
   */
  function createKeyElement(key) {
    const keyEl = document.createElement('button');
    keyEl.className = 'keyboard-key';
    keyEl.type = 'button';
    keyEl.dataset.key = key;

    // Special key styling
    if (key === 'SPACE') {
      keyEl.classList.add('key-space');
      keyEl.textContent = 'Space';
    } else if (key === 'BACK') {
      keyEl.classList.add('key-back');
      keyEl.textContent = '⌫';
    } else if (key === 'SHIFT') {
      keyEl.classList.add('key-shift');
      keyEl.textContent = '⇧';
    } else if (key === 'DONE') {
      keyEl.classList.add('key-done');
      keyEl.textContent = 'Done';
    } else {
      keyEl.textContent = key;
    }

    // Click handler
    keyEl.addEventListener('click', handleKeyPress);

    return keyEl;
  }

  /**
   * Handle key press
   * @param {Event} event - Click event
   */
  function handleKeyPress(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!_targetInput) {
      console.error('[OnScreenKeyboard] No target input');
      return;
    }

    const key = event.currentTarget.dataset.key;
    const action = getKeyAction(key);

    console.log('[OnScreenKeyboard] Key pressed:', key, 'action:', action);

    // Handle special actions
    if (action === 'done') {
      // CRITICAL FIX: Dispatch event BEFORE hiding (prevents crash)
      dispatchInputEvent();
      hide();
      return; // Early return
    }

    if (action === 'shift') {
      toggleShift();
      return;
    }

    // Handle character input
    const currentValue = _targetInput.value;
    const cursorPos = getCursorPosition();

    let newValue = currentValue;
    let newCursorPos = cursorPos;

    if (action === 'backspace') {
      if (cursorPos > 0) {
        newValue = currentValue.slice(0, cursorPos - 1) + currentValue.slice(cursorPos);
        newCursorPos = cursorPos - 1;
      }
    } else if (action === 'space') {
      newValue = currentValue.slice(0, cursorPos) + ' ' + currentValue.slice(cursorPos);
      newCursorPos = cursorPos + 1;
    } else if (action === 'character') {
      const char = _isShiftActive ? key.toUpperCase() : key.toLowerCase();
      newValue = currentValue.slice(0, cursorPos) + char + currentValue.slice(cursorPos);
      newCursorPos = cursorPos + 1;

      // Auto-disable shift after character
      if (_isShiftActive) {
        _isShiftActive = false;
        updateShiftState();
      }
    }

    // Update input value
    _targetInput.value = newValue;
    setCursorPosition(newCursorPos);

    // Dispatch input event
    dispatchInputEvent();
  }

  /**
   * Get action for a key
   * @param {string} key - Key label
   * @returns {string} Action type
   */
  function getKeyAction(key) {
    if (key === 'DONE') return 'done';
    if (key === 'SHIFT') return 'shift';
    if (key === 'BACK') return 'backspace';
    if (key === 'SPACE') return 'space';
    return 'character';
  }

  /**
   * Toggle shift state
   */
  function toggleShift() {
    _isShiftActive = !_isShiftActive;
    updateShiftState();
    console.log('[OnScreenKeyboard] Shift:', _isShiftActive);
  }

  /**
   * Update shift button visual state
   */
  function updateShiftState() {
    const shiftKey = _container.querySelector('[data-key="SHIFT"]');
    if (shiftKey) {
      if (_isShiftActive) {
        shiftKey.classList.add('active');
      } else {
        shiftKey.classList.remove('active');
      }
    }
  }

  /**
   * Get cursor position in input
   * @returns {number}
   */
  function getCursorPosition() {
    if (!_targetInput) return 0;
    return _targetInput.selectionStart || 0;
  }

  /**
   * Set cursor position in input
   * @param {number} pos - Cursor position
   */
  function setCursorPosition(pos) {
    if (!_targetInput) return;

    // CRITICAL FIX: Wrap in try/catch (can fail on some input types)
    try {
      _targetInput.setSelectionRange(pos, pos);
    } catch (e) {
      console.warn('[OnScreenKeyboard] setSelectionRange failed:', e);
    }
  }

  /**
   * Dispatch input event (for listeners)
   */
  function dispatchInputEvent() {
    if (!_targetInput) return;

    const event = new Event('input', {
      bubbles: true,
      cancelable: true
    });

    _targetInput.dispatchEvent(event);
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  window.OnScreenKeyboard = {
    init,
    show,
    hide,
    isVisible
  };

  console.log('[OnScreenKeyboard] Module loaded');

})();
