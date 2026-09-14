import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

/**
 * Signs the doctor out automatically after `timeoutMs` of no mouse,
 * keyboard, scroll, or touch activity — the DPDP-driven auto-lock
 * mentioned on the login screen. Only runs while `active` is true.
 */
export function useIdleLogout(active, onIdle, timeoutMs = 5 * 60 * 1000) {
  const idleTimerRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(onIdle, timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [active, onIdle, timeoutMs]);
}
