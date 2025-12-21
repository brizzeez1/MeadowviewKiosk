# Ward Kiosk v1 - Complete Deployment & Operations Guide

> **Version:** 1.0
> **Last Updated:** December 2024
> **Audience:** Non-technical ward administrators

---

## Table of Contents

1. [What You Are Building](#1-what-you-are-building)
2. [Prerequisites](#2-prerequisites)
3. [Repository Overview](#3-repository-overview)
4. [Firebase Project Setup](#4-firebase-project-setup)
5. [Domain Setup (GoDaddy)](#5-domain-setup-godaddy)
6. [Initial Ward Bootstrap](#6-initial-ward-bootstrap)
7. [Kiosk Deployment](#7-kiosk-deployment)
8. [Temple 365 Phone PWA Deployment](#8-temple-365-phone-pwa-deployment)
9. [Missionary Upload Portal Deployment](#9-missionary-upload-portal-deployment)
10. [Multiple Wards Onboarding](#10-multiple-wards-onboarding)
11. [Troubleshooting](#11-troubleshooting)
12. [Appendix](#12-appendix)
13. [Quickstart & Checklists](#13-quickstart--checklists)

---

# 1) What You Are Building

## System Overview

The Ward Kiosk is an interactive touchscreen experience for LDS meetinghouses that includes:

### Temple 365 Tracker
- A visual 365-square grid representing the ward's goal of 365 temple visits in a year
- Each temple visit "fills" one square until all 365 are complete
- After 365 squares are filled, visits continue as "bonus visits" forever
- Members can log visits from:
  - **Kiosk** (touchscreen in the meetinghouse)
  - **Phone PWA** (installed web app on personal phones)

### Selfie Mosaic
- Members can take selfies at the kiosk
- Photos are uploaded to cloud storage
- Selfies are **never linked to temple visits** (they are independent)
- Creates a visual mosaic representing ward unity

### Missionary Spotlight
- Displays ward missionaries currently serving
- Shows missionary photos, mission location, and favorite scripture
- **Missionary Gallery**: Family/friends can upload photos and videos via secret links
- **Kiosk Video Recording**: Ward members can record 30-second video messages

### How It All Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SINGLE FIREBASE PROJECT                       │
│                     (hosts ALL wards in one project)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │   Ward A         │    │   Ward B         │    │   Ward C       │ │
│  │   meadowview_az  │    │   sunset_ca      │    │   alpine_ut    │ │
│  └────────┬─────────┘    └────────┬─────────┘    └───────┬────────┘ │
│           │                       │                       │          │
│           ▼                       ▼                       ▼          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     FIRESTORE DATABASE                          │ │
│  │  wards/{wardId}/                                                │ │
│  │    ├── stats/current          (visit counters)                  │ │
│  │    ├── templeSquares/{1-365}  (grid squares)                    │ │
│  │    ├── visits/{visitId}       (visit log)                       │ │
│  │    ├── selfies/{selfieId}     (selfie metadata)                 │ │
│  │    └── missionaries/{id}      (missionary data)                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     CLOUD STORAGE                               │ │
│  │  wards/{wardId}/                                                │ │
│  │    ├── selfies/               (selfie photos)                   │ │
│  │    └── missionaries/          (gallery photos & videos)         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     CLOUD FUNCTIONS                             │ │
│  │  POST /api/v1/temple/logVisit        (log visits)               │ │
│  │  POST /api/v1/mosaic/requestSelfieUpload (get upload URL)       │ │
│  │  POST /api/v1/missionary/validateToken   (upload portal)        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

                              ▲          ▲          ▲
                              │          │          │
               ┌──────────────┘          │          └──────────────┐
               │                         │                         │
    ┌──────────┴──────────┐   ┌──────────┴──────────┐   ┌─────────┴─────────┐
    │    KIOSK HARDWARE   │   │   PHONE PWA         │   │  UPLOAD PORTAL    │
    │  kiosk.wardname.com │   │ temple.wardname.com │   │ upload.wardname.com│
    │  (meetinghouse)     │   │ (member phones)     │   │ (family uploads)  │
    └─────────────────────┘   └─────────────────────┘   └───────────────────┘
```

### Domain Pattern (Per Ward)

Each ward uses its own domain with consistent subdomains:

| Subdomain | Purpose | Example |
|-----------|---------|---------|
| `kiosk.` | Kiosk touchscreen app | kiosk.meadowviewward.com |
| `temple.` | Temple 365 PWA for phones | temple.meadowviewward.com |
| `upload.` | Missionary photo upload portal | upload.meadowviewward.com |

### Ward Isolation

- **wardId** is a human-readable identifier (e.g., `meadowview_az`, `sunset_ca`)
- All data is isolated by wardId in Firestore
- Multiple wards safely share one Firebase project
- **wardId ↔ domain tracking**: Maintained in `config/config.js` (kiosk) and `apps/*/js/config.js` (PWA/upload)

---

# 2) Prerequisites

Before you begin, you need accounts, software, and verification that everything is installed correctly.

## 2.1 Accounts Required

### GoDaddy Account (or your DNS provider)
- **Why**: To configure DNS records pointing your domain to Firebase
- **What you need**: Domain already purchased (e.g., meadowviewward.com)
- **How to verify**: Log in at https://godaddy.com and confirm you can access DNS settings

### Google Account with Firebase Access
- **Why**: Firebase hosts the database, files, and cloud functions
- **What you need**: A Google account (Gmail works fine)
- **How to verify**: Go to https://console.firebase.google.com and confirm you can see the Firebase Console

## 2.2 Software to Install

### Node.js LTS (Long Term Support)

Node.js is required to run Firebase CLI commands and seed scripts.

**Installation Steps:**
1. Go to https://nodejs.org
2. Click the **LTS** (green) button to download
3. Run the installer, accepting all defaults
4. Restart your computer after installation

**Verification:**
Open Command Prompt (Windows) or Terminal (Mac) and type:
```bash
node --version
```

**Expected Output:**
```
v20.10.0
```
(Your version may differ; any v18 or higher is acceptable)

Also verify npm (comes with Node.js):
```bash
npm --version
```

**Expected Output:**
```
10.2.3
```
(Any version 8 or higher is acceptable)

### Firebase CLI (Command Line Interface)

**Installation Steps:**
Open Command Prompt or Terminal and run:
```bash
npm install -g firebase-tools
```

Wait for installation to complete (may take 1-2 minutes).

**Verification:**
```bash
firebase --version
```

**Expected Output:**
```
13.0.0
```
(Any version 12 or higher is acceptable)

### Git (Version Control)

**Installation Steps:**
1. Go to https://git-scm.com/downloads
2. Download and run the installer for your operating system
3. Accept all default settings during installation

**Verification:**
```bash
git --version
```

**Expected Output:**
```
git version 2.42.0
```
(Any version 2.30 or higher is acceptable)

### VS Code (Optional but Recommended)

A code editor makes it easier to view and edit configuration files.

**Installation Steps:**
1. Go to https://code.visualstudio.com
2. Download and install for your operating system

## 2.3 Prerequisites Verification Checklist

Before proceeding, confirm each item:

| Check | Command | Expected Result |
|-------|---------|-----------------|
| ☐ | `node --version` | v18.0.0 or higher |
| ☐ | `npm --version` | 8.0.0 or higher |
| ☐ | `firebase --version` | 12.0.0 or higher |
| ☐ | `git --version` | 2.30.0 or higher |
| ☐ | GoDaddy login works | Can access DNS settings |
| ☐ | Firebase Console accessible | Can create new projects |

---

# 3) Repository Overview

## 3.1 Cloning the Repository

Open Command Prompt or Terminal and navigate to where you want the code:

```bash
cd Documents
git clone https://github.com/YOUR_ORG/MeadowviewKiosk.git
cd MeadowviewKiosk
```

**Expected Result:** You should see a folder named `MeadowviewKiosk` with files inside.

## 3.2 Folder Structure Explained

```
MeadowviewKiosk/
│
├── index.html                    # KIOSK: Main kiosk app entry point
├── css/                          # KIOSK: Stylesheets
│   ├── styles.css
│   └── kiosk-layout.css
├── js/                           # KIOSK: JavaScript files
│   ├── app.js
│   ├── firebase-init-kiosk.js    # ** MUST CONFIGURE WITH YOUR FIREBASE KEYS **
│   ├── selfieCapture.js
│   ├── missionarySpotlight.js
│   └── ...
├── config/
│   └── config.js                 # ** MUST CONFIGURE WITH YOUR WARD_ID **
├── assets/
│   ├── temple_photos/            # Screensaver images
│   ├── missionary_photos/        # (Legacy - now in Cloud Storage)
│   ├── icons/                    # UI icons
│   └── videos/                   # Local videos (President Nelson)
│
├── apps/
│   ├── temple365/                # TEMPLE 365 PWA (for phones)
│   │   ├── index.html
│   │   ├── manifest.webmanifest  # PWA configuration
│   │   ├── sw.js                 # Service worker for offline
│   │   ├── js/
│   │   │   ├── config.js         # ** MUST CONFIGURE **
│   │   │   ├── firebase-init.js  # ** MUST CONFIGURE **
│   │   │   └── ...
│   │   └── css/
│   │
│   └── upload/                   # MISSIONARY UPLOAD PORTAL
│       ├── index.html
│       ├── js/
│       │   ├── config.js         # ** MUST CONFIGURE **
│       │   ├── firebase-init.js  # ** MUST CONFIGURE **
│       │   └── upload.js
│       └── css/
│
├── functions/                    # CLOUD FUNCTIONS (server-side code)
│   ├── index.js                  # Main entry point
│   ├── package.json              # Dependencies
│   └── src/
│       ├── temple/
│       │   ├── logVisit.js       # Temple visit API
│       │   └── logBonusVisit.js
│       ├── mosaic/
│       │   ├── requestSelfieUpload.js
│       │   └── onSelfieUploaded.js
│       └── missionary/
│           ├── validateToken.js
│           ├── requestUpload.js
│           └── ...
│
├── firestore/                    # DATABASE CONFIGURATION
│   ├── seed-data/
│   │   ├── temple-squares-seed.js    # ** RUN THIS TO INITIALIZE WARD **
│   │   ├── missionaries-seed.js      # ** RUN THIS TO ADD MISSIONARIES **
│   │   ├── ward-template.json
│   │   └── initial-stats.json
│   ├── schema.md                 # Database structure documentation
│   └── DEPLOYMENT.md
│
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Database security rules
├── firestore.indexes.json        # Required database indexes
└── storage.rules                 # File storage security rules
```

## 3.3 CRITICAL: What Goes Where

### Files that Deploy to Firebase Hosting (Web Server)

These files are publicly accessible on the web:

| Files | Deploys As | URL Path |
|-------|------------|----------|
| `index.html`, `css/`, `js/`, `config/`, `assets/` | Kiosk App | `/` (root) |
| `apps/temple365/*` | Temple 365 PWA | `/apps/temple365/` |
| `apps/upload/*` | Upload Portal | `/apps/upload/` |

### Files that Deploy to Cloud Functions (Server)

| Folder | Purpose |
|--------|---------|
| `functions/` | API endpoints for logging visits, generating upload URLs |

### Files that Configure Firestore (Database)

| File | Purpose |
|------|---------|
| `firestore.rules` | Security rules (who can read/write) |
| `firestore.indexes.json` | Required indexes for queries |

### Files that Configure Storage (File Uploads)

| File | Purpose |
|------|---------|
| `storage.rules` | Security rules for file uploads |

### Files that MUST NOT Deploy to Hosting

> ⚠️ **WARNING**: The following folders contain server-side code or sensitive configuration. They are explicitly ignored by `firebase.json` but never manually deploy them to Hosting:

| Folder | Why It's Excluded |
|--------|-------------------|
| `functions/` | Server code (would expose API implementation) |
| `firestore/` | Seed scripts with admin credentials |
| `backend/` | Legacy backend code |
| `docs/` | Internal documentation |
| `node_modules/` | Dependencies (large, not needed) |

---

# 4) Firebase Project Setup

## 4.1 Create a New Firebase Project

**Why**: Firebase is your backend infrastructure—database, file storage, and serverless functions.

**Steps:**

1. Open https://console.firebase.google.com in your browser
2. Click **"Create a project"** (or **"Add project"** if you have existing projects)
3. Enter a project name:
   - Recommended: `ward-kiosk-production`
   - This name will appear in URLs and the console
4. Click **Continue**
5. Google Analytics:
   - For most wards, click **"Disable Google Analytics"** (simplifies setup)
   - If you want analytics, enable it and select a Google Analytics account
6. Click **"Create project"**
7. Wait 30-60 seconds for project creation
8. Click **Continue** when prompted

**Expected Result:** You see your new project dashboard with "Get started" options.

**Record this information:**
- **Project ID**: Found in project settings (e.g., `ward-kiosk-production`)
  - This is NOT editable after creation
  - Write it down: `__________________________`

## 4.2 Enable Required Services

### Enable Firestore Database

1. In Firebase Console, click **"Build"** in left sidebar
2. Click **"Firestore Database"**
3. Click **"Create database"**
4. Select location:
   - **Recommended**: `us-central` (Iowa) for US-based wards
   - **Important**: Location cannot be changed later!
5. Select **"Start in production mode"** (we will deploy security rules)
6. Click **"Enable"**

**Expected Result:** You see an empty Firestore database interface.

### Enable Cloud Storage

1. Click **"Build"** → **"Storage"** in left sidebar
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Select same location as Firestore (e.g., `us-central`)
5. Click **"Done"**

**Expected Result:** You see an empty Storage bucket (gs://your-project.appspot.com).

### Enable Cloud Functions

Cloud Functions are enabled automatically when you deploy them. No manual step needed.

### Get Your Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the web icon `</>` to register a web app
5. Enter an app nickname: `ward-kiosk-web`
6. ☐ Do NOT check "Firebase Hosting" (we'll set this up separately)
7. Click **"Register app"**
8. You'll see a code block with `firebaseConfig`. **Copy these values:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // Copy this
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Write down each value:**
- apiKey: `___________________________________`
- authDomain: `___________________________________`
- projectId: `___________________________________`
- storageBucket: `___________________________________`
- messagingSenderId: `___________________________________`
- appId: `___________________________________`

## 4.3 Firebase CLI Login

Open Command Prompt or Terminal in your `MeadowviewKiosk` folder:

```bash
firebase login
```

**What happens:**
1. A browser window opens
2. Select your Google account (the one with Firebase access)
3. Click **"Allow"** to grant Firebase CLI access
4. Return to the terminal

**Expected Result:**
```
✔ Success! Logged in as yourname@gmail.com
```

## 4.4 Select Your Firebase Project

```bash
firebase use --add
```

**What happens:**
1. You see a list of your Firebase projects
2. Use arrow keys to select your project (e.g., `ward-kiosk-production`)
3. Press Enter
4. When asked for an alias, type: `production`
5. Press Enter

**Expected Result:**
```
✔ Added alias production for ward-kiosk-production
Now using alias production (ward-kiosk-production)
```

**Verification:**
```bash
firebase projects:list
```

You should see your project with `(current)` next to it.

## 4.5 Deploy Firestore Rules and Indexes

**Why**: Security rules protect your data. Indexes make queries fast.

```bash
firebase deploy --only firestore
```

**Expected Result:**
```
=== Deploying to 'ward-kiosk-production'...

i  deploying firestore
✔  firestore: released rules firestore.rules to cloud.firestore
✔  firestore: deployed indexes in firestore.indexes.json

✔  Deploy complete!
```

**Troubleshooting:**
- If you see an error about indexes, wait 2-3 minutes and retry (indexes take time to build)
- If you see permission errors, ensure you're logged into the correct Google account

## 4.6 Deploy Storage Rules

```bash
firebase deploy --only storage
```

**Expected Result:**
```
=== Deploying to 'ward-kiosk-production'...

i  deploying storage
✔  storage: released rules storage.rules

✔  Deploy complete!
```

## 4.7 Deploy Cloud Functions

First, install function dependencies:

```bash
cd functions
npm install
cd ..
```

**Expected Result:** You see packages being installed. This may take 1-2 minutes.

Now deploy the functions:

```bash
firebase deploy --only functions
```

**Expected Result:**
```
=== Deploying to 'ward-kiosk-production'...

i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X.XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 22 function api(us-central1)...
✔  functions[api(us-central1)]: Successful create operation.

✔  Deploy complete!

Function URL (api): https://us-central1-ward-kiosk-production.cloudfunctions.net/api
```

**IMPORTANT**: Copy the Function URL. You'll need it for configuration.

**Write it down:**
- Function URL: `https://us-central1-_____________________.cloudfunctions.net/api`

## 4.8 Configure CORS for Your Domain

The Cloud Functions include CORS (Cross-Origin Resource Sharing) restrictions. You must add your domain(s) to the allowed list.

**Edit the file:** `functions/index.js`

Find this section (around line 60-68):

```javascript
const allowedOrigins = [
  'https://kiosk.meadowviewward.com',  // Custom domain (primary)
  'https://meadowview-kiosk.web.app',
  // ... more origins
];
```

**Add your domain(s):**

```javascript
const allowedOrigins = [
  'https://kiosk.yourward.com',        // Your kiosk domain
  'https://temple.yourward.com',       // Your Temple 365 domain
  'https://upload.yourward.com',       // Your upload portal domain
  'https://your-project.web.app',      // Firebase default domain
  'https://your-project.firebaseapp.com',
  'http://localhost:5000',  // Development only
];
```

**After editing, redeploy:**

```bash
firebase deploy --only functions
```

---

# 5) Domain Setup (GoDaddy)

This section uses GoDaddy as an example, but the concepts apply to any DNS provider.

## 5.1 Understanding What We're Setting Up

We need three subdomains, each pointing to Firebase Hosting:

| Subdomain | Firebase Hosting Site | Purpose |
|-----------|----------------------|---------|
| kiosk.yourward.com | Default (or "kiosk") | Kiosk touchscreen |
| temple.yourward.com | temple | Phone PWA |
| upload.yourward.com | upload | Family uploads |

**Important**: Firebase Hosting uses a special Google address for all custom domains:
```
ghs.googlehosted.com
```

## 5.2 Add Custom Domain in Firebase Hosting

### For the Kiosk (Primary) Domain

1. Go to Firebase Console → Your Project
2. Click **"Build"** → **"Hosting"**
3. If this is your first time, click **"Get started"** and complete the setup wizard
4. Click **"Add custom domain"**
5. Enter: `kiosk.yourward.com` (replace with your actual domain)
6. Click **"Continue"**
7. Firebase will show you DNS records to add:
   - Type: **CNAME** (or A record for apex domain)
   - Host: **kiosk**
   - Points to: **ghs.googlehosted.com** (or IP addresses for A record)
8. **Keep this page open** - you'll need to verify after adding DNS records

### Repeat for Temple 365 and Upload Portal

Repeat the above steps for:
- `temple.yourward.com`
- `upload.yourward.com`

## 5.3 Configure DNS Records in GoDaddy

1. Log in to https://godaddy.com
2. Go to **"My Products"** → Find your domain → Click **"DNS"**
3. You'll see a list of existing DNS records

### Add CNAME Records

Click **"Add"** (or **"Add Record"**) and enter:

**Record 1 - Kiosk:**
| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | kiosk |
| Value | ghs.googlehosted.com |
| TTL | 1 Hour (or default) |

Click **Save**.

**Record 2 - Temple:**
| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | temple |
| Value | ghs.googlehosted.com |
| TTL | 1 Hour |

Click **Save**.

**Record 3 - Upload:**
| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | upload |
| Value | ghs.googlehosted.com |
| TTL | 1 Hour |

Click **Save**.

**Expected Result:** Your DNS records list shows three new CNAME entries.

## 5.4 Verify Domain Ownership in Firebase

1. Return to Firebase Console → Hosting
2. Wait 5-30 minutes for DNS to propagate
3. Click **"Verify"** next to each domain
4. If verification succeeds, status changes to **"Connected"**

**If verification fails:**
- DNS changes take up to 48 hours (usually 5-30 minutes)
- Double-check the CNAME value is exactly `ghs.googlehosted.com`
- Ensure there are no conflicting A records for the same subdomain

## 5.5 Verify SSL Certificate

Firebase automatically provisions SSL certificates for verified domains.

**Check SSL Status:**
1. In Firebase Console → Hosting → Custom domains
2. Look for **"Connected"** status (green checkmark)
3. SSL certificate is provisioned automatically (may take up to 24 hours)

**Test HTTPS:**
Open your browser and go to:
- `https://kiosk.yourward.com` (should load but may show "not configured" page)
- Check for the padlock icon in the address bar

**Troubleshooting "Not Secure" Warnings:**
- Wait longer for SSL certificate (up to 24 hours)
- Ensure domain shows "Connected" in Firebase Console
- Clear browser cache and retry
- If using older browser, update it

---

# 6) Initial Ward Bootstrap

This is the most critical section. You must create the correct database structure for your ward.

## 6.1 Choose a Ward ID

The **wardId** is a unique identifier for your ward. It's used throughout the database.

**Rules for choosing a wardId:**
- Use lowercase letters, numbers, and underscores only
- Make it descriptive but short
- Include location if you have multiple wards with similar names

**Good examples:**
- `meadowview_az` (Meadowview Ward, Arizona)
- `sunset_1st_ca` (Sunset 1st Ward, California)
- `alpine_ut` (Alpine Ward, Utah)

**Bad examples:**
- `Meadowview Ward` (has spaces and capitals)
- `ward1` (not descriptive)
- `my-ward` (hyphens not recommended)

**Write down your chosen wardId:** `_________________________`

## 6.2 Configure Firebase Initialization Files

You must update THREE files with your Firebase configuration:

### File 1: `js/firebase-init-kiosk.js` (Kiosk)

Open the file and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Replace with your apiKey
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",              // Replace with your projectId
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Replace with your actual values** (from Section 4.2).

### File 2: `apps/temple365/js/firebase-init.js` (Temple 365 PWA)

Open the file and replace with the same values.

### File 3: `apps/upload/js/firebase-init.js` (Upload Portal)

Open the file and replace with the same values.

## 6.3 Configure Ward-Specific Settings

### File 1: `config/config.js` (Kiosk Configuration)

Find the `ORGANIZATION` section (around line 200):

```javascript
ORGANIZATION: {
  NAME: "Meadowview Ward",           // Change to your ward name
  STAKE: "Gateway Stake",            // Change to your stake name
  WARD_ID: "wUdBrGwVvafFGZFyxvFm",  // ** CHANGE TO YOUR wardId **
  BULLETIN_URL: "https://app.wardbullet.com/channel/YOUR_ID",
  GREETING: "Touch Anywhere To Explore"
},
```

**Change `WARD_ID` to your chosen wardId** (e.g., `meadowview_az`).

### File 2: `apps/temple365/js/config.js` (Temple 365 Configuration)

```javascript
const TEMPLE365_CONFIG = {
  wardId: 'wUdBrGwVvafFGZFyxvFm',  // ** CHANGE TO YOUR wardId **
  apiBaseUrl: 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api',
  // ...
};
```

**Change:**
- `wardId` to your wardId
- `apiBaseUrl` to your Function URL (from Section 4.7)

### File 3: `apps/upload/js/config.js` (Upload Portal Configuration)

```javascript
const UPLOAD_CONFIG = {
  apiBaseUrl: 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api',
  wardId: 'meadowview',  // ** CHANGE TO YOUR wardId **
  // ...
};
```

**Change both values** to match your configuration.

## 6.4 Create Ward Document in Firestore

You need to create the ward's configuration document in Firestore.

### Option A: Using Firebase Console (Manual)

1. Go to Firebase Console → Firestore Database
2. Click **"+ Start collection"**
3. Collection ID: `wards`
4. Click **"Next"**
5. Document ID: Enter your wardId (e.g., `meadowview_az`)
6. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| name | string | Meadowview 1st Ward |
| templeAffiliation | string | Bountiful Utah Temple |
| timezone | string | America/Denver |
| goalSquares | number | 365 |
| celebrationAutoDismissMs | number | 2000 |
| createdAt | timestamp | (click timestamp, select current time) |
| updatedAt | timestamp | (click timestamp, select current time) |

7. Add nested object `uploadLimits`:
   - Click **"+"** next to Document, select "Map"
   - Name: `uploadLimits`
   - Add fields inside:
     - `maxBytes` (number): 10485760
     - `maxFilesPerDay` (number): 100

8. Add nested object `baseUrls`:
   - `kioskBaseUrl` (string): https://kiosk.yourward.com
   - `templeBaseUrl` (string): https://temple.yourward.com
   - `uploadBaseUrl` (string): https://upload.yourward.com

9. Click **"Save"**

### Option B: Using Seed Script (Recommended)

The seed script automates ward creation. First, you need a service account key.

**Get Service Account Key:**
1. Go to Firebase Console → Project Settings (gear icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"**
5. A JSON file downloads. Save it in `firestore/seed-data/` as `service-account-key.json`

> ⚠️ **SECURITY WARNING**: Never commit `service-account-key.json` to Git. Add it to `.gitignore`.

**Run the Seed Script:**

```bash
cd firestore/seed-data
npm install firebase-admin  # Install if not already installed
```

Edit `temple-squares-seed.js`:
- Update `wardId` variable to your wardId
- Update `wardConfig` object with your ward information

Then run:
```bash
node temple-squares-seed.js YOUR_WARD_ID --init
```

**Expected Result:**
```
[Seed] Initializing complete ward structure: meadowview_az
[Seed] ✅ Ward configuration created
[Seed] ✅ Ward stats initialized
[Seed] Initializing 365 temple squares for ward: meadowview_az
[Seed] Committing 1 batch(es)...
[Seed] Batch 1/1 committed
[Seed] ✅ Successfully created 365 temple squares for meadowview_az
[Seed] ✅ Ward meadowview_az fully initialized!

✅ Seed operation completed successfully!
```

## 6.5 Create Stats Subcollection

If using Option A (manual), create the stats document:

1. In Firestore Console, navigate to: `wards` → your wardId
2. Click **"+ Start collection"** (inside the ward document)
3. Collection ID: `stats`
4. Document ID: `current`
5. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| totalVisits | number | 0 |
| totalBonusVisits | number | 0 |
| totalSelfies | number | 0 |
| squaresFilled | number | 0 |
| goalMetAt | null | (leave empty/null) |
| lastVisitAt | null | (leave empty/null) |
| updatedAt | timestamp | (current time) |

6. Click **"Save"**

## 6.6 Create 365 Temple Squares

If using Option A (manual), you must create 365 documents. **Use the seed script instead** (Option B) - manually creating 365 documents is extremely tedious.

The seed script creates documents numbered "1" through "365" in the `templeSquares` subcollection, each with:
- `squareNumber`: 1-365
- `claimed`: false
- `claimedAt`: null
- `claimedByName`: null

## 6.7 Add Missionaries (Optional)

To add missionaries to the ward:

Edit `firestore/seed-data/missionaries-seed.js`:
1. Update `projectId` to your Firebase project ID
2. Update `wardId` to your wardId
3. Update the `missionaries` array with your missionary information

```javascript
const missionaries = [
  {
    id: 1,
    name: "Sister Kylie Gorecki",
    mission: "Poland Warsaw Mission",
    language: "Polish",
    scripture: "2 Nephi 2:25",
    photoUrl: "gs://your-bucket/wards/your-wardId/missionaries/photos/kylie-profile.jpg",
    homeLocation: "Bountiful, UT",
    displayOrder: 1,
    active: true
  },
  // Add more missionaries...
];
```

Run the script:
```bash
node missionaries-seed.js
```

**Expected Result:**
```
=============================================================
MISSIONARY SEED SCRIPT (Phase 7)
=============================================================

Project ID: ward-kiosk-production
Ward ID: meadowview_az
Missionaries to seed: 14

✓ All missionaries validated

Starting seed...

✓ Created: Sister Kylie Gorecki (ID: 1)
  Upload Token: a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  Upload URL: /upload?token=a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6
...

✓ All missionaries seeded successfully!
```

**IMPORTANT**: Save the upload tokens! These are needed for missionary families to upload photos.

## 6.8 Firestore Verification Checklist

Before proceeding, verify your database structure in Firebase Console:

| Path | Check | Required Fields |
|------|-------|-----------------|
| ☐ | `wards/{wardId}` exists | name, goalSquares, timezone |
| ☐ | `wards/{wardId}/stats/current` exists | totalVisits, squaresFilled |
| ☐ | `wards/{wardId}/templeSquares` has 365 docs | squareNumber, claimed |
| ☐ | `wards/{wardId}/missionaries` exists (if added) | name, mission, uploadToken |

---

# 7) Kiosk Deployment

## 7.1 Files for Kiosk Hosting

The kiosk app consists of these files from the repository root:

```
index.html                 # Main entry point
css/
  styles.css
  kiosk-layout.css
js/
  app.js
  firebase-init-kiosk.js   # (already configured in Section 6)
  screensaver.js
  homeScreen.js
  selfieCapture.js
  missionarySpotlight.js
  missionaryGallery.js
  missionaryDetail.js
  missionaryVideoRecorder.js
  floatingQR.js
  views.js
  apiClient.js
  configLoader.js
  temple365Video.js
  phase2Placeholders.js
config/
  config.js                # (already configured in Section 6)
assets/
  temple_photos/           # Screensaver images
  icons/                   # UI icons
  videos/                  # President Nelson video
apps/
  temple365/               # Embedded as iframe
  upload/                  # Upload portal
```

## 7.2 Deploy to Firebase Hosting

From the repository root:

```bash
firebase deploy --only hosting
```

**Expected Result:**
```
=== Deploying to 'ward-kiosk-production'...

i  deploying hosting
i  hosting: preparing . directory for upload...
✔  hosting: 127 files uploaded successfully

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ward-kiosk-production/overview
Hosting URL: https://ward-kiosk-production.web.app
```

**Verification:**
Open https://your-project.web.app in a browser. You should see the kiosk screensaver.

## 7.3 Windows 10 Pro Kiosk Mode Setup

### Hardware Requirements
- Windows 10 Pro computer (e.g., Lenovo ThinkCentre M700 Tiny)
- Touch monitor (e.g., Lenovo Tiny-in-One 24")
- Webcam (for selfies)
- Stable internet connection

### Step 1: Create a Kiosk User Account

1. Open **Settings** → **Accounts** → **Other users**
2. Click **"Add someone else to this PC"**
3. Click **"I don't have this person's sign-in information"**
4. Click **"Add a user without a Microsoft account"**
5. Username: `KioskUser`
6. Password: (choose a simple password or leave blank)
7. Click **Next**

### Step 2: Configure Assigned Access (Kiosk Mode)

1. Open **Settings** → **Accounts** → **Family & other users**
2. Scroll down to **"Set up assigned access"**
3. Click **"Assigned access"**
4. Click **"Choose an app"** under the KioskUser account
5. Select **"Microsoft Edge"**
6. In the Edge settings that appear:
   - Enter URL: `https://kiosk.yourward.com`
   - Select **"As a digital sign or interactive display"**

### Step 3: Configure Edge Kiosk Settings

Edge in kiosk mode needs additional configuration:

1. Sign in as KioskUser
2. Edge should open automatically to your kiosk URL
3. Edge will be in fullscreen mode without address bar

### Step 4: Enable Touch Keyboard

For Temple 365 name entry, you need the on-screen keyboard:

1. Open **Settings** → **Ease of Access** → **Keyboard**
2. Turn ON **"Use the On-Screen Keyboard"**
3. Alternatively, configure Edge to show keyboard for input fields

### Step 5: Auto-Login Setup

1. Press **Win + R**, type `netplwiz`, press Enter
2. Select the KioskUser account
3. Uncheck **"Users must enter a user name and password..."**
4. Click **OK**
5. Enter the KioskUser password twice
6. Click **OK**

The computer will now boot directly into kiosk mode.

## 7.4 Touch-Only Verification Checklist

Test these features with touch only (no mouse or keyboard):

| Feature | Test | Expected Result |
|---------|------|-----------------|
| ☐ Screensaver | Touch anywhere | Home screen appears |
| ☐ Temple 365 | Touch Temple 365 button | Iframe loads grid |
| ☐ Temple 365 grid | Touch unclaimed square | Modal opens |
| ☐ Name entry | Touch input field | On-screen keyboard appears |
| ☐ Name capitalization | Type "john smith" | Shows "John Smith" |
| ☐ Save visit | Touch Save Visit | Confetti, square fills |
| ☐ Back button | Touch "← Back to Home" | Returns to home |
| ☐ Selfie | Touch Take a Selfie | Camera preview shows |
| ☐ Selfie capture | Touch Take Selfie button | Countdown, capture |
| ☐ Selfie confirm | Touch Yes | Shows "Saved!" message |
| ☐ Missionaries | Touch Missionaries | Grid of missionaries |
| ☐ Missionary detail | Touch a missionary card | Detail view opens |
| ☐ Gallery | Touch gallery photo | Fullscreen view |
| ☐ Gallery swipe | Swipe left/right | Next/previous photo |
| ☐ Inactivity | Wait 60 seconds | Returns to screensaver |

## 7.5 End-to-End Kiosk Test Plan

### Test 1: Complete Temple Visit Flow

1. Start at screensaver
2. Touch screen → Home appears
3. Touch **Temple 365** → Iframe loads
4. Verify grid shows 365 squares (most unclaimed)
5. Touch an unclaimed square → Modal opens
6. Touch name field → Keyboard appears
7. Type your name (verify auto-capitalization)
8. Touch **Save Visit**
9. Verify:
   - Confetti animation plays
   - Toast message appears
   - Toast auto-dismisses after 2 seconds
   - Square now shows as claimed
   - Stats update (Squares Filled increases)
10. Touch **← Back to Home**

### Test 2: Selfie-Only Upload

1. From Home, touch **Take a Selfie**
2. Verify camera preview shows
3. Touch **Take Selfie**
4. Verify countdown (3, 2, 1)
5. Photo captures
6. Touch **Yes** to confirm
7. Verify "Saved!" message appears
8. Check Firebase Console → Storage → wards/{wardId}/selfies/
   - New file should appear

### Test 3: Bonus Visit (After 365)

1. In Firebase Console, manually set `stats/current.squaresFilled` to 365
2. In kiosk, go to Temple 365
3. Verify "Log Another Visit" button appears
4. Touch button → Name entry appears
5. Enter name, save
6. Verify visit is recorded (check visits collection)
7. Reset `squaresFilled` to actual count when done testing

---

# 8) Temple 365 Phone PWA Deployment

## 8.1 Files for Temple 365 Hosting

The Temple 365 PWA is located in `apps/temple365/`:

```
apps/temple365/
├── index.html
├── manifest.webmanifest    # PWA configuration
├── sw.js                   # Service worker (offline support)
├── css/
│   ├── styles.css
│   ├── grid.css
│   └── keyboard.css
├── js/
│   ├── config.js           # (already configured)
│   ├── firebase-init.js    # (already configured)
│   ├── api.js
│   ├── app.js
│   ├── grid.js
│   ├── modal.js
│   ├── celebration.js
│   └── keyboard.js
└── icons/                   # PWA icons (MUST CREATE)
    ├── icon-192.png
    └── icon-512.png
```

## 8.2 Create PWA Icons

The `icons/` folder needs to contain PWA icons. Create these images:

1. Create a 192x192 PNG image with your ward logo or temple icon
2. Save as `apps/temple365/icons/icon-192.png`
3. Create a 512x512 version
4. Save as `apps/temple365/icons/icon-512.png`

**Quick Option:** Use any square image and resize with an online tool like:
- https://www.iloveimg.com/resize-image

## 8.3 PWA Requirements

The following are already configured in the repository:

### manifest.webmanifest

```json
{
  "name": "Temple 365",
  "short_name": "Temple365",
  "description": "Track your temple visits throughout the year",
  "start_url": "/apps/temple365/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker (sw.js)

Already configured for:
- Caching app shell for offline use
- Network-first strategy with cache fallback
- Automatic cache updates

## 8.4 Deploy Temple 365

Temple 365 deploys as part of the main hosting deployment:

```bash
firebase deploy --only hosting
```

**Verification:**
Open https://your-project.web.app/apps/temple365/ in a browser.

## 8.5 Custom Domain for Temple 365

If you want `temple.yourward.com` to point directly to Temple 365:

### Option A: Subdirectory Access (Simplest)

Access via: `https://kiosk.yourward.com/apps/temple365/`

No additional configuration needed.

### Option B: Separate Hosting Site (Advanced)

1. In Firebase Console → Hosting
2. Click **"Add another site"**
3. Site ID: `temple-yourward`
4. Update `firebase.json` to use multi-site hosting:

```json
{
  "hosting": [
    {
      "site": "ward-kiosk-production",
      "public": ".",
      "ignore": ["functions", "firestore", "backend", "docs", "**/.*", "**/node_modules/**"]
    },
    {
      "site": "temple-yourward",
      "public": "apps/temple365",
      "ignore": ["**/node_modules/**"]
    }
  ]
}
```

5. Deploy: `firebase deploy --only hosting:temple-yourward`
6. Add custom domain `temple.yourward.com` to this site

## 8.6 Installing on iPhone

1. Open Safari (Chrome won't work for PWA install on iOS)
2. Navigate to `https://temple.yourward.com` (or your Temple 365 URL)
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Edit the name if desired (default: "Temple 365")
6. Tap **Add**

**Expected Result:** A Temple 365 icon appears on the home screen. Tapping it opens the app in standalone mode (no Safari UI).

## 8.7 Installing on Android

1. Open Chrome
2. Navigate to your Temple 365 URL
3. Chrome should show a banner: **"Add Temple 365 to Home screen"**
4. Tap **Add**
5. Confirm by tapping **Add** again

**Alternative method:**
1. Tap the three-dot menu in Chrome
2. Select **"Add to Home screen"**
3. Tap **Add**

## 8.8 Phone and Kiosk Sync

The phone PWA and kiosk stay synchronized because:

1. **Same wardId**: Both apps use the same `wardId` in their configuration
2. **Same Firestore database**: Both read from `wards/{wardId}/templeSquares`
3. **Real-time sync**: Firestore's `onSnapshot` provides live updates
4. **Same Cloud Functions**: Both call the same API endpoint for logging visits

**How sync works:**
- When a member logs a visit on their phone, the Firestore document updates
- The kiosk's `onSnapshot` listener receives the update within seconds
- The kiosk grid refreshes automatically
- Vice versa for visits logged at the kiosk

---

# 9) Missionary Upload Portal Deployment

## 9.1 Files for Upload Portal

Located in `apps/upload/`:

```
apps/upload/
├── index.html
├── css/
│   └── upload.css
└── js/
    ├── config.js           # (already configured)
    ├── firebase-init.js    # (already configured)
    └── upload.js
```

## 9.2 How Secret Links Work

Each missionary has a unique 32-character upload token generated when you run the seed script:

```
Upload Token: a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Upload URL: /upload?token=a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Full URL example:**
```
https://upload.yourward.com/apps/upload/?token=a7b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

When a family member visits this URL:
1. The token is automatically filled in
2. The system validates the token against Firestore
3. If valid, the missionary's name is shown
4. Family can upload photos and videos

**Token Security:**
- Tokens are stored in Firestore under `missionaries/{missionaryId}.uploadToken`
- Tokens are validated by Cloud Functions before allowing uploads
- No login required—token IS the authentication

## 9.3 Sharing Upload Links with Families

After running the missionary seed script, you'll have upload tokens for each missionary.

**How to share:**
1. Copy the full upload URL for each missionary
2. Send via email or text to the missionary's family
3. Include instructions:

> **Subject: Upload Photos for [Missionary Name]**
>
> You can now upload photos and videos to support [Missionary Name]!
>
> Click this link: [Upload URL]
>
> Instructions:
> 1. Click the link above
> 2. Your missionary's name will appear
> 3. Click or tap to select photos/videos
> 4. Click "Upload Files"
> 5. Photos will appear in the ward kiosk gallery
>
> Tips:
> - Maximum file size: 100MB
> - Supported formats: JPG, PNG, HEIC, MP4, MOV
> - No account or login required

## 9.4 Rotating Leaked Tokens

If a token is shared publicly or compromised:

1. Open Firebase Console → Firestore
2. Navigate to: `wards/{wardId}/missionaries/{missionaryId}`
3. Edit the `uploadToken` field
4. Generate a new token:
   - In Node.js: `require('crypto').randomBytes(24).toString('base64').replace(/[+/=]/g, '')`
   - Or use any random string generator (32 characters)
5. Save the new token
6. Share the new upload URL with the family
7. Old links will stop working immediately

## 9.5 Test Upload Flow

1. Open the upload portal URL with a valid token
2. Verify missionary name appears
3. Click/drag to add a photo
4. Click **Upload Files**
5. Verify success message
6. Check Cloud Storage:
   - Firebase Console → Storage
   - Navigate to: `wards/{wardId}/missionaries/gallery/{missionaryId}/`
   - Verify file appears
7. Check Firestore:
   - Navigate to: `wards/{wardId}/missionaries/{missionaryId}/gallery/`
   - Verify document was created with file metadata
8. On kiosk:
   - Go to Missionaries → Select the missionary → Gallery
   - Verify uploaded photo appears (newest first)

## 9.6 Upload Limits

| Type | Limit | Notes |
|------|-------|-------|
| File size | 100MB | Per file (spec decision #10) |
| Video duration | No limit | For family uploads |
| Kiosk video | 30 seconds | Hard cap with visible timer |
| File types | image/*, video/* | JPG, PNG, HEIC, MP4, MOV, AVI |

---

# 10) Multiple Wards Onboarding

## 10.1 Architecture for Multi-Ward

All wards share ONE Firebase project but are isolated by `wardId`:

```
Firebase Project: ward-kiosk-production
│
├── Firestore Database
│   └── wards/
│       ├── meadowview_az/     (Ward 1)
│       │   ├── stats/
│       │   ├── templeSquares/
│       │   └── missionaries/
│       │
│       ├── sunset_ca/         (Ward 2)
│       │   ├── stats/
│       │   ├── templeSquares/
│       │   └── missionaries/
│       │
│       └── alpine_ut/         (Ward 3)
│           └── ...
│
├── Cloud Storage
│   └── wards/
│       ├── meadowview_az/
│       ├── sunset_ca/
│       └── alpine_ut/
│
└── Cloud Functions
    └── api (shared by all wards)
```

## 10.2 Adding a New Ward - Complete Process

### Step 1: Choose wardId and Domain

| Decision | Example |
|----------|---------|
| wardId | `newward_state` (e.g., `hillcrest_ut`) |
| Domain | hillcrestward.com |
| Kiosk URL | kiosk.hillcrestward.com |
| Temple URL | temple.hillcrestward.com |
| Upload URL | upload.hillcrestward.com |

### Step 2: DNS Configuration

In GoDaddy (or your DNS provider):
1. Add CNAME: `kiosk` → `ghs.googlehosted.com`
2. Add CNAME: `temple` → `ghs.googlehosted.com`
3. Add CNAME: `upload` → `ghs.googlehosted.com`

### Step 3: Firebase Hosting Custom Domains

In Firebase Console → Hosting:
1. Add custom domain: `kiosk.hillcrestward.com`
2. Add custom domain: `temple.hillcrestward.com`
3. Add custom domain: `upload.hillcrestward.com`
4. Wait for verification and SSL

### Step 4: Create Ward in Firestore

**Option A: Use seed script (recommended)**

```bash
cd firestore/seed-data

# Edit temple-squares-seed.js:
# - wardId = 'hillcrest_ut'
# - Update wardConfig with ward info

node temple-squares-seed.js hillcrest_ut --init
```

**Option B: Manual in Firebase Console**
(Follow Section 6.4-6.6)

### Step 5: Add Missionaries (Optional)

```bash
# Edit missionaries-seed.js with new ward's missionaries
node missionaries-seed.js
```

### Step 6: Create Ward-Specific Configuration Files

For each new ward, you need ward-specific config files. The cleanest approach:

1. Copy the entire repository to a new folder for the new ward
2. Update configuration files with the new wardId
3. Deploy to Firebase Hosting

**Files to update for new ward:**
- `config/config.js` → WARD_ID, NAME, STAKE
- `apps/temple365/js/config.js` → wardId
- `apps/upload/js/config.js` → wardId
- All three `firebase-init*.js` files (if using different Firebase project)

### Step 7: Deploy New Ward

```bash
firebase deploy --only hosting
```

### Step 8: Update Cloud Functions CORS

Add new ward's domains to `functions/index.js`:

```javascript
const allowedOrigins = [
  // Existing wards...
  'https://kiosk.hillcrestward.com',
  'https://temple.hillcrestward.com',
  'https://upload.hillcrestward.com',
];
```

Redeploy functions:
```bash
firebase deploy --only functions
```

### Step 9: Verify New Ward

Run the complete verification checklist (Section 7.4 and 7.5).

## 10.3 Printable New Ward Checklist

```
╔══════════════════════════════════════════════════════════════════════╗
║                    NEW WARD ONBOARDING CHECKLIST                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Ward Name: _____________________________                            ║
║  wardId: ________________________________                            ║
║  Domain: ________________________________                            ║
║  Date: __________________________________                            ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  DOMAIN & DNS                                                        ║
║  ☐ Domain purchased                                                  ║
║  ☐ CNAME: kiosk → ghs.googlehosted.com                              ║
║  ☐ CNAME: temple → ghs.googlehosted.com                             ║
║  ☐ CNAME: upload → ghs.googlehosted.com                             ║
║                                                                      ║
║  FIREBASE HOSTING                                                    ║
║  ☐ Custom domain added: kiosk.______.com                            ║
║  ☐ Custom domain added: temple.______.com                           ║
║  ☐ Custom domain added: upload.______.com                           ║
║  ☐ All domains show "Connected" status                              ║
║  ☐ SSL certificates active                                          ║
║                                                                      ║
║  FIRESTORE DATABASE                                                  ║
║  ☐ wards/{wardId} document created                                  ║
║  ☐ wards/{wardId}/stats/current initialized                         ║
║  ☐ wards/{wardId}/templeSquares has 365 docs                        ║
║  ☐ wards/{wardId}/missionaries created (if applicable)              ║
║                                                                      ║
║  CONFIGURATION FILES                                                 ║
║  ☐ config/config.js updated with wardId                             ║
║  ☐ apps/temple365/js/config.js updated                              ║
║  ☐ apps/upload/js/config.js updated                                 ║
║  ☐ All firebase-init.js files have Firebase config                  ║
║                                                                      ║
║  CLOUD FUNCTIONS                                                     ║
║  ☐ CORS origins updated in functions/index.js                       ║
║  ☐ Functions redeployed                                             ║
║                                                                      ║
║  DEPLOYMENT                                                          ║
║  ☐ firebase deploy --only hosting completed                         ║
║  ☐ Kiosk loads at https://kiosk.______.com                          ║
║  ☐ Temple 365 loads at https://temple.______.com                    ║
║  ☐ Upload portal loads at https://upload.______.com                 ║
║                                                                      ║
║  VERIFICATION                                                        ║
║  ☐ Temple visit logged successfully                                 ║
║  ☐ Selfie captured and uploaded                                     ║
║  ☐ Missionary gallery displays                                      ║
║  ☐ Upload portal accepts photos with valid token                    ║
║                                                                      ║
║  HANDOFF                                                             ║
║  ☐ Upload tokens shared with missionary families                    ║
║  ☐ Ward administrator trained                                       ║
║  ☐ Documentation provided                                           ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

# 11) Troubleshooting

## 11.1 Temple 365 Loads But No Grid

**Symptoms:**
- Page loads but shows "Loading..." forever
- Grid container is empty
- Console shows errors

**Causes & Fixes:**

| Cause | How to Check | Fix |
|-------|--------------|-----|
| Wrong wardId | Check `apps/temple365/js/config.js` | Update wardId to match Firestore |
| templeSquares missing | Firestore Console → Check collection | Run seed script |
| Firebase config wrong | Browser console errors | Verify firebase-init.js values |
| CORS blocking | Console shows CORS error | Add domain to functions/index.js |

**Debug Steps:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

## 11.2 Firestore Permission Errors

**Symptoms:**
- Console shows: "Missing or insufficient permissions"
- Data doesn't load or save

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Rules not deployed | `firebase deploy --only firestore:rules` |
| Wrong project selected | `firebase use production` |
| Indexes not built | Wait 5 minutes, check Console → Firestore → Indexes |

**Verify Rules:**
```bash
firebase deploy --only firestore:rules
```

## 11.3 API Fetch / CORS Errors

**Symptoms:**
- Console shows: "Access to fetch at ... has been blocked by CORS"
- Temple visits don't save

**Fix:**
1. Open `functions/index.js`
2. Add your domain to `allowedOrigins` array
3. Redeploy: `firebase deploy --only functions`

**Example:**
```javascript
const allowedOrigins = [
  'https://kiosk.yourward.com',  // Add this
  // ... other origins
];
```

## 11.4 Missing Squares

**Symptoms:**
- Grid shows fewer than 365 squares
- Some square numbers missing

**Fix:**
Re-run the seed script:
```bash
cd firestore/seed-data
node temple-squares-seed.js YOUR_WARD_ID
```

This adds any missing squares without affecting existing ones.

## 11.5 Missionaries Not Showing

**Symptoms:**
- Missionary grid is empty
- "No missionaries found" message

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| No missionaries seeded | Run missionaries-seed.js |
| Wrong wardId | Check config.js wardId matches Firestore |
| All missionaries inactive | Set `active: true` in Firestore |
| displayOrder missing | Add displayOrder field to each missionary |

## 11.6 Upload Failures

**Symptoms:**
- "Upload failed" error
- Files don't appear in Storage

**Causes & Fixes:**

| Cause | How to Check | Fix |
|-------|--------------|-----|
| Invalid token | Try token in Firestore query | Verify token exists in missionary doc |
| Storage rules | Check storage.rules deployed | `firebase deploy --only storage` |
| File too large | Check file size | Must be under 100MB |
| CORS on upload URL | Console errors | Ensure signed URL is fresh |

## 11.7 Camera Permission Issues

**Symptoms:**
- Camera doesn't activate
- Black screen in selfie view
- Browser asks for permission but nothing happens

**Fixes:**

**On Windows Kiosk:**
1. Open Windows Settings → Privacy → Camera
2. Ensure "Allow apps to access camera" is ON
3. Ensure browser (Edge) has camera permission

**On Phones:**
1. When prompted, tap "Allow"
2. If denied previously: Settings → Safari/Chrome → Camera → Allow

**Check HTTPS:**
Camera only works over HTTPS. Verify URL uses `https://`.

## 11.8 SSL / Mixed Content Warnings

**Symptoms:**
- Browser shows "Not Secure" warning
- Some resources blocked
- Images don't load

**Fixes:**

| Issue | Fix |
|-------|-----|
| SSL not provisioned | Wait up to 24 hours after domain verification |
| Mixed content | Ensure ALL URLs in code use https:// |
| Domain not connected | Check Firebase Hosting → Custom domains |

**Force HTTPS:**
All URLs in config files should use `https://`, never `http://`.

---

# 12) Appendix

## 12.1 Complete Configuration Values

### Firebase Project Settings
| Value | Location | Example |
|-------|----------|---------|
| Project ID | Firebase Console | ward-kiosk-production |
| API Key | Project Settings | AIzaSy... |
| Auth Domain | Project Settings | ward-kiosk-production.firebaseapp.com |
| Storage Bucket | Project Settings | ward-kiosk-production.appspot.com |
| Messaging Sender ID | Project Settings | 123456789 |
| App ID | Project Settings | 1:123456789:web:abc123 |
| Functions URL | After function deploy | https://us-central1-ward-kiosk-production.cloudfunctions.net/api |

### Configuration Files
| File | Key Values |
|------|------------|
| `config/config.js` | WARD_ID, NAME, STAKE, BULLETIN_URL |
| `apps/temple365/js/config.js` | wardId, apiBaseUrl |
| `apps/upload/js/config.js` | apiBaseUrl, wardId |
| `js/firebase-init-kiosk.js` | All Firebase config values |
| `apps/temple365/js/firebase-init.js` | All Firebase config values |
| `apps/upload/js/firebase-init.js` | All Firebase config values |
| `functions/index.js` | allowedOrigins (CORS) |

### Firestore Paths
| Path | Purpose |
|------|---------|
| `wards/{wardId}` | Ward configuration |
| `wards/{wardId}/stats/current` | Visit statistics |
| `wards/{wardId}/templeSquares/{1-365}` | Grid squares |
| `wards/{wardId}/visits/{visitId}` | Visit log |
| `wards/{wardId}/selfies/{selfieId}` | Selfie metadata |
| `wards/{wardId}/missionaries/{id}` | Missionary data |
| `wards/{wardId}/missionaries/{id}/gallery/{photoId}` | Gallery photos |

### Cloud Storage Paths
| Path | Purpose |
|------|---------|
| `wards/{wardId}/selfies/` | Kiosk selfies |
| `wards/{wardId}/missionaries/photos/` | Profile photos |
| `wards/{wardId}/missionaries/gallery/{missionaryId}/` | Family uploads |
| `wards/{wardId}/missionaries/videos/{missionaryId}/` | Kiosk video messages |

## 12.2 Command Cheat Sheet

```bash
# Firebase CLI Login
firebase login

# Select project
firebase use production

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage

# View function logs
firebase functions:log

# Run local emulator
firebase emulators:start

# List projects
firebase projects:list

# Seed ward data
cd firestore/seed-data
node temple-squares-seed.js WARD_ID --init
node missionaries-seed.js
```

## 12.3 Locked Behavioral Rules

These behaviors are locked in the specification and MUST NOT be changed:

| Rule | Description |
|------|-------------|
| 365 fixed squares | Goal is always 365 squares |
| Bonus visits forever | After 365, visits continue as bonus |
| Bonus via button only | "Log Another Visit" button triggers bonus |
| Confetti on success | Every successful visit shows confetti |
| 2-second auto-dismiss | Toast dismisses after 2000ms |
| Auto-assign collision | Server assigns next available square |
| Capitalize names | First letter of each word capitalized |
| Selfies never linked | Selfies are independent of visits |
| No missionary login | Token-based upload, no accounts |
| Auto-publish uploads | Family uploads immediately visible |
| 100MB upload limit | Max file size for family uploads |
| 30-second kiosk video | Hard cap with visible timer |
| Newest first gallery | Gallery sorts by createdAt descending |
| Scroll doesn't open | Scrolling grid doesn't open cards |
| Height-fit screensaver | Images fit by height, no cropping |
| In-app keyboard required | Touch keyboard for name entry |

---

# 13) Quickstart & Checklists

## A) One-Page Quickstart Checklist

```
═══════════════════════════════════════════════════════════════════════
                     WARD KIOSK V1 - QUICKSTART
═══════════════════════════════════════════════════════════════════════

BEFORE YOU START
☐ Node.js installed (node --version shows v18+)
☐ Firebase CLI installed (firebase --version shows 12+)
☐ Git installed (git --version shows 2.30+)
☐ GoDaddy account access
☐ Google account for Firebase

STEP 1: FIREBASE PROJECT (30 min)
☐ Create project at console.firebase.google.com
☐ Enable Firestore Database
☐ Enable Cloud Storage
☐ Register web app, copy firebaseConfig

STEP 2: REPOSITORY (15 min)
☐ git clone [repository URL]
☐ cd MeadowviewKiosk

STEP 3: CONFIGURE FILES (20 min)
☐ Edit js/firebase-init-kiosk.js with Firebase config
☐ Edit apps/temple365/js/firebase-init.js
☐ Edit apps/upload/js/firebase-init.js
☐ Edit config/config.js with your wardId
☐ Edit apps/temple365/js/config.js
☐ Edit apps/upload/js/config.js

STEP 4: FIREBASE CLI (10 min)
☐ firebase login
☐ firebase use --add (select project, alias: production)

STEP 5: DEPLOY FIREBASE (20 min)
☐ firebase deploy --only firestore
☐ firebase deploy --only storage
☐ cd functions && npm install && cd ..
☐ firebase deploy --only functions
☐ Note the Functions URL

STEP 6: SEED DATABASE (15 min)
☐ cd firestore/seed-data
☐ Download service account key → service-account-key.json
☐ npm install firebase-admin
☐ Edit temple-squares-seed.js with your config
☐ node temple-squares-seed.js YOUR_WARD_ID --init
☐ (Optional) Edit and run missionaries-seed.js

STEP 7: DNS (15 min + wait time)
☐ GoDaddy: Add CNAME kiosk → ghs.googlehosted.com
☐ GoDaddy: Add CNAME temple → ghs.googlehosted.com
☐ GoDaddy: Add CNAME upload → ghs.googlehosted.com
☐ Firebase Hosting: Add custom domains
☐ Wait for verification (5-30 min)

STEP 8: DEPLOY HOSTING (10 min)
☐ firebase deploy --only hosting
☐ Verify: https://kiosk.yourward.com loads

STEP 9: UPDATE CORS (5 min)
☐ Edit functions/index.js allowedOrigins
☐ firebase deploy --only functions

STEP 10: TEST (30 min)
☐ Log a temple visit
☐ Take a selfie
☐ View missionaries
☐ Test upload portal

TOTAL TIME: ~3 hours (plus DNS propagation)
═══════════════════════════════════════════════════════════════════════
```

## B) Multi-Ward Onboarding Checklist

(See Section 10.3 for full printable checklist)

## C) Final Spec Compliance Checklist

```
═══════════════════════════════════════════════════════════════════════
                    SPEC COMPLIANCE VERIFICATION
═══════════════════════════════════════════════════════════════════════

TEMPLE 365 CORE
☐ 365 fixed squares (not configurable)
☐ Squares numbered 1-365
☐ Each square shows claimed/unclaimed state
☐ Claimed squares show visitor name
☐ Real-time sync between phone and kiosk

VISIT LOGGING
☐ Name entry capitalizes first letter of each word
☐ Collision auto-assigns next available square
☐ Confetti animation on success
☐ Toast auto-dismisses after 2 seconds
☐ Visit logged to Firestore

BONUS VISITS
☐ "Log Another Visit" button appears after 365 filled
☐ Button is the ONLY way to start a bonus visit
☐ Bonus visits increment totalBonusVisits
☐ Bonus visits do NOT assign squares

SELFIE MOSAIC
☐ Selfies capture from webcam
☐ Countdown before capture
☐ Confirmation prompt (Yes/No)
☐ Upload to Cloud Storage
☐ Selfies are NEVER linked to visits

MISSIONARIES
☐ Grid displays all active missionaries
☐ Missionary detail shows info + gallery
☐ Gallery shows newest first
☐ Family uploads via token links
☐ Uploads auto-publish (no approval needed)
☐ Videos: 100MB max for family, 30-sec max for kiosk

KIOSK UX
☐ Screensaver with rotating temple photos
☐ Images fit by height (no cropping)
☐ Touch anywhere exits screensaver
☐ Inactivity returns to screensaver (60 sec)
☐ On-screen keyboard for text entry
☐ Scroll does NOT open cards
☐ Back buttons work correctly

ARCHITECTURE
☐ Single Firebase project for all wards
☐ Ward isolation via wardId
☐ No user login required
☐ Public read access for Temple 365
☐ Writes via Cloud Functions only

═══════════════════════════════════════════════════════════════════════
                           COMPLIANCE: ☐ ALL ITEMS VERIFIED
═══════════════════════════════════════════════════════════════════════
```

---

# Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 2024 | Initial complete guide |

---

**END OF GUIDE**

*This guide is maintained as part of the Ward Kiosk repository. For updates, check the repository for newer versions of this file.*
