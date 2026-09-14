import { Code2, Copy, Download, X } from "lucide-react";
import { generateFhirBundle } from "../dashboard-utils/fhirBundle";

/**
 * Modal showing the raw ABDM FHIR R4 bundle for the selected patient,
 * with copy-to-clipboard and .json download actions.
 */
export default function FhirExportModal({ patient, onClose, onCopy, copied, onDownload }) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Code2 className="text-indigo-400" size={20} aria-hidden="true" />
            <div>
              <h3 className="text-white text-sm font-black">ABDM FHIR R4 Bundle Record</h3>
              <p className="text-[10px] text-slate-400">
                Standardized DocumentBundle for National Health Authority & EHR Interoperability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Copy size={12} aria-hidden="true" /> {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              <Download size={12} aria-hidden="true" /> Export .json
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close FHIR export dialog"
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-900 font-mono text-[11px] text-emerald-400">
          <pre>{JSON.stringify(generateFhirBundle(patient), null, 2)}</pre>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Profile: NRCeS DocumentBundle R4</span>
          <span>Patient Ref: {patient.token_number || "TKN-PENDING"}</span>
        </div>
      </div>
    </div>
  );
}
