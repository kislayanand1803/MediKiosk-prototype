import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDoctorSession } from "./dashboard-hooks/useDoctorSession";
import { useDarkMode } from "./dashboard-hooks/useDarkMode";
import { useLiveClock } from "./dashboard-hooks/useLiveClock";
import { useIdleLogout } from "./dashboard-hooks/useIdleLogout";
import { usePatientQueue } from "./dashboard-hooks/usePatientQueue";
import { PATIENT_STATUS } from "./dashboard-data/patientStatus";
import { downloadClinicalReport } from "./dashboard-utils/clinicalReport";
import { copyFhirBundle, downloadFhirBundle } from "./dashboard-utils/fhirBundle";
import LoginScreen from "./dashboard-components/LoginScreen";
import DashboardHeader from "./dashboard-components/DashboardHeader";
import QueueTab from "./dashboard-components/QueueTab";
import AnalyticsPanel from "./dashboard-components/AnalyticsPanel";
import FhirExportModal from "./dashboard-components/FhirExportModal";
import DocumentViewerModal from "./dashboard-components/DocumentViewerModal";

/**
 * ==========================================
 * DOCTOR DASHBOARD (PHYSICIAN PORTAL)
 * ==========================================
 * Top-level page for the Vaidya/physician portal. This component
 * owns only the state that's genuinely shared across the whole page
 * (auth session, active tab, dark mode, date/filters, which modal is
 * open) and delegates everything else to focused hooks and
 * dashboard-components:
 *
 *   - useDoctorSession → Supabase Auth session (replaces the old
 *                        client-side credential check — see
 *                        SUPABASE_AUTH_SETUP.md for the one-time
 *                        dashboard configuration this depends on)
 *   - useDarkMode      → theme persistence
 *   - useLiveClock     → the ticking "now" used for wait/consult timers
 *   - useIdleLogout    → DPDP-driven auto-lock after inactivity
 *   - usePatientQueue  → fetching, real-time sync, and actions on the
 *                        day's patient queue (including Module B's
 *                        OCR/timeline/document fields)
 *
 * The `dashboard-` prefix on these folders (rather than plain
 * "components"/"hooks") keeps this page's building blocks visually
 * distinct from LandingPage's components/data folders and from the
 * app-wide src/components folder (e.g. ClinicalTimeline).
 */
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout } = useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const now = useLiveClock(isAuthenticated);
  useIdleLogout(isAuthenticated, logout);

  const [activeTab, setActiveTab] = useState("queue");
  const [queueFilter, setQueueFilter] = useState(PATIENT_STATUS.WAITING);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showFhirModal, setShowFhirModal] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  const queue = usePatientQueue(selectedDate, isAuthenticated);

  // Selecting a patient who's already "In Consultation" (e.g. reopened
  // from another device) restarts the local stopwatch if none is running.
  const handleSelectPatientWithTimer = (patient) => {
    queue.handleSelectPatient(patient);
    if (patient.status === PATIENT_STATUS.IN_CONSULTATION && !queue.consultationStartTime) {
      queue.setConsultationStartTime(Date.now());
    }
  };

  // Calling the next patient also flips the queue filter to "In
  // Consult" so the doctor immediately sees where that patient landed.
  const handleCallNext = async () => {
    const result = await queue.handleCallNextPatient();
    if (result.calledPatient) setQueueFilter(PATIENT_STATUS.IN_CONSULTATION);
    return result;
  };

  const handleChangeDate = (date) => {
    setSelectedDate(date);
    queue.setSelectedPatient(null);
  };

  const handleCopyFhir = () => {
    copyFhirBundle(queue.selectedPatient);
    setCopiedFhir(true);
    setTimeout(() => setCopiedFhir(false), 2000);
  };

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDynamicWaitTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const diffMins = Math.floor((now - new Date(createdAt)) / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getElapsedConsultationTime = () => {
    if (!queue.consultationStartTime) return "00:00";
    const diffSecs = Math.floor((now - queue.consultationStartTime) / 1000);
    const mins = String(Math.floor(diffSecs / 60)).padStart(2, "0");
    const secs = String(diffSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // --- Analytics derived data ---
  const totalFootfall = queue.patients.length;
  const approvedCount = queue.patients.filter((p) => p.status === PATIENT_STATUS.APPROVED).length;
  const redFlagCount = queue.patients.filter((p) => p.is_red_flag).length;
  const abhaLinkedCount = queue.patients.filter((p) => p.abha_id && p.abha_id !== "Not Linked").length;

  const averageDosha = (index, fallback) =>
    totalFootfall
      ? Math.round(
          queue.patients.reduce((sum, p) => sum + (p.dosha_data?.[index]?.value ?? 50), 0) / totalFootfall,
        )
      : fallback;

  const doshaBarData = [
    { name: "Vata (Air)", value: averageDosha(0, 65) },
    { name: "Pitta (Fire)", value: averageDosha(1, 55) },
    { name: "Kapha (Earth)", value: averageDosha(2, 40) },
  ];

  if (isLoadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onBackHome={() => navigate("/")} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors duration-200 flex flex-col">
      <div className="mx-auto w-full flex-1 flex flex-col space-y-4 overflow-hidden">
        <DashboardHeader
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onLogout={logout}
          onGoHome={() => navigate("/")}
        />

        {activeTab === "queue" && (
          <QueueTab
            patients={queue.patients}
            selectedPatient={queue.selectedPatient}
            isEditing={queue.isEditing}
            caseNotes={queue.caseNotes}
            selectedDate={selectedDate}
            queueFilter={queueFilter}
            searchQuery={searchQuery}
            isDarkMode={isDarkMode}
            onChangeDate={handleChangeDate}
            onChangeQueueFilter={setQueueFilter}
            onChangeSearchQuery={setSearchQuery}
            onSelectPatient={handleSelectPatientWithTimer}
            onCallNextPatient={handleCallNext}
            onChangeCaseNotes={queue.setCaseNotes}
            onToggleEdit={() => (queue.isEditing ? queue.handleSaveNotes() : queue.setIsEditing(true))}
            onApprove={queue.handleApprove}
            onDownloadReport={() => downloadClinicalReport(queue.selectedPatient, queue.caseNotes)}
            onOpenFhirModal={() => setShowFhirModal(true)}
            onOpenDocViewer={() => setShowDocViewer(true)}
            formatTime={formatTime}
            getDynamicWaitTime={getDynamicWaitTime}
            getElapsedConsultationTime={getElapsedConsultationTime}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsPanel
            totalFootfall={totalFootfall}
            approvedCount={approvedCount}
            redFlagCount={redFlagCount}
            abhaLinkedCount={abhaLinkedCount}
            doshaBarData={doshaBarData}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {showFhirModal && (
        <FhirExportModal
          patient={queue.selectedPatient}
          onClose={() => setShowFhirModal(false)}
          onCopy={handleCopyFhir}
          copied={copiedFhir}
          onDownload={() => downloadFhirBundle(queue.selectedPatient)}
        />
      )}

      {showDocViewer && (
        <DocumentViewerModal patient={queue.selectedPatient} onClose={() => setShowDocViewer(false)} />
      )}
    </div>
  );
}
