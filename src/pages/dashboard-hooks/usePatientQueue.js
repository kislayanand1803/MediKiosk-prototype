import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { PATIENT_STATUS } from "../dashboard-data/patientStatus";

// Lightweight columns for the queue list — enough to render the sidebar
// without pulling the heavier text/JSON fields for every patient.
const PATIENT_LIST_COLUMNS =
  "id, created_at, name, age, gender, abha_id, token_number, status, is_red_flag, urgency_level, primary_complaint, possible_diagnosis, agni_status, koshtha_status, ahara_vihara, dosha_data";

// Heavier fields loaded only for the currently-open patient, including
// the Module B jsonb columns (medications, lab_values, timeline, document_images).
const PATIENT_DETAIL_COLUMNS =
  "subjective_history, extracted_doc_notes, medications, lab_values, timeline, document_images";

/**
 * ==========================================
 * PATIENT QUEUE HOOK
 * ==========================================
 * Owns the physician's patient queue for a given day: fetching,
 * real-time updates, patient selection, and the actions a doctor can
 * take (call next, approve, save notes). Extracted from the dashboard
 * component so this data logic can be reasoned about — and tested —
 * independently of how it's rendered.
 */
export function usePatientQueue(selectedDate, isAuthenticated) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [caseNotes, setCaseNotes] = useState("");
  const [consultationStartTime, setConsultationStartTime] = useState(null);

  // Fetches the day's queue, sorted red-flags-first, then by arrival time.
  const fetchPatients = async () => {
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_LIST_COLUMNS)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("is_red_flag", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return;
    }

    setPatients(data);
    if (data.length > 0) {
      const isCurrentPatientStillInList =
        selectedPatient && data.find((p) => p.id === selectedPatient.id);
      if (!isCurrentPatientStillInList) {
        handleSelectPatient(data[0]);
      }
    } else {
      setSelectedPatient(null);
    }
  };

  // Loads the heavier text/JSON fields (history, OCR notes, timeline,
  // medications, lab values, original document scans) once a patient
  // is actually opened, rather than for the whole list up front.
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setCaseNotes("Loading clinical notes...");

    const { data, error } = await supabase
      .from("patients")
      .select(PATIENT_DETAIL_COLUMNS)
      .eq("id", patient.id)
      .single();

    if (!error && data) {
      setSelectedPatient({ ...patient, ...data });
      setCaseNotes(data.subjective_history || "");
    } else {
      setCaseNotes("Error loading notes.");
    }
  };

  // Calls the next waiting patient in. Returns `calledPatient: null`
  // instead of showing a native alert() when the queue is empty — the
  // UI decides how to surface that (see PatientQueueList).
  const handleCallNextPatient = async () => {
    const nextPatient = patients.find(
      (p) =>
        p.status !== PATIENT_STATUS.APPROVED && p.status !== PATIENT_STATUS.IN_CONSULTATION,
    );
    if (!nextPatient) return { calledPatient: null };

    const { error } = await supabase
      .from("patients")
      .update({ status: PATIENT_STATUS.IN_CONSULTATION })
      .eq("id", nextPatient.id);

    if (error) return { calledPatient: null, error };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === nextPatient.id ? { ...p, status: PATIENT_STATUS.IN_CONSULTATION } : p,
      ),
    );
    handleSelectPatient({ ...nextPatient, status: PATIENT_STATUS.IN_CONSULTATION });
    setConsultationStartTime(Date.now());

    return { calledPatient: nextPatient };
  };

  const handleApprove = async () => {
    if (!selectedPatient?.id) return;
    const { error } = await supabase
      .from("patients")
      .update({ status: PATIENT_STATUS.APPROVED })
      .eq("id", selectedPatient.id);

    if (!error) {
      setPatients((prev) =>
        prev.map((p) => (p.id === selectedPatient.id ? { ...p, status: PATIENT_STATUS.APPROVED } : p)),
      );
      setSelectedPatient((prev) => ({ ...prev, status: PATIENT_STATUS.APPROVED }));
      setConsultationStartTime(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient?.id) return;
    const { error } = await supabase
      .from("patients")
      .update({ subjective_history: caseNotes })
      .eq("id", selectedPatient.id);

    if (!error) {
      setIsEditing(false);
      setSelectedPatient((prev) => ({ ...prev, subjective_history: caseNotes }));
    }
  };

  // Initial fetch + refetch whenever the selected date changes.
  useEffect(() => {
    if (isAuthenticated) fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedDate]);

  // Live updates: re-fetch whenever the patients table changes on the server.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const channel = supabase
      .channel("public:patients")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () =>
        fetchPatients(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedDate]);

  return {
    patients,
    selectedPatient,
    isEditing,
    caseNotes,
    consultationStartTime,
    setCaseNotes,
    setIsEditing,
    setSelectedPatient,
    setConsultationStartTime,
    handleSelectPatient,
    handleCallNextPatient,
    handleApprove,
    handleSaveNotes,
  };
}
