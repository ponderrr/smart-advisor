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
  text?: string;
  className?: string;
};

/**
 * PageLoader — full-screen centered LoaderFive.
 *
 * Drop-in replacement for the centered `animate-spin` route-level loaders.
 * Same min-h-screen + slate background as the rest of the app shells.
 */
export function PageLoader({ text = "Loading...", className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950",
        className,
      )}
    >
      <LoaderFive text={text} />
    </div>
  );
}
