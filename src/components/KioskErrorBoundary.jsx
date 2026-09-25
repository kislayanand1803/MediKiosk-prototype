import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ============================================================================
 * KIOSK ERROR BOUNDARY — Phase 1 of Offline Resilience
 * ============================================================================
 * Wraps the patient-facing kiosk flow (/intake → /chat → /success) to catch
 * any unhandled JavaScript error or malformed AI payload that would otherwise
 * produce a white-screen crash with no recovery path.
 *
 * WHY A CLASS COMPONENT:
 * React's componentDidCatch / getDerivedStateFromError lifecycle methods are
 * the only supported mechanism for error boundaries — they cannot be replicated
 * with hooks. This is intentionally limited to the kiosk flow; staff-facing
 * dashboards (Doctor, Nurse, Admin, Pharmacy) are not wrapped here because
 * those have their own session state and a white-screen there is recoverable
 * by a trained staff member, unlike a patient standing alone at a kiosk.
 *
 * USAGE (in App.jsx, wrapping only the kiosk routes):
 *   <KioskErrorBoundary>
 *     <Route path="/intake" element={<IntakePage />} />
 *     <Route path="/chat" element={<ChatPage />} />
 *     <Route path="/success" element={<PatientSuccessPage />} />
 *   </KioskErrorBoundary>
 *
 * The reset button clears all kiosk sessionStorage (no PHI left behind for
 * the next patient), logs the error for debugging, and reloads to /intake.
 */
export class KioskErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
    };
  }

  componentDidCatch(error, info) {
    // Log the full stack for dev debugging without surfacing it to patients.
    console.error("[KioskErrorBoundary] Caught unhandled error:", error, info);
  }

  handleReset = () => {
    // Purge all kiosk session data so the next patient starts clean.
    // FIX: Target consolidated kiosk_intake_draft and individual keys,
    // but EXPLICITLY PRESERVE kiosk_outbox so prior patients' unsaved records are never lost (Defect #3)[cite: 4].
    const kioskKeys = [
      "kiosk_intake_draft",
      "kiosk_intake_name",
      "kiosk_intake_age",
      "kiosk_intake_gender",
      "kiosk_intake_abha",
      "kiosk_intake_consent",
      "kiosk_intake_lang",
      "kiosk_chat_messages",
      "kiosk_chat_step",
      "active_kiosk_patient",
      "active_kiosk_ticket",
    ];
    kioskKeys.forEach((key) => sessionStorage.removeItem(key));

    // Force a full reload to /intake so React starts from a completely
    // fresh tree — setState alone can't clean up a corrupted subtree.
    window.location.href = "/intake";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-8 text-center space-y-6">
          {/* Error icon */}
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-600 p-4 rounded-full">
              <AlertTriangle size={40} />
            </div>
          </div>

          {/* Patient-facing message — no technical details */}
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              The kiosk encountered an unexpected error. Your data has not been
              submitted. Please press the button below to restart, or ask a
              staff member at the counter for assistance.
            </p>
          </div>

          {/* Staff instruction box — visually distinct so a nurse can
              recognize it instantly if they glance at the screen */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Staff Instructions
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              If this screen persists after pressing "Restart Kiosk," please
              perform a hard refresh (Ctrl + Shift + R on Windows, Cmd + Shift +
              R on Mac) or alert the IT desk. Reference: kiosk-boundary-error.
            </p>
          </div>

          {/* Reset action */}
          <button
            onClick={this.handleReset}
            className="w-full flex items-center justify-center gap-2 bg-[#0f3c31] hover:bg-[#1a4f43] text-white font-bold py-3.5 rounded-xl transition shadow-md focus:ring-4 focus:ring-[#0f3c31]/30"
          >
            <RefreshCw size={18} />
            Restart Kiosk
          </button>

          {/* Error reference for log correlation — visible but not alarming */}
          <p className="text-[10px] text-slate-400 font-mono">
            Ref: {this.state.errorMessage.substring(0, 60)}
          </p>
        </div>
      </div>
    );
  }
}
