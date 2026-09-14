import { Image as ImageIcon, X } from "lucide-react";

/**
 * Module B: shows the raw scanned documents/images a patient uploaded
 * during intake, so the doctor can verify the AI's OCR extraction
 * against the original source.
 */
export default function DocumentViewerModal({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-t-2xl">
          <div>
            <h3 className="text-slate-900 dark:text-white text-base font-black flex items-center gap-2">
              <ImageIcon className="text-emerald-500" size={20} aria-hidden="true" /> Original Patient
              Uploads
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Verify AI extractions against the raw scanned documents.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close original document viewer"
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-full transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 space-y-6">
          {patient.document_images?.map((doc, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="px-2 py-1 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex justify-between">
                <span>Document {index + 1}</span>
                <span className="truncate max-w-[200px]">{doc.name}</span>
              </div>
              {doc.type?.includes("pdf") ? (
                <iframe src={doc.base64} className="w-full h-[600px] rounded-lg" title={`PDF Viewer ${index}`} />
              ) : (
                <img
                  src={doc.base64}
                  alt={`Original upload ${index + 1} for ${patient.name}`}
                  className="w-full object-contain rounded-lg max-h-[800px]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
