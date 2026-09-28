import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Bot, Mic } from "lucide-react";

/**
 * Hero section: headline, sub-copy, primary CTAs, and a dynamic
 * mockup previewing the patient-facing triage chat.
 */

const DYNAMIC_CHAT = [
  {
    from: "bot",
    text: "नमस्ते! मैं आपका आयुष क्लिनिकल एआई सहायक हूँ। आज आपको क्या परेशानी महसूस हो रही है?",
  },
  {
    from: "patient",
    text: "मुझे दो दिन से बहुत तेज सिरदर्द है और पेट में जलन हो रही है।",
  },
  {
    from: "bot",
    text: "क्या आपको खाने के बाद पेट में भारीपन या एसिडिटी महसूस होती है?",
  },
  {
    from: "patient",
    text: "हाँ, खाने के तुरंत बाद पेट फूल जाता है और खट्टी डकारें भी आती हैं।",
  },
  {
    from: "bot",
    text: "ठीक है, मैंने आपके सभी लक्षण दर्ज कर लिए हैं। कृपया अपनी टोकन पर्ची लें और कक्ष संख्या 4 में वैद्य जी से मिलें।",
  },
];

export default function Hero() {
  const navigate = useNavigate();
  const [visibleMessages, setVisibleMessages] = useState(0);

  // Stagger the appearance of each chat bubble by 1.5 seconds
  useEffect(() => {
    if (visibleMessages < DYNAMIC_CHAT.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages]);

  return (
    <section className="relative bg-white overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
      {/* Inline custom keyframe for the slide-up-fade effect */}
      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-bubble {
          animation: slideUpFade 0.5s ease-out forwards;
        }
      `}</style>

      <div
        className="absolute inset-0 bg-gradient-to-br from-green-50 to-white z-0"
        aria-hidden="true"
      />

      <div className="max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10 py-10 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* --- LEFT COLUMN: Copy + CTAs --- */}
          <div className="space-y-6">
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
              Voice-first regional language interviews, automated Dashavidha
              Pariksha, and seamless routing to a smart pharmacy
              POS—purpose-built for India's high-footfall public healthcare
              system.
            </p>

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

          {/* --- RIGHT COLUMN: Hero Visual (Dynamic Chat Mockup) --- */}
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
                  className="flex-1 p-4 space-y-4 relative overflow-hidden flex flex-col"
                  lang="hi"
                  aria-hidden="true"
                >
                  {DYNAMIC_CHAT.slice(0, visibleMessages).map(
                    (message, index) => (
                      <div
                        key={index}
                        className={`animate-bubble ${
                          message.from === "patient"
                            ? "bg-blue-600 p-3 rounded-2xl rounded-br-none text-sm text-white max-w-[80%] ml-auto"
                            : "bg-green-100/50 p-3 rounded-2xl rounded-bl-none text-sm text-green-900 max-w-[80%]"
                        }`}
                      >
                        {message.text}
                      </div>
                    ),
                  )}

                  {/* Typing indicator displays if the bot is "typing" the next message */}
                  {visibleMessages > 0 &&
                    visibleMessages < DYNAMIC_CHAT.length &&
                    DYNAMIC_CHAT[visibleMessages].from === "bot" && (
                      <div className="bg-gray-200 p-3 rounded-2xl rounded-bl-none max-w-[50px] flex gap-1 items-center h-10 animate-bubble">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    )}

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
