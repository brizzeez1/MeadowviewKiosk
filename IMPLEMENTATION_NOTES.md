# Implementation Notes - Phases 3-5

## Phase 3: Temple 365 Phone PWA

**Completed:**
- Standalone PWA for iPhone and Android
- 365-square grid with real-time Firestore sync
- Visit logging with name input and image branching  
- Confetti celebration (2-second auto-dismiss)
- Collision auto-assignment messaging
- Bonus visit UI after goal met
- PWA manifest + service worker
- HEIC image support (empty MIME type handling)
- Name formatting (Title Case assist, preserve intentional capitals)

**Architecture:**
- **Reads**: Firestore client SDK with onSnapshot listeners
- **Writes**: Cloud Functions API (POST /api/v1/temple/logVisit)
- Real-time sync across all devices

**Files Created:**
- `apps/temple365/` - Complete PWA implementation
- All HTML, CSS, JS, manifest, service worker

## Phase 4: Temple 365 Kiosk Mode

**Completed:**
- URL parameter detection (?mode=kiosk)
- In-app on-screen keyboard
  - Docked below name input
  - Does not cover Save/Cancel buttons
  - Touch-only with letters, space, backspace, shift, done
- postMessage emission to parent kiosk
- Input attributes to discourage native OSK

**Keyboard Fixes Applied:**
- Done key crash fixed (dispatch before hide)
- Idempotent initialization
- Auto-init in show()
- setSelectionRange wrapped in try/catch
- Double-show protection
- data-display="flex" support in modal

**Files Updated:**
- `apps/temple365/js/keyboard.js` - On-screen keyboard
- `apps/temple365/js/modal.js` - Keyboard integration
- `apps/temple365/js/app.js` - postMessage emission
- `apps/temple365/css/keyboard.css` - Keyboard styles

## Phase 5: Kiosk Integration Fixes

**Completed:**
1. **Missionary scroll vs tap** - Scroll detection prevents card opens
2. **Back button hijack fix** - data-action attributes for explicit intent
3. **Screensaver scaling** - background-size: contain (height-priority)
4. **Selfie confirm overlay** - Side-by-side layout, no preview covering
5. **Temple 365 iframe update** - Points to Firebase PWA, postMessage listener

**Fixes Applied:**
- Pointer event tracking for mouse/trackpad
- Double-binding guard in Views
- showElement() respects data-display attribute
- postMessage origin check (commented, ready to enable)

**Files Updated:**
- `js/selfieCapture.js`
- `js/missionarySpotlight.js`
- `js/views.js`
- `css/kiosk-layout.css`

## Cloud Functions (Phase 2)

**API Implemented:**
- POST /api/v1/temple/logVisit - Atomic visit logging with collision auto-assign
- Firestore transactions for race condition safety
- Idempotency via clientRequestId

**Files Created:**
- `functions/index.js`
- `functions/src/temple/logVisit.js`
- `functions/src/temple/logBonusVisit.js`
- `functions/package.json`

## Locked Decisions Implemented

All 12 locked decisions from spec followed exactly:
1. ✅ Fixed 365 squares, bonus visits forever
2. ✅ Bonus visits only from dedicated button
3. ✅ Confetti toast on every visit, 2-second auto-dismiss
4. ✅ Collision auto-assigns next available square
5. ✅ Name capitalization (Title Case assist, preserve capitals)
6. ✅ Selfie-only never logs visit
7. ✅ Selfies never linked to visits
8. ✅ Missionary uploads use secret tokens
9. ✅ Missionary uploads auto-published
10. ✅ Missionary video max 100MB
11. ✅ Kiosk video capped at 30 seconds
12. ✅ Missionary gallery newest first

## Next Steps

Phase 6: Selfie-Only Upload Pipeline
Phase 7: Missionary Portal Data
Phase 8: Upload Portal
Phase 9: Kiosk-Recorded Missionary Video
