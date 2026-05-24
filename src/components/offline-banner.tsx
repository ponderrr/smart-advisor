"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";

/** Inline "You're offline" strip — scoped to the feed pages where
 *  the live/stale distinction matters most. Pairs with the
 *  offline→online edge-detection below so the feed auto-refreshes
 *  when the network comes back.
 *
 *  `navigator.onLine` reports a *transport* state, not real
 *  reachability — a browser on a captive-portal wifi will read as
 *  online here even though requests fail. That's intentional:
 *  catching captive portals would need a probe-per-period (cost) and
 *  false negatives are worse than missed positives for this UX. */
export function OfflineBanner() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(true);
  // SSR doesn't have navigator, so the first client render starts
  // online and corrects on mount — otherwise the banner would
  // hydrate-flash on every page load.
  const wasOnlineRef = useRef(true);

  useEffect(() => {
    const initial = typeof navigator === "undefined" ? true : navigator.onLine;
    setOnline(initial);
    wasOnlineRef.current = initial;
    const onOnline = () => {
      setOnline(true);
      // offline→online edge: invalidate the feed family so the
      // user's screen reloads with fresh data instead of stranding
      // on the cached error state from the dropped fetch.
      if (!wasOnlineRef.current) {
        qc.invalidateQueries({ queryKey: ["feed"] });
      }
      wasOnlineRef.current = true;
    };
    const onOffline = () => {
      setOnline(false);
      wasOnlineRef.current = false;
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [qc]);

  return (
    <AnimatePresence initial={false}>
      {!online && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200">
            <WifiOff size={12} aria-hidden />
            <span>You&rsquo;re offline — the feed is paused</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
