import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Terminal,
  Activity,
  Fingerprint,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

/**
 * ============================================================================
 * GLOBAL MASTER LOCK (SIH EXTERNAL ACCESS BARRIER)
 * ============================================================================
 * Completely hides the entire React tree until the passcode is entered.
 */
export default function SecurityWall({ onUnlock }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [terminalText, setTerminalText] = useState("AWAITING_INPUT...");

  const handleUnlock = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(false);
    setTerminalText("VERIFYING_CREDENTIALS...");

    // Simulate network delay for effect
    setTimeout(() => {
      // The master passcode for Judges/Admins
      if (
        passcode.toLowerCase() === "sih2026" ||
        passcode.toLowerCase() === "ayushadmin"
      ) {
        setTerminalText("ACCESS_GRANTED. ESTABLISHING_SECURE_TUNNEL...");
        sessionStorage.setItem("medikiosk_demo_auth", "true");

        setTimeout(() => {
          onUnlock(); // Tells App.jsx to drop the wall and render the real app
        }, 800);
      } else {
        setTerminalText("ACCESS_DENIED. UNAUTHORIZED_ATTEMPT_LOGGED.");
        setError(true);
        setIsAuthenticating(false);
        setPasscode("");
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Radar/Grid Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] overflow-hidden">
          {/* Top Warning Banner */}
          <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-red-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-red-500 tracking-widest uppercase">
              Restricted Government Network
            </span>
          </div>

          <div className="p-8 sm:p-10">
            {/* Logo & Branding */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center justify-center relative shadow-lg">
                  <ShieldCheck size={36} className="text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                MediKiosk <span className="text-emerald-500">Core</span>
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Development Phase • Admin Access Only
              </p>
            </div>

            {/* Simulated Terminal Output */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-6 font-mono text-[10px] text-emerald-500 flex items-center gap-2">
              <Terminal size={14} className="shrink-0" />
              <span className="truncate">{terminalText}</span>
              {isAuthenticating && (
                <span className="w-1.5 h-3 bg-emerald-500 animate-ping ml-1"></span>
              )}
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <input
                    type="password"
                    required
                    disabled={isAuthenticating}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Security PIN"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-950 border rounded-xl outline-none transition-all font-mono tracking-[0.3em] text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans text-center disabled:opacity-50 ${
                      error
                        ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                        : "border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    }`}
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] font-bold text-red-500 text-center mt-2"
                  >
                    Invalid PIN. Access logged and reported.
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !passcode}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.98]"
              >
                {isAuthenticating ? (
                  <>
                    <Activity size={18} className="animate-spin" />{" "}
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} /> Authorize Access
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Legal Warnings */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 text-center">
            <p className="text-[9px] sm:text-[10px] text-slate-500 leading-relaxed font-mono">
              UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED UNDER THE DIGITAL
              PERSONAL DATA PROTECTION (DPDP) ACT 2023. ALL TELEMETRY IS E2E
              ENCRYPTED.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
