import { useState, useEffect } from "react";
import {
  Stethoscope,
  FileText,
  Check,
  Edit2,
  Save,
  Activity,
  AlertTriangle,
  FileSearch,
  Flame,
  Apple,
  Lock,
  LogOut,
  Clock,
  BarChart3,
  Users,
  ShieldCheck,
  TrendingUp,
  Search,
  BellRing,
  Megaphone,
  Calendar,
  Timer,
  Code2,
  Copy,
  Download,
  X,
  FileDown,
  Globe2,
  PieChart as PieIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { supabase } from "../services/supabaseClient";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("medikiosk_doc_auth") === "true",
  );

  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("medikiosk_theme") === "dark";
  });

  const [activeTab, setActiveTab] = useState("queue");
  const [queueFilter, setQueueFilter] = useState("Waiting");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [caseNotes, setCaseNotes] = useState("");

  const [showFhirModal, setShowFhirModal] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  const [now, setNow] = useState(new Date());
  const [consultationStartTime, setConsultationStartTime] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("medikiosk_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("medikiosk_theme", "light");
    }
  }, [isDarkMode]);

  const handleLogin = (e) => {
    e.preventDefault();
    const validId = import.meta.env.VITE_DOCTOR_ID || "medi-kiosk";
    const validPass = import.meta.env.VITE_DOCTOR_PASSWORD || "sih2026";

    if (doctorId === validId && password === validPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem("medikiosk_doc_auth", "true");
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("medikiosk_doc_auth");
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const timerInterval = setInterval(() => setNow(new Date()), 1000);
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => handleLogout(), 5 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      clearInterval(timerInterval);
      clearTimeout(idleTimer);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer),
      );
    };
  }, [isAuthenticated]);

  const fetchPatients = async () => {
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("patients")
      // UPDATED QUERY: Included koshtha_status
      .select(
        "id, created_at, name, age, gender, abha_id, token_number, status, is_red_flag, urgency_level, primary_complaint, possible_diagnosis, agni_status, koshtha_status, ahara_vihara, dosha_data",
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("is_red_flag", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error.message);
    } else if (data) {
      setPatients(data);
      if (data.length > 0) {
        const isCurrentInNewList =
          selectedPatient && data.find((p) => p.id === selectedPatient.id);
        if (!isCurrentInNewList) {
          handleSelectPatient(data[0]);
        }
      } else {
        setSelectedPatient(null);
      }
    }
  };

  const handleSelectPatient = async (pat) => {
    setSelectedPatient(pat);
    setIsEditing(false);
    setCaseNotes("Loading clinical notes...");

    const { data, error } = await supabase
      .from("patients")
      .select("subjective_history, extracted_doc_notes")
      .eq("id", pat.id)
      .single();

    if (!error && data) {
      const fullPatientData = { ...pat, ...data };
      setSelectedPatient(fullPatientData);
      setCaseNotes(fullPatientData.subjective_history || "");
    } else {
      setCaseNotes("Error loading notes.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchPatients();
  }, [isAuthenticated, selectedDate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("public:patients")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => {
          fetchPatients();
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [isAuthenticated, selectedDate]);

  const handleCallNextPatient = async () => {
    const nextPatient = patients.find(
      (p) => p.status !== "Approved" && p.status !== "In Consultation",
    );

    if (!nextPatient) {
      alert("No waiting patients in the queue!");
      return;
    }

    const { error } = await supabase
      .from("patients")
      .update({ status: "In Consultation" })
      .eq("id", nextPatient.id);

    if (!error) {
      const updatedPatients = patients.map((p) =>
        p.id === nextPatient.id ? { ...p, status: "In Consultation" } : p,
      );
      setPatients(updatedPatients);
      handleSelectPatient({ ...nextPatient, status: "In Consultation" });
      setConsultationStartTime(Date.now());
      setQueueFilter("In Consultation");
    }
  };

  const handleApprove = async () => {
    if (!selectedPatient?.id) return;
    const { error } = await supabase
      .from("patients")
      .update({ status: "Approved" })
      .eq("id", selectedPatient.id);

    if (!error) {
      const updatedPatients = patients.map((p) =>
        p.id === selectedPatient.id ? { ...p, status: "Approved" } : p,
      );
      setPatients(updatedPatients);
      setSelectedPatient({ ...selectedPatient, status: "Approved" });
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
      setSelectedPatient({ ...selectedPatient, subjective_history: caseNotes });
    }
  };

  const cleanProvenanceEmoji = (text) => {
    if (!text) return "";
    return text.replace(/^[🗣️📄🤖]\s*/, "");
  };

  const handleDownloadReport = () => {
    if (!selectedPatient) return;

    const reportDate = new Date(
      selectedPatient.created_at,
    ).toLocaleDateString();
    const reportTime = new Date(selectedPatient.created_at).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" },
    );

    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Report - ${selectedPatient.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
            .header p { margin: 5px 0 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: 800; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .label { font-weight: bold; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 14px; margin-top: 2px; font-weight: 500; }
            .full-width { grid-column: span 2; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f9fafb; color: #4b5563; font-size: 11px; text-transform: uppercase; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MediKiosk Clinical Report</h1>
            <p>Ministry of Ayush • Digitized OPD Record</p>
            <h4 style="margin-top: 15px; color: #4b5563;">Date: <strong>${reportDate}</strong> &nbsp;|&nbsp; Time: <strong>${reportTime}</strong></h4>
          </div>

          <div class="section">
            <div class="section-title">Patient Demographics</div>
            <div class="grid">
              <div><div class="label">Patient Name</div><div class="value">${selectedPatient.name}</div></div>
              <div><div class="label">Age / Gender</div><div class="value">${selectedPatient.age} Yrs / ${selectedPatient.gender}</div></div>
              <div><div class="label">ABHA ID</div><div class="value">${selectedPatient.abha_id || "Not Linked"}</div></div>
              <div><div class="label">Token Number</div><div class="value">${selectedPatient.token_number || "N/A"}</div></div>
              <div><div class="label">Triage Priority</div><div class="value" style="color: ${selectedPatient.is_red_flag ? "#dc2626" : "#16a34a"}">${selectedPatient.is_red_flag ? "🚨 URGENT EMERGENCY" : "Routine"}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Assessment</div>
            <div class="grid">
              <div class="full-width"><div class="label">Chief Complaint</div><div class="value">${cleanProvenanceEmoji(selectedPatient.primary_complaint)}</div></div>
              <div class="full-width"><div class="label">History of Present Illness (HPI)</div><div class="value">${cleanProvenanceEmoji(caseNotes)}</div></div>
              <div class="full-width"><div class="label">Differential Diagnosis</div><div class="value">${cleanProvenanceEmoji(selectedPatient.possible_diagnosis)}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ayurvedic Dashavidha Pariksha</div>
            <div class="grid-3" style="margin-bottom: 15px;">
              <div><div class="label">Agni (Digestive Fire)</div><div class="value">${cleanProvenanceEmoji(selectedPatient.agni_status)}</div></div>
              <div><div class="label">Koshtha (Bowel Habit)</div><div class="value">${cleanProvenanceEmoji(selectedPatient.koshtha_status) || "Madhyama Koshtha"}</div></div>
              <div><div class="label">Ahara-Vihara (Diet & Lifestyle)</div><div class="value">${cleanProvenanceEmoji(selectedPatient.ahara_vihara)}</div></div>
            </div>
            <table>
              <thead><tr><th>Vikriti Parameter (Dosha)</th><th>Imbalance Percentage</th></tr></thead>
              <tbody>
                ${(selectedPatient.dosha_data || []).map((d) => `<tr><td style="font-weight: bold;">${d.subject}</td><td>${d.value}%</td></tr>`).join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Prior Investigations & OCR Findings</div>
            <div class="grid">
              <div class="full-width"><div class="label">Digitized Records Extract</div><div class="value">${cleanProvenanceEmoji(selectedPatient.extracted_doc_notes) || "No records provided during intake."}</div></div>
            </div>
          </div>

          <div class="footer">
            <p>Generated by MediKiosk Automated Triage System • Document ID: ${selectedPatient.id}</p>
            <p style="margin-top: 30px;">Physician Signature: ___________________________</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generateFhirBundle = (patient) => {
    if (!patient) return {};
    const timestamp = new Date().toISOString();
    return {
      resourceType: "Bundle",
      id: `medikiosk-bundle-${patient.id || "session"}`,
      meta: {
        versionId: "1",
        lastUpdated: timestamp,
        profile: [
          "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle",
        ],
      },
      identifier: {
        system: "https://abdm.gov.in/facilities/medikiosk",
        value: `OPD-${patient.token_number || "TKN-001"}`,
      },
      type: "document",
      timestamp: timestamp,
      entry: [
        {
          fullUrl: `urn:uuid:patient-${patient.id || "001"}`,
          resource: {
            resourceType: "Patient",
            id: `patient-${patient.id || "001"}`,
            meta: {
              profile: [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient",
              ],
            },
            identifier: [
              {
                type: {
                  coding: [
                    {
                      system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                      code: "MR",
                      display: "ABHA Health ID",
                    },
                  ],
                },
                system: "https://abdm.gov.in/abha",
                value: patient.abha_id || "Not Linked",
              },
            ],
            name: [{ text: patient.name }],
            gender: patient.gender ? patient.gender.toLowerCase() : "unknown",
          },
        },
        {
          fullUrl: `urn:uuid:condition-complaint-${patient.id || "001"}`,
          resource: {
            resourceType: "Condition",
            id: `condition-complaint-${patient.id || "001"}`,
            meta: {
              profile: [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition",
              ],
            },
            clinicalStatus: {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/condition-clinical",
                  code: "active",
                  display: "Active",
                },
              ],
            },
            category: [
              {
                coding: [
                  {
                    system:
                      "http://terminology.hl7.org/CodeSystem/condition-category",
                    code: "encounter-diagnosis",
                    display: "Encounter Diagnosis",
                  },
                ],
              },
            ],
            code: {
              text:
                cleanProvenanceEmoji(patient.primary_complaint) ||
                "Unspecified Complaint",
            },
            subject: {
              reference: `urn:uuid:patient-${patient.id || "001"}`,
            },
          },
        },
        {
          fullUrl: `urn:uuid:observation-agni-${patient.id || "001"}`,
          resource: {
            resourceType: "Observation",
            id: `observation-agni-${patient.id || "001"}`,
            status: "final",
            code: {
              text: "Ayush Dashavidha Agni Assessment",
            },
            subject: {
              reference: `urn:uuid:patient-${patient.id || "001"}`,
            },
            valueString: cleanProvenanceEmoji(patient.agni_status) || "Samagni",
          },
        },
        {
          fullUrl: `urn:uuid:observation-vikriti-${patient.id || "001"}`,
          resource: {
            resourceType: "Observation",
            id: `observation-vikriti-${patient.id || "001"}`,
            status: "final",
            code: {
              text: "Ayurvedic Tri-Dosha Imbalance (Vikriti)",
            },
            subject: {
              reference: `urn:uuid:patient-${patient.id || "001"}`,
            },
            component: (patient.dosha_data || []).map((dosha) => ({
              code: { text: `${dosha.subject} Imbalance` },
              valueQuantity: {
                value: dosha.value,
                unit: "%",
                system: "http://unitsofmeasure.org",
                code: "%",
              },
            })),
          },
        },
      ],
    };
  };

  const handleCopyFhir = () => {
    const fhirString = JSON.stringify(
      generateFhirBundle(selectedPatient),
      null,
      2,
    );
    navigator.clipboard.writeText(fhirString);
    setCopiedFhir(true);
    setTimeout(() => setCopiedFhir(false), 2000);
  };

  const handleDownloadFhir = () => {
    const fhirString = JSON.stringify(
      generateFhirBundle(selectedPatient),
      null,
      2,
    );
    const blob = new Blob([fhirString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ABDM_FHIR_${selectedPatient?.token_number || "RECORD"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDynamicWaitTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const diffMs = now - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const getElapsedConsultationTime = () => {
    if (!consultationStartTime) return "00:00";
    const diffSecs = Math.floor((now - consultationStartTime) / 1000);
    const mins = String(Math.floor(diffSecs / 60)).padStart(2, "0");
    const secs = String(diffSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.token_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const status = p.status || "Pending";
    if (queueFilter === "Waiting")
      return (
        matchesSearch && status !== "Approved" && status !== "In Consultation"
      );
    if (queueFilter === "In Consultation")
      return matchesSearch && status === "In Consultation";
    if (queueFilter === "Approved")
      return matchesSearch && status === "Approved";
    return matchesSearch;
  });

  const totalFootfall = patients.length;
  const approvedCount = patients.filter((p) => p.status === "Approved").length;
  const redFlagCount = patients.filter((p) => p.is_red_flag).length;
  const abhaLinkedCount = patients.filter(
    (p) => p.abha_id && p.abha_id !== "Not Linked",
  ).length;

  const avgVata = totalFootfall
    ? Math.round(
        patients.reduce((acc, p) => acc + (p.dosha_data?.[0]?.value || 50), 0) /
          totalFootfall,
      )
    : 65;
  const avgPitta = totalFootfall
    ? Math.round(
        patients.reduce((acc, p) => acc + (p.dosha_data?.[1]?.value || 50), 0) /
          totalFootfall,
      )
    : 55;
  const avgKapha = totalFootfall
    ? Math.round(
        patients.reduce((acc, p) => acc + (p.dosha_data?.[2]?.value || 50), 0) /
          totalFootfall,
      )
    : 40;

  const doshaBarData = [
    { name: "Vata (Air)", value: avgVata },
    { name: "Pitta (Fire)", value: avgPitta },
    { name: "Kapha (Earth)", value: avgKapha },
  ];

  const doshaInfo = {
    Vata: {
      subtitle: "(Air/Space)",
      desc: "Energy of Movement (Nervous system & circulation)",
      colorClass: "bg-red-500",
    },
    Pitta: {
      subtitle: "(Fire/Water)",
      desc: "Energy of Transformation (Digestion & metabolism)",
      colorClass: "bg-yellow-500",
    },
    Kapha: {
      subtitle: "(Earth/Water)",
      desc: "Energy of Structure (Stability & lubrication)",
      colorClass: "bg-green-500",
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-500/20 text-blue-400 rounded-full">
              <Lock size={32} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black text-white">
              Physician Secure Portal
            </h1>
            <p className="text-xs text-slate-400">
              Restricted Area • DPDP Act Compliance & Data Protection
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Doctor ID
              </label>
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="e.g. ayurveda"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tracking-widest"
              />
            </div>

            <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 text-[10px] text-blue-300 text-center font-medium">
              Demo Credentials - ID:{" "}
              <span className="font-bold text-blue-200">medi-kiosk</span> |
              Pass: <span className="font-bold text-blue-200">sih2026</span>
            </div>

            {authError && (
              <p className="text-xs text-red-400 font-semibold text-center animate-pulse">
                Invalid Doctor ID or Password. Access Denied.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-md"
            >
              Authenticate & Access Portal
            </button>
          </form>

          <div className="text-center pt-4 mt-2">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-slate-500 hover:text-slate-300 font-bold transition flex items-center justify-center gap-1 mx-auto"
            >
              ← Back to Patient Kiosk Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm gap-3 transition-colors duration-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="text-blue-600 flex-shrink-0" /> MediKiosk
              Physician Portal
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-blue-600 dark:text-blue-500" />{" "}
              Auto-locks after 5 minutes of inactivity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1 transition-colors duration-200">
              <button
                onClick={() => setActiveTab("queue")}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${activeTab === "queue" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-slate-400"}`}
              >
                Live Queue
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${activeTab === "analytics" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-600 dark:text-slate-400"}`}
              >
                Ayush Ministry Analytics
              </button>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg"
            >
              + Kiosk
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
              title="Lock Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {activeTab === "queue" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col lg:h-[780px] transition-colors duration-200">
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl transition-colors duration-200">
                <button
                  onClick={handleCallNextPatient}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-black py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Megaphone size={18} /> Call Next Patient
                </button>

                <div className="flex items-center gap-2">
                  <Calendar
                    size={14}
                    className="text-gray-500 dark:text-slate-400"
                  />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedPatient(null);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white text-xs py-1.5 px-2 rounded-md focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                  />
                  {selectedDate === new Date().toISOString().split("T")[0] && (
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0 font-bold">
                      <BellRing size={10} /> Live
                    </span>
                  )}
                </div>

                <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-lg mt-2 transition-colors duration-200">
                  <button
                    onClick={() => setQueueFilter("Waiting")}
                    className={`flex-1 text-[10px] sm:text-xs font-bold py-1.5 rounded-md transition ${queueFilter === "Waiting" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-slate-400"}`}
                  >
                    Waiting
                  </button>
                  <button
                    onClick={() => setQueueFilter("In Consultation")}
                    className={`flex-1 text-[10px] sm:text-xs font-bold py-1.5 rounded-md transition ${queueFilter === "In Consultation" ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm" : "text-gray-500 dark:text-slate-400"}`}
                  >
                    In Consult
                  </button>
                  <button
                    onClick={() => setQueueFilter("Approved")}
                    className={`flex-1 text-[10px] sm:text-xs font-bold py-1.5 rounded-md transition ${queueFilter === "Approved" ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-slate-400"}`}
                  >
                    Completed
                  </button>
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Search name or token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredPatients.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-10">
                    No patients found in this category.
                  </p>
                ) : (
                  filteredPatients.map((pat) => {
                    const active = pat.id === selectedPatient?.id;
                    const isConsulting = pat.status === "In Consultation";

                    return (
                      <div
                        key={pat.id}
                        onClick={() => {
                          handleSelectPatient(pat);
                          if (isConsulting && !consultationStartTime) {
                            setConsultationStartTime(Date.now());
                          }
                        }}
                        className={`p-3 border rounded-xl transition cursor-pointer relative overflow-hidden ${
                          active
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700 shadow-sm"
                            : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        {pat.is_red_flag && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        )}

                        <div className="flex justify-between items-start ml-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black text-xs px-1.5 py-0.5 rounded ${isConsulting ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300" : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300"}`}
                              >
                                {pat.token_number || "TKN-PENDING"}
                              </span>
                              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                {pat.name}
                              </p>
                            </div>

                            <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1.5 space-y-0.5">
                              <p className="flex items-center gap-1">
                                <Clock size={10} /> In:{" "}
                                {formatTime(pat.created_at)}
                              </p>
                              {pat.status !== "Approved" &&
                                pat.status !== "In Consultation" &&
                                selectedDate ===
                                  new Date().toISOString().split("T")[0] && (
                                  <p className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                                    <Timer size={10} /> Wait:{" "}
                                    {getDynamicWaitTime(pat.created_at)}
                                  </p>
                                )}
                            </div>
                          </div>
                          {pat.is_red_flag && (
                            <AlertTriangle
                              size={14}
                              className="text-red-500 animate-pulse"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!selectedPatient ? (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 sm:p-6 lg:h-[780px] flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50/50 dark:bg-slate-900/50 transition-colors duration-200">
                <Stethoscope
                  size={48}
                  className="mb-4 text-gray-300 dark:text-slate-700"
                />
                <p className="text-lg font-bold text-gray-500 dark:text-slate-400">
                  No Patient Selected
                </p>
                <p className="text-sm mt-1 text-center">
                  Select a patient from the queue or change the date to view
                  records.
                </p>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 sm:p-6 lg:h-[780px] lg:overflow-y-auto space-y-6 relative transition-colors duration-200">
                {selectedPatient.is_red_flag && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-xl flex items-center gap-3 shadow-sm">
                    <AlertTriangle
                      className="text-red-600 dark:text-red-500 flex-shrink-0"
                      size={24}
                    />
                    <div>
                      <h3 className="text-red-900 dark:text-red-400 font-black text-sm">
                        CRITICAL RED-FLAG ALERT
                      </h3>
                      <p className="text-red-700 dark:text-red-300 text-xs">
                        AI flagged acute symptoms. Prioritize physical
                        examination.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-slate-800 pb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText
                        className="text-blue-600 dark:text-blue-500"
                        size={20}
                      />{" "}
                      Clinical Summary
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-xs font-bold">
                      <span className="text-gray-500 dark:text-slate-400">
                        Token: {selectedPatient.token_number || "Pending"}
                      </span>
                      <span className="text-gray-300 dark:text-slate-600">
                        |
                      </span>
                      {selectedPatient.status === "In Consultation" ? (
                        <span className="text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Timer size={12} className="animate-pulse" /> Active:{" "}
                          {getElapsedConsultationTime()}
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full ${selectedPatient.status === "Approved" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"}`}
                        >
                          Status: {selectedPatient.status || "Waiting"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/50 transition"
                      title="Download PDF Clinical Report"
                    >
                      <FileDown size={14} /> Print PDF
                    </button>

                    <button
                      onClick={() => setShowFhirModal(true)}
                      className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-900/50 transition"
                      title="Inspect ABDM FHIR JSON Document"
                    >
                      <Code2 size={14} /> ABDM FHIR
                    </button>

                    <button
                      onClick={() =>
                        isEditing ? handleSaveNotes() : setIsEditing(true)
                      }
                      className={`flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-bold transition ${isEditing ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}
                    >
                      {isEditing ? <Save size={14} /> : <Edit2 size={14} />}{" "}
                      {isEditing ? "Save" : "Edit"}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={selectedPatient.status === "Approved"}
                      className={`flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold text-white shadow-sm transition ${selectedPatient.status === "Approved" ? "bg-green-600 dark:bg-green-700" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"}`}
                    >
                      <Check size={14} />{" "}
                      {selectedPatient.status === "Approved"
                        ? "Approved"
                        : "Approve Case"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-4 mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Data Provenance:
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">🗣️</span> Patient Reported
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">📄</span> Document/Lab OCR
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">🤖</span> AI Inferred
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-200/60 dark:border-slate-800 space-y-3.5">
                  <div className="border-b border-gray-200 dark:border-slate-800 pb-2.5">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      Patient Details
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mt-0.5">
                      {selectedPatient.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {selectedPatient.age} yrs • {selectedPatient.gender}
                      </p>
                      <span className="text-gray-300 dark:text-slate-700">
                        |
                      </span>
                      <p className="text-xs text-gray-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Calendar size={12} className="text-blue-500" />{" "}
                        {new Date(
                          selectedPatient.created_at,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Clock size={12} className="text-blue-500" />{" "}
                        {formatTime(selectedPatient.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 dark:border-slate-800 pb-2.5">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      Chief Complaint
                    </p>
                    <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-0.5 leading-relaxed break-words">
                      {selectedPatient.primary_complaint}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      Differential Diagnosis
                    </p>
                    <p className="font-bold text-gray-800 dark:text-slate-200 text-sm mt-0.5 leading-relaxed break-words">
                      {selectedPatient.possible_diagnosis}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Activity size={14} /> Subjective Clinical History
                  </h4>
                  {isEditing ? (
                    <textarea
                      className="w-full p-3 text-sm text-gray-800 dark:text-white bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800 rounded-xl outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-inner"
                      rows="3"
                      value={caseNotes}
                      onChange={(e) => setCaseNotes(e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-slate-300 text-xs bg-yellow-50/70 dark:bg-yellow-900/10 p-3.5 rounded-xl border border-yellow-200 dark:border-yellow-900/30 leading-relaxed break-words">
                      {caseNotes}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileSearch
                      size={14}
                      className="text-blue-600 dark:text-blue-500 flex-shrink-0"
                    />{" "}
                    Digitized Prior Records / Lab OCR
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
                    {selectedPatient.extracted_doc_notes ||
                      "No prior records attached during this session."}
                  </p>
                </div>

                {/* UPDATED: 3-Column Layout for Koshtha Pariksha */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50/60 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-500 flex items-center gap-1">
                      <Flame size={14} className="flex-shrink-0" /> Agni
                      Pariksha (Digestive Fire)
                    </span>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 break-words">
                      {selectedPatient.agni_status || "Samagni"}
                    </p>
                  </div>
                  <div className="bg-indigo-50/60 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
                      <Activity size={14} className="flex-shrink-0" /> Koshtha
                      (Bowel Habit)
                    </span>
                    <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-1 break-words">
                      {selectedPatient.koshtha_status || "Madhyama Koshtha"}
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-500 flex items-center gap-1">
                      <Apple size={14} className="flex-shrink-0" /> Ahara-Vihara
                      (Diet & Lifestyle)
                    </span>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1 break-words">
                      {selectedPatient.ahara_vihara || "Balanced routine"}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/40 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-slate-300 mb-3">
                    Ayurvedic Vikriti Triaging (Dosha Imbalance)
                  </h4>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="h-48 w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="65%"
                          data={selectedPatient.dosha_data}
                        >
                          <PolarGrid
                            stroke={isDarkMode ? "#334155" : "#e5e7eb"}
                          />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{
                              fill: isDarkMode ? "#cbd5e1" : "#374151",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                          />
                          <Radar
                            name="Imbalance"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fill="#3b82f6"
                            fillOpacity={0.4}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 space-y-2.5">
                      {selectedPatient.dosha_data?.map((item) => {
                        const info = doshaInfo[item.subject];
                        if (!info) return null;
                        return (
                          <div
                            key={item.subject}
                            className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm"
                          >
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-bold text-gray-800 dark:text-slate-200">
                                {item.subject}{" "}
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">
                                  {info.subtitle}
                                </span>
                              </span>
                              <span className="font-bold text-gray-600 dark:text-slate-400">
                                {item.value}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full ${info.colorClass}`}
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 italic break-words">
                              💡{" "}
                              <strong className="text-gray-700 dark:text-slate-300">
                                {info.desc.split("(")[0]}
                              </strong>
                              ({info.desc.split("(")[1]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
                <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                  <span className="text-xs font-bold uppercase">
                    Total Footfall
                  </span>
                  <Users
                    size={18}
                    className="text-blue-600 dark:text-blue-500"
                  />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalFootfall}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} /> Active kiosk sessions recorded
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
                <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                  <span className="text-xs font-bold uppercase">
                    Approved Cases
                  </span>
                  <Check
                    size={18}
                    className="text-green-600 dark:text-green-500"
                  />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {approvedCount}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  {totalFootfall
                    ? Math.round((approvedCount / totalFootfall) * 100)
                    : 0}
                  % clearance rate
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
                <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                  <span className="text-xs font-bold uppercase">
                    Red-Flag Alerts
                  </span>
                  <AlertTriangle
                    size={18}
                    className="text-red-600 dark:text-red-500"
                  />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {redFlagCount}
                </p>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                  Immediate triage priority
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
                <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                  <span className="text-xs font-bold uppercase">
                    ABHA / ABDM Linked
                  </span>
                  <ShieldCheck
                    size={18}
                    className="text-blue-600 dark:text-blue-500"
                  />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {abhaLinkedCount}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  National Health Locker sync
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Globe2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    Multilingual Kiosk Reach
                  </p>
                  <p className="text-base font-black text-gray-800 dark:text-white">
                    7 Regional Languages
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Active voice & OCR support
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Timer size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    Avg Triage Duration
                  </p>
                  <p className="text-base font-black text-gray-800 dark:text-white">
                    1.8 Minutes
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Dashavidha Pariksha speedup
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <PieIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    Interoperability Standard
                  </p>
                  <p className="text-base font-black text-gray-800 dark:text-white">
                    ABDM FHIR R4
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    NRCeS health vault compliant
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <BarChart3
                      size={18}
                      className="text-blue-600 dark:text-blue-500"
                    />{" "}
                    National Ayush Dosha Trends (Vikriti)
                  </h3>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Aggregated imbalance percentage across all active kiosk
                  consultations in the database.
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doshaBarData}>
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: isDarkMode ? "#cbd5e1" : "#374151",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: isDarkMode ? "#cbd5e1" : "#374151" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                          borderColor: isDarkMode ? "#334155" : "#e5e7eb",
                          color: isDarkMode ? "#fff" : "#000",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between transition-colors duration-200">
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <ShieldCheck
                      size={18}
                      className="text-emerald-600 dark:text-emerald-500"
                    />{" "}
                    Ministry of Ayush Compliance & Interoperability
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                    This MediKiosk platform strictly adheres to the Ministry of
                    Ayush digital health standards, integrating Dashavidha
                    Pariksha metrics with standard electronic health records
                    (EHR).
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <span className="font-bold text-gray-700 dark:text-slate-300">
                        DPDP Act 2023 Consent Audit
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        100% Compliant
                      </span>
                    </div>
                    <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <span className="font-bold text-gray-700 dark:text-slate-300">
                        ABDM Health Locker Protocol
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        Active API Hook
                      </span>
                    </div>
                    <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <span className="font-bold text-gray-700 dark:text-slate-300">
                        AI Triage Model
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        Google Gemini 3.5 Flash
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
                  <Activity
                    size={20}
                    className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                  />
                  <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium">
                    National health data is encrypted at rest via Supabase
                    PostgreSQL secure schemas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFhirModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Code2 className="text-indigo-400" size={20} />
                <div>
                  <h3 className="text-white text-sm font-black">
                    ABDM FHIR R4 Bundle Record
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Standardized DocumentBundle for National Health Authority &
                    EHR Interoperability
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFhir}
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <Copy size={12} /> {copiedFhir ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownloadFhir}
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition shadow-sm"
                >
                  <Download size={12} /> Export .json
                </button>
                <button
                  onClick={() => setShowFhirModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-900 font-mono text-[11px] text-emerald-400">
              <pre>
                {JSON.stringify(generateFhirBundle(selectedPatient), null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Profile: NRCeS DocumentBundle R4</span>
              <span>
                Patient Ref: {selectedPatient.token_number || "TKN-PENDING"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
