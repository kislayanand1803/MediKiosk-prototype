import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const OUTBOX_KEY = "kiosk_outbox";

/**
 * ============================================================================
 * useNetworkStatus — Phase 3 of Offline Resilience
 * ============================================================================
 * Tracks the browser's online/offline state and manages an "outbox" of patient
 * records that couldn't be submitted while the network was down.
 *
 * WHY SESSION STORAGE FOR THE OUTBOX:
 * localStorage would survive past the session (bad for PHI). sessionStorage
 * is cleared when the browser tab closes, which is exactly what we want — the
 * kiosk is a shared device, and any unsent record sitting in storage across
 * sessions is both a privacy risk and stale data. If the clinic's internet is
 * down for so long that the tab closes, the patient should be re-triaged, not
 * submitted hours later from a cached record.
 *
 * LIMITATIONS TO BE AWARE OF:
 * The browser's online/offline events reflect network *connectivity*, not
 * Supabase *reachability* — a captive portal or firewall would show the browser
 * as "online" while Supabase requests still fail. The `flushOutbox` function
 * handles this by catching the Supabase error and leaving the record in the
 * outbox for the next flush attempt rather than treating it as permanent failure.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // FIX: Track outbox item count state to drive NetworkStatusBanner messaging properly
  const [outboxCount, setOutboxCount] = useState(() => {
    try {
      const items = JSON.parse(sessionStorage.getItem(OUTBOX_KEY) || "[]");
      return items.length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Adds a patient record to the outbox so it can be submitted once
  // connectivity is restored. The record is stored as-is — the flush
  // function submits it via the same Supabase insert path as a normal
  // online submission, so no special handling is needed on the server.
  const addToOutbox = useCallback((patientRecord) => {
    const existing = JSON.parse(sessionStorage.getItem(OUTBOX_KEY) || "[]");
    const updated = [
      ...existing,
      { ...patientRecord, _outbox_queued_at: new Date().toISOString() },
    ];
    sessionStorage.setItem(OUTBOX_KEY, JSON.stringify(updated));
    setOutboxCount(updated.length);
    console.info(
      `[Outbox] Record queued. Outbox now has ${updated.length} item(s).`,
    );
  }, []);

  // Attempts to submit all queued records when connectivity returns.
  // Called automatically when the browser fires the 'online' event,
  // and also exposed so components can call it manually via the Force
  // Refresh button already present in your dashboards.
  const flushOutbox = useCallback(async () => {
    const outbox = JSON.parse(sessionStorage.getItem(OUTBOX_KEY) || "[]");
    if (outbox.length === 0) {
      setOutboxCount(0);
      return 0;
    }

    console.info(`[Outbox] Flushing ${outbox.length} queued record(s)...`);
    const remaining = [];

    for (const record of outbox) {
      const { _outbox_queued_at, ...patientData } = record;
      const { error } = await supabase.from("patients").insert([patientData]);

      if (error) {
        console.warn(
          "[Outbox] Flush failed for record — keeping in queue:",
          error.message,
        );
        remaining.push(record); // Keep for next attempt
      } else {
        console.info("[Outbox] Record flushed successfully.");
      }
    }

    sessionStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
    setOutboxCount(remaining.length);
    return remaining.length; // Returns count of still-pending records
  }, []);

  // Auto-flush whenever connectivity is restored.
  useEffect(() => {
    if (isOnline) flushOutbox();
  }, [isOnline, flushOutbox]);

  return { isOnline, addToOutbox, flushOutbox, outboxCount };
}
