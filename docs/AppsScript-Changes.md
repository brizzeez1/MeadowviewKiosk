# Apps Script Index.html - Required Changes

Your current Apps Script file is mostly correct! The issue is a **duplicate modal** that creates confusion. Here's exactly what to change:

---

## CHANGE 1: REMOVE the Kiosk Selfie Prompt Modal HTML

**Find and DELETE this entire block** (around line 750-768):

```html
<!--==================== KIOSK SELFIE PROMPT MODAL ====================-->
<div id="kioskSelfiePromptModal" class="modal-backdrop">
  <div class="modal">
    <h2>Would you like to take a Selfie?</h2>
    <p style="margin: 16px 0; color: var(--text-medium);">
      Your temple visit has been recorded! Would you like to take a quick selfie
      to add your family to the mosaic of Christ?
    </p>
    <div class="modal-buttons" style="justify-content: center; gap: 16px;">
      <button type="button" class="btn btn-secondary" id="kioskSelfieNoBtn">
        No, thanks
      </button>
      <button type="button" class="btn btn-primary" id="kioskSelfieYesBtn">
        Yes, take a selfie
      </button>
    </div>
  </div>
</div>
```

---

## CHANGE 2: SIMPLIFY the Kiosk Mode JavaScript

**Find the KIOSK MODE section at the bottom of your `<script>` tag** and REPLACE the entire section with this simpler version:

```javascript
/**************************************************************************
 * KIOSK MODE DETECTION AND BEHAVIOR
 **************************************************************************/

// Detect if running inside an iframe (kiosk mode)
var IS_KIOSK_MODE = false;
try {
  IS_KIOSK_MODE = (window.self !== window.top);
} catch (e) {
  // Security error means we're in an iframe
  IS_KIOSK_MODE = true;
}

// Apply kiosk-specific modifications when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (IS_KIOSK_MODE) {
    console.log('[Temple365] Running in KIOSK mode - selfie upload hidden');

    // Hide the selfie input section in kiosk mode
    // (Kiosk has its own webcam selfie capture screen)
    var selfieLabel = document.querySelector('label[for="selfieInput"]');
    var selfieInput = document.getElementById('selfieInput');

    if (selfieLabel) selfieLabel.style.display = 'none';
    if (selfieInput) selfieInput.style.display = 'none';
  } else {
    console.log('[Temple365] Running in STANDALONE mode - full functionality');
  }
});

// NOTE: The postMessage to parent kiosk is already handled in handleSaveResult()
// The parent kiosk will show its own selfie prompt modal when it receives
// the TEMPLE_VISIT_LOGGED message. We don't need a duplicate modal here.
```

---

## WHAT TO DELETE (the duplicate modal code)

Remove ALL of this code that's currently at the bottom of your script:

```javascript
// DELETE THIS ENTIRE SECTION:

// Override handleSaveResult for kiosk mode
var _originalHandleSaveResult = handleSaveResult;
handleSaveResult = function(result) {
  // Call original function first
  _originalHandleSaveResult(result);

  // In kiosk mode, after successful save, show selfie prompt modal
  if (IS_KIOSK_MODE && result && result.success && !result.hasSelfie) {
    // Wait for success modal to be shown, then show our kiosk selfie prompt
    setTimeout(function() {
      showKioskSelfiePrompt();
    }, 500);
  }
};

// Show kiosk selfie prompt modal
function showKioskSelfiePrompt() {
  var modal = document.getElementById('kioskSelfiePromptModal');
  if (modal) {
    modal.classList.add('visible');
  }
}

// Hide kiosk selfie prompt modal
function hideKioskSelfiePrompt() {
  var modal = document.getElementById('kioskSelfiePromptModal');
  if (modal) {
    modal.classList.remove('visible');
  }
}

// Handle "Yes" - navigate to kiosk selfie screen
function handleKioskSelfieYes() {
  hideKioskSelfiePrompt();
  closeSuccessModal();

  // Send message to parent kiosk to navigate to selfie screen
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: 'Temple365',
        type: 'NAVIGATE_TO_SELFIE'
      }, '*');
    }
  } catch (e) {
    console.warn('[Temple365] Could not send navigation message:', e);
  }
}

// Handle "No" - just close and stay on Temple 365
function handleKioskSelfieNo() {
  hideKioskSelfiePrompt();
  // Success modal is already shown, user can dismiss it normally
}

// Wire up kiosk selfie prompt buttons
document.addEventListener('DOMContentLoaded', function() {
  var yesBtn = document.getElementById('kioskSelfieYesBtn');
  var noBtn = document.getElementById('kioskSelfieNoBtn');

  if (yesBtn) {
    yesBtn.addEventListener('click', handleKioskSelfieYes);
  }
  if (noBtn) {
    noBtn.addEventListener('click', handleKioskSelfieNo);
  }
});
```

---

## WHY THESE CHANGES?

**The Problem:** Your Apps Script was showing its own "Would you like to take a Selfie?" modal, AND the parent kiosk was also showing its modal when it received the `TEMPLE_VISIT_LOGGED` message. This caused:
- Two modals appearing (confusing)
- User might click the iframe's "Yes" but nothing happens because navigation needs to happen in the parent

**The Solution:**
- Keep the postMessage that tells the parent kiosk a visit was logged
- Let the PARENT kiosk show its selfie prompt modal
- Remove the duplicate modal from the iframe
- The parent kiosk handles navigation to the selfie screen

---

## WHAT STAYS THE SAME

Your existing `handleSaveResult` function already has the postMessage code that notifies the parent:

```javascript
// This code is CORRECT - keep it in handleSaveResult:
try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        source: 'Temple365',
        type: 'TEMPLE_VISIT_LOGGED',
        visitNumber: result.visitNumber,
        gridPosition: gridPosition,
        hasSelfie: hasSelfie
      },
      '*'
    );
  }
} catch (pmErr) {
  console.warn('postMessage to parent failed:', pmErr);
}
```

This is the message that triggers the parent kiosk to show its selfie prompt modal.

---

## SUMMARY OF CHANGES

| What | Action |
|------|--------|
| `kioskSelfiePromptModal` HTML | DELETE |
| `showKioskSelfiePrompt()` function | DELETE |
| `hideKioskSelfiePrompt()` function | DELETE |
| `handleKioskSelfieYes()` function | DELETE |
| `handleKioskSelfieNo()` function | DELETE |
| `_originalHandleSaveResult` override | DELETE |
| Button event listeners for kiosk modal | DELETE |
| `IS_KIOSK_MODE` detection | KEEP (simplified) |
| Selfie input hiding in kiosk mode | KEEP |
| postMessage in `handleSaveResult` | KEEP |

After these changes, deploy a new version of your Apps Script.
