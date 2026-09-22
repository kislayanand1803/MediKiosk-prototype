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

/**
 * ==========================================
 * STAFF SESSION HOOK (Phase 2 Upgraded)
 * ==========================================
 * Tracks the Supabase Auth session AND fetches the user's role/department
 * from the public.profiles table to enforce Role-Based Access Control (RBAC).
 */
export function useDoctorSession() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSessionAndProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (mounted) {
          setSession(session);
          setProfile(prof);
          setIsLoadingSession(false);
        }
      } else {
        if (mounted) {
          setSession(null);
          setProfile(null);
          setIsLoadingSession(false);
        }
      }
    }

    fetchSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession?.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newSession.user.id)
            .single();
          if (mounted) {
            setSession(newSession);
            setProfile(prof);
            setIsLoadingSession(false);
          }
        } else {
          if (mounted) {
            setSession(null);
            setProfile(null);
            setIsLoadingSession(false);
          }
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = () => supabase.auth.signOut();

  return {
    session,
    profile, // NEW: Returns { role, full_name, department, on_shift }
    isAuthenticated: Boolean(session),
    isLoadingSession,
    logout,
  };
}
