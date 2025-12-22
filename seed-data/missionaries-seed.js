/**
 * Missionaries Seed Script
 * Seeds missionaries under: wards/{wardId}/missionaries/{docId}
 * Generates upload tokens for each missionary (used by families to upload media)
 *
 * Run:
 *   node missionaries-seed.js
 */

const admin = require("firebase-admin");
const path = require("path");
const crypto = require("crypto");

// ---- CONFIG YOU MUST SET ----
const PROJECT_ID = "ward-kiosk-test"; // e.g. "ward-kiosk-production"
const WARD_ID = "meadowview_az";

// If your app expects a specific Cloud Storage bucket, set it here.
// If you don't know, leave null. photoUrl can be "" for now.
const STORAGE_BUCKET = null; // e.g. "ward-kiosk-production.appspot.com"

// ---- MISSIONARIES TO SEED (EDIT THESE) ----
const missionaries = [
  {
    id: 15,
    name: "Sister Kylie Gorecki",
    mission: "Poland Warsaw Mission",
    language: "Polish",
    scripture: "2 Nephi 2:25",
    photoUrl: "", // optional for now (you can update later)
    homeLocation: "Bountiful, UT",
    displayOrder: 1,
    active: true,
  },
  {
    id: 1,
    name: "Elder & Sister Eberhard",
    mission: "Virtual Records Operations Center Mission, Gilbert, AZ",
    language: "English",
    scripture: "D&C 128:24",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 1,
    active: true
  },
  {
    id: 2,
    name: "Elder & Sister Woolley",
    mission: "Virtual Records Operations Center Mission, Gilbert, AZ",
    language: "English",
    scripture: "Quote from President Russell M. Nelson (placeholder)",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 2,
    active: true
  },
  {
    id: 3,
    name: "Elder Austin Weber",
    mission: "Tennessee Nashville Mission",
    language: "English",
    scripture: "Helaman 5:12",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 3,
    active: true
  },
  {
    id: 4,
    name: "Elder Ethan Kempton",
    mission: "Paraguay Asunción Mission",
    language: "Spanish",
    scripture: "Ether 12:27",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 4,
    active: true
  },
  {
    id: 5,
    name: "Elder Wyatt King",
    mission: "Florida Tampa Mission",
    language: "Haitian",
    scripture: "Alma 36:24",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 5,
    active: true
  },
  {
    id: 6,
    name: "Elder Carter Cook",
    mission: "Arizona Gilbert Mission",
    language: "English",
    scripture: "1 Nephi 3:7",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 6,
    active: true
  },
  {
    id: 7,
    name: "Sister Rachel Sutton",
    mission: "Oregon Portland Mission",
    language: "English",
    scripture: "John 14:27",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 7,
    active: true
  },
  {
    id: 8,
    name: "Sister Ellie Bateman",
    mission: "New Zealand Wellington Mission",
    language: "English",
    scripture: "3 Nephi 18:24",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 8,
    active: true
  },
  {
    id: 9,
    name: "Elder Easton Cook",
    mission: "Cambodia Phnom Penh Mission",
    language: "Khmer",
    scripture: "Mormon 9:21",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 9,
    active: true
  },
  {
    id: 10,
    name: "Elder Zach Pyeatt",
    mission: "Colorado, Colorado Springs Mission",
    language: "English",
    scripture: "D&C 58:27-28",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 10,
    active: true
  },
  {
    id: 11,
    name: "Sister Maren Jennings",
    mission: "Ghana Accra East Mission",
    language: "Twi",
    scripture: "Luke 7:47",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 11,
    active: true
  },
  {
    id: 12,
    name: "Elder Nathan Transtrum",
    mission: "Uganda Kampala Mission",
    language: "English, Swahili, Luganda?",
    scripture: "Alma 26:12",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 12,
    active: true
  },
  {
    id: 13,
    name: "Sister Olivia Weight",
    mission: "Ohio Columbus Mission",
    language: "English",
    scripture: "D&C 59:23",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 13,
    active: true
  },
  {
    id: 14,
    name: "Elder Carson McConaghie",
    mission: "North Carolina, Charlotte Mission",
    language: "English",
    scripture: "D&C 18:10",
    photoUrl: "",
    homeLocation: "Gilbert, AZ",
    displayOrder: 14,
    active: true
  },
  // Add more missionaries here...
];

