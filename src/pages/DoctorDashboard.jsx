import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

import { useDoctorSession } from "./dashboard-hooks/useDoctorSession";
import { useDarkMode } from "./dashboard-hooks/useDarkMode";
import { useLiveClock } from "./dashboard-hooks/useLiveClock";
import { useIdleLogout } from "./dashboard-hooks/useIdleLogout";
import { usePatientQueue } from "./dashboard-hooks/usePatientQueue";
import { PATIENT_STATUS } from "./dashboard-data/patientStatus";
import { downloadClinicalReport } from "./dashboard-utils/clinicalReport";
import {
  copyFhirBundle,
  downloadFhirBundle,
} from "./dashboard-utils/fhirBundle";
import { generateEPrescription } from "./dashboard-utils/ePrescription";

import LoginScreen from "./dashboard-components/LoginScreen";
import DashboardHeader from "./dashboard-components/DashboardHeader";
import QueueTab from "./dashboard-components/QueueTab";
import AnalyticsPanel from "./dashboard-components/AnalyticsPanel";
import FhirExportModal from "./dashboard-components/FhirExportModal";
import DocumentViewerModal from "./dashboard-components/DocumentViewerModal";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout, profile } =
    useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const now = useLiveClock(isAuthenticated);
  useIdleLogout(isAuthenticated, logout);

  const [activeTab, setActiveTab] = useState("queue");
  const [queueFilter, setQueueFilter] = useState(PATIENT_STATUS.WAITING);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // NEW: State for Monthly Analytics Filter
  const [analyticsMonth, setAnalyticsMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );

  const [showFhirModal, setShowFhirModal] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  const queue = usePatientQueue(selectedDate, isAuthenticated, profile);

  // ========================================================================
  // GLOBAL HISTORICAL FETCH FOR ANALYTICS (NOW MONTH-BOUNDED)
  // ========================================================================
  const [allPatients, setAllPatients] = useState([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "analytics") return;

    let isMounted = true;

    async function loadAnalytics() {
      setIsAnalyticsLoading(true);
      try {
        // Calculate start and end of the selected month
        const year = parseInt(analyticsMonth.split("-")[0], 10);
        const month = parseInt(analyticsMonth.split("-")[1], 10) - 1; // JS months are 0-indexed

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        let query = supabase
          .from("patients")
          .select(
            "id, created_at, name, age, gender, abha_id, token_number, status, is_red_flag, primary_complaint, dosha_data, department",
          )
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());

        if (profile?.department && profile.department !== "General") {
          query = query.eq("department", profile.department);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Supabase Analytics Fetch Error:", error);
          setIsAnalyticsLoading(false);
          return;
        }

        if (isMounted) {
          setAllPatients(data || []);
          setIsAnalyticsLoading(false);
        }
      } catch (err) {
        console.error("Analytics network error:", err);
        if (isMounted) setIsAnalyticsLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    activeTab,
    analyticsMonth,
    queue.patients.length,
    profile?.department,
  ]);

  // Use allPatients directly. If it's an empty month, we want it to show 0, not fallback to today's queue.
  const activeDataset = allPatients;

  const analyticsFootfall = activeDataset.length;
  const analyticsApproved = activeDataset.filter(
    (p) => p.status === PATIENT_STATUS.APPROVED,
  ).length;
  const analyticsRedFlag = activeDataset.filter((p) => p.is_red_flag).length;
  const analyticsAbha = activeDataset.filter(
    (p) => p.abha_id && p.abha_id !== "Not Linked",
  ).length;

  const averageDosha = (index, fallback) =>
    analyticsFootfall
      ? Math.round(
          activeDataset.reduce(
            (sum, p) => sum + (p.dosha_data?.[index]?.value ?? 50),
            0,
          ) / analyticsFootfall,
        )
      : fallback;

  const doshaBarData = [
    { name: "Vata (Air)", value: averageDosha(0, 65) },
    { name: "Pitta (Fire)", value: averageDosha(1, 55) },
    { name: "Kapha (Earth)", value: averageDosha(2, 40) },
  ];

  const getTopComplaints = () => {
    const cats = {
      Fever: 0,
      Pain: 0,
      Respiratory: 0,
      Digestive: 0,
      Skin: 0,
      Other: 0,
    };
    activeDataset.forEach((p) => {
      const text = (p.primary_complaint || "").toLowerCase();
      if (
        text.includes("fever") ||
        text.includes("बुखार") ||
        text.includes("hot") ||
        text.includes("chills")
      )
        cats.Fever++;
      else if (
        text.includes("pain") ||
        text.includes("ache") ||
        text.includes("दर्द") ||
        text.includes("सिरदर्द") ||
        text.includes("headache")
      )
        cats.Pain++;
      else if (
        text.includes("cough") ||
        text.includes("breath") ||
        text.includes("खांसी") ||
        text.includes("सांस") ||
        text.includes("cold")
      )
        cats.Respiratory++;
      else if (
        text.includes("stomach") ||
        text.includes("digestion") ||
        text.includes("vomit") ||
        text.includes("पेट") ||
        text.includes("उल्टी") ||
        text.includes("nausea")
      )
        cats.Digestive++;
      else if (
        text.includes("skin") ||
        text.includes("rash") ||
        text.includes("itch") ||
        text.includes("खुजली")
      )
        cats.Skin++;
      else cats.Other++;
    });

    return Object.entries(cats)
      .map(([name, count]) => ({ name, count }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getDemographics = () => {
    const ages = { "0-18": 0, "19-35": 0, "36-50": 0, "51+": 0 };
    const genders = { Male: 0, Female: 0, Other: 0 };

    activeDataset.forEach((p) => {
      const age = parseInt(p.age, 10);
      if (!isNaN(age)) {
        if (age <= 18) ages["0-18"]++;
        else if (age <= 35) ages["19-35"]++;
        else if (age <= 50) ages["36-50"]++;
        else ages["51+"]++;
      } else ages["19-35"]++;

      if (p.gender === "Male") genders.Male++;
      else if (p.gender === "Female") genders.Female++;
      else genders.Other++;
    });

    return {
      ageData: Object.entries(ages).map(([name, count]) => ({ name, count })),
      genderData: Object.entries(genders).map(([name, count]) => ({
        name,
        count,
      })),
    };
  };

  const getPeakHours = () => {
    const hours = Array(24).fill(0);
    activeDataset.forEach((p) => {
      if (p.created_at) {
        try {
          const hour = new Date(p.created_at).getHours();
          if (!isNaN(hour)) hours[hour]++;
        } catch (e) {}
      }
    });
    return hours.map((count, hour) => ({
      time: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));
  };

  const exportMinistryReport = () => {
    if (!activeDataset || activeDataset.length === 0) {
      alert(`No patient data available to export for ${analyticsMonth}.`);
      return;
    }

    const headers = [
      "Date",
      "Token Number",
      "Patient Name",
      "Age",
      "Gender",
      "ABHA ID",
      "Department",
      "Chief Complaint",
      "Status",
      "Priority",
    ];
    const csvRows = [headers.join(",")];

    activeDataset.forEach((p) => {
      const date = p.created_at
        ? new Date(p.created_at).toLocaleDateString()
        : "N/A";
      const complaint = p.primary_complaint
        ? `"${p.primary_complaint.replace(/"/g, '""').replace(/\n/g, " ")}"`
        : '"N/A"';
      const name = p.name ? `"${p.name}"` : '"N/A"';

      const row = [
        date,
        p.token_number || "N/A",
        name,
        p.age || "N/A",
        p.gender || "N/A",
        p.abha_id || "Unlinked",
        p.department || "General",
        complaint,
        p.status || "Pending",
        p.is_red_flag ? "CRITICAL" : "Routine",
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Ayush_Ministry_Report_${analyticsMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveAndGenerateRx = async () => {
    const success = await queue.handleApprove();
    if (success) {
      generateEPrescription(queue.selectedPatient, queue.prescription, profile);
    }
  };

  const handleSelectPatientWithTimer = (patient) => {
    queue.handleSelectPatient(patient);
    if (patient?.id) {
      supabase
        .rpc("log_patient_view", { p_patient_id: patient.id })
        .catch(() => {});
    }
    if (
      patient.status === PATIENT_STATUS.IN_CONSULTATION &&
      !queue.consultationStartTime
    ) {
      queue.setConsultationStartTime(Date.now());
    }
  };

  const handleCallNext = async () => {
    const result = await queue.handleCallNextPatient();
    if (result.calledPatient) {
      setQueueFilter(PATIENT_STATUS.IN_CONSULTATION);
      supabase
        .rpc("log_patient_view", { p_patient_id: result.calledPatient.id })
        .catch(() => {});
    }
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

  const formatTime = (isoString) =>
    isoString
      ? new Date(isoString).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const getDynamicWaitTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const diffMins = Math.floor((now - new Date(createdAt)) / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getElapsedConsultationTime = () => {
    if (!queue.consultationStartTime) return "00:00";
    const diffSecs = Math.floor((now - queue.consultationStartTime) / 1000);
    return `${String(Math.floor(diffSecs / 60)).padStart(2, "0")}:${String(diffSecs % 60).padStart(2, "0")}`;
  };

  if (isLoadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
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
            // Filter: Allow all non-waiting statuses, but for 'Waiting', require triaged_at
            patients={queue.patients.filter(
              (p) => p.status !== PATIENT_STATUS.WAITING || p.triaged_at,
            )}
            selectedPatient={queue.selectedPatient}
            isEditing={queue.isEditing}
            caseNotes={queue.caseNotes}
            prescription={queue.prescription}
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
            onChangePrescription={queue.setPrescription}
            onToggleEdit={() =>
              queue.isEditing
                ? queue.handleSaveNotes()
                : queue.setIsEditing(true)
            }
            onApprove={handleApproveAndGenerateRx}
            onDownloadReport={() =>
              downloadClinicalReport(queue.selectedPatient, queue.caseNotes)
            }
            onOpenFhirModal={() => setShowFhirModal(true)}
            onOpenDocViewer={() => setShowDocViewer(true)}
            formatTime={formatTime}
            getDynamicWaitTime={getDynamicWaitTime}
            getElapsedConsultationTime={getElapsedConsultationTime}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsPanel
            analyticsMonth={analyticsMonth}
            onChangeMonth={setAnalyticsMonth}
            isLoading={isAnalyticsLoading}
            totalFootfall={analyticsFootfall}
            approvedCount={analyticsApproved}
            redFlagCount={analyticsRedFlag}
            abhaLinkedCount={analyticsAbha}
            doshaBarData={doshaBarData}
            topComplaints={getTopComplaints()}
            demographics={getDemographics()}
            peakHours={getPeakHours()}
            isDarkMode={isDarkMode}
            onExportCSV={exportMinistryReport}
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
        <DocumentViewerModal
          patient={queue.selectedPatient}
          onClose={() => setShowDocViewer(false)}
        />
      )}
    </div>
  );
}
