# 🏥 MediKiosk - AI-Powered Clinical Intake & Triage Platform

![Smart India Hackathon 2026](https://img.shields.io/badge/Smart_India_Hackathon-2026-orange?style=for-the-badge)
![Problem Statement](https://img.shields.io/badge/PS_ID-SIH26047-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Team Name:** VaidyaCode  
**Institution:** IIMT College of Engineering  
**Theme:** MedTech

---

## 📖 The Problem

In India's public and AYUSH hospitals, the doctor-to-patient consultation time is severely overburdened, frequently collapsing to **2 to 5 minutes** per patient. Doctors spend the majority of this critical window performing administrative data entry, taking basic history, and sorting through chaotic physical documents, leaving almost no time for actual clinical diagnosis and counseling.

## 🚀 Our Solution: MediKiosk

**MediKiosk** is an autonomous, self-service patient intake platform designed to solve the OPD "first-mile" data bottleneck. Accessible to rural, elderly, and low-literacy demographics, the kiosk captures comprehensive medical histories via voice or touch, digitizes physical records using Multimodal AI, and routes a standardized HL7 FHIR clinical summary directly to the physician's dashboard before the patient even enters the room.

### 🔗 Useful Links

- 🌐 **Live Demo:** [Insert Vercel Link Here]
- 🏗️ **System Architecture & Security Specs:** [Read ARCHITECTURE.md](./ARCHITECTURE.md)
- 📺 **Video Pitch / Walkthrough:** [Insert YouTube Link Here]

---

## ✨ Key Features & Modules

- 🗣️ **Multimodal Voice & Touch Intake (Module A & C):** Zero-typing interface. Patients can speak symptoms in 22+ regional languages via native Web Speech API or tap areas of discomfort on an interactive SVG Human Body Map.

- 📄 **AI Document Digitization (Module B):** Integrated with Google Gemini 1.5 Flash. Uploaded PDFs and messy handwritten prescriptions are contextually parsed into strict JSON arrays (Drug Dosages, Lab Values) and checked for abnormal ranges.

- 🔒 **Government Compliant & Interoperable (Module D):**
  - Integrates with the **ABDM / NHA API Gateway** for ABHA ID authentication and Care Context creation.
  - Clinical notes are mapped to international **HL7 FHIR R4** standards.
  - **DPDP Act 2023 Compliant:** Features audio-guided consent and an aggressive stateless volatile memory-wiping protocol to sanitize the kiosk after every patient.

- 👨‍⚕️ **Live Physician Dashboard (Module E):** Real-time queue management powered by Supabase. Doctors view an AI-generated SOAP summary, a chronological medical timeline, AYUSH Dosha/Agni radar charts, and can manually verify AI data against the original physical scans side-by-side.

---

## 🛠️ Technology Stack

| Category                  | Technologies Used                                |
| :------------------------ | :----------------------------------------------- |
| **Frontend**              | React.js, Vite, Tailwind CSS, Lucide React       |
| **Backend**               | Node.js, Express.js (NHA API Proxy Server)       |
| **Database & Auth**       | Supabase (PostgreSQL with `jsonb` array support) |
| **AI / Machine Learning** | Google Gemini 1.5 Flash, Native Web Speech API   |
| **Healthcare Standards**  | HL7 FHIR R4, NHA ABDM M1/M2/M3 APIs              |

---

## 💻 Local Setup & Installation

To run this project locally on your machine, follow these steps:

### Prerequisites

- Node.js (v18 or higher)
- Git

### 1. Clone the repository

```bash
git clone [https://github.com/your-username/medikiosk-vaidyacode.git](https://github.com/your-username/medikiosk-vaidyacode.git)
cd medikiosk-vaidyacode
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# If your backend is in the same repo, navigate to it and install
cd backend
npm install
cd ..
```

### 3. Environment Variables

_Create a .env file in the root directory and add your secure keys. (Never commit this file to GitHub)._

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Backend NHA API Config
ABDM_CLIENT_ID=your_sandbox_client_id
ABDM_CLIENT_SECRET=your_sandbox_client_secret
```

### 4. Run the Development Servers

```bash
# Start the Vite React Frontend (Usually runs on localhost:5173)
npm run dev

# Open a new terminal and start the Node.js Express Backend (Runs on localhost:5000)
cd backend
node server.js
```

---

## 🛡️ Security Note

This repository contains no sensitive API keys, ABHA details, or personal health information (PHI). All data handled during the demo is mocked sandbox data or explicitly wiped upon session termination in accordance with our data privacy architecture.

Built with ❤️ by Team **VaidyaCode** for the _Smart India Hackathon 2026_.
