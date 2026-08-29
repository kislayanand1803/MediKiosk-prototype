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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultPatient = {
    name: "Rohit",
    age: "52",
    gender: "Male",
    abhaId: "91-4582-1923-8821",
    primaryComplaint: "Severe Throbbing Headache & Acid Indigestion",
    subjectiveHistory:
      "Patient reports intense throbbing headache localized to the temporal region for 2 days. Reports irregular bowel movements and sleep disturbances.",
    possibleDiagnosis:
      "Vata-Pitta Shiroroga / Tension Migraine with Agni Imbalance",
    extractedDocNotes:
      "Prior Rx: Paracetamol 650mg SOS. No known major drug allergies recorded.",
    agniStatus:
      "Vishamagni (Irregular digestive capacity due to erratic eating habits)",
    aharaVihara:
      "Excessive dry/spicy food consumption, irregular sleep schedule (Ratri Jagarana).",
    urgencyLevel: "Review Soon",
    isRedFlag: false,
    doshaData: [
      { subject: "Vata", value: 80 },
      { subject: "Pitta", value: 55 },
      { subject: "Kapha", value: 30 },
    ],
  };

  const currentPatient = location.state?.currentCase || defaultPatient;

  const [isEditing, setIsEditing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [caseNotes, setCaseNotes] = useState(currentPatient.subjectiveHistory);

  useEffect(() => {
    setCaseNotes(currentPatient.subjectiveHistory);
  }, [currentPatient]);

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

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border shadow-sm gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Stethoscope className="text-blue-600 flex-shrink-0" /> MediKiosk
              Physician Portal
            </h1>
            <p className="text-xs text-gray-500">
              SIH26047 • ABDM & Ayush Clinical Triage
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 text-xs hover:underline font-bold bg-blue-50 px-3 py-1.5 rounded-lg w-full sm:w-auto text-center"
          >
            + New Patient Simulation
          </button>
        </header>

        {/* Emergency Red-Flag Banner */}
        {currentPatient.isRedFlag && (
          <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={28} />
            <div>
              <h3 className="text-red-900 font-black text-sm">
                CRITICAL RED-FLAG TRIAGE ALERT
              </h3>
              <p className="text-red-700 text-xs">
                AI detected acute symptoms requiring immediate priority physical
                examination.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Queue Column */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-4 lg:h-[750px]">
            <h3 className="font-bold text-gray-800 text-sm mb-3 border-b pb-2">
              Incoming Cases (ABHA Linked)
            </h3>
            <div
              className={`p-3.5 border rounded-xl transition ${isApproved ? "bg-white opacity-60 border-gray-200" : "bg-blue-50 border-blue-200 shadow-sm"}`}
            >
              <div className="flex justify-between items-start">
                <div className="truncate pr-2">
                  <p className="font-bold text-gray-900 truncate">
                    {currentPatient.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    ABHA: {currentPatient.abhaId}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    currentPatient.urgencyLevel === "Urgent"
                      ? "bg-red-100 text-red-800"
                      : isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {isApproved ? "Approved" : currentPatient.urgencyLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Structured Case Report Column */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:h-[750px] lg:overflow-y-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-gray-900">
                <FileText className="text-blue-600 flex-shrink-0" size={20} />{" "}
                Pre-Consultation Clinical Record
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-bold transition ${
                    isEditing
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                  {isEditing ? "Save Notes" : "Edit Notes"}
                </button>
                <button
                  onClick={() => setIsApproved(true)}
                  disabled={isApproved}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold text-white shadow-sm transition ${
                    isApproved
                      ? "bg-green-600 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Check size={14} />{" "}
                  {isApproved ? "Case Approved" : "Approve & Push"}
                </button>
              </div>
            </div>

            {/* Demographics & Clinical Overview Card (Fixed text wrapping) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3.5">
              <div className="border-b border-gray-200 pb-2.5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Patient Details
                </p>
                <p className="font-bold text-gray-900 text-sm sm:text-base mt-0.5">
                  {currentPatient.name}
                </p>
                <p className="text-xs text-gray-500">
                  {currentPatient.age} yrs • {currentPatient.gender}
                </p>
              </div>

              <div className="border-b border-gray-200 pb-2.5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Chief Complaint
                </p>
                <p className="font-bold text-blue-700 text-sm mt-0.5 leading-relaxed break-words">
                  {currentPatient.primaryComplaint}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Differential Diagnosis
                </p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 leading-relaxed break-words">
                  {currentPatient.possibleDiagnosis}
                </p>
              </div>
            </div>

            {/* Subjective History */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1.5">
                <Activity size={14} /> Subjective Clinical History
              </h4>
              {isEditing ? (
                <textarea
                  className="w-full p-3 text-sm text-gray-800 border-2 border-blue-300 rounded-xl outline-none focus:border-blue-600 shadow-inner"
                  rows="3"
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                />
              ) : (
                <p className="text-gray-700 text-xs bg-yellow-50/70 p-3.5 rounded-xl border border-yellow-200 leading-relaxed break-words">
                  {caseNotes}
                </p>
              )}
            </div>

            {/* Module B: Document OCR Findings */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileSearch size={14} className="text-blue-600 flex-shrink-0" />{" "}
                Digitized Prior Records / Lab OCR
              </h4>
              <p className="text-xs text-slate-600 break-words">
                {currentPatient.extractedDocNotes ||
                  "No prior records attached during this session."}
              </p>
            </div>

            {/* Ayush Dashavidha Parameters: Agni & Ahara-Vihara */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Flame size={14} className="flex-shrink-0" /> Agni Pariksha
                  (Digestive Fire)
                </span>
                <p className="text-xs text-amber-800 mt-1 break-words">
                  {currentPatient.agniStatus || "Samagni"}
                </p>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <Apple size={14} className="flex-shrink-0" /> Ahara-Vihara
                  (Diet & Lifestyle)
                </span>
                <p className="text-xs text-emerald-800 mt-1 break-words">
                  {currentPatient.aharaVihara || "Balanced routine"}
                </p>
              </div>
            </div>

            {/* Ayurvedic Vikriti Radar Chart */}
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold uppercase text-gray-700 mb-3">
                Ayurvedic Vikriti Triaging (Dosha Imbalance)
              </h4>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="h-48 w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="65%"
                      data={currentPatient.doshaData}
                    >
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fill: "#374151",
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
                  {currentPatient.doshaData?.map((item) => {
                    const info = doshaInfo[item.subject];
                    if (!info) return null;
                    return (
                      <div
                        key={item.subject}
                        className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-bold text-gray-800">
                            {item.subject}{" "}
                            <span className="text-[10px] text-gray-400 font-normal">
                              {info.subtitle}
                            </span>
                          </span>
                          <span className="font-bold text-gray-600">
                            {item.value}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${info.colorClass}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 italic break-words">
                          💡{" "}
                          <strong className="text-gray-700">
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
        </div>
      </div>
    </div>
  );
}
