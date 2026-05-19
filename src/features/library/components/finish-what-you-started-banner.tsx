"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { libraryService } from "@/features/library/services/library-service";

/**
 * "Finish what you started" nudge — the web analogue of the mobile
 * recurring local notification (mobile commit f16a6de). Renders a slim
 * single-row banner when the signed-in user has any in-progress library
 * items, and auto-hides when there are none, mirroring the mobile
 * notification's self-cancel behaviour.
 *
 * Surfaced on /feed (home). Tapping routes to the library filtered to
 * in-progress, where the existing edit dialog handles the "mark
 * finished / dropped" flow.
 */
export const FinishWhatYouStartedBanner = () => {
  const router = useRouter();
  const t = useTranslations("Library.finishReminder");
  const [count, setCount] = useState<number | null>(null);

  // One-shot fetch on mount. Sessions where this lands tend to be short,
  // and the library list is small — no need for live updates.
  useEffect(() => {
    let cancelled = false;
    void libraryService
      .list({ status: "in_progress" })
      .then(({ data }) => {
        if (cancelled) return;
        setCount(data?.length ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => router.push("/library?status=in_progress")}
      className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-4 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900/60 dark:to-amber-500/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
        <BookOpen size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
          {t("eyebrow")}
        </p>
        <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
          {t("title", { count })}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        {t("cta")}
        <ArrowRight size={12} />
      </span>
    </motion.button>
  );
};
