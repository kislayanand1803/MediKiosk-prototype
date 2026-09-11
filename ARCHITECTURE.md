# 🏗️ MediKiosk - System Architecture & Security Documentation

**Smart India Hackathon 2026 | Problem Statement: SIH26047**  
**Team:** VaidyaCode | **Institution:** IIMT College of Engineering

## 1. System Overview

MediKiosk is an AI-powered, self-service clinical intake platform designed to solve the "first-mile" data bottleneck in India’s high-throughput hospital Outpatient Departments (OPDs). The system allows patients to autonomously record their medical history via voice or touch, digitize physical medical records, and generate a structured, physician-ready summary linked to their Ayushman Bharat Health Account (ABHA).

## 2. Technology Stack

- **Frontend Client:** React.js, Vite, Tailwind CSS, Lucide React Icons.
- **Backend Proxy Server:** Node.js, Express.js.
- **Database & State:** Supabase (PostgreSQL with `jsonb` array support for clinical entities).
- **AI & Machine Learning:** Google Gemini 1.5 Flash (Multimodal OCR & NLP), Native Web Speech API / Google TTS (Multilingual Voice).
- **Interoperability Standards:** HL7 FHIR R4, ABDM (NHA APIs).

## 3. Core Modules & Architecture

### Module A: Conversational Multimodal History Engine

- **Voice-First Interface:** Utilizes browser-native Web Speech API for multi-accent voice capture in 22 regional languages.
- **Dynamic Prompting:** NLP logic dynamically branches based on the SOCRATES pain assessment framework (Allopathic) and Dashavidha Pariksha (AYUSH).
- **Real-Time Triage:** AI autonomously parses chat inputs to trigger an `is_red_flag` boolean alert for emergency symptoms, overriding the standard queue.

### Module B: Medical Document Digitization Pipeline

- **Multimodal OCR Ingestion:** Accepts multi-file uploads (JPEG/PNG/PDF) of chaotic, handwritten prescriptions and lab reports.
- **AI Entity Extraction:** Raw images are piped securely into a multimodal context window.
- **Structured Output:** The LLM bypasses raw text dumping and directly outputs strict JSON arrays (`Medications`: drugName, dosage; `Lab Values`: testName, result, isAbnormal).

### Module C: Interactive UI & Accessibility

- **SVG Symptom Body Map:** A zero-typing, touch-based interface where low-literacy users can tap a human body outline to register the location of discomfort.
- **Audio-Guided Navigation:** TTS (Text-to-Speech) engines with Regex script-mismatch fixes read UI prompts and legal terms aloud.

### Module D: Privacy & ABDM Integration

- **NHA Proxy Bridge:** A standalone Node.js server securely proxies M1 (OTP Handshake) and M3 (Care Context Registration) requests to the National Health Authority gateway.
- **FHIR R4 Mapping:** Internal JSON clinical notes are transformed into HL7 FHIR R4 standard Bundles (`Patient`, `Encounter`, `Condition`, `ClinicalImpression` resources).

### Module E: Live-Syncing Physician Dashboard

- **Real-Time Queue Management:** Database real-time subscriptions push new patient tokens instantly to the doctor's screen.
- **Clinical Data Visualization:** Generates chronological clinical timelines and AYUSH Dosha/Agni radar charts.
- **Source-Truth Verification:** Allows physicians to view AI-generated JSON dosages side-by-side with the original uploaded physical scans for manual verification before HIS approval.

## 4. Security & Data Protection Protocols

_This project strictly adheres to the Digital Personal Data Protection (DPDP) Act 2023._

- **Environment Isolation:** All API keys, database URIs, and ABDM client secrets are injected via secure environment variables (`.env`) and are **never** committed to this public repository.
- **Stateless Volatile Wiping:** Upon session completion, the application triggers a mandatory flush of `localStorage`, `sessionStorage`, and browser history. This actively sanitizes the kiosk memory for the next patient.
- **Anti-Hijacking:** Implements `window.history.replaceState` overwrites to prevent "Back-Button" data leakage between kiosk users.
- **Data in Transit/Rest:** TLS 1.3 / HTTPS encryption for all API communication and AES-256 database encryption.

## 5. Deployment Architecture

- **Frontend:** Deployed globally via Vercel Edge Network.
- **Backend:** Hosted securely via Render/Railway environments with strict CORS policies allowing traffic exclusively from the verified frontend domain.
