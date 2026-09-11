// To boot up my backend in a separate terminal (node server.js)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Ensures your Vercel frontend is allowed to talk to your Render backend
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health Check Route (Fixes the "Cannot GET /" screen)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Online",
    service: "MediKiosk ABDM Integration API",
    message: "Backend is active and listening for M1/M3 Handshakes.",
  });
});

const ABDM_SANDBOX_URL = "https://abhasbx.abdm.gov.in/abha/api/v3";

/**
 * ---------------------------------------------------------
 * ABDM MILESTONE 1: ABHA AUTHENTICATION & OTP GENERATION
 * ---------------------------------------------------------
 * POST /api/abha/generate-otp
 */
app.post("/api/abha/generate-otp", async (req, res) => {
  const { abhaId } = req.body;

  if (!abhaId) {
    return res
      .status(400)
      .json({ success: false, error: "ABHA ID is required" });
  }

  try {
    console.log(`[ABDM Gateway] Requesting OTP for ABHA: ${abhaId}`);

    // Simulating the NHA Gateway Network Latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Returns a standard ABDM Sandbox Transaction ID
    res.json({
      success: true,
      txnId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}-SBX`,
      message: "OTP sent to registered Aadhaar-linked mobile",
    });
  } catch (error) {
    console.error("ABDM Gateway Error:", error);
    res.status(500).json({ success: false, error: "NHA Sandbox Timeout" });
  }
});

/**
 * ---------------------------------------------------------
 * ABDM MILESTONE 1: OTP VERIFICATION & DEMOGRAPHIC FETCH
 * ---------------------------------------------------------
 * POST /api/abha/verify-otp
 */
app.post("/api/abha/verify-otp", async (req, res) => {
  const { txnId, otp, abhaId } = req.body;

  try {
    console.log(`[ABDM Gateway] Verifying OTP ${otp} for TXN: ${txnId}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Use "123456" as the universal mock OTP for your hackathon demo
    if (otp === "123456") {
      // In production, this data is returned from: /v3/profile/login/profile/abha-profile
      res.json({
        success: true,
        message: "Authentication Successful",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI...", // Mock JWT
        patientDetails: {
          name: "Prachi Sharma",
          gender: "Female",
          age: "20",
          abha_number: abhaId,
          kyc_status: "VERIFIED",
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Invalid OTP. Please use 123456 for demo.",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Gateway verification failed" });
  }
});

/**
 * ---------------------------------------------------------
 * ABDM MILESTONE 3: HIP CARE CONTEXT REGISTRATION (LINKING)
 * ---------------------------------------------------------
 * POST /api/care-context/link
 */
app.post("/api/care-context/link", async (req, res) => {
  const { abhaId, patientName, fhirBundleId } = req.body;

  if (!abhaId || abhaId === "Not Linked") {
    return res.json({
      success: false,
      message: "Skipped: Patient not linked to ABHA",
    });
  }

  try {
    console.log(`[ABDM Gateway] Registering Care Context for ABHA: ${abhaId}`);
    console.log(`[ABDM Gateway] Attaching FHIR Bundle ID: ${fhirBundleId}`);

    // Simulating the NHA Gateway Network Latency for M3 Linking
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Returns a standard ABDM Care Context linking response
    res.json({
      success: true,
      careContextReference: `CC-${Math.floor(Math.random() * 90000) + 10000}`,
      message: "Successfully linked OPD Visit to patient's ABHA Health Locker",
    });
  } catch (error) {
    console.error("ABDM Care Context Error:", error);
    res.status(500).json({ success: false, error: "Gateway Link Failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ABDM Backend Bridge running on http://localhost:${PORT}`);
  console.log(`⚙️  Ready to route M1 Auth traffic to NHA Sandbox`);
});
