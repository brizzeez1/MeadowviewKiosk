# Apps Script Index.html - Required Changes

## The Problem

Google Apps Script serves pages inside its own internal sandbox, so `window.self !== window.top`
returns `true` even on direct URL access. This breaks iframe-based kiosk detection.

## The Solution

Use a **URL parameter** (`?mode=kiosk`) instead of iframe detection.

- **Direct access:** `https://script.google.com/.../exec` → Shows selfie upload
- **Kiosk iframe:** `https://script.google.com/.../exec?mode=kiosk` → Hides selfie upload

---

## CHANGE 1: Replace the Kiosk Detection Code

Find this section at the bottom of your `<script>` tag:

```javascript
/**************************************************************************
 * KIOSK MODE DETECTION AND BEHAVIOR
 **************************************************************************/
```

**REPLACE everything from that comment down to the end of the script** with this:

```javascript
/**************************************************************************
 * KIOSK MODE DETECTION AND BEHAVIOR
 **************************************************************************/

// Detect kiosk mode via URL parameter (iframe detection doesn't work in Apps Script)
// The kiosk loads: ...exec?mode=kiosk
// Direct access loads: ...exec (no parameter)
var IS_KIOSK_MODE = false;
try {
  var urlParams = new URLSearchParams(window.location.search);
  IS_KIOSK_MODE = (urlParams.get('mode') === 'kiosk');
} catch (e) {
  // Fallback for older browsers
  IS_KIOSK_MODE = (window.location.search.indexOf('mode=kiosk') !== -1);
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
```

---

## CHANGE 2: Remove the Duplicate Modal (if present)

If you still have the `kioskSelfiePromptModal` HTML and its related JavaScript functions,
**DELETE** them. The parent kiosk handles the selfie prompt, not the iframe.

### HTML to DELETE (if present):
```html
<!--==================== KIOSK SELFIE PROMPT MODAL ====================-->
<div id="kioskSelfiePromptModal" class="modal-backdrop">
  ...
</div>
```

### JavaScript to DELETE (if present):
- `showKioskSelfiePrompt()` function
- `hideKioskSelfiePrompt()` function
- `handleKioskSelfieYes()` function
- `handleKioskSelfieNo()` function
- `_originalHandleSaveResult` override
- Button event listeners for `kioskSelfieYesBtn` and `kioskSelfieNoBtn`

---

## WHAT TO KEEP

Your existing `handleSaveResult` function already has the postMessage code - **keep it**:

```javascript
// This code notifies the parent kiosk - KEEP IT
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

---

## After Making Changes

1. Save your Apps Script project
2. Deploy → New deployment (or Manage deployments → Edit → New version)
3. Test:
   - **Direct URL** (`/exec`): Should show selfie upload in modal
   - **Kiosk** (`/exec?mode=kiosk`): Should hide selfie upload in modal

---

## Summary

| What | Action |
|------|--------|
| Kiosk detection method | CHANGE from iframe to URL parameter |
| `kioskSelfiePromptModal` HTML | DELETE (if present) |
| Duplicate modal JavaScript | DELETE (if present) |
| postMessage in `handleSaveResult` | KEEP |
