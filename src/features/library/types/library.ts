export type LibraryMedium = "movie" | "book" | "music";
export type LibraryStatus =
  | "finished"
  | "in_progress"
  | "wishlist"
  | "dropped";
/** 1 = thumbs-down, 2 = neutral, 3 = thumbs-up. */
export type LibraryRating = 1 | 2 | 3;

export interface LibraryItem {
  id: string;
  user_id: string;
  medium: LibraryMedium;
  title: string;
  creator: string | null;
  year: number | null;
  poster_url: string | null;
  status: LibraryStatus;
  rating: LibraryRating | null;
  reaction: string | null;
  source_recommendation_id: string | null;
  logged_at: string;
  finished_at: string | null;
  updated_at: string;
}

export interface LogLibraryInput {
  medium: LibraryMedium;
  title: string;
  creator?: string | null;
  year?: number | null;
  poster_url?: string | null;
  status?: LibraryStatus;
  rating?: LibraryRating | null;
  reaction?: string | null;
  source_recommendation_id?: string | null;
}

export interface UpdateLibraryInput {
  status?: LibraryStatus;
  rating?: LibraryRating | null;
  reaction?: string | null;
}

export const RATING_LABELS: Record<LibraryRating, string> = {
  1: "Not for me",
  2: "It was fine",
  3: "Loved it",
};

export const STATUS_LABELS: Record<LibraryStatus, string> = {
  finished: "Finished",
  in_progress: "In progress",
  wishlist: "Wishlist",
  dropped: "Gave up",
};

/**
 * Saturated pill backgrounds for the SegmentedControl variants
 * (status filter, log/edit dialogs). Mirrors STATUS_TONE conceptually
 * but at a stronger contrast level since the pill always carries white
 * text.
 */
export const STATUS_PILL_CLASSES: Record<LibraryStatus, string> = {
  wishlist: "bg-violet-500",
  in_progress: "bg-amber-500",
  finished: "bg-emerald-500",
  dropped: "bg-rose-500",
};

/**
 * Tailwind class fragments for each status — used by the log/edit
 * dialogs (active button) and the library cards (chip). Distinct
 * hues so finished / in-progress / wishlist read at a glance.
 */
export const STATUS_TONE: Record<
  LibraryStatus,
  { active: string; chip: string }
> = {
  finished: {
    active:
      "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  in_progress: {
    active:
      "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  wishlist: {
    active:
      "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-300",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
  dropped: {
    active:
      "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};
