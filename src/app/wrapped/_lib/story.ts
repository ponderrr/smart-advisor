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
