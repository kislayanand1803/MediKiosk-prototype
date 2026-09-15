import { Activity, Pill, FileText, Clock } from "lucide-react";

export default function ClinicalTimeline({
  timeline = [],
  medications = [],
  labValues = [],
}) {
  // If no data was extracted, show a clean empty state (Updated for Dark Mode)
  if (
    timeline.length === 0 &&
    medications.length === 0 &&
    labValues.length === 0
  ) {
    return (
      <div className="p-6 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <Clock
          size={24}
          className="mx-auto mb-2 opacity-50"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">
          No historical timeline or documents detected.
        </p>
      </div>
    );
  }

  return (
    // Main Container (Updated for Dark Mode)
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 transition-colors duration-200">
      {/* SECTION 1: Chronological Timeline */}
      {timeline.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} aria-hidden="true" /> Chronological History
          </h3>
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-[#0f3c31]"></div>
                <p className="text-xs font-bold text-[#cd6b40] mb-0.5">
                  {item.date}
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.event}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: OCR Extracted Entities (Labs & Meds) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        {/* Medications Extracted */}
        {medications.length > 0 && (
          <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <h3 className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Pill size={12} aria-hidden="true" /> Extracted Medications
            </h3>
            <ul className="space-y-2">
              {medications.map((med, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-start bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-orange-50 dark:border-slate-700 shadow-sm"
                >
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {med.drugName}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                      {med.dosage}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {med.duration}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Labs Extracted */}
        {labValues.length > 0 && (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Activity size={12} aria-hidden="true" /> Extracted Lab Values
            </h3>
            <ul className="space-y-2">
              {labValues.map((lab, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-50 dark:border-slate-700 shadow-sm"
                >
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {lab.testName}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-md ${
                      lab.isAbnormal
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {lab.result}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
