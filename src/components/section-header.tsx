"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SECTION_ACCENTS = {
  violet: {
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    rule: "from-violet-300/70 dark:from-violet-500/40",
    eyebrow: "text-violet-600 dark:text-violet-400",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    rule: "from-emerald-300/70 dark:from-emerald-500/40",
    eyebrow: "text-emerald-600 dark:text-emerald-400",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    rule: "from-indigo-300/70 dark:from-indigo-500/40",
    eyebrow: "text-indigo-600 dark:text-indigo-400",
  },
} as const;

interface SectionHeaderProps {
  icon: ReactNode;
  /** Tiny uppercase label above the title. Pluralization (`s`) is appended
   *  automatically when count > 1. */
  eyebrow: string;
  title: string;
  count: number;
  accent: keyof typeof SECTION_ACCENTS;
  /** Hide the count chip in the eyebrow (default: shown). */
  hideCount?: boolean;
}

/**
 * Section header with circular icon, colored eyebrow, bold title, and a
 * fading horizontal rule. Used by results, demo results, and anywhere we
 * want consistent grouping of cards into "Movies"/"Books"/etc.
 */
export const SectionHeader = ({
  icon,
  eyebrow,
  title,
  count,
  accent,
  hideCount = false,
}: SectionHeaderProps) => {
  const tone = SECTION_ACCENTS[accent];
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          tone.icon,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.18em]",
            tone.eyebrow,
          )}
        >
          {eyebrow}
          {count > 1 ? "s" : ""}
          {hideCount ? "" : ` · ${count}`}
        </p>
        <h2 className="text-lg font-black tracking-tight sm:text-xl">
          {title}
        </h2>
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "h-px flex-1 bg-gradient-to-r to-transparent",
          tone.rule,
        )}
      />
    </div>
  );
};
