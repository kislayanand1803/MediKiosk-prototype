import {
  Languages,
  Clock,
  ShieldCheck,
  Cloud,
  BrainCircuit,
  Database,
  Globe,
  Upload,
  Ticket,
  Stethoscope,
  Server,
} from "lucide-react";

/**
 * ==========================================
 * LANDING PAGE CONTENT
 * ==========================================
 * All copy and structured data for the marketing page lives here,
 * separate from the components that render it. This is the single
 * place to edit when wording, stats, or the workflow steps change —
 * no need to touch JSX/layout code for a content update.
 */

// Top navigation entry points.
export const NAV_LINKS = [
  { label: "Vaidya Portal", path: "/doctor", variant: "text" },
  { label: "Patient Kiosk", path: "/intake", variant: "solid" },
];

// Headline stats shown in the highlight strip below the hero.
export const METRICS = [
  { icon: Languages, value: "22", label: "Scheduled Languages" },
  { icon: Clock, value: "< 90s", label: "Avg. Triage Time" },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "ABDM & DPDP COMPLIANT",
  },
  { icon: Cloud, value: "Zero", label: "Local GPUs Needed" },
];

// Static preview of the patient-facing triage chat, shown in the hero mockup.
// Kept as data (rather than hardcoded JSX) so the demo script is easy to update.
export const HERO_CHAT = [
  {
    from: "ai",
    text: "नमस्ते। मैं आपका आयुष क्लिनिकल एआई सहायक हूँ। आज आपको क्या परेशानी महसूस हो रही है?",
  },
  {
    from: "patient",
    text: "मुझे दो दिन से बहुत तेज सिरदर्द है और पेट में जलन हो रही है।",
  },
  {
    from: "ai",
    text: "क्या आपको खाने के बाद पेट में भारीपन या एसिडिटी महसूस होती है?",
  },
];

// The 6-step "Patient Journey" timeline. `tone` colors the step's icon;
// `highlight` marks the final, physician-facing step for the orange treatment.
export const TIMELINE_STEPS = [
  {
    icon: Languages,
    tone: "green",
    title: "Native Language Onboarding",
    description:
      "Patient selects from 22 local Indian languages. All subsequent interactions and voice AI happen entirely in their chosen dialect.",
  },
  {
    icon: ShieldCheck,
    tone: "orange",
    title: "Patient Info & Consent",
    description:
      "Frictionless capture of essential details (Name, Age, Gender, and ABHA ID) alongside DPDP Act 2023 compliant explicit data consent, featuring audio-guided readouts for low-literacy users.",
  },
  {
    icon: BrainCircuit,
    tone: "green",
    title: "AI Prashna Pariksha",
    description:
      "The empathetic AI conducts a dynamic medical interview using both the allopathic SOCRATES framework and the Ayurvedic Dashavidha Pariksha (assessing Prakriti and Vikriti) to narrow down the chief complaint.",
  },
  {
    icon: Upload,
    tone: "orange",
    title: "Document & Report Upload",
    description:
      "At the end of the AI interview round, patients can upload older physical prescriptions or lab reports. The AI goes beyond simple OCR, extracting exact drug dosages and flagging abnormal lab values automatically.",
  },
  {
    icon: Ticket,
    tone: "green",
    title: "Token Generation & Analysis",
    description:
      "A unique token is generated. The AI compiles the patient info, analyzes the clinical issue, and securely routes a standardized HL7 FHIR R4 clinical summary directly to the Vaidya Dashboard, registering the visit on the ABDM gateway.",
  },
  {
    icon: Stethoscope,
    tone: "orange",
    title: "Sequential Consultation",
    description:
      "The physician calls the patients in order of their sequence to ensure fair treatment, reviewing the structured AI summary before the patient even enters.",
    highlight: true,
  },
];

// Architecture / tech-stack cards.
export const TECH_STACK = [
  {
    icon: BrainCircuit,
    tone: "blue",
    title: "Google Gemini AI",
    description:
      "Dual-temperature configuration. 0.1 deterministic inference for strict clinical summaries, and 0.4 conversational empathy for patient chat.",
  },
  {
    icon: Database,
    tone: "orange",
    title: "Supabase (PostgreSQL)",
    description:
      "Secure, cloud-hosted patient database providing real-time synchronization to the Doctor Portal with Row Level Security (RLS).",
  },
  {
    icon: Globe,
    tone: "green",
    title: "Vite + React",
    description:
      "Lightweight Single Page Application (SPA) architecture utilizing native Web Speech APIs with custom script-family phonetic fallbacks.",
  },
  {
    icon: Server,
    tone: "purple", 
    title: "Node.js ABDM Proxy",
    description:
      "Standalone Express server bridging the frontend to the National Health Authority (NHA) gateway. Handles secure ABHA OTP handshakes and HL7 FHIR R4 data packaging.",
  },
];
