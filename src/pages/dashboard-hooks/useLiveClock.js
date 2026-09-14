import { useState, useEffect } from "react";

/**
 * Ticks once a second while `active` is true. Backs any UI that needs
 * a live-updating "now" — queue wait times, the consultation
 * stopwatch, etc. Stops ticking (and clears its interval) as soon as
 * `active` is false, e.g. after logout.
 */
export function useLiveClock(active) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!active) return undefined;
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, [active]);

  return now;
}
