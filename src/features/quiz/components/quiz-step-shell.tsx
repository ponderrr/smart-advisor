"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";
import {
  getAccentTone,
  type ContentAccent,
} from "@/features/quiz/utils/content-accent";
import type { ContentType } from "@/features/quiz/store/quiz-store";

const LAST_PROGRESS_KEY = "smart_advisor_quiz_last_progress";

interface QuizStepShellProps {
  /** Short context label, e.g. "Quiz setup" or "Live quiz". */
  category: string;
  /** Step indicator text, e.g. "Step 1 of 4" or "Question 3 of 7". */
  stepLabel: string;
  /** 0–100, drives the progress bar fill. */
  progress: number;
  /** Optional: where the bar should appear to start animating from on the
   *  first paint of this page. Use it to bridge across page navigations so
   *  the bar feels continuous (q-count passes 25, questionnaire passes 50).
   *  Omit on the very first quiz step. */
  initialProgress?: number;
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
 * Shared chrome for every quiz step (content-selection, question-count,
 * questionnaire). Renders the navbar, a back-button + eyebrow row, and a
 * gradient progress bar. Each step page owns its own card body via children.
 */
export const QuizStepShell = ({
  category,
  stepLabel,
  progress,
  initialProgress,
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

  // Bar continuity across navigations. Each shell mount reads the last
  // committed progress from sessionStorage and uses it as the motion.div's
  // initial width — so going q-count → content-selection animates the bar
  // backward (50 → 25) just like the forward trip animates 25 → 50. An
  // explicit `initialProgress` prop still wins so callers can override.
  //
  // We skip the stored value when it's far from the current step's progress
  // (more than 30 points apart) — that's the signal that the user finished
  // a quiz and is starting a fresh one, not stepping back-and-forth, so
  // popping straight to 25 is cleaner than animating backward from 100.
  const [storedInitial] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const raw = window.sessionStorage.getItem(LAST_PROGRESS_KEY);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;
    if (Math.abs(parsed - clamped) > 30) return undefined;
    return parsed;
  });
  const resolvedInitial =
    typeof initialProgress === "number" ? initialProgress : storedInitial;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(LAST_PROGRESS_KEY, String(clamped));
  }, [clamped]);

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

            <p
              className={cn(
                "truncate text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs",
                tone.text,
              )}
            >
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
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                tone.barGradient,
              )}
              initial={
                typeof resolvedInitial === "number"
                  ? { width: `${Math.max(0, Math.min(100, resolvedInitial))}%` }
                  : false
              }
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
      </main>
    </div>
  );
};
