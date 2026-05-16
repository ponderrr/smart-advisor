"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type LoaderFiveProps = {
  text: string;
  className?: string;
};

/**
 * LoaderFive — per-letter pulsing text loader.
 *
 * Each letter fades between 40% and 100% opacity on a 1.2-second ease-in-out
 * loop, with a small per-letter delay so a brightness wave travels across the
 * phrase from left to right. Color is the brand indigo (indigo-500 on light,
 * indigo-400 on dark).
 */
export function LoaderFive({ text, className }: LoaderFiveProps) {
  const letters = Array.from(text);

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-block text-base font-bold tracking-tight text-indigo-500 sm:text-lg dark:text-indigo-400",
        className,
      )}
    >
      {letters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

type PageLoaderProps = {
  /** Used only as the accessible label — the UI is dots-only to keep route
   *  transitions visually quiet. */
  text?: string;
  className?: string;
};

/**
 * PageLoader — full-screen route-level loader.
 *
 * Renders a thin shimmer progress bar near the top of the viewport instead
 * of bouncing colored dots — the bar is the same visual idiom the quiz
 * flow already uses, so route handoffs read as "the bar is still moving"
 * rather than "a different colored loader appeared." Neutral slate tone so
 * it doesn't clash with whichever accent the user has picked downstream.
 */
export function PageLoader({ text = "Loading", className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-label={text}
      className={cn(
        "flex min-h-screen items-start justify-center bg-slate-50 pt-32 dark:bg-slate-950",
        className,
      )}
    >
      <div
        aria-hidden
        className="relative h-1.5 w-full max-w-4xl overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70"
      >
        <motion.span
          className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-slate-400/80 to-transparent dark:via-slate-500/80"
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}
