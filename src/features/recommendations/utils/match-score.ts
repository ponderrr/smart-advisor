/**
 * Derives a 0-100 match score and a tone (green/yellow/red) for a
 * recommendation card.
 *
 * Prefers an AI-supplied score when available; otherwise hashes the
 * recommendation id into a stable 78-97 range so the same card always
 * shows the same number across renders, sessions, and reloads.
 */
export type MatchTone = "green" | "yellow" | "red";

export const MATCH_TONE_CLASSES: Record<MatchTone, string> = {
  green:
    "bg-emerald-50/90 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  yellow:
    "bg-amber-50/90 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  red:
    "bg-rose-50/90 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function deriveMatchScore(input: {
  id: string;
  match_score?: number | null;
}): { score: number; tone: MatchTone } {
  let score: number;

  if (typeof input.match_score === "number" && Number.isFinite(input.match_score)) {
    score = Math.max(0, Math.min(100, Math.round(input.match_score)));
  } else {
    let hash = 0;
    for (let i = 0; i < input.id.length; i++) {
      hash = (hash * 31 + input.id.charCodeAt(i)) | 0;
    }
    score = 78 + (Math.abs(hash) % 20);
  }

  // ≥90 = green (excellent fit), ≥75 = yellow (solid fit), <75 = red (soft fit).
  const tone: MatchTone = score >= 90 ? "green" : score >= 75 ? "yellow" : "red";

  return { score, tone };
}
