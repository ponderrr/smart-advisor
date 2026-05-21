import type { ContentType } from "@/features/quiz/store/quiz-store";

/** A community is just a content lane (mirrors the mobile prototype). */
export type FeedCommunity = "movies" | "books" | "music";

/** What a friend did with a pick — drives the activity line on the card. */
export type FeedActivity =
  | "finished"
  | "added"
  | "rated"
  | "shared"
  | "group";

/** Friends / Discover / Group scope tabs. */
export type FeedScope = "friends" | "discover" | "group";

export interface FeedComment {
  id: string;
  /** Author's profile id (uuid). Optional during the in-memory→backend
   *  migration; required once the feed is fully backend-backed. */
  authorId?: string;
  /** Display name — `profiles.name`, joined at fetch time. */
  author: string;
  authorAvatarUrl?: string | null;
  body: string;
  ageHours: number;
  score: number;
  /** Reddit/Lemmy-style threading. null = top-level comment. */
  parentId: string | null;
}

/** A comment plus its nested replies — built client-side from the flat list. */
export interface FeedCommentNode extends FeedComment {
  replies: FeedCommentNode[];
}

export type CommentSort = "top" | "new";

/** Turn the flat comment list into a reply tree. `sort` controls every
 *  level: "top" = highest score first, "new" = most recent first. */
export function buildCommentTree(
  flat: FeedComment[],
  sort: CommentSort = "top",
): FeedCommentNode[] {
  const nodes = new Map<string, FeedCommentNode>();
  flat.forEach((c) => nodes.set(c.id, { ...c, replies: [] }));
  const roots: FeedCommentNode[] = [];
  nodes.forEach((node) => {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  });
  const cmp =
    sort === "new"
      ? (a: FeedCommentNode, b: FeedCommentNode) => a.ageHours - b.ageHours
      : (a: FeedCommentNode, b: FeedCommentNode) =>
          b.score - a.score || a.ageHours - b.ageHours;
  const sortLevel = (list: FeedCommentNode[]) => {
    list.sort(cmp);
    list.forEach((n) => sortLevel(n.replies));
  };
  sortLevel(roots);
  return roots;
}

/** Deterministic mock follower count so the UI has stable numbers without
 *  a backend (replace with a real count when follows are persisted). */
export function mockFollowerCount(author: string): number {
  let h = 0;
  for (let i = 0; i < author.length; i += 1) {
    h = (h * 31 + author.charCodeAt(i)) >>> 0;
  }
  return 40 + (h % 960);
}

export interface FeedPost {
  id: string;
  community: FeedCommunity;
  /** Author's profile id (uuid). Optional during the in-memory→backend
   *  migration; required once the feed is fully backend-backed. */
  authorId?: string;
  /** Display name — `profiles.name`, joined at fetch time. */
  author: string;
  authorAvatarUrl?: string | null;
  title: string;
  activity: FeedActivity;
  /** Taste overlap with the current user, 0–100. */
  tasteMatch: number;
  ageHours: number;
  body?: string;
  posterUrl?: string;
  creator?: string;
  year?: number;
  /** Popularity used to order the Discover scope. */
  baseScore: number;
  comments: FeedComment[];
}

export const COMMUNITY_LABEL: Record<FeedCommunity, string> = {
  movies: "Movies",
  books: "Books",
  music: "Music",
};

export const COMMUNITY_TAG: Record<FeedCommunity, string> = {
  movies: "r/movies",
  books: "r/books",
  music: "r/music",
};

/** Map a community to the shared content accent input. */
export const COMMUNITY_CONTENT: Record<FeedCommunity, ContentType> = {
  movies: "movie",
  books: "book",
  music: "music",
};

export const ACTIVITY_VERB: Record<FeedActivity, string> = {
  finished: "finished",
  added: "added to library",
  rated: "rated",
  shared: "shared",
  group: "group pick",
};

export function agoLabel(hours: number): string {
  if (hours <= 0) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
