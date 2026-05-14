/**
 * Per-content-type accent classes for surfaces that display a saved
 * recommendation or library item (history cards, library cards, dashboard
 * spotlight, stat tiles). Movies = amber, books = emerald, music = rose.
 *
 * The quiz flow has its own broader palette (movie/book/music/mix) — that
 * lives in `features/quiz/utils/content-accent.ts`. This file is the simpler
 * post-quiz cousin: items in the library / history are always one specific
 * type, no "mix" case.
 */
export type RecType = "movie" | "book" | "music";

export interface RecTypeAccent {
  /** 4px left edge stripe — drop into an absolute-positioned span. */
  stripe: string;
  /** Border for stat tiles or compact cards that should be fully tinted. */
  tileBorder: string;
  /** Text color for stat tile labels / counts. */
  tileText: string;
  /** Background fill for a small chip/badge. */
  chipBg: string;
  /** Border-only outline color, used for hover/focus states. */
  outline: string;
}

const PALETTE: Record<RecType, RecTypeAccent> = {
  movie: {
    stripe: "bg-gradient-to-b from-amber-400 to-orange-500",
    tileBorder: "border-amber-300/60 dark:border-amber-500/40",
    tileText: "text-amber-600 dark:text-amber-400",
    chipBg: "bg-amber-100 dark:bg-amber-500/15",
    outline: "border-amber-300 dark:border-amber-500/50",
  },
  book: {
    stripe: "bg-gradient-to-b from-emerald-400 to-teal-500",
    tileBorder: "border-emerald-300/60 dark:border-emerald-500/40",
    tileText: "text-emerald-600 dark:text-emerald-400",
    chipBg: "bg-emerald-100 dark:bg-emerald-500/15",
    outline: "border-emerald-300 dark:border-emerald-500/50",
  },
  music: {
    stripe: "bg-gradient-to-b from-rose-400 to-pink-500",
    tileBorder: "border-rose-300/60 dark:border-rose-500/40",
    tileText: "text-rose-600 dark:text-rose-400",
    chipBg: "bg-rose-100 dark:bg-rose-500/15",
    outline: "border-rose-300 dark:border-rose-500/50",
  },
};

export function getRecTypeAccent(type: RecType | string): RecTypeAccent {
  if (type === "movie" || type === "book" || type === "music") {
    return PALETTE[type];
  }
  return PALETTE.book;
}
