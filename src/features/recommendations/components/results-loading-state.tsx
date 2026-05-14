"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMessages } from "next-intl";

import type { ContentType } from "@/features/quiz/store/quiz-store";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { cn } from "@/lib/utils";

/* ---------- Recommendation Skeleton ----------
 * Each skeleton mirrors the real RecommendationCard shape (poster column
 * + title + meta chips + body lines) so the swap from loader to result is
 * a content fill rather than a layout shift. The rotating status caption
 * at the bottom uses the chosen contentType's bank. */
type SkeletonFormat = "movie" | "book" | "music";

const SKELETON_TONES: Record<
  SkeletonFormat,
  { border: string; surface: string; dot: string; square: boolean }
> = {
  movie: {
    border: "border-amber-200/60 dark:border-amber-500/30",
    surface:
      "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-orange-500/10",
    dot: "bg-amber-500",
    square: false,
  },
  book: {
    border: "border-emerald-200/60 dark:border-emerald-500/30",
    surface:
      "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    dot: "bg-emerald-500",
    square: false,
  },
  music: {
    border: "border-rose-200/60 dark:border-rose-500/30",
    surface:
      "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-pink-500/10",
    dot: "bg-rose-500",
    square: true,
  },
};

export function skeletonFormatsFor(
  contentType: ContentType | null,
): SkeletonFormat[] {
  switch (contentType) {
    case "movie":
      return ["movie", "movie", "movie"];
    case "book":
      return ["book", "book", "book"];
    case "music":
      return ["music", "music", "music"];
    case "mix":
      return ["movie", "book", "music"];
    case "both":
      return ["movie", "movie", "book"];
    default:
      return ["movie", "book", "music"];
  }
}

const SkeletonRecCard = ({
  format,
  index,
}: {
  format: SkeletonFormat;
  index: number;
}) => {
  const tone = SKELETON_TONES[format];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.08 }}
      className={cn(
        "overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm backdrop-blur-md",
        tone.border,
        tone.surface,
      )}
    >
      <div className="grid sm:grid-cols-[168px_1fr]">
        {tone.square ? (
          <div className="relative flex items-center justify-center p-5">
            <div className="relative aspect-square w-full max-w-[136px] overflow-hidden rounded-2xl bg-slate-200/70 shadow-md dark:bg-slate-800/70">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/40 via-white/30 to-slate-200/40 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-800/40"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative aspect-[2/3] bg-slate-200/60 dark:bg-slate-800/60">
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/40 via-white/30 to-slate-200/40 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-800/40"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          </div>
        )}
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="space-y-3">
            <div className="h-7 w-3/4 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 sm:h-8" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-6 w-20 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800/70"
                style={{ animationDelay: `${(index * 3 + i) * 80}ms` }}
              />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="h-4 w-[92%] animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="h-4 w-[78%] animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface ResultsLoadingStateProps {
  contentType: ContentType | null;
}

export const ResultsLoadingState = ({
  contentType,
}: ResultsLoadingStateProps) => {
  const messages = useMessages() as {
    Results?: { loadingMessages?: Record<string, string[]> };
  };
  const loadingMessages = useMemo(() => {
    const bank = messages.Results?.loadingMessages;
    if (!bank) return [] as string[];
    const key = contentType === "both" ? "mix" : (contentType ?? "default");
    return bank[key] ?? bank.default ?? [];
  }, [messages, contentType]);
  const [messageIndex, setMessageIndex] = useState(0);
  const tone = getAccentTone(contentType);
  const formats = useMemo(
    () => skeletonFormatsFor(contentType),
    [contentType],
  );

  useEffect(() => {
    if (loadingMessages.length === 0) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 3800);
    return () => clearInterval(id);
  }, [loadingMessages.length]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="grid gap-5">
        {formats.map((format, i) => (
          <SkeletonRecCard
            key={`${format}-${i}`}
            format={format}
            index={i}
          />
        ))}
      </div>

      {/* Live status caption — accent dot + rotating per-type message —
          mirrors the questionnaire skeleton so the visual language is
          consistent across the flow. */}
      <div
        className="flex items-center justify-center gap-2"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden
          className={cn("h-2 w-2 animate-pulse rounded-full", tone.dot)}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "text-xs font-bold tracking-tight sm:text-sm",
              tone.text,
            )}
          >
            {loadingMessages[messageIndex] ?? ""}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
