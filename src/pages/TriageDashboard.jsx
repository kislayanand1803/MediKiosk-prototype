import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
  Activity,
  AlertTriangle,
  Send,
  CheckCircle2,
  HeartPulse,
  Thermometer,
  Droplets,
  Stethoscope,
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

const VITAL_RANGES = {
  bpSystolic: { max: 140 },
  bpDiastolic: { max: 90 },
  heartRate: { min: 60, max: 100 },
  temperature: { max: 99.5 },
  spo2: { min: 95 },
};

function isVitalAbnormal(key, rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined)
    return false;
  const value = Number(rawValue);
  const range = VITAL_RANGES[key];
  if (!range) return false;
  if (range.min !== undefined && value < range.min) return true;
  if (range.max !== undefined && value > range.max) return true;
  return false;
}

export default function TriageDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout, profile } =
    useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const queue = usePatientQueue(selectedDate, isAuthenticated, profile);

  const [vitals, setVitals] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    temperature: "",
    spo2: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSelectPatient = (patient) => {
    queue.handleSelectPatient(patient);
    setSaveMessage("");
    setVitals({
      bpSystolic: "",
      bpDiastolic: "",
      heartRate: "",
      temperature: "",
      spo2: "",
    });
    if (patient?.id) {
      supabase
        .rpc("log_patient_view", { p_patient_id: patient.id })
        .then(({ error }) => {
          if (error) console.error("DPDP Audit block:", error.message);
        })
        .catch((networkErr) => {
          console.error("Network failed before audit could log:", networkErr);
        });
    }
  };

  const handleCompleteTriage = async () => {
    if (!queue.selectedPatient?.id) return;
    setIsSaving(true);
    setSaveMessage("");

    const newLabValues = [];
    if (vitals.bpSystolic && vitals.bpDiastolic) {
      newLabValues.push({
        testName: "Blood Pressure",
        result: `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`,
        isAbnormal:
          isVitalAbnormal("bpSystolic", vitals.bpSystolic) ||
          isVitalAbnormal("bpDiastolic", vitals.bpDiastolic),
      });
    }
    if (vitals.heartRate) {
      newLabValues.push({
        testName: "Heart Rate",
        result: `${vitals.heartRate} bpm`,
        isAbnormal: isVitalAbnormal("heartRate", vitals.heartRate),
      });
    }
    if (vitals.temperature) {
      newLabValues.push({
        testName: "Temperature",
        result: `${vitals.temperature} °F`,
        isAbnormal: isVitalAbnormal("temperature", vitals.temperature),
      });
    }
    if (vitals.spo2) {
      newLabValues.push({
        testName: "SpO2",
        result: `${vitals.spo2} %`,
        isAbnormal: isVitalAbnormal("spo2", vitals.spo2),
      });
    }

    const existingLabs = queue.selectedPatient.lab_values || [];
    const mergedLabs = [...existingLabs, ...newLabValues];
    const triagedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("patients")
      .update({
        lab_values: mergedLabs,
        triaged_at: triagedAt,
      })
      .eq("id", queue.selectedPatient.id)
      .select(); // STRICT FIX: Force return of updated row to catch RLS blocks

    if (error) {
      console.error("Supabase Error:", error);
      alert(`Failed to save: ${error.message}`);
      setIsSaving(false);
      return;
    }

    if (!data || data.length === 0) {
      alert(
        "Database security policy (RLS) blocked the update. Please check your Supabase 'Nurses can update patient vitals' policy.",
      );
      setIsSaving(false);
      return;
    }

    queue.setPatients((prev) =>
      prev.map((p) =>
        p.id === queue.selectedPatient.id
          ? { ...p, lab_values: mergedLabs, triaged_at: triagedAt }
          : p,
      ),
    );

    setSaveMessage("Triage complete — sent to physician queue.");

    setTimeout(() => {
      queue.setSelectedPatient(null);
      setSaveMessage("");
      setIsSaving(false);
    }, 1500);
  };

  const handleEscalate = async () => {
    if (!queue.selectedPatient?.id) return;
    if (
      !window.confirm(
        "Escalate this patient to Urgent priority? This will flag them instantly on the Doctor's dashboard.",
      )
    )
      return;

    const { data, error } = await supabase
      .from("patients")
      .update({ is_red_flag: true, urgency_level: "Urgent" })
      .eq("id", queue.selectedPatient.id)
      .select();

    if (!error && data?.length > 0) {
      queue.setPatients((prev) =>
        prev.map((p) =>
          p.id === queue.selectedPatient.id
            ? { ...p, is_red_flag: true, urgency_level: "Urgent" }
            : p,
        ),
      );
      queue.setSelectedPatient((prev) => ({
        ...prev,
        is_red_flag: true,
        urgency_level: "Urgent",
      }));
      setSaveMessage("Patient escalated to URGENT.");
    } else if (!data || data.length === 0) {
      alert("Update blocked by database security policy.");
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

  const waitingPatients = queue.patients.filter(
    (p) => p.status === PATIENT_STATUS.WAITING && !p.triaged_at,
  );

  const isSelectedPatientWaiting =
    queue.selectedPatient &&
    waitingPatients.some((p) => p.id === queue.selectedPatient.id);

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors duration-200 flex flex-col">
      <div className="mx-auto w-full flex-1 flex flex-col space-y-4 overflow-hidden">
        <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Stethoscope
                className="text-emerald-600 flex-shrink-0"
                aria-hidden="true"
              />
              MediKiosk Nurse Triage
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Auto-locks after 5 minutes of inactivity.
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
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
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
              aria-label="Lock session"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" />
                Waiting Room
              </h2>
              <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 py-1 px-3 rounded-full text-xs font-bold">
                {waitingPatients.length} Pending
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {waitingPatients.length === 0 ? (
                <div className="text-center p-8 text-sm text-gray-500 dark:text-slate-400">
                  No patients waiting.
                </div>
              ) : (
                waitingPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      queue.selectedPatient?.id === p.id
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                        : "bg-white border-gray-100 hover:border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center">
                        {p.name}
                        {p.is_ai_fallback && (
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider ml-2">
                            Fallback
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                        {p.token_number}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                      {p.primary_complaint}
                    </div>
                    {p.is_red_flag && (
                      <div className="mt-2 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle size={12} /> Priority Alert
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {isSelectedPatientWaiting ? (
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
                      {queue.selectedPatient.gender} •{" "}
                      {queue.selectedPatient.department}
                    </p>
                  </div>
                  <button
                    onClick={handleEscalate}
                    disabled={queue.selectedPatient.is_red_flag}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold transition disabled:opacity-50"
                  >
                    <AlertTriangle size={16} />
                    {queue.selectedPatient.is_red_flag
                      ? "Escalated"
                      : "Escalate"}
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  {/* AI Fallback Warning Banner */}
                  {queue.selectedPatient?.is_ai_fallback && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 rounded-xl mb-6 flex items-start gap-3">
                      <AlertTriangle
                        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                        size={20}
                      />
                      <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                          AI Triage Unavailable
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                          This patient was routed via network fallback. The
                          clinical summary could not be generated. Please review
                          their raw input carefully and complete the Pariksha
                          (assessment) manually.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">
                      Chief Complaint (From Kiosk)
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-gray-700 dark:text-slate-300">
                      {queue.selectedPatient.primary_complaint ||
                        "Not recorded."}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> Record
                    Clinical Vitals
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border rounded-xl bg-white dark:bg-slate-800 transition-colors ${
                        isVitalAbnormal("bpSystolic", vitals.bpSystolic) ||
                        isVitalAbnormal("bpDiastolic", vitals.bpDiastolic)
                          ? "border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-500/5"
                          : "border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3">
                        <span className="flex items-center gap-2">
                          <HeartPulse size={14} /> Blood Pressure (mmHg)
                        </span>
                        {(isVitalAbnormal("bpSystolic", vitals.bpSystolic) ||
                          isVitalAbnormal(
                            "bpDiastolic",
                            vitals.bpDiastolic,
                          )) && (
                          <span className="text-red-600 dark:text-red-400 normal-case font-bold">
                            Elevated
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Sys"
                          value={vitals.bpSystolic}
                          onChange={(e) =>
                            setVitals({ ...vitals, bpSystolic: e.target.value })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="text-slate-400 font-bold">/</span>
                        <input
                          type="number"
                          placeholder="Dia"
                          value={vitals.bpDiastolic}
                          onChange={(e) =>
                            setVitals({
                              ...vitals,
                              bpDiastolic: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-xl bg-white dark:bg-slate-800 transition-colors ${
                        isVitalAbnormal("heartRate", vitals.heartRate)
                          ? "border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-500/5"
                          : "border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3">
                        <span className="flex items-center gap-2">
                          <Activity size={14} /> Heart Rate (BPM)
                        </span>
                        {isVitalAbnormal("heartRate", vitals.heartRate) && (
                          <span className="text-red-600 dark:text-red-400 normal-case font-bold">
                            Elevated
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 72"
                        value={vitals.heartRate}
                        onChange={(e) =>
                          setVitals({ ...vitals, heartRate: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div
                      className={`p-4 border rounded-xl bg-white dark:bg-slate-800 transition-colors ${
                        isVitalAbnormal("temperature", vitals.temperature)
                          ? "border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-500/5"
                          : "border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3">
                        <span className="flex items-center gap-2">
                          <Thermometer size={14} /> Temperature (°F)
                        </span>
                        {isVitalAbnormal("temperature", vitals.temperature) && (
                          <span className="text-red-600 dark:text-red-400 normal-case font-bold">
                            Elevated
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 98.6"
                        value={vitals.temperature}
                        onChange={(e) =>
                          setVitals({ ...vitals, temperature: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div
                      className={`p-4 border rounded-xl bg-white dark:bg-slate-800 transition-colors ${
                        isVitalAbnormal("spo2", vitals.spo2)
                          ? "border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-500/5"
                          : "border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-3">
                        <span className="flex items-center gap-2">
                          <Droplets size={14} /> Oxygen SpO2 (%)
                        </span>
                        {isVitalAbnormal("spo2", vitals.spo2) && (
                          <span className="text-red-600 dark:text-red-400 normal-case font-bold">
                            Low
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 98"
                        value={vitals.spo2}
                        onChange={(e) =>
                          setVitals({ ...vitals, spo2: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {!queue.selectedPatient.is_red_flag &&
                    Object.keys(vitals).some((key) =>
                      isVitalAbnormal(key, vitals[key]),
                    ) && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center gap-3">
                        <AlertTriangle
                          size={18}
                          className="text-amber-600 dark:text-amber-400 flex-shrink-0"
                        />
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                          One or more vitals are outside the normal range.
                          Consider escalating this patient to Urgent priority.
                        </p>
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
                    onClick={handleCompleteTriage}
                    disabled={
                      isSaving ||
                      (!vitals.bpSystolic &&
                        !vitals.heartRate &&
                        !vitals.temperature &&
                        !vitals.spo2)
                    }
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    <Send size={18} />
                    {isSaving
                      ? "Saving..."
                      : "Complete Triage & Send to Physician"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-8 text-center">
                <Activity size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">No Patient Selected</p>
                <p className="text-sm mt-2 max-w-sm">
                  Select a patient from the waiting room queue to record their
                  vitals before they see the doctor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
