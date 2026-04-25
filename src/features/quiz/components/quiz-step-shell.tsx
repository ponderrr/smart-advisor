"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";

interface QuizStepShellProps {
  /** Short context label, e.g. "Quiz setup" or "Live quiz". */
  category: string;
  /** Step indicator text, e.g. "Step 1 of 4" or "Question 3 of 7". */
  stepLabel: string;
  /** 0–100, drives the progress bar fill. */
  progress: number;
  /** Back action — wired into the back button. */
  onBack: () => void;
  /** Optional override for the back button label (default: "Back"). */
  backLabel?: string;
  children: ReactNode;
}

/**
 * Shared chrome for every quiz step (content-selection, question-count,
 * questionnaire). Renders the navbar, a back-button + eyebrow row, and a
 * gradient progress bar. Each step page owns its own card body via children.
 */
export const QuizStepShell = ({
  category,
  stepLabel,
  progress,
  onBack,
  backLabel = "Back",
  children,
}: QuizStepShellProps) => {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:bg-white sm:px-4 sm:text-sm",
                "dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70",
              )}
            >
              <ArrowLeft
                size={14}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              {backLabel}
            </button>

            <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 sm:text-xs dark:text-indigo-400">
              {category}
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {stepLabel}
              </span>
            </p>
          </div>

          <div className="relative mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 sm:mb-8 dark:bg-slate-800/70">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              initial={false}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};
