import "regenerator-runtime/runtime";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Send,
  Bot,
  CheckCircle,
  Volume2,
  VolumeX,
  Loader2,
  Upload,
  FileImage,
  X,
  Globe,
  Mic,
  MicOff,
} from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import BodyMapSelector from "../components/BodyMapSelector";
import {
  generateMedicalCaseSummary,
  generateNextChatResponse,
} from "../services/aiService";
import { getT, LANGUAGES } from "../utils/translations";

// Comprehensive BCP-47 and keyword mapping for all 22 Scheduled Languages + English
const REGIONAL_LANG_MAP = {
  // Direct Supported Indian Languages
  en: {
    code: "en-IN",
    keywords: ["english", "en-in", "en-us", "en-gb"],
    fallbackLang: null,
  },
  hi: {
    code: "hi-IN",
    keywords: ["hindi", "हिन्दी", "hi-in", "hi_in"],
    fallbackLang: null,
  },
  bn: {
    code: "bn-IN",
    keywords: ["bengali", "বাংলা", "bn-in", "bn-bd"],
    fallbackLang: null,
  },
  mr: {
    code: "mr-IN",
    keywords: ["marathi", "मराठी", "mr-in"],
    fallbackLang: "hi",
  },
  te: {
    code: "te-IN",
    keywords: ["telugu", "తెలుగు", "te-in"],
    fallbackLang: null,
  },
  ta: {
    code: "ta-IN",
    keywords: ["tamil", "தமிழ்", "ta-in"],
    fallbackLang: null,
  },
  gu: {
    code: "gu-IN",
    keywords: ["gujarati", "ગુજરાતી", "gu-in"],
    fallbackLang: null,
  },
  kn: {
    code: "kn-IN",
    keywords: ["kannada", "ಕನ್ನಡ", "kn-in"],
    fallbackLang: null,
  },
  ml: {
    code: "ml-IN",
    keywords: ["malayalam", "മലയാളം", "ml-in"],
    fallbackLang: null,
  },
  pa: {
    code: "pa-IN",
    keywords: ["punjabi", "ਪੰਜਾਬੀ", "pa-in"],
    fallbackLang: null,
  },
  ur: {
    code: "ur-IN",
    keywords: ["urdu", "اردو", "ur-in", "ur-pk"],
    fallbackLang: null,
  },
  or: {
    code: "or-IN",
    keywords: ["odia", "oriya", "ଓଡ଼ିଆ", "or-in"],
    fallbackLang: null,
  },
  ne: {
    code: "ne-NP",
    keywords: ["nepali", "नेपाली", "ne-np", "ne-in"],
    fallbackLang: "hi",
  },

  // Devanagari Script Family (Falls back cleanly to Hindi voice if specific pack is absent)
  sa: {
    code: "sa-IN",
    keywords: ["sanskrit", "संस्कृतम्", "sa-in"],
    fallbackLang: "hi",
  },
  mai: {
    code: "mai-IN",
    keywords: ["maithili", "मैथिली", "mai-in"],
    fallbackLang: "hi",
  },
  kok: {
    code: "kok-IN",
    keywords: ["konkani", "कोंकणी", "kok-in"],
    fallbackLang: "mr",
  },
  doi: {
    code: "doi-IN",
    keywords: ["dogri", "डोगरी", "doi-in"],
    fallbackLang: "hi",
  },
  brx: {
    code: "brx-IN",
    keywords: ["bodo", "बड़ो", "brx-in"],
    fallbackLang: "hi",
  },

  // Bengali / Eastern Nagari Script Family
  as: {
    code: "as-IN",
    keywords: ["assamese", "অসমীয়া", "as-in"],
    fallbackLang: "bn",
  },
  mni: {
    code: "mni-IN",
    keywords: ["manipuri", "মৈতৈলোন্", "মিতেইলোন", "mni-in"],
    fallbackLang: "bn",
  },

  // Perso-Arabic Script Family
  sd: {
    code: "sd-IN",
    keywords: ["sindhi", "سنڌي", "sd-in"],
    fallbackLang: "ur",
  },
  ks: {
    code: "ks-IN",
    keywords: ["kashmiri", "कॉशुर", "کٲشُر", "ks-in"],
    fallbackLang: "ur",
  },

  // Ol Chiki / Santali (Falls back to English/Hindi)
  sat: {
    code: "sat-IN",
    keywords: ["santali", "ᱥᱟᱱᱛᱟᱲᱤ", "sat-in"],
    fallbackLang: "en",
  },
};

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const patientInfo = location.state?.patientInfo || {
    name: "Rahul Sharma",
    age: "28",
    gender: "Male",
    abhaId: "91-4582-1923-8821",
  };

  const language = location.state?.appLanguage || "en";
  const t = getT(language);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || {
    label: "English",
  };
  const languageName = currentLangObj.label.split(" ")[0];

  const [messages, setMessages] = useState([]);
  const [dynamicChips, setDynamicChips] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(1);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [uploadedDocBase64, setUploadedDocBase64] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);

  const messagesEndRef = useRef(null);

  // INCREASED TOTAL STEPS: Accommodates 5 AI questions + 1 Final message step
  const TOTAL_STEPS = 7;

  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const {
    transcript,
    listening: isListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (isListening) SpeechRecognition.stopListening();
  }, [language]);

  useEffect(() => {
    let timeoutId;
    const greetingText = t.greeting(patientInfo.name);

    setMessages([{ text: greetingText, sender: "ai" }]);
    setDynamicChips(t.defaultChips);

    if (isVoiceOn) {
      window.speechSynthesis.cancel();
      timeoutId = setTimeout(() => speakText(greetingText), 600);
    }
    return () => clearTimeout(timeoutId);
  }, [language, availableVoices]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, isAiThinking]);

  // Intelligent Voice Selector with Script-Family Fallback
  const findRegionalVoice = (langKey, voicesList) => {
    const langConfig = REGIONAL_LANG_MAP[langKey] || REGIONAL_LANG_MAP.en;
    const targetCode = langConfig.code.toLowerCase();
    const keywords = langConfig.keywords;

    // 1. Direct code match (e.g., 'ml-in', 'pa-in', 'ur-in')
    let match = voicesList.find((v) => {
      const vLang = v.lang ? v.lang.toLowerCase().replace("_", "-") : "";
      return vLang === targetCode || vLang.startsWith(targetCode.split("-")[0]);
    });

    // 2. Keyword match against voice name
    if (!match) {
      match = voicesList.find((v) => {
        const vName = v.name.toLowerCase();
        return keywords.some((kw) => vName.includes(kw));
      });
    }

    // 3. Script-Family Fallback (e.g., Sanskrit/Maithili -> Hindi, Assamese -> Bengali)
    if (!match && langConfig.fallbackLang) {
      const fallbackConfig = REGIONAL_LANG_MAP[langConfig.fallbackLang];
      if (fallbackConfig) {
        match = voicesList.find((v) => {
          const vLang = v.lang ? v.lang.toLowerCase().replace("_", "-") : "";
          return vLang.startsWith(fallbackConfig.code.split("-")[0]);
        });
      }
    }

    return match;
  };

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[\[\]\(\)\*\_#]/g, "")
      .replace(/^[🗣️📄🤖]\s*/, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices =
      availableVoices.length > 0
        ? availableVoices
        : window.speechSynthesis.getVoices();
    const langConfig = REGIONAL_LANG_MAP[language] || REGIONAL_LANG_MAP.en;

    const selectedVoice = findRegionalVoice(language, voices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      window.speechSynthesis.speak(utterance);
    } else {
      if (language === "en" || language === "hi") {
        utterance.lang = langConfig.code;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const processMessage = async (userText) => {
    if (!userText.trim()) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    resetTranscript();

    const updatedHistory = [...messages, { text: userText, sender: "user" }];
    setMessages(updatedHistory);
    setDynamicChips([]);

    if (step < TOTAL_STEPS - 1) {
      setIsAiThinking(true);
      const aiResponse = await generateNextChatResponse(
        updatedHistory,
        step,
        languageName,
      );
      setIsAiThinking(false);
      setMessages((prev) => [
        ...prev,
        { text: aiResponse.question, sender: "ai" },
      ]);
      setDynamicChips(aiResponse.options || []);
      setStep((prev) => prev + 1);
      if (isVoiceOn) speakText(aiResponse.question);
    } else if (step === TOTAL_STEPS - 1) {
      setMessages((prev) => [...prev, { text: t.finalMsg, sender: "ai" }]);
      setStep((prev) => prev + 1);
      if (isVoiceOn) speakText(t.finalMsg);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isListening) SpeechRecognition.stopListening();
    processMessage(input);
    setInput("");
  };

  const toggleMicrophone = () => {
    if (!browserSupportsSpeechRecognition) {
      alert(t.noMicSupport);
      return;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      const langConfig = REGIONAL_LANG_MAP[language] || REGIONAL_LANG_MAP.en;
      SpeechRecognition.startListening({
        continuous: true,
        language: langConfig.code,
      });
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setUploadedDocBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFinishAndAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const transcriptStr = messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");
      const aiResult = await generateMedicalCaseSummary(
        patientInfo,
        transcriptStr,
        uploadedDocBase64,
        languageName,
      );
      navigate("/success", {
        state: { currentCase: aiResult, appLanguage: language },
      });
    } catch (error) {
      console.error("AI Intake failed:", error);
      alert("Failed to analyze case. Please verify your Gemini API key.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-white shadow-lg border-x relative">
      {isListening && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center animate-pulse">
          <div className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <Mic size={14} /> {t.listening}
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 bg-blue-600 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <Bot size={24} className="flex-shrink-0" />
          <div className="truncate">
            <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
              MediKiosk Clinical Intake
            </h2>
            <p className="text-[10px] sm:text-[11px] text-blue-100 truncate">
              Patient: {patientInfo.name} ({patientInfo.age}y/
              {patientInfo.gender})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-blue-800 text-blue-100 text-xs font-bold px-2 py-1.5 rounded-lg shadow-inner">
            <Globe size={14} /> {currentLangObj.label}
          </div>
          <button
            onClick={() => {
              if (isVoiceOn) window.speechSynthesis.cancel();
              setIsVoiceOn(!isVoiceOn);
            }}
            className="p-2 bg-blue-700 hover:bg-blue-800 rounded-full transition"
            title={isVoiceOn ? "Mute Voice" : "Enable Voice"}
          >
            {isVoiceOn ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} className="opacity-60" />
            )}
          </button>
          <span className="hidden sm:inline text-xs bg-blue-950/80 px-2.5 py-1 rounded-full font-bold">
            {t.phase} {step}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-gray-50 pb-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}

        {step === 1 && !isAiThinking && (
          <div className="animate-fade-in-up">
            <BodyMapSelector onSelect={processMessage} />
          </div>
        )}

        {step >= 5 && !isAiThinking && (
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 flex-wrap">
                <FileImage size={16} className="text-blue-600" /> {t.moduleB}
              </span>
              {uploadedDocBase64 && (
                <button
                  onClick={() => {
                    setUploadedDocBase64(null);
                    setDocFileName("");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {uploadedDocBase64 ? (
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-900 truncate">
                <span className="font-semibold flex-shrink-0">
                  {t.attached}
                </span>{" "}
                <span className="truncate">{docFileName}</span>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-500 py-3 rounded-lg cursor-pointer bg-gray-50 transition text-xs text-gray-600 font-medium text-center px-2">
                <Upload size={16} className="text-gray-400 flex-shrink-0" />{" "}
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDocUpload}
                />
              </label>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />

        {step === TOTAL_STEPS && !isAiThinking && (
          <div className="flex justify-center mt-4 mb-2">
            <button
              onClick={handleFinishAndAnalyze}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-lg ${isAnalyzing ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 animate-pulse"}`}
            >
              {isAnalyzing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {isAnalyzing ? t.processing : t.submitDoc}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border-t">
        {dynamicChips.length > 0 && !isAiThinking && (
          <div className="flex gap-2 p-2.5 overflow-x-auto bg-gray-50 border-b scrollbar-none">
            {dynamicChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput("");
                  processMessage(chip);
                }}
                className="whitespace-nowrap px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs rounded-full hover:bg-blue-50 hover:border-blue-600 transition shadow-sm font-medium flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleMicrophone}
            disabled={isAiThinking || !browserSupportsSpeechRecognition}
            className={`p-3 rounded-full transition flex-shrink-0 ${isListening ? "bg-red-600 text-white shadow-md animate-pulse" : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm"} disabled:opacity-50`}
            title={t.dictation}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            disabled={step === TOTAL_STEPS || isAnalyzing || isAiThinking}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 text-sm"
            placeholder={t.chatPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={
              step === TOTAL_STEPS ||
              isAnalyzing ||
              isAiThinking ||
              !input.trim()
            }
            className="p-3 bg-blue-600 text-white rounded-full disabled:bg-gray-300 hover:bg-blue-700 transition flex-shrink-0 shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
        {/* ADDED DISCLAIMER SAFETY NET */}
        <div className="text-center pb-2 pt-1 px-4 text-[10px] text-gray-500 italic bg-white">
          ⚠️ This AI is for triage data collection only and is not providing a
          medical diagnosis. Please consult your examining physician.
        </div>
      </div>
    </div>
  );
}
