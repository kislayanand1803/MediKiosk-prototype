import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import IntakePage from "./pages/IntakePage";
import ChatPage from "./pages/ChatPage";
import PatientSuccessPage from "./pages/PatientSuccessPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import VerifyPage from "./pages/VerifyPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-800">
        <Routes>
          {/* Landing Page as the introductory front door */}
          <Route path="/" element={<LandingPage />} />

          {/* Patient Kiosk Flow */}
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/kiosk" element={<IntakePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/success" element={<PatientSuccessPage />} />

          {/* Doctor & Verification Flow */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
