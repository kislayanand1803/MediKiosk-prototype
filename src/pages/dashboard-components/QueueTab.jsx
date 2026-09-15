import { Stethoscope } from "lucide-react";
import PatientQueueList from "./PatientQueueList";
import PatientDetailPanel from "./PatientDetailPanel";

/**
 * ============================================================================
 * QUEUE TAB LAYOUT
 * ============================================================================
 */
export default function QueueTab({
  patients,
  selectedPatient,
  isEditing,
  caseNotes,
  prescription, // NEW: Inherit state
  selectedDate,
  queueFilter,
  searchQuery,
  isDarkMode,
  onChangeDate,
  onChangeQueueFilter,
  onChangeSearchQuery,
  onSelectPatient,
  onCallNextPatient,
  onChangeCaseNotes,
  onChangePrescription, // NEW: Inherit setter
  onToggleEdit,
  onApprove,
  onDownloadReport,
  onOpenFhirModal,
  onOpenDocViewer,
  formatTime,
  getDynamicWaitTime,
  getElapsedConsultationTime,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
      <PatientQueueList
        patients={patients}
        selectedPatient={selectedPatient}
        selectedDate={selectedDate}
        onChangeDate={onChangeDate}
        queueFilter={queueFilter}
        onChangeQueueFilter={onChangeQueueFilter}
        searchQuery={searchQuery}
        onChangeSearchQuery={onChangeSearchQuery}
        onSelectPatient={onSelectPatient}
        onCallNextPatient={onCallNextPatient}
        formatTime={formatTime}
        getDynamicWaitTime={getDynamicWaitTime}
      />

      {!selectedPatient ? (
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 sm:p-6 h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50/50 dark:bg-slate-900/50 transition-colors duration-200">
          <Stethoscope
            size={48}
            className="mb-4 text-gray-300 dark:text-slate-700"
            aria-hidden="true"
          />
          <p className="text-lg font-bold text-gray-500 dark:text-slate-400">
            No Patient Selected
          </p>
          <p className="text-sm mt-1 text-center">
            Select a patient from the queue or change the date to view records.
          </p>
        </div>
      ) : (
        <PatientDetailPanel
          patient={selectedPatient}
          caseNotes={caseNotes}
          prescription={prescription}
          onChangeCaseNotes={onChangeCaseNotes}
          onChangePrescription={onChangePrescription}
          isEditing={isEditing}
          onToggleEdit={onToggleEdit}
          onApprove={onApprove}
          onDownloadReport={onDownloadReport}
          onOpenFhirModal={onOpenFhirModal}
          onOpenDocViewer={onOpenDocViewer}
          isDarkMode={isDarkMode}
          formatTime={formatTime}
          getElapsedConsultationTime={getElapsedConsultationTime}
        />
      )}
    </div>
  );
}
