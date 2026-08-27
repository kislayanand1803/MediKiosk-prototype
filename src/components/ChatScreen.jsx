import { useState } from "react";
import { generateMedicalCaseSummary } from "../services/aiService";

export default function ChatScreen({
  patientInfo,
  chatHistory,
  setChatHistory,
  onFinish,
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Append patient message
    const updatedHistory = [
      ...chatHistory,
      { sender: "patient", text: inputMessage },
    ];
    setChatHistory(updatedHistory);
    setInputMessage("");

    // Hackathon shortcut: Simulate a quick AI response or prompt next question
    setTimeout(() => {
      setChatHistory([
        ...updatedHistory,
        {
          sender: "ai",
          text: "Thank you. Do you have any fever, chills, or dizziness accompanying this?",
        },
      ]);
    }, 1000);
  };

  const handleFinalize = async () => {
    setLoading(true);
    // FIX: Passing patientInfo as the first argument so the AI has the demographics!
    const result = await generateMedicalCaseSummary(patientInfo, chatHistory);
    setLoading(false);
    onFinish(result);
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col h-[85vh]">
      <div className="bg-white p-3 rounded-t-lg border-b flex justify-between items-center shadow-sm">
        <span className="font-semibold text-blue-900">
          Consultation: {patientInfo.name}
        </span>
        <button
          onClick={handleFinalize}
          disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
        >
          {loading ? "Processing..." : "Finish & View Summary"}
        </button>
      </div>

      <div className="flex-1 bg-white p-4 overflow-y-auto space-y-3 border-x">
        {chatHistory.length === 0 && (
          <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
            AI: Hello {patientInfo.name}. Please describe your primary symptoms
            today.
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs text-sm ${msg.sender === "patient" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="bg-white p-3 rounded-b-lg border-t flex gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your answer..."
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
