/**
 * Temple Squares Seed Script
 * Creates 365 temple squares for a ward
 */

const admin = require("firebase-admin");
const path = require("path");

// ---- CONFIG ----
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account-key.json");

// ---- INIT FIREBASE ----
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

// ---- CLI ARGS ----
const wardId = process.argv[2];
const initFlag = process.argv.includes("--init");

if (!wardId) {
  console.error("❌ ERROR: Ward ID required");
  console.log("Usage: node temple-squares-seed.js <WARD_ID> --init");
  process.exit(1);
}

(async () => {
  try {
    console.log(`[Seed] Initializing 365 temple squares for ward: ${wardId}`);

    const batch = db.batch();
    const wardRef = db.collection("wards").doc(wardId);
    const squaresRef = wardRef.collection("templeSquares");

    for (let i = 1; i <= 365; i++) {
      const docRef = squaresRef.doc(String(i));
      batch.set(docRef, {
        squareNumber: i,
        claimed: false,
        claimedAt: null,
        claimedByName: null,
      });
    }

    await batch.commit();

    console.log(`✅ Successfully created 365 temple squares for ${wardId}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
})();
