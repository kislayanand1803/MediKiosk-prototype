import { BrowserRouter, Routes, Route } from "react-router-dom";
import IntakePage from "./pages/IntakePage";
import ChatPage from "./pages/ChatPage";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-800">
        <Routes>
          <Route path="/" element={<IntakePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
