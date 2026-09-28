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
  Pill, // Added Pill icon for the new pharmacy step
} from "lucide-react";

/**
 * ==========================================
 * LANDING PAGE CONTENT DICTIONARY
 * ==========================================
 * Centralized content configuration for the MVP landing page.
 * Keeping copy and structural data separate from JSX components ensures
 * rapid iteration during hackathon presentations without touching layout logic.
 */

// Top navigation routing.
export const NAV_LINKS = [
  { label: "Vaidya Portal", path: "/doctor", variant: "text" },
  { label: "Patient Kiosk", path: "/intake", variant: "solid" },
];

// High-impact performance and compliance metrics displayed below the hero section.
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

// Note: HERO_CHAT has been removed from this static dictionary as the
// conversation is now handled dynamically within Hero.jsx for real-time animation.

/**
 * The 7-step "Patient Journey" timeline.
 * `tone` dictates the icon's color palette.
 * `highlight` (applied to the final step) triggers a distinct UI treatment
 * to signify the conclusion of the workflow (the pharmacy hand-off).
 */
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
    // Highlight removed here as the journey now continues to the pharmacy
  },
  {
    icon: Pill,
    tone: "orange",
    title: "Smart Dispensary & POS",
    description:
      "The Vaidya issues an e-prescription mapped to standard NAMASTE codes. The patient proceeds to the pharmacy, where real-time inventory filters and an integrated POS generate an instant receipt with automated Ayush GST calculations.",
    highlight: true, // This now receives the orange UI treatment
  },
];

/**
 * Technical architecture cards highlighting the stack's viability,
 * scalability, and government alignment.
 */
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
      "Secure, cloud-hosted patient database providing real-time synchronization across the Doctor Portal and Pharmacy Inventory with Row Level Security (RLS).",
  },
  {
    icon: Globe,
    tone: "green",
    title: "Vite + React",
    description:
      "Lightweight Single Page Application (SPA) built with Tailwind CSS, utilizing native Web Speech APIs with custom script-family phonetic fallbacks.",
  },
  {
    icon: Server,
    tone: "purple",
    title: "Node.js ABDM Proxy",
    description:
      "Standalone Express server bridging the frontend to the National Health Authority (NHA) gateway. Handles secure ABHA OTP handshakes and HL7 FHIR R4 data packaging.",
  },
];
