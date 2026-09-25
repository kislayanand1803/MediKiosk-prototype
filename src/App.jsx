import { useState, useEffect } from "react";
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
import AdminDashboard from "./pages/AdminDashboard";
import { KioskErrorBoundary } from "./components/KioskErrorBoundary";
import NetworkStatusBanner from "./components/NetworkStatusBanner";
import { useNetworkStatus } from "./hooks/useNetworkStatus";

/**
 * ============================================================================
 * APP ROOT
 * ============================================================================
 * Offline resilience is layered in three places relative to the existing
 * routing structure, so nothing about the staff-facing routes (doctor, triage,
 * pharmacy, admin) is affected:
 *
 *   1. KioskErrorBoundary  — wraps only /intake, /chat, /success, /kiosk.
 *      Staff dashboards are not wrapped; they have their own session recovery.
 *
 *   2. NetworkStatusBanner — rendered inside the boundary so it's part of the
 *      kiosk flow but outside individual pages, meaning it doesn't re-mount
 *      during navigation between /intake → /chat → /success.
 *
 *   3. useNetworkStatus    — the hook that backs the banner and the outbox.
 *      Moved into a small KioskShell wrapper below so it only runs when the
 *      kiosk routes are active, not for the whole app.
 *
 * Everything commented out at the bottom (the original App.jsx before the
 * Security Wall) is preserved exactly as it was.
 */

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

/**
 * KioskShell — isolates the network hook and banner to the kiosk flow only.
 * Rendered as the element of a parent <Route path="/*"> so the hook doesn't
 * run while staff are on /doctor, /triage, /admin, etc.
 * Also exposes `addToOutbox` and `flushOutbox` via React context if child pages
 * need them — passed here through location state for now since ChatPage already
 * receives patientInfo that way.
 */
function KioskShell({ children }) {
  const { isOnline, addToOutbox, flushOutbox, outboxCount } =
    useNetworkStatus();

  // FIX: Replaced useState initializer side-effect with useEffect to guarantee
  // proper cleanup on unmount and prevent stale closures in window.__kioskOffline.
  useEffect(() => {
    window.__kioskOffline = { addToOutbox, flushOutbox };
    return () => {
      delete window.__kioskOffline;
    };
  }, [addToOutbox, flushOutbox]);

  return (
    <>
      <NetworkStatusBanner isOnline={isOnline} outboxCount={outboxCount} />
      {children}
    </>
  );
}

function App() {
  // 1. Check if the user has successfully entered the PIN this session
  const [isUnlocked, setIsUnlocked] = useState(true);
  // To enable the Security Wall, uncomment the following line and comment out the above:
  // const [isUnlocked, setIsUnlocked] = useState(
  //   sessionStorage.getItem("medikiosk_demo_auth") === "true",
  // );

  // 2. If locked, render ONLY the Security Wall.
  if (!isUnlocked) {
    return <SecurityWall onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-800">
        <Routes>
          {/* Landing Page — no kiosk shell or error boundary needed */}
          <Route path="/" element={<LandingPage />} />

          {/* 
            FIX: Staff Dashboards moved OUTSIDE the KioskShell and KioskErrorBoundary 
            so doctors/nurses are never trapped inside the kiosk shell or error boundary.
          */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/triage" element={<TriageDashboard />} />
          <Route path="/dispensary" element={<PharmacyDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/*
            Patient Kiosk Flow — wrapped in:
              1. KioskErrorBoundary: catches white-screen crashes
              2. KioskShell: provides NetworkStatusBanner + outbox hook
            All three kiosk routes share one boundary and one banner instance
            so state doesn't reset on navigation between them.
          */}
          <Route
            path="/*"
            element={
              <KioskErrorBoundary>
                <KioskShell>
                  <Routes>
                    <Route path="/intake" element={<IntakePage />} />
                    <Route path="/kiosk" element={<IntakePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/success" element={<PatientSuccessPage />} />
                    <Route path="/verify" element={<VerifyPage />} />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </KioskShell>
              </KioskErrorBoundary>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
