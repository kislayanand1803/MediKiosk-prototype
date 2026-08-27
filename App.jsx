import { useState } from "react";
import PatientIntake from "./components/PatientIntake";
import ChatScreen from "./components/ChatScreen";
import CaseSummary from "./components/CaseSummary";
import DoctorDashboard from "./components/DoctorDashboard";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("intake"); // 'intake', 'chat', 'summary', 'doctor'
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [structuredCase, setStructuredCase] = useState(null);
  const [doctorQueue, setDoctorQueue] = useState([]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation Helper for Hackathon Demo Testing */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg">AI Clinical Triage (SIH26047)</h1>
        <div className="space-x-2 text-sm">
          <button
            onClick={() => setCurrentScreen("intake")}
            className="px-3 py-1 bg-blue-700 rounded"
          >
            Patient Flow
          </button>
          <button
            onClick={() => setCurrentScreen("doctor")}
            className="px-3 py-1 bg-blue-700 rounded"
          >
            Doctor Dashboard
          </button>
        </div>
      </nav>

      {/* Conditional Screen Rendering */}
      {currentScreen === "intake" && (
        <PatientIntake
          onStart={(info) => {
            setPatientInfo(info);
            setCurrentScreen("chat");
          }}
        />
      )}
      {currentScreen === "chat" && (
        <ChatScreen
          patientInfo={patientInfo}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onFinish={(summary) => {
            setStructuredCase(summary);
            setCurrentScreen("summary");
          }}
        />
      )}
      {currentScreen === "summary" && (
        <CaseSummary
          patientInfo={patientInfo}
          structuredCase={structuredCase}
          onSubmitToDoctor={() => {
            setDoctorQueue([
              ...doctorQueue,
              {
                id: Date.now(),
                patientInfo,
                structuredCase,
                status: "Pending",
              },
            ]);
            setCurrentScreen("doctor");
          }}
        />
      )}
      {currentScreen === "doctor" && (
        <DoctorDashboard
          doctorQueue={doctorQueue}
          setDoctorQueue={setDoctorQueue}
        />
      )}
    </div>
  );
}
