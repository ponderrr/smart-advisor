import { create } from "zustand";
import type { FeedComment, FeedCommunity, FeedPost } from "./types";

/**
 * In-memory taste-graph feed — mirrors the mobile prototype. Nothing
 * persists or is networked; the shape maps cleanly onto future Supabase
 * tables (follows / feed posts / saves / comments) when we wire a backend.
 */
interface FeedState {
  posts: FeedPost[];
  saved: Set<string>;
  following: Set<string>;
  /** Comment vote, keyed `"<postId>#<commentId>"` → -1 | 0 | 1. */
  commentVotes: Record<string, number>;
  toggleSave: (postId: string) => boolean;
  toggleFollow: (author: string) => boolean;
  addComment: (postId: string, body: string) => void;
  setCommentVote: (key: string, dir: number) => void;
  addPost: (
    p: Pick<
      FeedPost,
      "community" | "title" | "activity" | "body" | "posterUrl" | "creator" | "year"
    >,
  ) => void;
}

const SEED: FeedPost[] = [
  {
    id: "1",
    community: "movies",
    author: "maya",
    activity: "finished",
    tasteMatch: 92,
    title: "Dune: Part Two",
    body:
      "The IMAX sound design alone justifies it — epic without ever losing the characters.",
    posterUrl: "https://picsum.photos/seed/dune/300/450",
    creator: "Denis Villeneuve",
    year: 2024,
    ageHours: 5,
    baseScore: 1284,
    comments: [
      { id: "c1", author: "jon", body: "Chalamet finally won me over here.", ageHours: 4, score: 92 },
      { id: "c2", author: "priya", body: "Adding this to my list now.", ageHours: 3, score: 41 },
    ],
  },
  {
    id: "2",
    community: "books",
    author: "jon",
    activity: "finished",
    tasteMatch: 88,
    title: "Project Hail Mary",
    body: "Went in for hard sci-fi, left emotionally wrecked. No spoilers but: Rocky.",
    posterUrl: "https://picsum.photos/seed/phm/300/450",
    creator: "Andy Weir",
    year: 2021,
    ageHours: 14,
    baseScore: 803,
    comments: [
      { id: "c3", author: "maya", body: "Read it in two sittings. Couldn't stop.", ageHours: 12, score: 58 },
    ],
  },
  {
    id: "3",
    community: "music",
    author: "priya",
    activity: "added",
    tasteMatch: 74,
    title: "Wall of Eyes",
    body: "On repeat all month — the strings on track 2.",
    posterUrl: "https://picsum.photos/seed/album/300/300",
    creator: "The Smile",
    year: 2024,
    ageHours: 9,
    baseScore: 412,
    comments: [
      { id: "c4", author: "theo", body: "Their best yet, honestly.", ageHours: 6, score: 31 },
    ],
  },
  {
    id: "4",
    community: "movies",
    author: "theo",
    activity: "rated",
    tasteMatch: 95,
    title: "Oppenheimer",
    body: "Holds up even better on a rewatch — Nolan's best structure work. ★★★★★",
    posterUrl: "https://picsum.photos/seed/oppen/300/450",
    creator: "Christopher Nolan",
    year: 2023,
    ageHours: 28,
    baseScore: 967,
    comments: [],
  },
  {
    id: "5",
    community: "books",
    author: "lena",
    activity: "rated",
    tasteMatch: 70,
    title: "Thinking, Fast and Slow",
    body: "Rewired a few of my defaults. Dense but worth it.",
    posterUrl: "https://picsum.photos/seed/tfas/300/450",
    creator: "Daniel Kahneman",
    year: 2011,
    ageHours: 40,
    baseScore: 318,
    comments: [
      { id: "c5", author: "sam", body: "The anchoring chapter stuck with me.", ageHours: 30, score: 14 },
    ],
  },
  {
    id: "6",
    community: "movies",
    author: "movie night crew",
    activity: "group",
    tasteMatch: 81,
    title: "Past Lives",
    body: "Your group quiz with 3 friends landed here — unanimous on the vibe.",
    posterUrl: "https://picsum.photos/seed/pastlives/300/450",
    creator: "Celine Song",
    year: 2023,
    ageHours: 52,
    baseScore: 588,
    comments: [],
  },
];

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: SEED,
  saved: new Set<string>(),
  following: new Set<string>(),
  commentVotes: {},

  toggleSave: (postId) => {
    const next = new Set(get().saved);
    const nowSaved = !next.has(postId);
    nowSaved ? next.add(postId) : next.delete(postId);
    set({ saved: next });
    return nowSaved;
  },

  toggleFollow: (author) => {
    const next = new Set(get().following);
    const nowFollowing = !next.has(author);
    nowFollowing ? next.add(author) : next.delete(author);
    set({ following: next });
    return nowFollowing;
  },

  addComment: (postId, body) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                {
                  id: `u${Date.now()}`,
                  author: "you",
                  body,
                  ageHours: 0,
                  score: 1,
                } satisfies FeedComment,
                ...p.comments,
              ],
            }
          : p,
      ),
    })),

  setCommentVote: (key, dir) =>
    set((s) => {
      const cur = s.commentVotes[key] ?? 0;
      return { commentVotes: { ...s.commentVotes, [key]: cur === dir ? 0 : dir } };
    }),

  addPost: ({ community, title, activity, body, posterUrl, creator, year }) =>
    set((s) => ({
      posts: [
        {
          id: `u${Date.now()}`,
          community: community as FeedCommunity,
          author: "you",
          title,
          activity,
          tasteMatch: 0,
          ageHours: 0,
          body: body?.trim() || undefined,
          posterUrl: posterUrl?.trim() || undefined,
          creator: creator?.trim() || undefined,
          year,
          baseScore: 1,
          comments: [],
        },
        ...s.posts,
      ],
    })),
}));
