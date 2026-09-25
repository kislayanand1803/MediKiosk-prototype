import { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Unobtrusive banner that slides in from the top when connectivity is lost
 * and briefly confirms when it's restored before disappearing.
 *
 * Designed specifically for the kiosk context — keeps copy simple enough
 * that a patient with limited literacy can understand the yellow/green
 * color coding even without reading the text carefully.
 *
 * PLACEMENT: render this at the root of the kiosk layout (inside the
 * error boundary but outside individual pages) so it persists across
 * the /intake → /chat → /success navigation without re-mounting.
 */
export default function NetworkStatusBanner({ isOnline, outboxCount = 0 }) {
  // Show "Reconnected" confirmation briefly after coming back online,
  // then hide completely — don't keep a permanent "you're online" banner.
  const [showReconnected, setShowReconnected] = useState(false);

  // FIX: Replaced useState tuple mutation anti-pattern with standard useRef(false) (Defect #5)[cite: 5].
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
    wasOfflineRef.current = !isOnline;
  }, [isOnline]);

  const shouldShow = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="network-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-2.5 px-4 text-sm font-bold shadow-md ${
            isOnline ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {isOnline ? (
            <>
              <Wifi size={16} aria-hidden="true" />
              <span>Connection restored. Submitting saved data…</span>
              <Loader2
                size={14}
                className="animate-spin opacity-70"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <WifiOff size={16} aria-hidden="true" />
              <span>
                No internet connection.{" "}
                {outboxCount > 0
                  ? `${outboxCount} record${outboxCount > 1 ? "s" : ""} saved locally — will submit automatically when reconnected.`
                  : "Your intake progress is saved. Please continue — data will submit when reconnected."}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
