"use client";

import { useEffect, useState } from "react";
import type {
  CommentSort,
  FeedCommunity,
  FeedScope,
  FeedSort,
} from "./types";

/**
 * Per-device feed display preferences (defaults the feed opens with, plus
 * the thread comment sort). Same backend-free localStorage pattern as
 * use-feed-visibility — one JSON blob so adding a pref is a one-line change.
 */
export type FeedView = "cards" | "list";

export interface FeedPrefs {
  view: FeedView;
  scope: FeedScope;
  community: FeedCommunity | "all";
  sort: FeedSort;
  commentSort: CommentSort;
}

export const DEFAULT_FEED_PREFS: FeedPrefs = {
  view: "cards",
  scope: "friends",
  community: "all",
  sort: "trending",
  commentSort: "top",
};

export const PREF_FEED_PREFS_KEY = "smart_advisor_pref_feed_prefs";

const FEED_PREFS_EVENT = "smart-advisor:feed-prefs-change";

const isView = (v: unknown): v is FeedView => v === "cards" || v === "list";
const isScope = (v: unknown): v is FeedScope =>
  v === "friends" || v === "discover" || v === "group";
const isCommunity = (v: unknown): v is FeedCommunity | "all" =>
  v === "all" || v === "movies" || v === "books" || v === "music";
const isCommentSort = (v: unknown): v is CommentSort =>
  v === "top" || v === "new";
const isFeedSort = (v: unknown): v is FeedSort =>
  v === "trending" || v === "new" || v === "top";

/** Synchronous read, falling back to defaults for any missing/invalid key. */
export function readFeedPrefs(): FeedPrefs {
  if (typeof window === "undefined") return DEFAULT_FEED_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_FEED_PREFS_KEY);
    if (!raw) return DEFAULT_FEED_PREFS;
    const p = JSON.parse(raw) as Partial<FeedPrefs>;
    return {
      view: isView(p.view) ? p.view : DEFAULT_FEED_PREFS.view,
      scope: isScope(p.scope) ? p.scope : DEFAULT_FEED_PREFS.scope,
      community: isCommunity(p.community)
        ? p.community
        : DEFAULT_FEED_PREFS.community,
      sort: isFeedSort(p.sort) ? p.sort : DEFAULT_FEED_PREFS.sort,
      commentSort: isCommentSort(p.commentSort)
        ? p.commentSort
        : DEFAULT_FEED_PREFS.commentSort,
    };
  } catch {
    return DEFAULT_FEED_PREFS;
  }
}

export function writeFeedPrefs(next: FeedPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_FEED_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(FEED_PREFS_EVENT));
}

/** Reactive accessor. `set` merges a partial patch. Synced across tabs
 *  (`storage`) and within the tab (custom event). */
export function useFeedPrefs(): [
  FeedPrefs,
  (patch: Partial<FeedPrefs>) => void,
] {
  const [prefs, setPrefs] = useState<FeedPrefs>(DEFAULT_FEED_PREFS);

  useEffect(() => {
    const sync = () => setPrefs(readFeedPrefs());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(FEED_PREFS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FEED_PREFS_EVENT, sync);
    };
  }, []);

  const set = (patch: Partial<FeedPrefs>) => {
    const next = { ...readFeedPrefs(), ...patch };
    writeFeedPrefs(next);
    setPrefs(next);
  };

  return [prefs, set];
}
