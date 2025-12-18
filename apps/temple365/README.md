# Temple 365 PWA

Standalone Progressive Web App for Temple 365 visit tracking.

## Features

- **Phone Mode**: Installable PWA for iPhone and Android
- **Kiosk Mode**: Embedded iframe with on-screen keyboard
- **Real-time Sync**: Firestore listeners keep all devices in sync
- **Offline Support**: Service worker caches app shell

## Deployment

### 1. Configure Firebase

Update `js/firebase-init.js` with your Firebase project credentials.

### 2. Configure Ward

Update `js/config.js`:
- Set `wardId` to your ward's ID
- Set `apiBaseUrl` to your Cloud Functions endpoint

### 3. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting:temple
```

## URL Modes

- **Phone/Standalone**: `https://temple.yourdomain.com/`
- **Kiosk/Iframe**: `https://temple.yourdomain.com/?mode=kiosk`

## Icons

Place PWA icons in `icons/` directory:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