// ---- INIT FIREBASE ADMIN ----
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  projectId: PROJECT_ID,
  ...(STORAGE_BUCKET ? { storageBucket: STORAGE_BUCKET } : {}),
});

const db = admin.firestore();

function makeToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex"); // 48-char token by default
}

function validateMissionary(m) {
  const required = ["id", "name", "mission", "language", "scripture", "homeLocation", "displayOrder", "active"];
  for (const k of required) {
    if (m[k] === undefined || m[k] === null || m[k] === "") {
      return `Missing/empty field "${k}" for missionary id=${m.id}`;
    }
  }
  if (!Number.isInteger(m.id) || m.id <= 0) return `Invalid id for "${m.name}" (must be positive integer)`;
  if (!Number.isInteger(m.displayOrder) || m.displayOrder <= 0) return `Invalid displayOrder for "${m.name}"`;
  if (typeof m.active !== "boolean") return `Invalid active for "${m.name}" (must be boolean)`;
  return null;
}

(async () => {
  try {
    console.log("=============================================================");
    console.log("MISSIONARY SEED SCRIPT");
    console.log("=============================================================\n");
    console.log(`Project ID: ${PROJECT_ID}`);
    console.log(`Ward ID: ${WARD_ID}`);
    console.log(`Missionaries to seed: ${missionaries.length}\n`);

    if (!PROJECT_ID || PROJECT_ID.includes("REPLACE_WITH")) {
      console.error("❌ ERROR: You must set PROJECT_ID at the top of missionaries-seed.js");
      process.exit(1);
    }

    // Validate input
    const errors = [];
    for (const m of missionaries) {
      const err = validateMissionary(m);
      if (err) errors.push(err);
    }
    if (errors.length) {
      console.error("❌ Validation errors:");
      for (const e of errors) console.error(" - " + e);
      process.exit(1);
    }
    console.log("✓ All missionaries validated\n");
    console.log("Starting seed...\n");

    const wardRef = db.collection("wards").doc(WARD_ID);

    // Ensure ward doc exists (won't overwrite anything)
    await wardRef.set({ updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    const results = [];

    // Write each missionary
    for (const m of missionaries) {
      const uploadToken = makeToken(24);

      // Document ID: use the numeric ID as string (stable + predictable)
      const docId = String(m.id);

      const doc = {
        id: m.id,
        name: m.name,
        mission: m.mission,
        language: m.language,
        scripture: m.scripture,
        photoUrl: m.photoUrl || "",
        homeLocation: m.homeLocation,
        displayOrder: m.displayOrder,
        active: m.active,

        // Upload token system
        uploadToken,
        // Optional: you can later build a Cloud Function route like /upload?token=...
        uploadUrl: `/upload?token=${uploadToken}`,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await wardRef.collection("missionaries").doc(docId).set(doc, { merge: true });

      console.log(`✓ Created: ${m.name} (ID: ${m.id})`);
      console.log(`  Upload Token: ${uploadToken}`);
      console.log(`  Upload URL: ${doc.uploadUrl}\n`);

      results.push({ name: m.name, id: m.id, uploadToken, uploadUrl: doc.uploadUrl });
    }

    console.log("✓ All missionaries seeded successfully!\n");
    console.log("IMPORTANT: Save the upload tokens! These are needed for missionary families to upload photos.\n");

    // Print a copy/paste friendly block at the end
    console.log("---- COPY/PASTE TOKENS ----");
    for (const r of results) {
      console.log(`${r.id}\t${r.name}\t${r.uploadToken}\t${r.uploadUrl}`);
    }
    console.log("--------------------------");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
})();
