import "regenerator-runtime/runtime";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertTriangle,
  ChevronLeft,
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

/* Language Configuration Map */
const REGIONAL_LANG_MAP = {
  en: { code: "en-IN", keywords: ["english", "en-in"], fallbackLang: null },
  hi: {
    code: "hi-IN",
    keywords: ["hindi", "हिन्दी", "hi-in"],
    fallbackLang: null,
  },
  bn: { code: "bn-IN", keywords: ["bengali", "bn-in"], fallbackLang: null },
  mr: { code: "mr-IN", keywords: ["marathi", "mr-in"], fallbackLang: "hi" },
  te: { code: "te-IN", keywords: ["telugu", "te-in"], fallbackLang: null },
  ta: { code: "ta-IN", keywords: ["tamil", "ta-in"], fallbackLang: null },
  gu: { code: "gu-IN", keywords: ["gujarati", "gu-in"], fallbackLang: null },
  kn: { code: "kn-IN", keywords: ["kannada", "kn-in"], fallbackLang: null },
  ml: { code: "ml-IN", keywords: ["malayalam", "ml-in"], fallbackLang: null },
  pa: { code: "pa-IN", keywords: ["punjabi", "pa-in"], fallbackLang: null },
  ur: { code: "ur-IN", keywords: ["urdu", "ur-in"], fallbackLang: null },
  or: { code: "or-IN", keywords: ["odia", "or-in"], fallbackLang: null },
  ne: { code: "ne-NP", keywords: ["nepali", "ne-in"], fallbackLang: "hi" },
  sa: { code: "sa-IN", keywords: ["sanskrit", "sa-in"], fallbackLang: "hi" },
  mai: { code: "mai-IN", keywords: ["maithili", "mai-in"], fallbackLang: "hi" },
  kok: { code: "kok-IN", keywords: ["कोंकणी", "kok-in"], fallbackLang: "mr" },
  doi: { code: "doi-IN", keywords: ["dogri", "doi-in"], fallbackLang: "hi" },
  brx: { code: "brx-IN", keywords: ["bodo", "brx-in"], fallbackLang: "hi" },
  as: { code: "as-IN", keywords: ["assamese", "as-in"], fallbackLang: "bn" },
  mni: { code: "mni-IN", keywords: ["manipuri", "mni-in"], fallbackLang: "bn" },
  sd: { code: "sd-IN", keywords: ["sindhi", "sd-in"], fallbackLang: "ur" },
  ks: { code: "ks-IN", keywords: ["kashmiri", "ks-in"], fallbackLang: "ur" },
  sat: { code: "sat-IN", keywords: ["santali", "sat-in"], fallbackLang: "en" },
};

/* Emergency Modal Translation Dictionary */
const EMERGENCY_TRANSLATIONS = {
  en: {
    title: "⚠️ Critical Symptom Detected",
    desc: "You mentioned a symptom that may require immediate medical attention. Do you need emergency assistance?",
    btnEnd: "🚨 End Assessment & Request Emergency Review",
    btnContinue: "➡️ This is my normal baseline – Continue",
    voice: "Critical symptom detected. Do you need immediate emergency help?",
  },
  hi: {
    title: "⚠️ गंभीर लक्षण का पता चला",
    desc: "आपने एक ऐसे लक्षण का उल्लेख किया है जिसके लिए तत्काल चिकित्सा ध्यान देने की आवश्यकता हो सकती है।",
    btnEnd: "🚨 मूल्यांकन समाप्त करें और आपातकालीन जांच का अनुरोध करें",
    btnContinue: "➡️ यह मेरे लिए सामान्य है – जारी रखें",
    voice:
      "गंभीर लक्षण का पता चला है। क्या आपको तुरंत आपातकालीन सहायता की आवश्यकता है?",
  },
};

