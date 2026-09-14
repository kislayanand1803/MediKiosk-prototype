import { Stethoscope, Clock, Sun, Moon, LogOut } from "lucide-react";
import TabButton from "./TabButton";

/**
 * Dashboard header: title, the Queue/Analytics tab switcher, and the
 * home/theme/logout controls.
 */
export default function DashboardHeader({
  activeTab,
  onChangeTab,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  onGoHome,
}) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm gap-3 transition-colors duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="text-blue-600 flex-shrink-0" aria-hidden="true" /> MediKiosk
          Physician Portal
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock size={12} className="text-blue-600 dark:text-blue-500" aria-hidden="true" /> Auto-locks
          after 5 minutes of inactivity.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1 transition-colors duration-200">
          <TabButton active={activeTab === "queue"} onClick={() => onChangeTab("queue")}>
            Live Queue
          </TabButton>
          <TabButton active={activeTab === "analytics"} onClick={() => onChangeTab("analytics")}>
            Ayush Ministry Analytics
          </TabButton>
        </div>

        <button
          type="button"
          onClick={onGoHome}
          className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg"
        >
          Home
        </button>

        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
        >
          {isDarkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Lock session"
          title="Lock Session"
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
