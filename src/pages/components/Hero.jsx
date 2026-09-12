import { useNavigate } from "react-router-dom";
import { ChevronRight, Bot, Mic } from "lucide-react";
import { HERO_CHAT } from "../data/landingContent";

/**
 * Hero section: headline, sub-copy, primary CTAs, and a static
 * mockup previewing the patient-facing triage chat.
 *
 * Layout Update: Uses viewport-height math (calc(100vh - 4rem)) and flexbox
 * to ensure the content stays perfectly vertically centered "above the fold"
 * without cutting off the bottom of the mockup.
 */
export default function Hero() {
  const navigate = useNavigate();

  return (
    // min-h-[calc(100vh-4rem)] accounts for the 64px navbar, keeping this exactly screen-height
    <section className="relative bg-white overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
      <div
        className="absolute inset-0 bg-gradient-to-br from-green-50 to-white z-0"
        aria-hidden="true"
      />

      {/* w-full ensures it stretches across the flex container. Padding removed on large screens to prevent vertical push */}
      <div className="max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10 py-10 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* --- LEFT COLUMN: Copy + CTAs --- */}
          <div className="space-y-6">
            {/* Live Demo Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              Live Demo Ready
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              AI-Powered{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">
                Patient Intake
              </span>{" "}
              for High-Volume Hospitals
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Voice-first regional language interviews, zero-typing touch
              interfaces, automated Dashavidha Pariksha, and ABDM
              integration—purpose-built for India's high-footfall public
              healthcare system.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/intake")}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-full font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                Launch Patient Kiosk{" "}
                <ChevronRight size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/doctor")}
                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-full font-bold text-lg hover:border-green-600 hover:text-green-700 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                View Vaidya Portal
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Hero Visual (CSS tablet mockup) --- */}
          <div
            className="relative mx-auto w-full max-w-md lg:max-w-lg perspective-1000"
            role="img"
            aria-label="Preview of the MediKiosk triage chat conducting a patient interview in Hindi"
          >
            <div className="bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-900 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-700 aspect-[3/4] relative flex flex-col">
                {/* Fake app header */}
                <div className="bg-green-600 text-white p-4 flex items-center gap-2 shadow-md z-10">
                  <Bot size={20} aria-hidden="true" />
                  <span className="font-bold text-sm">MediKiosk Triage</span>
                </div>

                {/* Fake chat body */}
                <div
                  className="flex-1 p-4 space-y-4 relative overflow-hidden"
                  lang="hi"
                  aria-hidden="true"
                >
                  {HERO_CHAT.map((message, index) => (
                    <div
                      key={index}
                      className={
                        message.from === "patient"
                          ? "bg-blue-600 p-3 rounded-2xl rounded-br-none text-sm text-white max-w-[80%] ml-auto"
                          : "bg-green-100/50 p-3 rounded-2xl rounded-bl-none text-sm text-green-900 max-w-[80%]"
                      }
                    >
                      {message.text}
                    </div>
                  ))}

                  {/* Fake voice pulse indicator */}
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
  );
}
