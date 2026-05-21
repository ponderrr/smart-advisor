"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Pick feedback — titles the user marked "Not for me". Persisted in
 * localStorage and threaded into every recommendation request as a hard
 * exclusion, so negative feedback compounds (parity with the mobile
 * dislikedTitlesProvider).
 */
export const PREF_DISLIKED_TITLES_KEY = "smart_advisor_pref_disliked_titles";

/** Reads the disliked-title list from localStorage. SSR-safe (returns []). */
export function loadDislikedTitles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREF_DISLIKED_TITLES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0);
  } catch {
    return [];
  }
}

function save(list: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_DISLIKED_TITLES_KEY, JSON.stringify(list));
  // Notify hooks in other components within the same tab.
  window.dispatchEvent(new Event("smart-advisor:dislikes"));
}

export function isDislikedTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  return loadDislikedTitles().some((x) => x.toLowerCase() === t);
}

export function addDislikedTitle(title: string): void {
  const t = title.trim();
  if (!t || isDislikedTitle(t)) return;
  save([...loadDislikedTitles(), t]);
}

export function removeDislikedTitle(title: string): void {
  const t = title.trim().toLowerCase();
  save(loadDislikedTitles().filter((x) => x.toLowerCase() !== t));
}

/**
 * React binding for a single title's "Not for me" state. Returns the
 * current flag and a toggle; stays in sync across components via the
 * `smart-advisor:dislikes` event.
 */
export function useDislikedTitle(title: string): [boolean, () => void] {
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    const sync = () => setDisliked(isDislikedTitle(title));
    sync();
    window.addEventListener("smart-advisor:dislikes", sync);
    return () => window.removeEventListener("smart-advisor:dislikes", sync);
  }, [title]);

  const toggle = useCallback(() => {
    if (isDislikedTitle(title)) removeDislikedTitle(title);
    else addDislikedTitle(title);
  }, [title]);

  return [disliked, toggle];
}
