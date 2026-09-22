import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { PATIENT_STATUS } from "../dashboard-data/patientStatus";

const PATIENT_LIST_COLUMNS =
  "id, created_at, name, age, gender, abha_id, token_number, status, is_red_flag, urgency_level, primary_complaint, possible_diagnosis, agni_status, koshtha_status, ahara_vihara, dosha_data, department, triaged_at";

const PATIENT_DETAIL_COLUMNS =
  "subjective_history, extracted_doc_notes, medications, lab_values, timeline, document_images, triaged_at";

export function usePatientQueue(selectedDate, isAuthenticated, profile) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [caseNotes, setCaseNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [consultationStartTime, setConsultationStartTime] = useState(null);

  const fetchPatients = async () => {
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    let query = supabase
      .from("patients")
      .select(PATIENT_LIST_COLUMNS)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (profile?.department && profile.department !== "General") {
      query = query.eq("department", profile.department);
    }

    query = query
      .order("is_red_flag", { ascending: false })
      .order("created_at", { ascending: true });

    const { data, error } = await query;

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

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setCaseNotes("Loading clinical notes...");
    setPrescription("");

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

  const handleCallNextPatient = async () => {
    // STRICT FIX: Only call patients who are waiting AND have passed triage
    const nextPatient = patients.find(
      (p) => p.status === PATIENT_STATUS.WAITING && p.triaged_at,
    );
    if (!nextPatient) return { calledPatient: null };

    const { error } = await supabase
      .from("patients")
      .update({ status: PATIENT_STATUS.IN_CONSULTATION })
      .eq("id", nextPatient.id);

    if (error) return { calledPatient: null, error };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === nextPatient.id
          ? { ...p, status: PATIENT_STATUS.IN_CONSULTATION }
          : p,
      ),
    );
    handleSelectPatient({
      ...nextPatient,
      status: PATIENT_STATUS.IN_CONSULTATION,
    });
    setConsultationStartTime(Date.now());

    return { calledPatient: nextPatient };
  };

  const handleApprove = async () => {
    if (!selectedPatient?.id) return false;

    const { error } = await supabase
      .from("patients")
      .update({ status: PATIENT_STATUS.APPROVED })
      .eq("id", selectedPatient.id);

    if (!error) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id
            ? { ...p, status: PATIENT_STATUS.APPROVED }
            : p,
        ),
      );
      setSelectedPatient((prev) => ({
        ...prev,
        status: PATIENT_STATUS.APPROVED,
      }));
      setConsultationStartTime(null);
      return true;
    }
    return false;
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient?.id) return;
    const { error } = await supabase
      .from("patients")
      .update({ subjective_history: caseNotes })
      .eq("id", selectedPatient.id);

    if (!error) {
      setIsEditing(false);
      setSelectedPatient((prev) => ({
        ...prev,
        subjective_history: caseNotes,
      }));
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedDate, profile?.department]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let channelFilter = `status=neq.${PATIENT_STATUS.APPROVED}`;
    if (profile?.department && profile.department !== "General") {
      channelFilter = `department=eq.${profile.department}`;
    }

    const channel = supabase
      .channel("public:patients")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
          filter: channelFilter,
        },
        () => fetchPatients(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedDate, profile?.department]);

  return {
    patients,
    setPatients, // STRICT FIX: Exposed to allow instantaneous local UI updates
    selectedPatient,
    isEditing,
    caseNotes,
    prescription,
    consultationStartTime,
    setCaseNotes,
    setPrescription,
    setIsEditing,
    setSelectedPatient,
    setConsultationStartTime,
    handleSelectPatient,
    handleCallNextPatient,
    handleApprove,
    handleSaveNotes,
  };
}
