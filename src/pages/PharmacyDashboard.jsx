import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
} from "lucide-react";

import { useDoctorSession } from "./dashboard-hooks/useDoctorSession";
import { useDarkMode } from "./dashboard-hooks/useDarkMode";
import { usePatientQueue } from "./dashboard-hooks/usePatientQueue";
import { PATIENT_STATUS } from "./dashboard-data/patientStatus";

import LoginScreen from "./dashboard-components/LoginScreen";

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout, profile } =
    useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const queue = usePatientQueue(selectedDate, isAuthenticated, profile);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Pharmacists only see patients who have been approved by the doctor
  const approvedPatients = queue.patients.filter(
    (p) => p.status === PATIENT_STATUS.APPROVED,
  );
  const isSelectedPatientApproved =
    queue.selectedPatient &&
    approvedPatients.some((p) => p.id === queue.selectedPatient.id);

  const handleSelectPatient = (patient) => {
    queue.handleSelectPatient(patient);
    setSaveMessage("");
    if (patient?.id) {
      supabase
        .rpc("log_patient_view", { p_patient_id: patient.id })
        .catch(() => {});
    }
  };

  const handleDispense = async () => {
    if (!queue.selectedPatient?.id) return;
    setIsSaving(true);
    setSaveMessage("");

    // 1. Log the dispensing action in our Milestone 0 audit table (Composite Key)
    const { error: dispenseError } = await supabase
      .from("prescription_dispensing")
      .insert([
        {
          patient_name: queue.selectedPatient.name,
          patient_id: queue.selectedPatient.id,
          dispensed_by: profile.id,
        },
      ]);

    if (dispenseError) {
      console.error("Dispensing log error:", dispenseError);
      setSaveMessage("Error logging dispense record.");
      setIsSaving(false);
      return;
    }

    // 2. Advance the status so the patient drops off the active pharmacy queue
    const { error: updateError } = await supabase
      .from("patients")
      .update({ status: "Dispensed" })
      .eq("id", queue.selectedPatient.id);

    setIsSaving(false);
    if (!updateError) {
      setSaveMessage("Medications successfully dispensed & logged!");
      setTimeout(() => {
        queue.setSelectedPatient(null);
        setSaveMessage("");
      }, 1500);
    } else {
      setSaveMessage("Error updating patient status.");
    }
  };

  if (isLoadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onBackHome={() => navigate("/")} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors duration-200 flex flex-col">
      <div className="mx-auto w-full flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Pharmacy Header */}
        <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Pill
                className="text-blue-500 flex-shrink-0"
                aria-hidden="true"
              />
              MediKiosk Pharmacy Dispensary
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Secure e-Prescription fulfillment and dispensing log.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="Force Sync Real-time Data"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              {isDarkMode ? (
                <Sun size={16} aria-hidden="true" />
              ) : (
                <Moon size={16} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* LEFT: Approved Prescriptions Queue */}
          <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Approved Prescriptions
              </h2>
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                {approvedPatients.length} Pending
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {approvedPatients.length === 0 ? (
                <div className="text-center p-8 text-sm text-gray-500 dark:text-slate-400">
                  No approved prescriptions waiting for fulfillment.
                </div>
              ) : (
                approvedPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      queue.selectedPatient?.id === p.id
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30"
                        : "bg-white border-gray-100 hover:border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {p.name}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                        {p.token_number}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                      Doctor Dept: {p.department}
                    </div>
                    {p.is_red_flag && (
                      <div className="mt-2 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle size={12} /> Urgent Fulfillment
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Medication Dispensing Panel */}
          <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {isSelectedPatientApproved ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {queue.selectedPatient.name}
                      </h2>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {queue.selectedPatient.token_number || "TKN-PENDING"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {queue.selectedPatient.age} Yrs •{" "}
                      {queue.selectedPatient.gender}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Pill size={16} className="text-blue-500" /> Prescribed
                    Medications
                  </h3>

                  {queue.selectedPatient.medications &&
                  queue.selectedPatient.medications.length > 0 ? (
                    <div className="space-y-3">
                      {queue.selectedPatient.medications.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl flex justify-between items-center shadow-sm"
                        >
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-base">
                              {med.drugName}
                            </div>
                            <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mt-1">
                              Dosage: {med.dosage}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-1.5 rounded-lg shadow-inner">
                            {med.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-center">
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                        No structured medications parsed. Please review the
                        physician's notes below.
                      </p>
                    </div>
                  )}

                  {queue.caseNotes && (
                    <div className="mt-6 p-5 bg-white dark:bg-slate-800 rounded-xl text-sm text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-sm">
                      <strong className="block mb-2 text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-2">
                        Physician's Case Notes & Advice:
                      </strong>
                      <p className="whitespace-pre-wrap">{queue.caseNotes}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 order-2 sm:order-1">
                    {saveMessage && (
                      <>
                        <CheckCircle2 size={16} /> {saveMessage}
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleDispense}
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition order-1 sm:order-2"
                  >
                    <CheckCircle2 size={18} />
                    {isSaving ? "Logging..." : "Mark as Dispensed"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-8 text-center">
                <Pill size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">No Prescription Selected</p>
                <p className="text-sm mt-2 max-w-sm">
                  Select a patient from the approved queue to view and dispense
                  their medications.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
