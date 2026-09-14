import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";

/**
 * ==========================================
 * DOCTOR SESSION HOOK
 * ==========================================
 * Tracks the physician's Supabase Auth session.
 *
 * SECURITY NOTE: this replaces the previous approach of comparing
 * doctorId/password to `import.meta.env.VITE_DOCTOR_ID` /
 * `VITE_DOCTOR_PASSWORD` (with hardcoded fallbacks) directly in the
 * browser. Vite inlines VITE_-prefixed env vars into the shipped JS
 * bundle, so that check — and its fallback password — was readable
 * by anyone who opened dev tools on the deployed site, and
 * `sessionStorage.setItem("medikiosk_doc_auth", "true")` could be run
 * manually from the console to bypass login entirely.
 *
 * Here, the browser never evaluates credentials at all — it just
 * asks Supabase to verify them (see LoginScreen) and listens for the
 * resulting session. See SUPABASE_AUTH_SETUP.md for the one-time
 * dashboard configuration this depends on.
 */
export function useDoctorSession() {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  return {
    session,
    isAuthenticated: Boolean(session),
    isLoadingSession,
    logout,
  };
}
