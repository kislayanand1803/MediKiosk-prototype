import { useState } from "react";
import { Megaphone, Calendar, BellRing, Search, Clock, Timer, AlertTriangle } from "lucide-react";
import TabButton from "./TabButton";
import { PATIENT_STATUS, QUEUE_FILTERS } from "../dashboard-data/patientStatus";

const todayIso = () => new Date().toISOString().split("T")[0];

/**
 * Left-hand column: call-next action, date picker, status filter,
 * search, and the scrollable patient list itself.
 */
export default function PatientQueueList({
  patients,
  selectedPatient,
  selectedDate,
  onChangeDate,
  queueFilter,
  onChangeQueueFilter,
  searchQuery,
  onChangeSearchQuery,
  onSelectPatient,
  onCallNextPatient,
  formatTime,
  getDynamicWaitTime,
}) {
  // Replaces the old alert("No waiting patients in the queue!") with an
  // inline, dismissable message that matches the rest of the UI instead
  // of a native browser dialog.
  const [queueNotice, setQueueNotice] = useState("");

  const handleCallNext = async () => {
    const { calledPatient } = await onCallNextPatient();
    if (!calledPatient) {
      setQueueNotice("No waiting patients in the queue.");
      setTimeout(() => setQueueNotice(""), 3000);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(query) || p.token_number?.toLowerCase().includes(query);

    const status = p.status || "Pending";
    if (queueFilter === PATIENT_STATUS.WAITING) {
      return (
        matchesSearch &&
        status !== PATIENT_STATUS.APPROVED &&
        status !== PATIENT_STATUS.IN_CONSULTATION
      );
    }
    if (queueFilter === PATIENT_STATUS.IN_CONSULTATION) {
      return matchesSearch && status === PATIENT_STATUS.IN_CONSULTATION;
    }
    if (queueFilter === PATIENT_STATUS.APPROVED) {
      return matchesSearch && status === PATIENT_STATUS.APPROVED;
    }
    return matchesSearch;
  });

  return (
    <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl transition-colors duration-200">
        <button
          type="button"
          onClick={handleCallNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-black py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition active:scale-95"
        >
          <Megaphone size={18} aria-hidden="true" /> Call Next Patient
        </button>

        {queueNotice && (
          <p
            className="text-xs text-center font-semibold text-orange-600 dark:text-orange-400"
            role="status"
          >
            {queueNotice}
          </p>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="queueDate" className="sr-only">
            Queue date
          </label>
          <Calendar size={14} className="text-gray-500 dark:text-slate-400" aria-hidden="true" />
          <input
            id="queueDate"
            type="date"
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white text-xs py-1.5 px-2 rounded-md focus:ring-2 focus:ring-blue-600 outline-none font-bold"
          />
          {selectedDate === todayIso() && (
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0 font-bold">
              <BellRing size={10} aria-hidden="true" /> Live
            </span>
          )}
        </div>

        <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-lg mt-2 transition-colors duration-200">
          {QUEUE_FILTERS.map((filter) => (
            <TabButton
              key={filter.id}
              size="sm"
              activeColor={filter.activeColor}
              active={queueFilter === filter.id}
              onClick={() => onChangeQueueFilter(filter.id)}
            >
              {filter.label}
            </TabButton>
          ))}
        </div>

        <div className="relative">
          <label htmlFor="patientSearch" className="sr-only">
            Search patients by name or token
          </label>
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            id="patientSearch"
            type="text"
            placeholder="Search name or token..."
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
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
          filteredPatients.map((patient) => {
            const isActive = patient.id === selectedPatient?.id;
            const isConsulting = patient.status === PATIENT_STATUS.IN_CONSULTATION;
            const isToday = selectedDate === todayIso();

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3 border rounded-xl transition cursor-pointer relative overflow-hidden ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                {patient.is_red_flag && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" aria-hidden="true" />
                )}

                <div className="flex justify-between items-start ml-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xs px-1.5 py-0.5 rounded ${
                          isConsulting
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300"
                        }`}
                      >
                        {patient.token_number || "TKN-PENDING"}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {patient.name}
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1.5 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Clock size={10} aria-hidden="true" /> In: {formatTime(patient.created_at)}
                      </p>
                      {patient.status !== PATIENT_STATUS.APPROVED &&
                        patient.status !== PATIENT_STATUS.IN_CONSULTATION &&
                        isToday && (
                          <p className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                            <Timer size={10} aria-hidden="true" /> Wait:{" "}
                            {getDynamicWaitTime(patient.created_at)}
                          </p>
                        )}
                    </div>
                  </div>
                  {patient.is_red_flag && (
                    <AlertTriangle
                      size={14}
                      className="text-red-500 animate-pulse"
                      aria-label="Red flag: urgent"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
