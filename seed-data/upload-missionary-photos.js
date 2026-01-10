//Bulk upload everything from your assets folder (recommended)

//Since you have lots of missionaries and starter photos, this is the easiest long-term.

//What this does

//Takes your local files in assets/...

//Uploads them into Firebase Storage at:

//wards/meadowview_az/missionaries/{id}/profile/profile.jpg

//wards/meadowview_az/missionaries/{id}/gallery/photos/...




//C:\Users\zbriz\firebase-hosting\upload-ready\
 // missionaries\
   // 1\
     // profile.jpg
      //gallery\
        //photo1.jpg
        //photo2.jpg
    //2\
      //profile.jpg
       //gallery\
        //photo1.jpg


// Then Run        //cd C:\Users\zbriz\firebase-hosting\seed-data
//node upload-missionary-photos.js




const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// ===== SET THESE =====
const PROJECT_ID = "ward-kiosk-test"; // REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID
const WARD_ID = "meadowview_az";
const BUCKET = "ward-kiosk-test.firebasestorage.app";

// Local folder containing your prepared files
const LOCAL_BASE = path.resolve(__dirname, "..", "upload-ready", "missionaries");

// ===== INIT =====
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
});
const bucket = admin.storage().bucket();

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

(async () => {
  try {
    if (!PROJECT_ID || PROJECT_ID.includes("REPLACE_WITH")) {
      console.error("❌ Set PROJECT_ID at the top of the script.");
      process.exit(1);
    }

    if (!fs.existsSync(LOCAL_BASE)) {
      console.error("❌ Local folder not found:", LOCAL_BASE);
      console.error("Create it and put files in it first.");
      process.exit(1);
    }

    const files = listFilesRecursive(LOCAL_BASE);
    if (!files.length) {
      console.log("No files found to upload.");
      process.exit(0);
    }

    console.log(`Uploading ${files.length} file(s) from: ${LOCAL_BASE}`);
    console.log(`To bucket: ${BUCKET}\n`);

    for (const fullPath of files) {
      // Determine missionaryId from path: .../missionaries/<id>/...
      const rel = path.relative(LOCAL_BASE, fullPath); // e.g. "14\\profile.jpg" or "14\\gallery\\photo1.jpg"
      const parts = rel.split(path.sep);
      const missionaryId = parts[0];

      // Map local paths to Storage paths
      // local: <id>\profile.jpg  -> storage: wards/{wardId}/missionaries/{id}/profile/profile.jpg
      // local: <id>\gallery\X.jpg -> storage: wards/{wardId}/missionaries/{id}/gallery/photos/X.jpg
      let storagePath = null;

      if (parts.length === 2 && parts[1].toLowerCase() === "profile.jpg") {
        storagePath = `wards/${WARD_ID}/missionaries/${missionaryId}/profile/profile.jpg`;
      } else if (parts.length >= 3 && parts[1].toLowerCase() === "gallery") {
        const filename = parts.slice(2).join("/"); // allow subfolders if you want
        storagePath = `wards/${WARD_ID}/missionaries/${missionaryId}/gallery/photos/${filename}`;
      } else {
        console.log("Skipping (unrecognized path):", rel);
        continue;
      }

      await bucket.upload(fullPath, {
        destination: storagePath,
        resumable: false,
        metadata: {
          cacheControl: "public,max-age=3600",
        },
      });

      console.log(`✓ ${rel}  ->  ${storagePath}`);
    }

    console.log("\n✅ Upload complete. Refresh Firebase Storage Console to see folders/files.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Upload failed:", e);
    process.exit(1);
  }
})();
