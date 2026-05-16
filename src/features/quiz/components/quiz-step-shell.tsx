"use client";

import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  getAccentTone,
  type ContentAccent,
} from "@/features/quiz/utils/content-accent";
import type { ContentType } from "@/features/quiz/store/quiz-store";

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
  /** Optional content type — drives the eyebrow + progress bar accent color.
   *  Pass null on the content-selection step (no content picked yet). */
  contentType?: ContentType | null;
  /** Direct accent override. Takes precedence over `contentType`. */
  accent?: ContentAccent;
  children: ReactNode;
}

/**
 * Shared back-button + eyebrow + progress-bar chrome for the quiz flow's
 * step bodies. The caller mounts the navbar and the outer page-fill div so
 * the orchestrator can keep the navbar stable while swapping between the
 * step shell (for content/count/questions/loader) and a different layout
 * (e.g. the wider results view) without unmounting the navbar.
 */
export const QuizStepShell = ({
  category,
  stepLabel,
  progress,
  onBack,
  backLabel = "Back",
  contentType,
  accent,
  children,
}: QuizStepShellProps) => {
  const tone = accent
    ? getAccentTone(
        accent === "amber"
          ? "movie"
          : accent === "emerald"
            ? "book"
            : accent === "rose"
              ? "music"
              : "mix",
      )
    : getAccentTone(contentType ?? null);
  const clamped = Math.max(0, Math.min(100, progress));

  return (
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

        <p
          className={cn(
            "truncate text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs",
            tone.text,
          )}
        >
          {category}
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            {stepLabel}
          </span>
        </p>
      </div>

      <div className="relative mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 sm:mb-8 dark:bg-slate-800/70">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            tone.barGradient,
          )}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 22,
            mass: 0.9,
          }}
        />
      </div>

      {children}
    </div>
  );
};
