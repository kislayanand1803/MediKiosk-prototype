import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SecurityWall from "./pages/SecurityWall";
import LandingPage from "./pages/LandingPage";
import IntakePage from "./pages/IntakePage";
import ChatPage from "./pages/ChatPage";
import PatientSuccessPage from "./pages/PatientSuccessPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import VerifyPage from "./pages/VerifyPage";
import TriageDashboard from "./pages/TriageDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";

// Temporary Placeholder Component for Phase 2 Roles
const PlaceholderView = ({ title, role }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center space-y-4">
    <h1 className="text-3xl font-black text-emerald-500">{title}</h1>
    <p className="text-slate-400 max-w-md leading-relaxed">
      You have successfully authenticated as a <strong>{role}</strong>. This
      workspace is currently being built for Milestone 3/4.
    </p>
    <button
      onClick={() => (window.location.href = "/")}
      className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition"
    >
      Logout / Return Home
    </button>
  </div>
);

function App() {
  // 1. Check if the user has successfully entered the PIN this session
  //-- This state determines whether to show the Security Wall or the actual app
  const [isUnlocked, setIsUnlocked] = useState(true);
  // To enable the Security Wall, uncomment the following line and comment out the above line:
  // const [isUnlocked, setIsUnlocked] = useState(
  //   sessionStorage.getItem("medikiosk_demo_auth") === "true",
  // );

  // 2. If locked, render ONLY the Security Wall. The router doesn't even exist yet.
  if (!isUnlocked) {
    return <SecurityWall onUnlock={() => setIsUnlocked(true)} />;
  }

  // 3. If unlocked, render your exact original app!
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

          {/* Verification Flow */}
          <Route path="/verify" element={<VerifyPage />} />

          {/* PHASE 2: Role-Based Workspaces */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/triage" element={<TriageDashboard />} />
          <Route path="/dispensary" element={<PharmacyDashboard />} />
          <Route
            path="/admin"
            element={
              <PlaceholderView title="Command Center" role="Administrator" />
            }
          />

          {/* AUTOMATIC REDIRECT: Catches /home or any typo and sends them safely to the landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

// The following is the original App.jsx code before the Security Wall was added. It has been commented out for reference and potential rollback purposes.

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import LandingPage from "./pages/LandingPage";
// import IntakePage from "./pages/IntakePage";
// import ChatPage from "./pages/ChatPage";
// import PatientSuccessPage from "./pages/PatientSuccessPage";
// import DoctorDashboard from "./pages/DoctorDashboard";
// import VerifyPage from "./pages/VerifyPage";

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="min-h-screen font-sans text-gray-800">
//         <Routes>
//           {/* Landing Page as the introductory front door */}
//           <Route path="/" element={<LandingPage />} />

//           {/* Patient Kiosk Flow */}
//           <Route path="/intake" element={<IntakePage />} />
//           <Route path="/kiosk" element={<IntakePage />} />
//           <Route path="/chat" element={<ChatPage />} />
//           <Route path="/success" element={<PatientSuccessPage />} />

//           {/* Doctor & Verification Flow */}
//           <Route path="/doctor" element={<DoctorDashboard />} />
//           <Route path="/verify" element={<VerifyPage />} />
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;
