"use client";

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "smart_advisor_mobile_app_coming_dismissed_v1";

/**
 * One-time info banner announcing that the native mobile app (iOS +
 * Android, Flutter port on the `feat/flutter-app` branch) is on the way.
 * Persists dismissal in localStorage so it shows up exactly once per
 * device — same pattern as the dashboard-moved banner.
 */
export const MobileAppBanner = () => {
  const t = useTranslations("Feed.mobileApp");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShown(window.localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setShown(false);
  };

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-4 shadow-sm backdrop-blur-md dark:border-violet-500/30 dark:from-violet-500/10 dark:via-slate-900/60 dark:to-violet-500/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
            <Smartphone size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              {t("eyebrow")}
            </p>
            <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
              {t("title")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t("body")}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("dismiss")}
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
