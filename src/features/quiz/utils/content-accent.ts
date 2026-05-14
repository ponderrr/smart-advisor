import type { ContentType } from "@/features/quiz/store/quiz-store";

export type ContentAccent = "amber" | "emerald" | "rose" | "violet";

export interface ContentAccentTone {
  /** Active text color, used for eyebrows and accent labels. */
  text: string;
  /** Tailwind gradient stops for the progress bar fill. */
  barGradient: string;
  /** Background gradient classes for ambient surface backgrounds (loading
   *  state, hero cards, etc.). */
  surfaceGradient: string;
  /** Border tint for surface cards in the accent color. */
  surfaceBorder: string;
  /** Dot/spinner color. */
  dot: string;
}

const PALETTE: Record<ContentAccent, ContentAccentTone> = {
  amber: {
    text: "text-amber-500 dark:text-amber-400",
    barGradient: "from-amber-500 to-orange-500",
    surfaceGradient:
      "from-amber-50/80 via-orange-50/40 to-rose-50/60 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-rose-500/15",
    surfaceBorder: "border-amber-300/60 dark:border-amber-500/40",
    dot: "bg-amber-500",
  },
  emerald: {
    text: "text-emerald-500 dark:text-emerald-400",
    barGradient: "from-emerald-500 to-teal-500",
    surfaceGradient:
      "from-emerald-50/80 via-teal-50/40 to-cyan-50/60 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/15",
    surfaceBorder: "border-emerald-300/60 dark:border-emerald-500/40",
    dot: "bg-emerald-500",
  },
  rose: {
    text: "text-rose-500 dark:text-rose-400",
    barGradient: "from-rose-500 to-pink-500",
    surfaceGradient:
      "from-rose-50/80 via-pink-50/40 to-fuchsia-50/60 dark:from-rose-500/15 dark:via-pink-500/10 dark:to-fuchsia-500/15",
    surfaceBorder: "border-rose-300/60 dark:border-rose-500/40",
    dot: "bg-rose-500",
  },
  violet: {
    text: "text-violet-500 dark:text-violet-400",
    barGradient: "from-indigo-500 to-violet-500",
    surfaceGradient:
      "from-violet-50/80 via-fuchsia-50/40 to-rose-50/60 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-rose-500/15",
    surfaceBorder: "border-violet-300/60 dark:border-violet-500/40",
    dot: "bg-violet-500",
  },
};

/** Map a content type to the visual accent name used across the quiz flow.
 *  Falls back to violet for null / legacy "both" so the existing look is
 *  preserved when no specific content focus is chosen. */
export function getAccentName(
  contentType: ContentType | null,
): ContentAccent {
  switch (contentType) {
    case "movie":
      return "amber";
    case "book":
      return "emerald";
    case "music":
      return "rose";
    case "mix":
    case "both":
    default:
      return "violet";
  }
}

export function getAccentTone(
  contentType: ContentType | null,
): ContentAccentTone {
  return PALETTE[getAccentName(contentType)];
}

export { PALETTE as CONTENT_ACCENT_PALETTE };
