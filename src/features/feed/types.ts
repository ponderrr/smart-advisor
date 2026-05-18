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
  author: string;
  body: string;
  ageHours: number;
  score: number;
}

export interface FeedPost {
  id: string;
  community: FeedCommunity;
  author: string;
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
