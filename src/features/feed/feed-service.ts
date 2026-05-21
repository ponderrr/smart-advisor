import { supabase } from "@/integrations/supabase/client";
import type {
  FeedActivity,
  FeedComment,
  FeedCommunity,
  FeedPost,
} from "./types";

/**
 * Supabase-backed feed data layer — reads and writes against the
 * feed_posts / feed_comments / feed_follows / feed_blocks / feed_saves /
 * feed_comment_votes tables. Replaces the in-memory zustand SEED store.
 *
 * Display names + avatars are joined from `profiles`; comment scores are
 * aggregated client-side from feed_comment_votes (a thread's vote set is
 * small — no view/RPC needed).
 */

/** Hours since an ISO timestamp — drives the "5h ago" labels. */
function hoursSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 3_600_000));
}

interface ProfileEmbed {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface CommentRow {
  id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  author: ProfileEmbed | null;
}

interface PostRow {
  id: string;
  community: FeedCommunity;
  activity: FeedActivity;
  title: string;
  body: string | null;
  poster_url: string | null;
  creator: string | null;
  year: number | null;
  base_score: number;
  created_at: string;
  author: ProfileEmbed | null;
  feed_comments: CommentRow[];
}

const POST_SELECT = `
  id, community, activity, title, body, poster_url, creator, year,
  base_score, created_at,
  author:profiles!feed_posts_user_id_fkey ( id, name, avatar_url ),
  feed_comments (
    id, body, parent_id, created_at,
    author:profiles!feed_comments_user_id_fkey ( id, name, avatar_url )
  )
`;

function mapComment(c: CommentRow, score: number): FeedComment {
  return {
    id: c.id,
    authorId: c.author?.id,
    author: c.author?.name ?? "Someone",
    authorAvatarUrl: c.author?.avatar_url ?? null,
    body: c.body,
    ageHours: hoursSince(c.created_at),
    score,
    parentId: c.parent_id,
  };
}

function mapPost(p: PostRow, scores: Map<string, number>): FeedPost {
  return {
    id: p.id,
    community: p.community,
    authorId: p.author?.id,
    author: p.author?.name ?? "Someone",
    authorAvatarUrl: p.author?.avatar_url ?? null,
    title: p.title,
    activity: p.activity,
    tasteMatch: 0,
    ageHours: hoursSince(p.created_at),
    body: p.body ?? undefined,
    posterUrl: p.poster_url ?? undefined,
    creator: p.creator ?? undefined,
    year: p.year ?? undefined,
    baseScore: p.base_score,
    comments: p.feed_comments.map((c) =>
      mapComment(c, scores.get(c.id) ?? 0),
    ),
  };
}

/** Sums feed_comment_votes for the given comment ids → { commentId: score }. */
async function loadCommentScores(
  commentIds: string[],
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (commentIds.length === 0) return scores;
  const { data } = await supabase
    .from("feed_comment_votes")
    .select("comment_id, value")
    .in("comment_id", commentIds);
  for (const row of (data ?? []) as { comment_id: string; value: number }[]) {
    scores.set(row.comment_id, (scores.get(row.comment_id) ?? 0) + row.value);
  }
  return scores;
}

/** The whole feed, newest first, with comments + author display data. */
export async function fetchFeed(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PostRow[];
  const commentIds = rows.flatMap((p) => p.feed_comments.map((c) => c.id));
  const scores = await loadCommentScores(commentIds);
  return rows.map((p) => mapPost(p, scores));
}

/** Inserts a post authored by the current user; returns it mapped. */
export async function createPost(input: {
  community: FeedCommunity;
  title: string;
  body?: string;
  activity?: FeedActivity;
  posterUrl?: string;
  creator?: string;
  year?: number;
}): Promise<FeedPost> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      community: input.community,
      activity: input.activity ?? "shared",
      title: input.title.trim(),
      body: input.body?.trim() || null,
      poster_url: input.posterUrl?.trim() || null,
      creator: input.creator?.trim() || null,
      year: input.year ?? null,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return mapPost(data as unknown as PostRow, new Map());
}

