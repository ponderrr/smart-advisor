"use client";

import { useEffect, useState } from "react";

export const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";
export const PREF_CONTENT_TONE_KEY = "smart_advisor_pref_content_tone";
export const PREF_QUESTION_COUNT_KEY = "smart_advisor_pref_question_count";

export type ContentFocus = "movie" | "book" | "music" | "both" | "mix";
export type ContentTone = "standard" | "family";

/**
 * Owns the per-device content-preference state plus its two hydration
 * effects: localStorage on mount, then a profile override for content_tone
 * (the profile is the source of truth, set in onboarding). Extracted
 * verbatim from settings/page.tsx; the save handler stays in the page
 * since it's coupled to the re-auth verification flow.
 */
export function useContentPreferences(
  profileContentTone: string | null | undefined,
) {
  const [contentFocus, setContentFocus] = useState<ContentFocus>("mix");
  const [contentTone, setContentTone] = useState<ContentTone>("standard");
  const [preferredQuestionCount, setPreferredQuestionCount] = useState(5);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sc = window.localStorage.getItem(PREF_CONTENT_KEY);
    const st = window.localStorage.getItem(PREF_CONTENT_TONE_KEY);
    const sq = Number(
      window.localStorage.getItem(PREF_QUESTION_COUNT_KEY) || "5",
    );
    if (
      sc === "movie" ||
      sc === "book" ||
      sc === "music" ||
      sc === "both" ||
      sc === "mix"
    )
      setContentFocus(sc);
    if (st === "standard" || st === "family") setContentTone(st);
    if (Number.isFinite(sq) && sq >= 3 && sq <= 15)
      setPreferredQuestionCount(sq);
  }, []);

  // Profile is the source of truth for content_tone (set in onboarding,
  // synced via useAuth). Override the localStorage value once the user
  // loads — otherwise a cross-device user would see stale local prefs.
  useEffect(() => {
    if (profileContentTone === "standard" || profileContentTone === "family") {
      setContentTone(profileContentTone);
    }
  }, [profileContentTone]);

  return {
    contentFocus,
    setContentFocus,
    contentTone,
    setContentTone,
    preferredQuestionCount,
    setPreferredQuestionCount,
  };
}
