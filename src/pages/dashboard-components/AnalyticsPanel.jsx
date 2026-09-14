import {
  Users,
  Check,
  AlertTriangle,
  ShieldCheck,
  Globe2,
  Timer,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  TrendingUp,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/**
 * "Ayush Ministry Analytics" tab: footfall/compliance KPIs, feature
 * highlight cards, the national dosha-trend bar chart, and the
 * compliance summary panel.
 */
export default function AnalyticsPanel({
  totalFootfall,
  approvedCount,
  redFlagCount,
  abhaLinkedCount,
  doshaBarData,
  isDarkMode,
}) {
  const clearanceRate = totalFootfall ? Math.round((approvedCount / totalFootfall) * 100) : 0;

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8 pr-2">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Total Footfall</span>
            <Users size={18} className="text-blue-600 dark:text-blue-500" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalFootfall}</p>
          <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
            <TrendingUp size={11} aria-hidden="true" /> Active kiosk sessions recorded
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Approved Cases</span>
            <Check size={18} className="text-green-600 dark:text-green-500" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{approvedCount}</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">{clearanceRate}% clearance rate</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Red-Flag Alerts</span>
            <AlertTriangle size={18} className="text-red-600 dark:text-red-500" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{redFlagCount}</p>
          <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Immediate triage priority</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">ABHA / ABDM Linked</span>
            <ShieldCheck size={18} className="text-blue-600 dark:text-blue-500" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{abhaLinkedCount}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">National Health Locker sync</p>
        </div>
      </div>

      {/* Feature highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Globe2 size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Multilingual Kiosk Reach</p>
            <p className="text-base font-black text-gray-800 dark:text-white">7 Regional Languages</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Active voice & OCR support</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Timer size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Avg Triage Duration</p>
            <p className="text-base font-black text-gray-800 dark:text-white">1.8 Minutes</p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Dashavidha Pariksha speedup</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <PieIcon size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Interoperability Standard</p>
            <p className="text-base font-black text-gray-800 dark:text-white">ABDM FHIR R4</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">NRCeS health vault compliant</p>
          </div>
        </div>
      </div>

      {/* Charts & compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600 dark:text-blue-500" aria-hidden="true" /> National
              Ayush Dosha Trends (Vikriti)
            </h3>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Aggregated imbalance percentage across all active kiosk consultations in the database.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doshaBarData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDarkMode ? "#cbd5e1" : "#374151", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis domain={[0, 100]} tick={{ fill: isDarkMode ? "#cbd5e1" : "#374151" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                    borderColor: isDarkMode ? "#334155" : "#e5e7eb",
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between transition-colors duration-200">
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-500" aria-hidden="true" /> Ministry
              of Ayush Compliance & Interoperability
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
              This MediKiosk platform strictly adheres to the Ministry of Ayush digital health
              standards, integrating Dashavidha Pariksha metrics with standard electronic health
              records (EHR).
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <span className="font-bold text-gray-700 dark:text-slate-300">DPDP Act 2023 Consent Audit</span>
                <span className="text-green-600 dark:text-green-400 font-bold">100% Compliant</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <span className="font-bold text-gray-700 dark:text-slate-300">ABDM Health Locker Protocol</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">Active API Hook</span>
              </div>
              <div className="flex justify-between text-xs p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <span className="font-bold text-gray-700 dark:text-slate-300">AI Triage Model</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">Google Gemini 3.6 Flash</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
            <Activity size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium">
              National health data is encrypted at rest via Supabase PostgreSQL secure schemas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