/* Intake Sequence List */
const INTAKE_STEPS = [
  "Symptoms & Location",
  "Digestion & Appetite",
  "Sleep & Energy",
  "Lifestyle & Stress",
  "Dietary Habits",
  "Document Upload",
  "Final Review",
];

/* Main ChatPage Component */
export default function ChatPage() {
  /* Routing Hooks */
  const navigate = useNavigate();
  const location = useLocation();

  /* Patient Data Context Initialization */
  const patientInfo = location.state?.patientInfo || {
    name: "Prachi Sharma",
    age: "20",
    gender: "Female",
    abhaId: "91-4582-1923-8821",
  };

  /* Application Language Initialization */
  const language = location.state?.appLanguage || "en";
  const t = getT(language);
  const emText = EMERGENCY_TRANSLATIONS[language] || EMERGENCY_TRANSLATIONS.en;
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || {
    label: "English",
  };
  const languageName = currentLangObj.label.split(" ")[0];

  /* UI State Variables */
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

  /* Emergency Event State Variables */
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(15);
  const [pendingAiResponse, setPendingAiResponse] = useState(null);

  /* Element References & Constants */
  const messagesEndRef = useRef(null);
  const TOTAL_STEPS = 7;

  /* System Voices Initialization Effect */
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) setAvailableVoices(voices);
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

  /* Emergency Timer Effect */
  useEffect(() => {
    let timer;
    if (showEmergencyModal && emergencyTimer > 0) {
      timer = setInterval(() => setEmergencyTimer((prev) => prev - 1), 1000);
    } else if (showEmergencyModal && emergencyTimer === 0) {
      handleEmergencyConfirm();
    }
    return () => clearInterval(timer);
  }, [showEmergencyModal, emergencyTimer]);

  /* Speech Recognition Hook Initialization */
  const {
    transcript,
    listening: isListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  /* Transcript Input Sync Effect */
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  /* Speech Recognition Reset Effect */
  useEffect(() => {
    if (isListening) SpeechRecognition.stopListening();
  }, [language]);

  /* Initial Greeting Mount Effect */
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

  /* Viewport Auto-Scroll Effect */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, isAiThinking]);

  /* Regional Voice Matcher Code */
  const findRegionalVoice = (langKey, voicesList) => {
    const langConfig = REGIONAL_LANG_MAP[langKey] || REGIONAL_LANG_MAP.en;
    const targetCode = langConfig.code.toLowerCase();
    const keywords = langConfig.keywords;

    let match = voicesList.find((v) => {
      const vLang = v.lang ? v.lang.toLowerCase().replace("_", "-") : "";
      return vLang === targetCode || vLang.startsWith(targetCode.split("-")[0]);
    });

    if (!match) {
      match = voicesList.find((v) => {
        const vName = v.name.toLowerCase();
        return keywords.some((kw) => vName.includes(kw));
      });
    }

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

  /* Audio Playback Execution Code */
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

    const langConfig = REGIONAL_LANG_MAP[language] || REGIONAL_LANG_MAP.en;
    utterance.lang = langConfig.code;

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = findRegionalVoice(language, voices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  /* AI Response DOM Appender */
  const proceedWithAiResponse = (aiResponse) => {
    setMessages((prev) => [
      ...prev,
      { text: aiResponse.question, sender: "ai" },
    ]);
    setDynamicChips(aiResponse.options || []);
    setStep((prev) => prev + 1);
    if (isVoiceOn) speakText(aiResponse.question);
  };

  /* Chat Orchestration Controller */
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

      if (aiResponse.critical_symptom_detected) {
        setPendingAiResponse(aiResponse);
        setShowEmergencyModal(true);
        setEmergencyTimer(15);
        if (isVoiceOn) speakText(emText.voice);
      } else {
        proceedWithAiResponse(aiResponse);
      }
    } else if (step === TOTAL_STEPS - 1) {
      setMessages((prev) => [...prev, { text: t.finalMsg, sender: "ai" }]);
      setStep((prev) => prev + 1);
      if (isVoiceOn) speakText(t.finalMsg);
    }
  };

  /* Input Submission Event Handler */
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isListening) SpeechRecognition.stopListening();
    processMessage(input);
    setInput("");
  };

  /* Microphone State Toggle Code */
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

  /* File Input Read Handler */
  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setUploadedDocBase64(reader.result);
    reader.readAsDataURL(file);
  };

  /* Triage Summary Generation Controller */
  const handleFinishAndAnalyze = async (isForcedEmergency = false) => {
    setIsAnalyzing(true);
    try {
      let transcriptStr = messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");

      if (isForcedEmergency) {
        transcriptStr += "\nSYSTEM: PATIENT CONFIRMED CRITICAL EMERGENCY.";
      }

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

  /* Modal Confirm Action Code */
  const handleEmergencyConfirm = () => {
    setShowEmergencyModal(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    handleFinishAndAnalyze(true);
  };

  /* Modal Dismiss Action Code */
  const handleEmergencyDismiss = () => {
    setShowEmergencyModal(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (pendingAiResponse) {
      proceedWithAiResponse(pendingAiResponse);
      setPendingAiResponse(null);
    }
  };

  /* React UI Render Code */
  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden font-sans">
      {/* Emergency Modal UI Container */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-2 border-red-500 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-6"
            >
              <div className="mx-auto bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center animate-pulse shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {emText.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {emText.desc}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleEmergencyConfirm}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm focus:ring-4 focus:ring-red-500/50"
                >
                  {emText.btnEnd} ({emergencyTimer}s)
                </button>
                <button
                  onClick={handleEmergencyDismiss}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm focus:ring-4 focus:ring-gray-200"
                >
                  {emText.btnContinue}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Container */}
      <header className="h-16 bg-[#0f3c31] text-white flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 shadow-md border-b border-[#1a4f43]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/intake")}
            className="p-2 hover:bg-white/10 rounded-lg transition text-emerald-100 hidden sm:block"
            title="Back to Intake"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="bg-[#cd6b40] p-1.5 rounded-lg hidden sm:block">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] leading-tight tracking-wide">
              MediKiosk Clinical Intake
            </span>
            <span className="text-[11px] text-emerald-100/70">
              Patient <strong className="text-white">{patientInfo.name}</strong>{" "}
              • {patientInfo.age}y • {patientInfo.gender}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] text-emerald-200/80 uppercase tracking-widest mb-1">
              Symptom Capture Step {step} of {TOTAL_STEPS}
            </span>
            <div className="w-32 h-1 bg-[#1a4f43] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#cd6b40] transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1a4f43] border border-emerald-700/50 px-3 py-1.5 rounded-full text-xs font-medium">
            <Globe size={14} className="text-emerald-200" />
            <span>{currentLangObj.label.split(" ")[0]}</span>
          </div>

          <button
            onClick={() => {
              if (isVoiceOn) window.speechSynthesis.cancel();
              setIsVoiceOn(!isVoiceOn);
            }}
            className="p-2 bg-[#1a4f43] hover:bg-emerald-800 border border-emerald-700/50 rounded-full transition"
            title={isVoiceOn ? "Mute Voice" : "Enable Voice"}
          >
            {isVoiceOn ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} className="opacity-60" />
            )}
          </button>
        </div>
      </header>

      {/* Main Layout Grid Container */}
      <div className="flex-1 flex overflow-hidden bg-[#f8fafc]">
        {/* Left Sidebar Context Container */}
        <aside className="hidden md:flex w-[260px] bg-[#0f3c31] flex-col shrink-0 z-10 shadow-lg">
          <div className="p-6">
            <div className="bg-[#1a4f43] border border-emerald-700/30 rounded-2xl p-4">
              <div className="w-10 h-10 bg-[#cd6b40] rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">
                {patientInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </div>
              <h3 className="font-bold text-white text-sm truncate">
                {patientInfo.name}
              </h3>
              <p className="text-[11px] text-emerald-100/70 mb-4">
                {patientInfo.age} years • {patientInfo.gender}
              </p>

              <div className="space-y-2 border-t border-emerald-700/50 pt-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-200/70">Token</span>
                  <span className="text-white font-medium">Pending</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-200/70">Visit type</span>
                  <span className="text-white font-medium">Walk-in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 flex-1 overflow-y-auto">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
              Intake Steps
            </h4>
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px before:h-full before:w-[2px] before:bg-[#1a4f43]">
              {INTAKE_STEPS.map((stepName, index) => {
                const stepNum = index + 1;
                const isCompleted = step > stepNum;
                const isActive = step === stepNum;

                return (
                  <div
                    key={index}
                    className="relative flex items-center gap-4 z-10 group"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : isActive
                            ? "bg-[#cd6b40] border-[#cd6b40]"
                            : "bg-[#0f3c31] border-[#1a4f43]"
                      }`}
                    >
                      {isCompleted && (
                        <div className="w-1.5 h-1.5 bg-[#0f3c31] rounded-full"></div>
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        isActive
                          ? "text-white font-bold"
                          : "text-emerald-100/50 font-medium"
                      }`}
                    >
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center Chat Viewport Container */}
        <main className="flex-1 flex flex-col h-full bg-white relative shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] z-20 rounded-tl-none md:rounded-tl-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth bg-slate-50/30">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start gap-3"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-[#0f3c31] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 text-[14px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#1d6b54] text-white rounded-2xl rounded-tr-sm"
                        : "bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#0f3c31] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                  AI
                </div>
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[52px]">
                  <div
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </motion.div>
            )}

            {/* Mobile Body Selector Container */}
            {step === 1 && !isAiThinking && (
              <div className="block lg:hidden mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-center mb-4 text-slate-700">
                  Where does it hurt?
                </h3>
                <BodyMapSelector onSelect={processMessage} />
              </div>
            )}

            {/* Document Upload UI Container */}
            {step >= 5 && !isAiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                      <FileImage size={18} />
                    </div>
                    {t.moduleB}
                  </span>
                  {uploadedDocBase64 && (
                    <button
                      onClick={() => {
                        setUploadedDocBase64(null);
                        setDocFileName("");
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {uploadedDocBase64 ? (
                  <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm text-emerald-900 truncate">
                    <CheckCircle
                      size={16}
                      className="text-emerald-500 shrink-0"
                    />
                    <span className="font-semibold flex-shrink-0">
                      {t.attached}
                    </span>
                    <span className="truncate font-mono text-xs">
                      {docFileName}
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#1d6b54] hover:bg-emerald-50/30 py-8 rounded-xl cursor-pointer transition-all text-sm text-slate-600 font-semibold text-center group">
                    <Upload
                      size={24}
                      className="text-slate-400 group-hover:text-[#1d6b54] group-hover:-translate-y-1 transition-all"
                    />
                    {t.upload}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                  </label>
                )}
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-4" />

            {/* Submission Button Container */}
            {step === TOTAL_STEPS && !isAiThinking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center mt-8 mb-4"
              >
                <button
                  onClick={() => handleFinishAndAnalyze(false)}
                  disabled={isAnalyzing}
                  className={`flex items-center gap-2 text-white px-8 py-3.5 rounded-full font-bold text-[15px] transition-all shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-[#cd6b40]/50 ${
                    isAnalyzing
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-[#cd6b40] hover:bg-[#b05832]"
                  }`}
                >
                  {isAnalyzing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  {isAnalyzing ? t.processing : t.submitDoc}
                </button>
              </motion.div>
            )}
          </div>

          {/* Bottom Chat Input Form Container */}
          <div className="bg-white px-4 sm:px-8 pb-6 pt-2 z-10 flex flex-col items-center border-t border-slate-100">
            <AnimatePresence>
              {dynamicChips.length > 0 &&
                !isAiThinking &&
                !showEmergencyModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 pb-4 overflow-x-auto scrollbar-none w-full max-w-4xl"
                  >
                    {dynamicChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput("");
                          processMessage(chip);
                        }}
                        className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] rounded-xl hover:border-[#1d6b54] hover:text-[#1d6b54] hover:bg-emerald-50/50 transition-all shadow-sm font-medium shrink-0 focus:ring-2 focus:ring-[#1d6b54]"
                      >
                        {chip}
                      </button>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>

            <form
              onSubmit={handleSend}
              className="w-full max-w-4xl relative flex items-center bg-slate-100 rounded-full border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-[#1d6b54] focus-within:border-transparent transition-all shadow-inner"
            >
              <button
                type="button"
                onClick={toggleMicrophone}
                disabled={
                  isAiThinking ||
                  showEmergencyModal ||
                  !browserSupportsSpeechRecognition
                }
                className={`p-3 rounded-full transition-all shrink-0 ml-1 ${
                  isListening
                    ? "bg-red-500 text-white shadow-md animate-pulse"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                } disabled:opacity-50`}
                title={t.dictation}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                disabled={
                  step === TOTAL_STEPS ||
                  isAnalyzing ||
                  isAiThinking ||
                  showEmergencyModal
                }
                className="flex-1 bg-transparent px-3 py-3 focus:outline-none text-[15px] text-slate-800 disabled:opacity-60 placeholder:text-slate-400"
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
                  showEmergencyModal ||
                  !input.trim()
                }
                className="p-3 bg-[#0f3c31] text-white rounded-full disabled:bg-slate-300 hover:bg-[#1a4f43] transition-all shrink-0 shadow-md"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>

            <div className="text-center mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <AlertTriangle size={12} className="text-orange-400" />
              <span>
                AI triage data collection only — not a final medical diagnosis
              </span>
            </div>
          </div>
        </main>

        {/* --- PERSISTENT RIGHT PANEL (Replaces the "Void") --- */}
        <aside className="hidden lg:flex w-[320px] xl:w-[380px] bg-slate-50 border-l border-slate-200 flex-col overflow-y-auto shrink-0 z-10">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-end">
              <div>
                <h3 className="font-bold text-slate-800">
                  {step === 1 ? "Where does it hurt?" : "Clinical Body Map"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {step === 1
                    ? "Tap regions to select, then click Confirm."
                    : "Regions recorded for Vaidya review."}
                </p>
              </div>
              {step > 1 && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                  Captured
                </span>
              )}
            </div>

            {/* Body Map remains visible throughout the chat, but becomes read-only after step 1 */}
            <div
              className={`bg-white p-4 rounded-3xl border shadow-sm flex items-center justify-center min-h-[400px] transition-all duration-500 ${
                step > 1
                  ? "border-emerald-200 bg-emerald-50/20 pointer-events-none"
                  : "border-slate-200"
              }`}
            >
              <BodyMapSelector onSelect={processMessage} />
            </div>

            {/* Show Common Symptoms only during Step 1 */}
            {step === 1 && (
              <div className="mt-8">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Common today
                </h3>
                <div className="space-y-2.5">
                  {["Cold & cough", "Body ache", "Digestion issues"].map(
                    (symptom, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput("");
                          processMessage(symptom);
                        }}
                        className="w-full flex justify-between items-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-[#1d6b54] hover:shadow-sm transition group"
                      >
                        <span className="text-sm font-medium text-slate-700 group-hover:text-[#1d6b54]">
                          {symptom}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          Common
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Show Live Medical Tracker after Step 1 */}
            {step > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Live Session Notes
                </h3>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-[#cd6b40] rounded-full mt-1.5"></div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      AI is actively analyzing patient responses for Dashavidha
                      Pariksha metrics.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Awaiting clinical document uploads (optional).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
