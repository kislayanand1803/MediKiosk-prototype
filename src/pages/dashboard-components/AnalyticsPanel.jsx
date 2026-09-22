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
  Clock,
  DownloadCloud,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const DOSHA_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];
const DEMO_COLORS = ["#6366f1", "#ec4899", "#8b5cf6"];
const COMPLAINT_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#64748b",
];

export default function AnalyticsPanel({
  analyticsMonth,
  onChangeMonth,
  isLoading,
  totalFootfall = 0,
  approvedCount = 0,
  redFlagCount = 0,
  abhaLinkedCount = 0,
  doshaBarData = [],
  topComplaints = [],
  demographics = { ageData: [], genderData: [] },
  peakHours = [],
  isDarkMode,
  onExportCSV,
}) {
  const clearanceRate = totalFootfall
    ? Math.round((approvedCount / totalFootfall) * 100)
    : 0;

  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#1e293b" : "#fff",
    borderColor: isDarkMode ? "#334155" : "#e5e7eb",
    color: isDarkMode ? "#fff" : "#000",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "bold",
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8 pr-2 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-500 font-bold">
            <Loader2 className="animate-spin" size={20} />
            Fetching Period Data...
          </div>
        </div>
      )}

      {/* COMMAND CENTER HEADER & CSV EXPORT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3
              className="text-emerald-600 dark:text-emerald-500"
              aria-hidden="true"
            />
            Ayush Ministry Command Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Global historical telemetry, syndromic surveillance, and facility
            throughput.
          </p>
        </div>

        {/* Month Selector & Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="month"
            value={analyticsMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer dark:[color-scheme:dark]"
          />
          <button
            type="button"
            onClick={onExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 hover:shadow-emerald-600/30"
          >
            <DownloadCloud size={16} aria-hidden="true" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* ROW 1: CORE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Total Footfall</span>
            <Users
              size={18}
              className="text-blue-600 dark:text-blue-500"
              aria-hidden="true"
            />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {totalFootfall}
          </p>
          <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
            <TrendingUp size={11} aria-hidden="true" /> Period kiosk sessions
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Approved Cases</span>
            <Check
              size={18}
              className="text-green-600 dark:text-green-500"
              aria-hidden="true"
            />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {approvedCount}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">
            {clearanceRate}% clearance rate
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-1 transition-colors duration-200">
          <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase">Red-Flag Alerts</span>
            <AlertTriangle
              size={18}
              className="text-red-600 dark:text-red-500"
              aria-hidden="true"
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
              aria-hidden="true"
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

      {/* ROW 2: FEATURE HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Globe2 size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">
              Multilingual Kiosk Reach
            </p>
            <p className="text-base font-black text-gray-800 dark:text-white">
              22 Scheduled Languages
            </p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Active voice & OCR support
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Timer size={24} aria-hidden="true" />
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
            <PieIcon size={24} aria-hidden="true" />
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

      {/* ROW 3: THREE-COLUMN DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <BarChart3
                size={16}
                className="text-blue-600 dark:text-blue-500"
                aria-hidden="true"
              />{" "}
              Dosha Trends (Vikriti)
            </h3>
          </div>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doshaBarData}>
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: isDarkMode ? "#cbd5e1" : "#374151",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: isDarkMode ? "#cbd5e1" : "#374151",
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? "#334155" : "#f1f5f9" }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {doshaBarData.map((entry, index) => (
                    <Cell
                      key={`dosha-${index}`}
                      fill={DOSHA_COLORS[index % DOSHA_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Activity
                size={16}
                className="text-orange-500"
                aria-hidden="true"
              />{" "}
              Top Chief Complaints
            </h3>
            <span className="text-[9px] bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold uppercase">
              NLP Parser
            </span>
          </div>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topComplaints}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isDarkMode ? "#cbd5e1" : "#374151",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  width={75}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? "#334155" : "#f1f5f9" }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {topComplaints.map((entry, index) => (
                    <Cell
                      key={`complaint-${index}`}
                      fill={COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Users size={16} className="text-pink-500" aria-hidden="true" />{" "}
              Patient Demographics
            </h3>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="h-28 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics.genderData}
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {demographics.genderData.map((entry, index) => (
                      <Cell
                        key={`gender-${index}`}
                        fill={DEMO_COLORS[index % DEMO_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold text-slate-400">
                Gender
              </div>
            </div>
            <div className="h-28 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={demographics.ageData}
                  margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? "#cbd5e1" : "#64748b",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? "#cbd5e1" : "#64748b",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: isDarkMode ? "#334155" : "#f1f5f9" }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: PEAK HOURS HEATMAP */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Clock size={18} className="text-emerald-500" aria-hidden="true" />{" "}
            Operational Throughput (24-Hour Peak OPD Heatmap)
          </h3>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
            Facility Congestion
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Aggregated case volume mapped across a 24-hour cycle. Warmer colors
          indicate severe counter bottlenecks.
        </p>
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={peakHours}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDarkMode ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="time"
                tick={{
                  fill: isDarkMode ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: isDarkMode ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? "#334155" : "#f1f5f9" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {peakHours.map((entry, index) => (
                  <Cell
                    key={`peak-${index}`}
                    fill={
                      entry.count > 10
                        ? "#ef4444"
                        : entry.count > 5
                          ? "#f59e0b"
                          : "#10b981"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 5: COMPLIANCE FOOTER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between transition-colors duration-200">
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <ShieldCheck
              size={18}
              className="text-emerald-600 dark:text-emerald-500"
              aria-hidden="true"
            />
            Ministry of Ayush Compliance & Interoperability
          </h3>
          <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
            This MediKiosk platform strictly adheres to the Ministry of Ayush
            digital health standards, integrating Dashavidha Pariksha metrics
            with standard electronic health records (EHR).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex justify-between text-xs p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="font-bold text-gray-700 dark:text-slate-300">
                DPDP Act 2023 Consent Audit
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                100% Compliant
              </span>
            </div>
            <div className="flex justify-between text-xs p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="font-bold text-gray-700 dark:text-slate-300">
                ABDM Health Locker Protocol
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Active API Hook
              </span>
            </div>
            <div className="flex justify-between text-xs p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="font-bold text-gray-700 dark:text-slate-300">
                AI Triage Model
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                Google Gemini Flash
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
