"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

/**
 * AI nudge — a slim discoverability card for users who haven't tried
 * Surprise Me. Same visual rhythm as FinishWhatYouStartedBanner so the
 * feed header reads consistently when multiple banners stack.
 */
export const AiNudgeBanner = () => {
  const router = useRouter();
  const t = useTranslations("Feed.aiNudge");

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => router.push("/quiz?mode=surprise")}
      className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/40 p-4 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-violet-500/30 dark:from-violet-500/10 dark:via-slate-900/60 dark:to-indigo-500/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
        <Sparkles size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
          {t("eyebrow")}
        </p>
        <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
          {t("title")}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        {t("cta")}
        <ArrowRight size={12} />
      </span>
    </motion.button>
  );
};
