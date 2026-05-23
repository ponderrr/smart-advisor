"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "smart_advisor_dashboard_moved_dismissed_v1";

/**
 * One-time info banner for users who used to navigate to /dashboard.
 * /dashboard was retired (web commit e570e61) — milestones moved to
 * /milestones and the rest folded into /feed. This banner explains the
 * move on the new home (/feed) and persists dismissal in localStorage
 * so it shows up exactly once per device.
 */
export const DashboardMovedBanner = () => {
  const t = useTranslations("Feed.dashboardMoved");
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
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 p-4 shadow-sm backdrop-blur-md dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/60 dark:to-indigo-500/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
            <LayoutDashboard size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
              {t("eyebrow")}
            </p>
            <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
              {t("title")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t.rich("body", {
                milestones: (chunks) => (
                  <Link
                    href="/milestones"
                    className="font-bold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                  >
                    {chunks}
                  </Link>
                ),
              })}
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
