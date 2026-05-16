import type { Recommendation } from "@/features/recommendations/types/recommendation";

/**
 * Shared "Year in Review" story model — the step order, its derived
 * union, the per-year stats shape, and the month fallback labels.
 * Extracted verbatim from wrapped/page.tsx so both the page orchestrator
 * and the story-card components can depend on it without a circular
 * page ⇄ component import.
 */

export const FALLBACK_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const STEPS = [
  "intro",
  "total",
  "format",
  "genres",
  "creator",
  "standout",
  "picks",
  "outro",
] as const;

export type StoryStep = (typeof STEPS)[number];

/** How long each card stays before auto-advancing (after Press Play).
 *  Tuned by Spotify Wrapped — long enough to read the headline + scan
 *  the visual, short enough to keep momentum. */
export const STEP_DURATION_MS = 5000;

/* -------------------- Per-step backdrops -------------------- */

export const stepBackgrounds: Record<StoryStep, string> = {
  intro: "from-violet-600 via-fuchsia-600 to-rose-600",
  total: "from-indigo-700 via-indigo-600 to-violet-700",
  format: "from-amber-500 via-rose-500 to-fuchsia-600",
  genres: "from-fuchsia-600 via-violet-600 to-indigo-700",
  creator: "from-amber-500 via-orange-600 to-rose-600",
  standout: "from-orange-500 via-amber-500 to-yellow-500",
  picks: "from-slate-900 via-slate-800 to-slate-900",
  outro: "from-rose-500 via-fuchsia-600 to-indigo-700",
};

export interface StoryStats {
  total: number;
  movies: number;
  books: number;
  music: number;
  favorites: number;
  watchHours: number;
  topGenres: Array<[string, number]>;
  topCreator:
    | { name: string; type: "director" | "author" | "artist"; count: number }
    | null;
  monthly: number[];
  peakMonth: { idx: number; count: number };
  longest: number;
  topPicks: Recommendation[];
  libraryLogged: number;
  /** Up to 4 poster URLs per format type for use as sample artwork on
   *  the format-split card. Falls back to empty when the user has no
   *  picks of that type or no poster URLs were found. */
  moviePosters: string[];
  bookPosters: string[];
  musicPosters: string[];
  /** Posters from the top creator's own picks, used on the creator card
   *  as a "cover wall" so the moment feels more concrete. */
  creatorPosters: string[];
  /** Mixed pool of every poster we have for the year — used to wallpaper
   *  the intro and outro card backdrops. */
  allPosters: string[];
}
