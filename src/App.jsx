import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/" element={<IntakePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/success" element={<PatientSuccessPage />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