/** Inserts a comment (optionally threaded under parentId). */
export async function createComment(
  postId: string,
  body: string,
  parentId: string | null = null,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("feed_comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId,
    body: body.trim(),
  });
  if (error) throw error;
}

/** Sets the current user's vote on a comment. dir 0 clears it. */
export async function setCommentVote(
  commentId: string,
  dir: -1 | 0 | 1,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (dir === 0) {
    await supabase
      .from("feed_comment_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);
    return;
  }
  await supabase
    .from("feed_comment_votes")
    .upsert(
      { user_id: user.id, comment_id: commentId, value: dir },
      { onConflict: "user_id,comment_id" },
    );
}

/** Profile ids the current user follows. */
export async function fetchFollowing(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  return (data ?? []).map((r) => (r as { followee_id: string }).followee_id);
}

/** Follows/unfollows a profile; returns the new following state. */
export async function toggleFollow(followeeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: existing } = await supabase
    .from("feed_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("feed_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
    return false;
  }
  await supabase
    .from("feed_follows")
    .insert({ follower_id: user.id, followee_id: followeeId });
  return true;
}

/** Profile ids the current user has blocked. */
export async function fetchBlocked(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  return (data ?? []).map((r) => (r as { blocked_id: string }).blocked_id);
}

/** Blocked profiles with display names — for the Settings list. */
export async function fetchBlockedProfiles(): Promise<
  { id: string; name: string }[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_blocks")
    .select("blocked:profiles!feed_blocks_blocked_id_fkey ( id, name )")
    .eq("blocker_id", user.id);
  const rows = (data ?? []) as unknown as {
    blocked: ProfileEmbed | ProfileEmbed[] | null;
  }[];
  return rows
    .map((r) => (Array.isArray(r.blocked) ? r.blocked[0] : r.blocked))
    .filter((p): p is ProfileEmbed => !!p)
    .map((p) => ({ id: p.id, name: p.name }));
}

/** Blocks a profile — also drops any follow so the tie is fully cut. */
export async function blockUser(blockedId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === blockedId) return;
  await supabase
    .from("feed_blocks")
    .upsert(
      { blocker_id: user.id, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id" },
    );
  await supabase
    .from("feed_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", blockedId);
}

export async function unblockUser(blockedId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("feed_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
}

/** Post ids the current user has saved. */
export async function fetchSaved(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_saves")
    .select("post_id")
    .eq("user_id", user.id);
  return (data ?? []).map((r) => (r as { post_id: string }).post_id);
}

/** Saves/unsaves a post; returns the new saved state. */
export async function toggleSave(postId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: existing } = await supabase
    .from("feed_saves")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("feed_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    return false;
  }
  await supabase
    .from("feed_saves")
    .insert({ user_id: user.id, post_id: postId });
  return true;
}

/** A profile's public display data, or null if it doesn't exist. */
export async function fetchProfile(
  profileId: string,
): Promise<{ id: string; name: string; avatarUrl: string | null } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", profileId)
    .maybeSingle();
  if (!data) return null;
  const row = data as ProfileEmbed;
  return { id: row.id, name: row.name, avatarUrl: row.avatar_url };
}

/** How many profiles follow [profileId]. */
export async function fetchFollowerCount(
  profileId: string,
): Promise<number> {
  const { count } = await supabase
    .from("feed_follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", profileId);
  return count ?? 0;
}

/** Posts authored by [profileId], newest first. */
export async function fetchUserPosts(
  profileId: string,
): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(POST_SELECT)
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PostRow[];
  const commentIds = rows.flatMap((p) => p.feed_comments.map((c) => c.id));
  const scores = await loadCommentScores(commentIds);
  return rows.map((p) => mapPost(p, scores));
}

/** The current user's own comment votes → { commentId: -1 | 1 }. */
export async function fetchMyCommentVotes(): Promise<Record<string, number>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("feed_comment_votes")
    .select("comment_id, value")
    .eq("user_id", user.id);
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as {
    comment_id: string;
    value: number;
  }[]) {
    out[row.comment_id] = row.value;
  }
  return out;
}
