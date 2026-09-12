import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowUp,
  Leaf,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  Code2,
  Globe,
  MessageSquare,
} from "lucide-react";

/**
 * Enterprise-grade "Fat Footer" for the landing page.
 * Includes branding, quick navigation, legal links, and social integrations
 * to demonstrate a production-ready product structure to hackathon judges.
 */
export default function Footer() {
  const navigate = useNavigate();

  // Smooth scroll handler for the "Back to Top" button
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-10 border-t-4 border-green-600 font-sans">
      {/* Expanded max-width to eliminate awkward side margins on large screens */}
      <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
        {/* --- TOP SECTION: 3-COLUMN GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24 mb-12">
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg">
                <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                MediKiosk
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              An AI-powered, voice-first clinical triage system designed to
              eliminate language barriers and reduce OPD wait times across
              India.
            </p>
            <div className="inline-block bg-slate-900 border border-slate-800 text-xs font-semibold text-green-400 px-3 py-1 rounded-full">
              Smart India Hackathon 2026 • SIH26047
            </div>
          </div>

          {/* Column 2: Navigation Shortcuts */}
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-sm mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => navigate("/intake")}
                  className="hover:text-green-400 transition flex items-center gap-2 group"
                >
                  <ChevronRight
                    size={14}
                    className="text-slate-600 group-hover:text-green-400 transition"
                  />
                  Prototype Demo (Patient)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/doctor")}
                  className="hover:text-green-400 transition flex items-center gap-2 group"
                >
                  <ChevronRight
                    size={14}
                    className="text-slate-600 group-hover:text-green-400 transition"
                  />
                  Vaidya Dashboard
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/kislayanand1803/MediKiosk-prototype/blob/main/ARCHITECTURE.md"
                  className="hover:text-green-400 transition flex items-center gap-2 group"
                >
                  <FileText
                    size={14}
                    className="text-slate-600 group-hover:text-green-400 transition"
                  />
                  Architecture Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/kislayanand1803/MediKiosk-prototype"
                  className="hover:text-green-400 transition flex items-center gap-2 group"
                >
                  <Code2
                    size={14}
                    className="text-slate-600 group-hover:text-green-400 transition"
                  />
                  Source Code
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-sm mb-4">
              Compliance & Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf"
                  className="hover:text-green-400 transition flex items-center gap-2"
                >
                  <Shield size={14} className="text-slate-600" />
                  DPDP Act 2023 Compliance
                </a>
              </li>
              <li>
                <a
                  href="https://abdm.gov.in/strapicms/uploads/privacypolicy_178041845b.pdf"
                  className="hover:text-green-400 transition flex items-center gap-2"
                >
                  <Shield size={14} className="text-slate-600" />
                  ABDM Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-green-400 transition flex items-center gap-2"
                >
                  <FileText size={14} className="text-slate-600" />
                  Terms of Use
                </a>
              </li>
              <li>
                <a
                  href="mailto:arise.coder@gmail.com"
                  className="hover:text-green-400 transition flex items-center gap-2"
                >
                  <Mail size={14} className="text-slate-600" />
                  Contact Hackathon Team
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-slate-800/80 mb-8"></div>

        {/* --- BOTTOM SECTION: ATTRIBUTION & SOCIALS --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          {/* Left Side: Consolidated Attribution & Copyright */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Building2
                className="h-4 w-4 text-slate-500 shrink-0"
                aria-hidden="true"
              />
              <p className="italic">
                Conceptualized for the{" "}
                <span className="text-slate-300 font-semibold">
                  Ministry of Ayush
                </span>
                , Government of India
              </p>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium tracking-wide">
              <p>
                © {new Date().getFullYear()} Team VaidyaCode (IIMT College of
                Engineering). MIT Licensed Open Source.
              </p>
              <p className="mt-0.5">
                Not for production medical use without physician oversight.
              </p>
            </div>
          </div>

          {/* Right Side: Social Icons & Back to Top */}
          <div className="flex items-center gap-5 pb-1">
            <a
              href="https://github.com/kislayanand1803/MediKiosk-prototype"
              className="text-slate-500 hover:text-white transition"
              title="Repository"
            >
              <Code2 size={18} />
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-white transition"
              title="Website"
            >
              <Globe size={18} />
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-white transition"
              title="Social"
            >
              <MessageSquare size={18} />
            </a>
            <span className="text-slate-700">|</span>
            <button
              onClick={scrollToTop}
              className="text-xs font-bold text-slate-400 hover:text-green-400 transition flex items-center gap-1 uppercase tracking-wider"
            >
              Top <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
