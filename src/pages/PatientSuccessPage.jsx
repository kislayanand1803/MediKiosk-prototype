import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Home, Printer, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../services/supabaseClient";
import { getT } from "../utils/translations";

/**
 * ==========================================
 * PATIENT SUCCESS & TOKEN PAGE
 * ==========================================
 * This component renders immediately after the AI triage is complete.
 * It assigns a daily sequential queue token to the patient, updates the database,
 * and generates a scannable QR code for the hospital staff to verify.
 */
export default function PatientSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE MANAGEMENT ---
  // 1. Instantly grab the data passed via React Router from the ChatPage
  // This prevents the UI from getting stuck on "Pending..." if the DB is slow.
  const appLanguage = location.state?.appLanguage || "en";
  const currentCase = location.state?.currentCase || {};
  const t = getT(appLanguage);

  // 2. Pre-fill the local state with the known patient data immediately
  const [tokenDetails, setTokenDetails] = useState({
    serialNumber: currentCase.token_number || "Pending...",
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    name: currentCase.name || "Patient",
    age: currentCase.age || "--",
    gender: currentCase.gender || "--",
    abhaId: currentCase.abha_id || "Not Linked",
  });

  /**
   * ==========================================
   * TOKEN GENERATION LOGIC
   * ==========================================
   * Queries Supabase to count how many patients arrived today,
   * generates the next sequence number (e.g., TKN-005), and updates the record.
   */
  useEffect(() => {
    async function generateAndFetchToken() {
      // Safety check: If we don't have a valid DB ID from the chat page, stop here.
      if (!currentCase.id) {
        setTokenDetails((prev) => ({
          ...prev,
          serialNumber: `TKN-${Math.floor(Math.random() * 900) + 100}`, // Fallback mock token
        }));
        return;
      }

      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // 1. Count how many patients arrived today to figure out the next sequence
        const { count, error: countError } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString());

        if (countError) throw countError;

        // 2. Format the token number (e.g., TKN-001, TKN-002)
        const sequenceNum = count > 0 ? count : 1;
        const finalToken = `TKN-${String(sequenceNum).padStart(3, "0")}`;

        // 3. Update THIS specific patient's token number in the database
        const { error: updateError } = await supabase
          .from("patients")
          .update({ token_number: finalToken })
          .eq("id", currentCase.id);

        if (updateError) throw updateError;

        // 4. Update the UI with the official finalized token
        setTokenDetails((prev) => ({
          ...prev,
          serialNumber: finalToken,
        }));
      } catch (err) {
        console.error("Error generating token details:", err);
        // Fallback: If DB fails or RLS blocks it, generate a local token so the UI doesn't break
        setTokenDetails((prev) => ({
          ...prev,
          serialNumber: `TKN-${Math.floor(Math.random() * 900) + 100}`,
        }));
      }
    }

    generateAndFetchToken();
  }, [currentCase.id]);

  /**
   * ==========================================
   * RENDER UI
   * ==========================================
   * Notice the use of "print:hidden", "print:bg-white", and "print:border-none" classes.
   * These specialized Tailwind classes ensure that when the user clicks "Print",
   * all the buttons and colored backgrounds disappear, saving printer ink and formatting
   * the output as a clean, physical paper ticket.
   */
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6 print:shadow-none print:border-none print:w-full">
        {/* Success Header (Hidden when printing) */}
        <div className="print:hidden space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full animate-bounce">
              <CheckCircle2 size={36} />
            </div>
          </div>
          <h1 className="text-xl font-black text-gray-900">{t.succTitle}</h1>
          <p className="text-xs text-gray-500">{t.succSub}</p>
        </div>

        {/* --- OFFICIAL TOKEN PASS --- */}
        <div className="border-2 border-dashed border-blue-300 bg-slate-50 p-6 rounded-2xl space-y-4 text-left print:border-black print:bg-white">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 print:border-black">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 print:text-black">
                {t.kioskLabel}
              </span>
              <h2 className="text-lg font-black text-gray-900">
                {t.passTitle}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">
                {t.tokenLabel}
              </span>
              <span className="text-2xl font-black text-blue-600 print:text-black">
                {tokenDetails.serialNumber}
              </span>
            </div>
          </div>

          {/* Patient Demographic Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t.patientName}
              </span>
              <span className="font-bold text-gray-800">
                {tokenDetails.name}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t.ageGender}
              </span>
              <span className="font-bold text-gray-800">
                {tokenDetails.age} yrs / {tokenDetails.gender}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t.abhaLocker}
              </span>
              <span className="font-mono font-bold text-gray-800">
                {tokenDetails.abhaId}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t.date}
              </span>
              <span className="font-medium text-gray-700">
                {tokenDetails.date}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {t.time}
              </span>
              <span className="font-medium text-gray-700">
                {tokenDetails.time}
              </span>
            </div>
          </div>

          {/* QR Code Verification Block */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between print:border-black">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 font-medium">
                {t.scanNote}
              </p>
              <p className="text-[9px] font-bold text-blue-700 print:text-black">
                {t.systemNote}
              </p>
            </div>
            <div className="bg-white p-2 rounded-lg border shadow-sm">
              {/* Generates a dynamic QR code that points to the VerifyPage with URL params */}
              <QRCodeSVG
                value={`${window.location.origin}/verify?token=${tokenDetails.serialNumber}&name=${encodeURIComponent(tokenDetails.name)}&abha=${tokenDetails.abhaId}`}
                size={64}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Post-Triage Instructions (Hidden when printing) */}
        <div className="print:hidden bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2 text-left">
          <ShieldCheck size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-[11px] text-blue-900 font-medium">{t.waitNote}</p>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="print:hidden flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            <Printer size={16} /> {t.printBtn}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            <Home size={16} /> {t.homeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
