import { useMemo } from "react";

import { useFeedStore } from "./store";
import type { FeedPost } from "./types";

/**
 * Posts + comments with blocked authors filtered out. The feed UI should
 * always consume this hook instead of reading `posts` directly so the
 * block list takes effect across every surface (cards, list, profile,
 * thread page) without each call site re-implementing the filter.
 */
export function useVisiblePosts(): FeedPost[] {
  const posts = useFeedStore((s) => s.posts);
  const blocked = useFeedStore((s) => s.blocked);

  return useMemo(() => {
    if (blocked.size === 0) return posts;
    return posts
      .filter((p) => !blocked.has(p.author.toLowerCase()))
      .map((p) => {
        if (p.comments.length === 0) return p;
        const filtered = p.comments.filter(
          (c) => !blocked.has(c.author.toLowerCase()),
        );
        return filtered.length === p.comments.length
          ? p
          : { ...p, comments: filtered };
      });
  }, [posts, blocked]);
}

/** Lookup helper, returns true when the lowercased handle is blocked. */
export function useIsBlocked(author: string): boolean {
  return useFeedStore((s) => s.blocked.has(author.toLowerCase()));
}
