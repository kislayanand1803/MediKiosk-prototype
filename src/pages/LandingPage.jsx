import { useNavigate } from "react-router-dom";
import {
  Languages,
  Clock,
  ShieldCheck,
  Cloud,
  BrainCircuit,
  Activity,
  FileText,
  ChevronRight,
  Leaf,
  Database,
  Bot,
  Mic,
  Globe,
  Upload,
  Ticket,
  Stethoscope,
  Lightbulb,
  Building2,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-green-200">
      {/* HEADER / NAVIGATION */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* LOGO & TAGLINE CONTAINER */}
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-bold text-xl text-green-900 tracking-tight leading-none">
                  MediKiosk
                </span>
                <span className="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-wide">
                  Empowering Ayush Healthcare
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/doctor")}
                className="text-sm font-semibold text-gray-600 hover:text-green-700 transition"
              >
                Vaidya Portal
              </button>
              <button
                onClick={() => navigate("/intake")}
                className="text-sm font-bold bg-green-600 text-white px-4 py-2 rounded-full shadow hover:bg-green-700 hover:shadow-md transition"
              >
                Patient Kiosk
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Live Demo Ready
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                AI-Powered{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">
                  Patient Intake
                </span>{" "}
                for Ayush Dispensaries
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Voice-first regional language interviews, automated Dashavidha
                Pariksha, and ABDM integration—purpose-built for India’s
                high-footfall public healthcare system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate("/intake")}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-full font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all"
                >
                  Launch Patient Kiosk <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => navigate("/doctor")}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-full font-bold text-lg hover:border-green-600 hover:text-green-700 transition-all"
                >
                  View Vaidya Portal
                </button>
              </div>
            </div>

            {/* Hero Visual (CSS Tablet Mockup) */}
            <div className="relative mx-auto w-full max-w-md perspective-1000">
              <div className="bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-900 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
                <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-700 aspect-[3/4] relative flex flex-col">
                  {/* Fake App Header */}
                  <div className="bg-green-600 text-white p-4 flex items-center gap-2 shadow-md z-10">
                    <Bot size={20} />
                    <span className="font-bold text-sm">MediKiosk Triage</span>
                  </div>
                  {/* Fake App Body */}
                  <div className="flex-1 p-4 space-y-4 relative overflow-hidden">
                    <div className="bg-green-100/50 p-3 rounded-2xl rounded-bl-none text-sm text-green-900 max-w-[80%]">
                      नमस्ते। मैं आपका आयुष क्लिनिकल एआई सहायक हूँ। आज आपको क्या
                      परेशानी महसूस हो रही है?
                    </div>
                    <div className="bg-blue-600 p-3 rounded-2xl rounded-br-none text-sm text-white max-w-[80%] ml-auto">
                      मुझे दो दिन से बहुत तेज सिरदर्द है और पेट में जलन हो रही
                      है।
                    </div>
                    <div className="bg-green-100/50 p-3 rounded-2xl rounded-bl-none text-sm text-green-900 max-w-[80%]">
                      (Dashavidha Pariksha) क्या आपको खाने के बाद पेट में भारीपन
                      या एसिडिटी महसूस होती है?
                    </div>
                    {/* Fake voice pulse */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 rounded-full animate-pulse shadow-lg">
                      <Mic size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS BAR */}
      <section className="bg-green-900 text-white py-10 border-y-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-green-700">
            <div className="space-y-1">
              <Languages className="mx-auto h-8 w-8 text-orange-400 mb-2" />
              <h3 className="text-3xl font-extrabold">22</h3>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                Scheduled Languages
              </p>
            </div>
            <div className="space-y-1">
              <Clock className="mx-auto h-8 w-8 text-orange-400 mb-2" />
              <h3 className="text-3xl font-extrabold">&lt; 90s</h3>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                Avg. Triage Time
              </p>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="mx-auto h-8 w-8 text-orange-400 mb-2" />
              <h3 className="text-3xl font-extrabold">ABDM</h3>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                DPDP Compliant
              </p>
            </div>
            <div className="space-y-1">
              <Cloud className="mx-auto h-8 w-8 text-orange-400 mb-2" />
              <h3 className="text-3xl font-extrabold">Zero</h3>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                Local GPUs Needed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PATIENT JOURNEY / WORKFLOW */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-orange-600 tracking-widest uppercase mb-2">
              Patient Journey
            </h2>
            <h3 className="text-3xl font-extrabold text-gray-900">
              From Walk-In to Vaidya-Ready in 90 Seconds
            </h3>
            <p className="mt-4 text-gray-600 text-lg">
              A frictionless, voice-first workflow designed for patients of all
              literacy levels.
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-green-200 before:via-orange-200 before:to-green-200">
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Languages className="text-green-600" size={20} />
                  <h4 className="font-bold text-gray-900 text-lg">
                    Native Language Onboarding
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Patient selects from 22 local Indian languages. All subsequent
                  interactions and voice AI happen entirely in their chosen
                  dialect.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="text-orange-500" size={20} />
                  <h4 className="font-bold text-gray-900 text-lg">
                    Patient Info & Consent
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Frictionless capture of essential details (Name, Age, Gender,
                  and ABHA ID) alongside DPDP Act 2023 compliant explicit data
                  consent.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="text-green-600" size={20} />
                  <h4 className="font-bold text-gray-900 text-lg">
                    AI Prashna Pariksha
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  The empathetic AI conducts a dynamic medical interview using
                  the modern SOCRATES framework to narrow down the chief
                  complaint.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                4
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="text-orange-500" size={20} />
                  <h4 className="font-bold text-gray-900 text-lg">
                    Document & Report Upload
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  At the end of the AI interview round, patients can upload
                  older physical prescriptions or lab reports for intelligent
                  OCR text extraction.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                5
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Ticket className="text-green-600" size={20} />
                  <h4 className="font-bold text-gray-900 text-lg">
                    Token Generation & Analysis
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  A unique token is generated. The AI compiles the patient info,
                  analyzes the clinical issue, and sends a complete summary
                  directly to the Vaidya Dashboard.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-500 text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                6
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:shadow-md transition-shadow shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Stethoscope className="text-orange-600" size={20} />
                  <h4 className="font-bold text-orange-900 text-lg">
                    Sequential Consultation
                  </h4>
                </div>
                <p className="text-orange-800 text-sm">
                  The physician calls the patients in order of their sequence to
                  ensure fair treatment, reviewing the structured AI summary
                  before the patient even enters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">
              Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-gray-900">
              Highly Scalable, Hardware-Agnostic Tech
            </h3>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Unlike local LLMs that require expensive GPUs in every clinic,
              MediKiosk uses a modern cloud architecture designed for mass
              deployment in resource-constrained Ayush dispensaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-100 rounded-3xl p-8 bg-gray-50 hover:border-green-300 hover:bg-green-50/30 transition-colors">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit className="text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Google Gemini AI
              </h4>
              <p className="text-gray-600 text-sm">
                Dual-temperature configuration. 0.1 deterministic inference for
                strict clinical summaries, and 0.4 conversational empathy for
                patient chat.
              </p>
            </div>

            <div className="border border-gray-100 rounded-3xl p-8 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/30 transition-colors">
              <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Database className="text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Supabase (PostgreSQL)
              </h4>
              <p className="text-gray-600 text-sm">
                Secure, cloud-hosted patient database providing real-time
                synchronization to the Doctor Portal with Row Level Security
                (RLS).
              </p>
            </div>

            <div className="border border-gray-100 rounded-3xl p-8 bg-gray-50 hover:border-green-300 hover:bg-green-50/30 transition-colors">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Globe className="text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Vite + React
              </h4>
              <p className="text-gray-600 text-sm">
                Lightweight Single Page Application (SPA) architecture utilizing
                native Web Speech APIs with custom script-family phonetic
                fallbacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-8 text-center border-t-4 border-green-600">
        <div className="flex flex-col items-center space-y-3">
          {/* Project Line */}
          <div className="flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-green-400" />
            <p className="text-gray-200 font-semibold text-base">
              MediKiosk | Smart India Hackathon 2026
            </p>
          </div>

          {/* Support Line */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <p className="text-gray-400 text-sm italic">
              Conceptualized with support from the Ministry of Ayush, Government
              of India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
