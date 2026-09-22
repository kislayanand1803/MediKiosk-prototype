import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

/**
 * ==========================================
 * PHYSICIAN LOGIN SCREEN
 * ==========================================
 * Authentication is delegated entirely to Supabase Auth
 * (supabase.auth.signInWithPassword) — no credentials are compared
 * in the browser, and no fallback password exists in the client
 * bundle. See SUPABASE_AUTH_SETUP.md for the one-time dashboard
 * steps this depends on (creating a doctor account, enabling the
 * email/password provider, and locking down data access with RLS).
 */

/**
 * ==========================================
 * ROLE-AWARE STAFF LOGIN SCREEN
 * ==========================================
 * Authenticates via Supabase, checks the staff_role in the profiles table,
 * and dynamically routes the user to their specific workspace.
 */
export default function LoginScreen({ onBackHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError("Invalid email or password. Access denied.");
      setIsSubmitting(false);
      return;
    }

    // PHASE 2 RBAC: Fetch the role to determine where to send them
    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      setIsSubmitting(false);

      if (profileError || !profile) {
        setAuthError("Account exists, but no staff profile is configured.");
        return;
      }

      // Dynamic Routing based on staff_role
      switch (profile.role) {
        case "nurse":
          navigate("/triage");
          break;
        case "pharmacist":
          navigate("/dispensary");
          break;
        case "admin":
          navigate("/admin");
          break;
        case "physician":
        default:
          navigate("/doctor");
          break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-500/20 text-blue-400 rounded-full">
            <Lock size={32} aria-hidden="true" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-white">Staff Secure Portal</h1>
          <p className="text-xs text-slate-400">
            Restricted Area • DPDP Act Compliance & Data Protection
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="staffEmail"
              className="block text-xs font-bold text-slate-300 mb-1"
            >
              Staff Email
            </label>
            <input
              id="staffEmail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@medikiosk.in"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
          <div>
            <label
              htmlFor="staffPassword"
              className="block text-xs font-bold text-slate-300 mb-1"
            >
              Password
            </label>
            <input
              id="staffPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tracking-widest"
              required
            />
          </div>

          {authError && (
            <p
              className="text-xs text-red-400 font-semibold text-center animate-pulse"
              role="alert"
            >
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            {isSubmitting ? "Authenticating…" : "Authenticate & Access Portal"}
          </button>
        </form>

        <div className="text-center pt-4 mt-2">
          <button
            type="button"
            onClick={onBackHome}
            className="text-xs text-slate-500 hover:text-slate-300 font-bold transition flex items-center justify-center gap-1 mx-auto"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
