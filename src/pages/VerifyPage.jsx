import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  Home,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const fallbackName = searchParams.get("name");
  const fallbackAbha = searchParams.get("abha");

  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("token_number", token)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setPatient(data);
      setLoading(false);
    }
    verifyToken();
  }, [token]);

  const cleanProvenanceEmoji = (text) => {
    if (!text) return "";
    return text.replace(/^(🗣️|📄|🤖)\s*/, "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-bold flex flex-col items-center gap-2">
          <ShieldCheck size={32} />
          Verifying ABDM Health Record...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex justify-center items-start print:bg-white print:p-0">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none">
        <div className="bg-emerald-600 p-6 text-white text-center relative print:bg-white print:text-black print:border-b print:border-black">
          <div className="absolute top-4 right-4 print:hidden">
            <ShieldCheck size={24} className="text-emerald-200" />
          </div>
          <div className="flex justify-center mb-3">
            <div className="bg-white p-2 rounded-full text-emerald-600 print:text-black print:p-0">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <h1 className="text-xl font-black tracking-wide">
            Verified Digital Health Pass <br />{" "}
            <span className="text-lg">सत्यापित डिजिटल स्वास्थ्य पास</span>
          </h1>
          <p className="text-emerald-100 text-xs mt-1 print:text-gray-600">
            Ministry of Ayush • Authenticated OPD Record
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-end border-b pb-4 print:border-black">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">
                Patient Name / मरीज का नाम
              </p>
              <p className="text-lg font-black text-gray-900">
                {patient?.name || fallbackName}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                ABHA:{" "}
                <span className="font-mono font-bold text-gray-800">
                  {patient?.abha_id || fallbackAbha}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase">
                Token Number / टोकन नंबर
              </p>
              <p className="text-2xl font-black text-blue-600 print:text-black">
                {token}
              </p>
            </div>
          </div>

          {patient ? (
            <>
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${patient.is_red_flag ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
              >
                {patient.is_red_flag ? (
                  <AlertTriangle size={20} className="flex-shrink-0" />
                ) : (
                  <Activity size={20} className="flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-black uppercase">
                    Triage Status:{" "}
                    {patient.is_red_flag
                      ? "URGENT / तत्काल"
                      : "Routine / सामान्य"}
                  </p>
                  <p className="text-[10px] opacity-80">
                    Present this pass to the OPD nursing station immediately.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">
                    Chief Complaint / मुख्य शिकायत
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cleanProvenanceEmoji(patient.primary_complaint)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">
                    Ayurvedic Assessment (Agni) / अग्नि परीक्षण
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {patient.agni_status}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-sm text-slate-500 font-medium">
                Valid pass, but clinical details are restricted or still
                syncing.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-sm"
          >
            <Printer size={16} /> Print Pass
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition shadow-sm"
          >
            <Home size={16} /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}
