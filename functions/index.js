const express = require("express");
const cors = require("cors");

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({ region: "us-central1" });

const app = express();

// CORS: allow your production domains + local testing
app.use(
  cors({
    origin: [
      "https://www.kiosk.meadowviewward.com",
      "https://kiosk.meadowviewward.com",
      "https://www.meadowviewward.com",
      "https://meadowviewward.com",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/v1/health", (req, res) => {
  res.status(200).json({ ok: true });
});

/**
 * POST /v1/temple/logVisit
 * Body: { wardId, name, desiredSquareNumber, hasSelfie, selfieUrl? }
 */
app.post("/v1/temple/logVisit", async (req, res) => {
  try {
    const { wardId, name, desiredSquareNumber, hasSelfie, selfieUrl } = req.body || {};

    if (!wardId || !name || !desiredSquareNumber) {
      return res.status(400).json({ ok: false, error: "Missing wardId, name, or desiredSquareNumber" });
    }

    const db = admin.firestore();
    const wardRef = db.collection("wards").doc(String(wardId));

    // Write a visit record (server-side)
    const visitRef = wardRef.collection("visits").doc();
    await visitRef.set({
      name: String(name),
      desiredSquareNumber: Number(desiredSquareNumber),
      hasSelfie: Boolean(hasSelfie),
      selfieUrl: selfieUrl ? String(selfieUrl) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // OPTIONAL: you can also update stats here if you want
    // await wardRef.collection("stats").doc("current").set({ ... }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("logVisit error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Export as a single HTTPS function with your existing URL pattern
exports.api = onRequest(app);
