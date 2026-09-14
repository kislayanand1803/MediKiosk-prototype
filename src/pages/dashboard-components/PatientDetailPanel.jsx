import {
  FileText,
  AlertTriangle,
  Calendar,
  Clock,
  Activity,
  FileSearch,
  Flame,
  Apple,
  Edit2,
  Save,
  Check,
  FileDown,
  Code2,
  Timer,
  Image as ImageIcon,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { DOSHA_INFO } from "../dashboard-data/doshaInfo";
import { PATIENT_STATUS } from "../dashboard-data/patientStatus";
// Module B: shared clinical-timeline component, not page-specific —
// lives in the app-wide src/components/ folder alongside other
// cross-page building blocks (adjust this path if your project
// structure differs).
import ClinicalTimeline from "../../components/ClinicalTimeline";

/**
 * Right-hand panel: the full clinical record for whichever patient is
 * currently selected in the queue, plus the doctor's available actions
 * (edit notes, approve, print report, export FHIR, view original scans).
 */
export default function PatientDetailPanel({
  patient,
  caseNotes,
  onChangeCaseNotes,
  isEditing,
  onToggleEdit,
  onApprove,
  onDownloadReport,
  onOpenFhirModal,
  onOpenDocViewer,
  isDarkMode,
  formatTime,
  getElapsedConsultationTime,
}) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 sm:p-6 h-full overflow-y-auto space-y-6 relative transition-colors duration-200">
      {patient.is_red_flag && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle
            className="text-red-600 dark:text-red-500 flex-shrink-0"
            size={24}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-red-900 dark:text-red-400 font-black text-sm">
              CRITICAL RED-FLAG ALERT
            </h3>
            <p className="text-red-700 dark:text-red-300 text-xs">
              AI flagged acute symptoms. Prioritize physical examination.
            </p>
          </div>
        </div>
      )}

      {/* Summary header + actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-slate-800 pb-4 gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-500" size={20} aria-hidden="true" />{" "}
            Clinical Summary
          </h2>
          <div className="flex items-center gap-3 mt-1 text-xs font-bold">
            <span className="text-gray-500 dark:text-slate-400">
              Token: {patient.token_number || "Pending"}
            </span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            {patient.status === PATIENT_STATUS.IN_CONSULTATION ? (
              <span className="text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Timer size={12} className="animate-pulse" aria-hidden="true" /> Active:{" "}
                {getElapsedConsultationTime()}
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full ${
                  patient.status === PATIENT_STATUS.APPROVED
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                }`}
              >
                Status: {patient.status || "Waiting"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={onDownloadReport}
            title="Download PDF Clinical Report"
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/50 transition"
          >
            <FileDown size={14} aria-hidden="true" /> Print PDF
          </button>

          <button
            type="button"
            onClick={onOpenFhirModal}
            title="Inspect ABDM FHIR JSON Document"
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-900/50 transition"
          >
            <Code2 size={14} aria-hidden="true" /> ABDM FHIR
          </button>

          <button
            type="button"
            onClick={onToggleEdit}
            className={`flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-bold transition ${
              isEditing
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            {isEditing ? <Save size={14} aria-hidden="true" /> : <Edit2 size={14} aria-hidden="true" />}{" "}
            {isEditing ? "Save" : "Edit"}
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={patient.status === PATIENT_STATUS.APPROVED}
            className={`flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold text-white shadow-sm transition ${
              patient.status === PATIENT_STATUS.APPROVED
                ? "bg-green-600 dark:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            }`}
          >
            <Check size={14} aria-hidden="true" />{" "}
            {patient.status === PATIENT_STATUS.APPROVED ? "Approved" : "Approve Case"}
          </button>
        </div>
      </div>

      {/* Data provenance legend */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-4 mb-2">
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Data Provenance:
        </span>
        <span className="flex items-center gap-1">
          <span className="text-sm" aria-hidden="true">
            🗣️
          </span>{" "}
          Patient Reported
        </span>
        <span className="flex items-center gap-1">
          <span className="text-sm" aria-hidden="true">
            📄
          </span>{" "}
          Document/Lab OCR
        </span>
        <span className="flex items-center gap-1">
          <span className="text-sm" aria-hidden="true">
            🤖
          </span>{" "}
          AI Inferred
        </span>
      </div>

      {/* Demographics & diagnosis */}
      <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-200/60 dark:border-slate-800 space-y-3.5">
        <div className="border-b border-gray-200 dark:border-slate-800 pb-2.5">
          <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Patient Details
          </p>
          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mt-0.5">
            {patient.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              {patient.age} yrs • {patient.gender}
            </p>
            <span className="text-gray-300 dark:text-slate-700">|</span>
            <p className="text-xs text-gray-600 dark:text-slate-300 font-bold flex items-center gap-1">
              <Calendar size={12} className="text-blue-500" aria-hidden="true" />{" "}
              {new Date(patient.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-300 font-bold flex items-center gap-1">
              <Clock size={12} className="text-blue-500" aria-hidden="true" />{" "}
              {formatTime(patient.created_at)}
            </p>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-slate-800 pb-2.5">
          <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Chief Complaint
          </p>
          <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-0.5 leading-relaxed break-words">
            {patient.primary_complaint}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Differential Diagnosis
          </p>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-sm mt-0.5 leading-relaxed break-words">
            {patient.possible_diagnosis}
          </p>
        </div>
      </div>

      {/* Editable subjective notes */}
      <div>
        <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Activity size={14} aria-hidden="true" /> Subjective Clinical History
        </h4>
        {isEditing ? (
          <>
            <label htmlFor="caseNotes" className="sr-only">
              Subjective clinical history
            </label>
            <textarea
              id="caseNotes"
              className="w-full p-3 text-sm text-gray-800 dark:text-white bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800 rounded-xl outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-inner"
              rows="3"
              value={caseNotes}
              onChange={(e) => onChangeCaseNotes(e.target.value)}
            />
          </>
        ) : (
          <p className="text-gray-700 dark:text-slate-300 text-xs bg-yellow-50/70 dark:bg-yellow-900/10 p-3.5 rounded-xl border border-yellow-200 dark:border-yellow-900/30 leading-relaxed break-words">
            {caseNotes}
          </p>
        )}
      </div>

      {/* Module B: extracted document/lab data & clinical timeline */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileSearch
              size={14}
              className="text-blue-600 dark:text-blue-500 flex-shrink-0"
              aria-hidden="true"
            />{" "}
            Digitized Clinical Timeline & OCR Extracts
          </h4>
          {patient.document_images?.length > 0 && (
            <button
              type="button"
              onClick={onOpenDocViewer}
              className="flex items-center gap-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-md font-bold shadow-sm transition"
            >
              <ImageIcon size={14} aria-hidden="true" /> View Original Scans
            </button>
          )}
        </div>

        {/* Dynamic timeline component mapped to the extracted JSON arrays */}
        <ClinicalTimeline
          timeline={patient.timeline || []}
          medications={patient.medications || []}
          labValues={patient.lab_values || []}
        />

        <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
            <span className="font-bold text-slate-800 dark:text-slate-200">Raw AI Inference Notes: </span>
            {patient.extracted_doc_notes || "No prior records attached during this session."}
          </p>
        </div>
      </div>

      {/* Dashavidha Pariksha metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50/60 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-500 flex items-center gap-1">
            <Flame size={14} className="flex-shrink-0" aria-hidden="true" /> Agni Pariksha (Digestive
            Fire)
          </span>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 break-words">
            {patient.agni_status || "Samagni"}
          </p>
        </div>
        <div className="bg-indigo-50/60 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
          <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
            <Activity size={14} className="flex-shrink-0" aria-hidden="true" /> Koshtha (Bowel Habit)
          </span>
          <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-1 break-words">
            {patient.koshtha_status || "Madhyama Koshtha"}
          </p>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
          <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-500 flex items-center gap-1">
            <Apple size={14} className="flex-shrink-0" aria-hidden="true" /> Ahara-Vihara (Diet &
            Lifestyle)
          </span>
          <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1 break-words">
            {patient.ahara_vihara || "Balanced routine"}
          </p>
        </div>
      </div>

      {/* Dosha radar chart */}
      <div className="bg-blue-50/40 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-slate-300 mb-3">
          Ayurvedic Vikriti Triaging (Dosha Imbalance)
        </h4>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="h-48 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={patient.dosha_data}>
                <PolarGrid stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: isDarkMode ? "#cbd5e1" : "#374151", fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Imbalance" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 space-y-2.5">
            {patient.dosha_data?.map((item) => {
              const info = DOSHA_INFO[item.subject];
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
                    <span className="font-bold text-gray-600 dark:text-slate-400">{item.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full ${info.colorClass}`} style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 italic break-words">
                    <span aria-hidden="true">💡</span>{" "}
                    <strong className="text-gray-700 dark:text-slate-300">{info.desc.split("(")[0]}</strong>(
                    {info.desc.split("(")[1]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
