import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Home, Printer, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

/**
 * ============================================================================
 * PATIENT SUCCESS & SECURE EXIT PAGE (ABDM COMPLIANT)
 * ============================================================================
 * Displays the finalized OPD token and digital verification QR code.
 *
 * SECURITY ARCHITECTURE:
 * 1. Resiliency: Implements `sessionStorage` caching to ensure the patient's
 *    ticket is not lost if the kiosk browser is accidentally refreshed.
 * 2. DPDP Compliance: Executes strict volatile memory wiping (`sessionStorage`
 *    clearing and history overwrite) immediately upon user exit, ensuring the
 *    kiosk remains completely stateless for the next walk-in patient.
 */
export default function PatientSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  /**
   * --------------------------------------------------------------------------
   * TICKET STATE HYDRATION (REFRESH-PROOF)
   * --------------------------------------------------------------------------
   * Load patient case from router state on arrival. If the user hits F5/Refresh,
   * recover the active ticket from secure session storage.
   */
  const [activeCase] = useState(() => {
    if (location.state?.currentCase) {
      sessionStorage.setItem(
        "active_kiosk_ticket",
        JSON.stringify(location.state.currentCase),
      );
      return location.state.currentCase;
    }
    const saved = sessionStorage.getItem("active_kiosk_ticket");
    return saved ? JSON.parse(saved) : {};
  });

  const [tokenDetails] = useState({
    serialNumber: activeCase.token_number || "TKN-001",
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    name: activeCase.name || "Patient",
    age: activeCase.age || "--",
    gender: activeCase.gender || "--",
    abhaId: activeCase.abha_id || "Not Linked",
    careContextRef: activeCase.care_context_ref || null, // Provided if M3 Link succeeds
  });

  /**
   * Ensure native Web Speech API audio streams are cleanly terminated
   * upon arriving at the success screen.
   */
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  /**
   * --------------------------------------------------------------------------
   * SECURE EXIT & VOLATILE MEMORY WIPE
   * --------------------------------------------------------------------------
   * Purges cached records and forces a hard router replacement.
   * Prevents subsequent patients from hitting the physical "Back" button
   * to view PHI.
   */
  const handleSecureExit = () => {
    // 1. Purge the cached ticket from memory
    sessionStorage.removeItem("active_kiosk_ticket");
    sessionStorage.clear();

    // 2. Overwrite browser history to prevent backwards navigation attacks
    window.history.replaceState({}, document.title);

    // 3. Return to idle screen
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6 print:shadow-none print:border-none print:w-full">
        {/* --- HEADER --- */}
        <div className="print:hidden space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full animate-bounce">
              <CheckCircle2 size={36} />
            </div>
          </div>
          <h1 className="text-xl font-black text-gray-900">{t("succTitle")}</h1>
          <p className="text-xs text-gray-500">{t("succSub")}</p>
        </div>

        {/* --- TOKEN TICKET (Printable Area) --- */}
        <div className="border-2 border-dashed border-blue-300 bg-slate-50 p-6 rounded-2xl space-y-4 text-left print:border-black print:bg-white">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 print:border-black">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 print:text-black">
                {t("kioskLabel")}
              </span>
              <h2 className="text-lg font-black text-gray-900">
                {t("passTitle")}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">
                {t("tokenNum")}
              </span>
              <span className="text-2xl font-black text-blue-600 print:text-black">
                {tokenDetails.serialNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t("patientName")}
              </span>
              <span className="font-bold text-gray-800">
                {tokenDetails.name}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t("ageGender")}
              </span>
              <span className="font-bold text-gray-800">
                {tokenDetails.age} yrs / {tokenDetails.gender}
              </span>
            </div>

            {/* --- ABDM M3 CARE CONTEXT LINKING STATUS --- */}
            <div className="col-span-2 bg-blue-100/50 p-2 rounded-lg border border-blue-200 print:border-gray-300 print:bg-transparent">
              <span className="text-blue-600 print:text-gray-600 block text-[10px] uppercase font-bold">
                {t("abhaLocker")} Status
              </span>
              <div className="flex justify-between items-center mt-1">
                <span className="font-mono font-bold text-gray-800">
                  {tokenDetails.abhaId}
                </span>

                {/* Dynamically displays the M3 Care Context Reference if the backend linked it successfully */}
                {tokenDetails.careContextRef && (
                  <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm print:border print:border-black print:text-black print:bg-white">
                    <CheckCircle2 size={10} /> Linked:{" "}
                    {tokenDetails.careContextRef}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t("date")}
              </span>
              <span className="font-medium text-gray-700">
                {tokenDetails.date}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t("time")}
              </span>
              <span className="font-medium text-gray-700">
                {tokenDetails.time}
              </span>
            </div>
          </div>

          {/* --- QR CODE VERIFICATION --- */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between print:border-black">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 font-medium">
                {t("scanNote")}
              </p>
              <p className="text-[9px] font-bold text-blue-700 print:text-black">
                {t("systemNote")}
              </p>
            </div>
            <div className="bg-white p-2 rounded-lg border shadow-sm">
              <QRCodeSVG
                value={`${window.location.origin}/verify?token=${tokenDetails.serialNumber}&name=${encodeURIComponent(tokenDetails.name)}&abha=${tokenDetails.abhaId}`}
                size={64}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* --- SECURITY FOOTER --- */}
        <div className="print:hidden bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2 text-left">
          <ShieldCheck size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-[11px] text-blue-900 font-medium">
            {t("waitNote")}
          </p>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="print:hidden flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            <Printer size={16} /> {t("printBtn")}
          </button>
          <button
            onClick={handleSecureExit}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            <Home size={16} /> {t("homeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
