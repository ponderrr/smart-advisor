"use client";

import { useEffect, useState } from "react";

/**
 * Profile visibility for the social feed. The feed is everyone's home; this
 * controls whether *your* activity is broadcast, not whether you can use it:
 *
 *  - "public"  — your finished/rated/shared picks appear in others' feeds
 *                and people can follow you directly.
 *  - "private" — you still browse and post normally, but your activity
 *                isn't broadcast and follows are request-only.
 *
 * The feed store is in-memory with no backend, so this preference is
 * per-device too (mirrors the content-preference localStorage pattern).
 * Move to a synced profile column when the feed gets a backend.
 */
export type FeedVisibility = "public" | "private";

export const PREF_FEED_VISIBILITY_KEY = "smart_advisor_pref_feed_visibility";

/** Same-tab change signal — `storage` only fires in *other* tabs. */
const FEED_VISIBILITY_EVENT = "smart-advisor:feed-visibility-change";

/** Synchronous read (default "public"). Safe on the server. */
export function readFeedVisibility(): FeedVisibility {
  if (typeof window === "undefined") return "public";
  return window.localStorage.getItem(PREF_FEED_VISIBILITY_KEY) === "private"
    ? "private"
    : "public";
}

export function writeFeedVisibility(value: FeedVisibility): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_FEED_VISIBILITY_KEY, value);
  window.dispatchEvent(new Event(FEED_VISIBILITY_EVENT));
}

/**
 * Reactive accessor. Returns the current visibility and a setter, kept in
 * sync across tabs (`storage`) and within the tab (custom event).
 */
export function useFeedVisibility(): [
  FeedVisibility,
  (next: FeedVisibility) => void,
] {
  // Start from the default so SSR and first client render agree; the real
  // value is hydrated in the effect (avoids a hydration mismatch).
  const [visibility, setVisibility] = useState<FeedVisibility>("public");

  useEffect(() => {
    const sync = () => setVisibility(readFeedVisibility());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(FEED_VISIBILITY_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FEED_VISIBILITY_EVENT, sync);
    };
  }, []);

  const set = (next: FeedVisibility) => {
    writeFeedVisibility(next);
    setVisibility(next);
  };

  return [visibility, set];
}
