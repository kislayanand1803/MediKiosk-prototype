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
} from "lucide-react";
import BodyMapSelector from "../components/BodyMapSelector";
import { generateMedicalCaseSummary } from "../services/aiService";

const generateAIResponse = (currentStep, userText = "") => {
  const text = userText.toLowerCase();
  if (currentStep === 1) {
    if (text.includes("headache") || text.includes("head")) {
      return "I understand you have a headache. Is the pain throbbing, or does it feel like a tight band around your head?";
    } else if (
      text.includes("stomach") ||
      text.includes("belly") ||
      text.includes("acid")
    ) {
      return "Stomach discomfort noted. Do you experience acid reflux, sour belching, or burning sensations after meals?";
    } else if (
      text.includes("joint") ||
      text.includes("knee") ||
      text.includes("pain")
    ) {
      return "Joint discomfort noted. Is there morning stiffness, cracking sounds (crepitus), or swelling in the joint?";
    } else {
      return "Understood. Could you share how long this symptom has persisted and if it affects your sleep or digestion?";
    }
  }
  if (currentStep === 2) {
    return "Thank you. And how is your appetite and bowel regularity (Agni and Koshtha state)?";
  }
  if (currentStep === 3) {
    return "Noted. If you have any physical prescriptions or recent lab reports, please upload them below before we summarize your case.";
  }
  return "Compiling your Ayush clinical intake file...";
};

const getQuickReplies = (currentStep, lastUserMessage = "") => {
  if (currentStep === 1)
    return ["Severe Headache", "Acid Reflux & Indigestion", "Knee Joint Pain"];
  if (currentStep === 2) {
    const text = lastUserMessage.toLowerCase();
    if (text.includes("head"))
      return [
        "Throbbing headache",
        "Tight band feeling",
        "Severe one-sided pain",
      ];
    if (text.includes("stomach") || text.includes("acid"))
      return ["Burning chest/throat", "Irregular appetite", "Sour belching"];
    return ["Morning joint stiffness", "Aggravated by cold", "Mild swelling"];
  }
  if (currentStep === 3)
    return [
      "Irregular appetite (Vishamagni)",
      "Excessive hunger (Tikshnagni)",
      "Sluggish digestion (Mandagni)",
    ];
  return [];
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

  const [messages, setMessages] = useState([
    {
      text: `Namaste ${patientInfo.name}. I am your MediKiosk Ayush AI Clinical Assistant. What symptoms are you experiencing today?`,
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(1);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedDocBase64, setUploadedDocBase64] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const messagesEndRef = useRef(null);

  const TOTAL_STEPS = 4;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isVoiceOn) {
      setTimeout(() => speakText(messages[0].text), 500);
    }
    return () => window.speechSynthesis.cancel();
  }, []);

  const processMessage = (userText) => {
    setMessages((prev) => [...prev, { text: userText, sender: "user" }]);
    if (step < TOTAL_STEPS) {
      setTimeout(() => {
        const nextAiMessage = generateAIResponse(step, userText);
        setMessages((prev) => [...prev, { text: nextAiMessage, sender: "ai" }]);
        setStep((prev) => prev + 1);
        if (isVoiceOn) speakText(nextAiMessage);
      }, 900);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    processMessage(input);
    setInput("");
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedDocBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFinishAndAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const transcript = messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");
      const aiResult = await generateMedicalCaseSummary(
        patientInfo,
        transcript,
        uploadedDocBase64,
      );
      navigate("/doctor", { state: { currentCase: aiResult } });
    } catch (error) {
      console.error("AI Intake failed:", error);
      alert("Failed to analyze case. Please verify your Gemini API key.");
      setIsAnalyzing(false);
    }
  };

  const lastUserMessage =
    messages
      .slice()
      .reverse()
      .find((m) => m.sender === "user")?.text || "";
  const currentChips = getQuickReplies(step, lastUserMessage);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-lg border-x">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <div>
            <h2 className="font-bold text-base leading-tight">
              MediKiosk Clinical Intake
            </h2>
            <p className="text-[11px] text-blue-100">
              Patient: {patientInfo.name} ({patientInfo.age}y/
              {patientInfo.gender})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
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
          <span className="text-xs bg-blue-950/80 px-2.5 py-1 rounded-full font-bold">
            Phase {step}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 pb-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {step === 1 && (
          <div className="animate-fade-in-up">
            <BodyMapSelector onSelect={processMessage} />
          </div>
        )}

        {/* Document Upload Box in Step 3/4 */}
        {step >= 3 && (
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FileImage size={16} className="text-blue-600" /> Module B:
                Physical Medical Document / Lab OCR
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
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-900">
                <span className="font-semibold">Attached:</span> {docFileName}
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-500 py-3 rounded-lg cursor-pointer bg-gray-50 transition text-xs text-gray-600 font-medium">
                <Upload size={16} className="text-gray-400" /> Upload
                Prescription / Lab Report Image
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

        {step === TOTAL_STEPS && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleFinishAndAnalyze}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-lg ${
                isAnalyzing
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700 animate-pulse"
              }`}
            >
              {isAnalyzing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {isAnalyzing
                ? "Processing Clinical & Ayurvedic Triage..."
                : "Submit to Physician Portal ➔"}
            </button>
          </div>
        )}
      </div>

      {/* Input & Quick Replies */}
      <div className="bg-white border-t">
        {currentChips.length > 0 && (
          <div className="flex gap-2 p-2.5 overflow-x-auto bg-gray-50 border-b">
            {currentChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => processMessage(chip)}
                className="whitespace-nowrap px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs rounded-full hover:bg-blue-50 hover:border-blue-600 transition shadow-sm font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3.5 flex gap-2">
          <input
            type="text"
            disabled={step === TOTAL_STEPS || isAnalyzing}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 text-sm"
            placeholder="Type your response or select from options above..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={step === TOTAL_STEPS || isAnalyzing}
            className="p-2.5 bg-blue-600 text-white rounded-full disabled:bg-gray-300 hover:bg-blue-700 transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
