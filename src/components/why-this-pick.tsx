"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type WhyThisPickType = "movie" | "book" | "music";

interface WhyThisPickProps {
  text: string;
  /** Compact = no left accent stripe, smaller padding (use inside modals). */
  variant?: "default" | "compact";
  /** Recommendation type — drives the accent palette so the callout matches
   *  the rec card's border. Defaults to book (emerald) when omitted. */
  type?: WhyThisPickType;
  className?: string;
}

const TONES: Record<
  WhyThisPickType,
  { border: string; surface: string; bar: string; icon: string; eyebrow: string }
> = {
  movie: {
    border: "border-amber-200/60 dark:border-amber-500/30",
    surface:
      "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-orange-500/10",
    bar: "from-amber-400 to-orange-500",
    icon: "text-amber-600 dark:text-amber-400",
    eyebrow: "text-amber-700 dark:text-amber-300",
  },
  book: {
    border: "border-emerald-200/60 dark:border-emerald-500/30",
    surface:
      "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    bar: "from-emerald-400 to-teal-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    eyebrow: "text-emerald-700 dark:text-emerald-300",
  },
  music: {
    border: "border-rose-200/60 dark:border-rose-500/30",
    surface:
      "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-pink-500/10",
    bar: "from-rose-400 to-pink-500",
    icon: "text-rose-600 dark:text-rose-400",
    eyebrow: "text-rose-700 dark:text-rose-300",
  },
};

/**
 * The "Why this pick" reasoning callout — used on results cards, demo
 * results, and inside recommendation modals. Accent matches the rec
 * type so the callout reads as part of the rec card it belongs to.
 */
export const WhyThisPick = ({
  text,
  variant = "default",
  type = "book",
  className,
}: WhyThisPickProps) => {
  const isCompact = variant === "compact";
  const tone = TONES[type];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br",
        tone.border,
        tone.surface,
        isCompact ? "p-3" : "p-4",
        className,
      )}
    >
      {!isCompact && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
            tone.bar,
          )}
        />
      )}
      <div className={cn("flex items-center gap-2", !isCompact && "pl-2")}>
        <Sparkles size={14} className={tone.icon} />
        <p
          className={cn(
            "text-[11px] font-black uppercase tracking-[0.16em]",
            tone.eyebrow,
          )}
        >
          Why this pick
        </p>
      </div>
      <p
        className={cn(
          "mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200",
          !isCompact && "pl-2",
        )}
      >
        {text}
      </p>
    </div>
  );
};
