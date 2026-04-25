"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhyThisPickProps {
  text: string;
  /** Compact = no left accent stripe, smaller padding (use inside modals). */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * The "Why this pick" reasoning callout — used on results cards, demo
 * results, and inside recommendation modals. Indigo→violet gradient tint
 * with a Sparkles glyph so it reads as the AI's voice.
 */
export const WhyThisPick = ({
  text,
  variant = "default",
  className,
}: WhyThisPickProps) => {
  const isCompact = variant === "compact";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10",
        isCompact ? "p-3" : "p-4",
        className,
      )}
    >
      {!isCompact && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500"
        />
      )}
      <div className={cn("flex items-center gap-2", !isCompact && "pl-2")}>
        <Sparkles
          size={14}
          className="text-indigo-600 dark:text-indigo-400"
        />
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
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
