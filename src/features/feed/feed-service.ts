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
  edited_at: string | null;
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
  rating: number | null;
  base_score: number;
  created_at: string;
  author: ProfileEmbed | null;
  feed_comments: CommentRow[];
}

// Joins go through profiles_public (public-safe projection) because
// the base `profiles` table has owner-only RLS. See
// supabase/migrations/20260522040000_profiles_public_view.sql.
const POST_SELECT = `
  id, community, activity, title, body, poster_url, creator, year,
  rating, base_score, created_at,
  author:profiles_public!feed_posts_user_id_fkey ( id, name, avatar_url ),
  feed_comments (
    id, body, parent_id, created_at, edited_at,
    author:profiles_public!feed_comments_user_id_fkey ( id, name, avatar_url )
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
    edited: c.edited_at != null,
    parentId: c.parent_id,
  };
}

function mapPost(
  p: PostRow,
  commentScores: Map<string, number>,
  postScore: number,
): FeedPost {
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
    rating: p.rating ?? undefined,
    baseScore: p.base_score,
    score: postScore,
    comments: p.feed_comments.map((c) =>
      mapComment(c, commentScores.get(c.id) ?? 0),
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

/** Sums feed_post_votes for the given post ids → { postId: score }. */
async function loadPostScores(
  postIds: string[],
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (postIds.length === 0) return scores;
  const { data } = await supabase
    .from("feed_post_votes")
    .select("post_id, value")
    .in("post_id", postIds);
  for (const row of (data ?? []) as { post_id: string; value: number }[]) {
    scores.set(row.post_id, (scores.get(row.post_id) ?? 0) + row.value);
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
  const postIds = rows.map((p) => p.id);
  const [commentScores, postScores] = await Promise.all([
    loadCommentScores(commentIds),
    loadPostScores(postIds),
  ]);
  return rows.map((p) => mapPost(p, commentScores, postScores.get(p.id) ?? 0));
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
  rating?: number;
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
      // Only meaningful for a 'rated' post; null otherwise.
      rating:
        (input.activity ?? "shared") === "rated"
          ? input.rating ?? null
          : null,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return mapPost(data as unknown as PostRow, new Map(), 0);
}

/** Updates an existing post's editable fields. RLS only permits the
 *  author; returns the post mapped fresh (comments re-joined). */
export async function updatePost(input: {
  postId: string;
  community: FeedCommunity;
  title: string;
  body?: string;
  activity?: FeedActivity;
  posterUrl?: string;
  creator?: string;
  year?: number;
  rating?: number;
}): Promise<FeedPost> {
  const { data, error } = await supabase
    .from("feed_posts")
    .update({
      community: input.community,
      activity: input.activity ?? "shared",
      title: input.title.trim(),
      body: input.body?.trim() || null,
      poster_url: input.posterUrl?.trim() || null,
      creator: input.creator?.trim() || null,
      year: input.year ?? null,
      // Only meaningful for a 'rated' post; cleared otherwise.
      rating:
        (input.activity ?? "shared") === "rated"
          ? input.rating ?? null
          : null,
    })
    .eq("id", input.postId)
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return mapPost(data as unknown as PostRow, new Map(), 0);
}

/** Deletes a post. RLS only permits the author; cascades to its
 *  comments / saves / votes. */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("feed_posts")
    .delete()
    .eq("id", postId);
  if (error) throw error;
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

/** Deletes a comment. RLS only permits the author; cascades to replies. */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}

/** Updates a comment's body. RLS only permits the author. Stamps
 *  edited_at so the UI can show "(edited)" on the byline. */
export async function updateComment(
  commentId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase
    .from("feed_comments")
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
}

/** Files a moderation report on a post or a comment (exactly one id is
 *  set). Reason is optional free text. */
async function fileReport(target: {
  postId?: string;
  commentId?: string;
  reason?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("feed_reports").insert({
    reporter_id: user.id,
    post_id: target.postId ?? null,
    comment_id: target.commentId ?? null,
    reason: target.reason?.trim() || null,
  });
  if (error) throw error;
}

export function reportPost(postId: string, reason?: string): Promise<void> {
  return fileReport({ postId, reason });
}

export function reportComment(
  commentId: string,
  reason?: string,
): Promise<void> {
  return fileReport({ commentId, reason });
}

/** A report the current user filed — for the Settings reports list. */
export type ReportStatus = "open" | "reviewed" | "dismissed";

export interface MyReport {
  id: string;
  reason: string | null;
  createdAt: string;
  target: "post" | "comment";
  /** Post title / comment snippet, when the content still exists. */
  targetLabel: string | null;
  status: ReportStatus;
}

/** Reports the current user has filed, newest first. */
export async function fetchMyReports(): Promise<MyReport[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("feed_reports")
    .select(
      `id, reason, created_at, post_id, comment_id, status,
       post:feed_posts!feed_reports_post_id_fkey ( title ),
       comment:feed_comments!feed_reports_comment_id_fkey ( body )`,
    )
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    id: string;
    reason: string | null;
    created_at: string;
    post_id: string | null;
    comment_id: string | null;
    status: string | null;
    post: { title: string } | { title: string }[] | null;
    comment: { body: string } | { body: string }[] | null;
  }[];
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;
  return rows.map((r) => {
    const post = one(r.post);
    const comment = one(r.comment);
    return {
      id: r.id,
      reason: r.reason,
      createdAt: r.created_at,
      target: r.post_id ? ("post" as const) : ("comment" as const),
      targetLabel: post?.title ?? comment?.body ?? null,
      status: ((r.status ?? "open") as ReportStatus),
    };
  });
}

/** Admin-only triage list — every report in the system, newest first.
 *  Reads via the `feed_reports_select_admin` RLS policy
 *  (profiles.is_admin = TRUE). Non-admins get back an empty list (or
 *  only their own reports via the additive select_own policy). */
export interface AdminReport extends MyReport {
  reporterName: string | null;
  reporterUsername: string | null;
  targetAuthorName: string | null;
  targetAuthorUsername: string | null;
  postId: string | null;
  commentId: string | null;
  /** For a comment report, the post that holds the thread the
   *  comment lives in — used by the "Open thread" link. */
  commentPostId: string | null;
}

export async function fetchAllReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from("feed_reports")
    .select(
      `id, reason, created_at, post_id, comment_id, status,
       reporter:profiles_public!feed_reports_reporter_id_fkey ( name, username ),
       post:feed_posts!feed_reports_post_id_fkey
         ( title, author:profiles_public!feed_posts_user_id_fkey ( name, username ) ),
       comment:feed_comments!feed_reports_comment_id_fkey
         ( body, post_id, author:profiles_public!feed_comments_user_id_fkey ( name, username ) )`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;
  type ActorEmbed = { name: string; username: string | null };
  const rows = (data ?? []) as unknown as {
    id: string;
    reason: string | null;
    created_at: string;
    post_id: string | null;
    comment_id: string | null;
    status: string | null;
    reporter: ActorEmbed | ActorEmbed[] | null;
    post:
      | {
          title: string;
          author: ActorEmbed | ActorEmbed[] | null;
        }
      | {
          title: string;
          author: ActorEmbed | ActorEmbed[] | null;
        }[]
      | null;
    comment:
      | {
          body: string;
          post_id: string;
          author: ActorEmbed | ActorEmbed[] | null;
        }
      | {
          body: string;
          post_id: string;
          author: ActorEmbed | ActorEmbed[] | null;
        }[]
      | null;
  }[];
  return rows.map((r) => {
    const reporter = one(r.reporter);
    const post = one(r.post);
    const comment = one(r.comment);
    const author = one(post?.author ?? comment?.author ?? null);
    return {
      id: r.id,
      reason: r.reason,
      createdAt: r.created_at,
      target: r.post_id ? ("post" as const) : ("comment" as const),
      targetLabel: post?.title ?? comment?.body ?? null,
      status: ((r.status ?? "open") as ReportStatus),
      reporterName: reporter?.name ?? null,
      reporterUsername: reporter?.username ?? null,
      targetAuthorName: author?.name ?? null,
      targetAuthorUsername: author?.username ?? null,
      postId: r.post_id,
      commentId: r.comment_id,
      commentPostId: comment?.post_id ?? null,
    };
  });
}

/** Admin: change a report's moderation status. Gated server-side by
 *  the `feed_reports_update_admin` RLS policy — non-admins get a 403. */
export async function setReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resolving = status !== "open";
  await supabase
    .from("feed_reports")
    .update({
      status,
      reviewed_at: resolving ? new Date().toISOString() : null,
      reviewed_by: resolving ? (user?.id ?? null) : null,
    })
    .eq("id", reportId);
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

/** Sets the current user's vote on a post. dir 0 clears it. Mirrors
 *  setCommentVote — same upsert/delete pattern against feed_post_votes. */
export async function setPostVote(
  postId: string,
  dir: -1 | 0 | 1,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (dir === 0) {
    await supabase
      .from("feed_post_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    return;
  }
  await supabase
    .from("feed_post_votes")
    .upsert(
      { user_id: user.id, post_id: postId, value: dir },
      { onConflict: "user_id,post_id" },
    );
}

/** The current user's own post votes → { postId: -1 | 1 }. */
export async function fetchMyPostVotes(): Promise<Record<string, number>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("feed_post_votes")
    .select("post_id, value")
    .eq("user_id", user.id);
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as { post_id: string; value: number }[]) {
    out[row.post_id] = row.value;
  }
  return out;
}

/** Set of emoji users can react with — mirrors the CHECK constraint
 *  in 20260524000000_feed_reactions.sql. Order is the picker order. */
export const REACTION_EMOJI = [
  "❤️",
  "🔥",
  "😂",
  "😢",
  "🤔",
  "👏",
] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI)[number];

export type ReactionTargetKind = "post" | "comment";

export interface ReactionAggregates {
  /** counts[targetId][emoji] = N */
  counts: Record<string, Partial<Record<ReactionEmoji, number>>>;
  /** mine[targetId] = the single emoji the current user picked. */
  mine: Record<string, ReactionEmoji>;
}

/** Aggregated reactions for the given post + comment ids — one
 *  query per kind because target_kind is part of the index. Returns
 *  empty maps when neither id list is provided. */
export async function fetchReactions(args: {
  postIds?: string[];
  commentIds?: string[];
}): Promise<ReactionAggregates> {
  const { postIds = [], commentIds = [] } = args;
  if (postIds.length === 0 && commentIds.length === 0) {
    return { counts: {}, mine: {} };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? null;
  type ReactionRow = {
    user_id: string;
    target_id: string;
    emoji: string;
  };
  const queries: Promise<ReactionRow[]>[] = [];
  if (postIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("feed_reactions")
          .select("user_id, target_id, emoji")
          .eq("target_kind", "post")
          .in("target_id", postIds);
        return (data ?? []) as ReactionRow[];
      })(),
    );
  }
  if (commentIds.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("feed_reactions")
          .select("user_id, target_id, emoji")
          .eq("target_kind", "comment")
          .in("target_id", commentIds);
        return (data ?? []) as ReactionRow[];
      })(),
    );
  }
  const batches = await Promise.all(queries);
  const counts: ReactionAggregates["counts"] = {};
  const mine: ReactionAggregates["mine"] = {};
  for (const rows of batches) {
    for (const r of rows) {
      const e = r.emoji as ReactionEmoji;
      const bucket = (counts[r.target_id] ??= {});
      bucket[e] = (bucket[e] ?? 0) + 1;
      if (uid && r.user_id === uid) mine[r.target_id] = e;
    }
  }
  return { counts, mine };
}

/** Sets the current user's reaction on a post or comment. A null
 *  `emoji` clears it (delete). One reaction per (user, target) is
 *  enforced by the PK — upsert replaces a previous pick. */
export async function setReaction(args: {
  targetKind: ReactionTargetKind;
  targetId: string;
  emoji: ReactionEmoji | null;
}): Promise<void> {
  const { targetKind, targetId, emoji } = args;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (emoji === null) {
    await supabase
      .from("feed_reactions")
      .delete()
      .eq("user_id", user.id)
      .eq("target_kind", targetKind)
      .eq("target_id", targetId);
    return;
  }
  await supabase.from("feed_reactions").upsert(
    {
      user_id: user.id,
      target_kind: targetKind,
      target_id: targetId,
      emoji,
    },
    { onConflict: "user_id,target_kind,target_id" },
  );
}

export interface FollowingProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Profiles the current user follows, newest follow first — drives
 *  the "Send to a friend" picker. Auth-gated by the caller; returns
 *  [] when not signed in. */
export async function fetchMyFollowingProfiles(): Promise<FollowingProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  type Row = {
    created_at: string;
    followee: { id: string; name: string | null; avatar_url: string | null } | null;
  };
  const { data } = await supabase
    .from("feed_follows")
    .select(
      "created_at, " +
        "followee:profiles_public!feed_follows_followee_id_fkey ( id, name, avatar_url )",
    )
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });
  const out: FollowingProfile[] = [];
  for (const r of (data ?? []) as unknown as Row[]) {
    const p = r.followee;
    if (!p?.id) continue;
    out.push({
      id: p.id,
      name: p.name ?? "Someone",
      avatarUrl: p.avatar_url,
    });
  }
  return out;
}

/** Sends `postId` to `recipientId` as a "have you read this" pick.
 *  Inserts into feed_pick_sends — the AFTER-INSERT trigger fires
 *  the 'pick_sent' notification on the recipient's inbox; RLS
 *  guards the sender_id check. `message` is the optional one-liner
 *  shown to the recipient. */
export async function sendPickToFriend(args: {
  postId: string;
  recipientId: string;
  message?: string;
}): Promise<void> {
  const { postId, recipientId, message } = args;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (user.id === recipientId) {
    throw new Error("Can't send a pick to yourself");
  }
  const trimmed = message?.trim() ?? "";
  const { error } = await supabase.from("feed_pick_sends").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    post_id: postId,
    message: trimmed.length > 0 ? trimmed : null,
  });
  if (error) throw error;
}

export interface SearchProfileResult {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface SearchPostResult {
  id: string;
  title: string;
  body: string | null;
  posterUrl: string | null;
  community: FeedCommunity;
  authorId: string;
  author: string;
}

/** Escapes `%` and `_` so a literal "50%" search doesn't act as a
 *  wildcard. Used by both search functions below. */
function escapeIlike(s: string): string {
  return s.replace(/[%_]/g, (m) => `\\${m}`);
}

/** Debounced caller is in the search page; the service itself returns
 *  whatever ilike finds. Blocked users (either direction) are filtered
 *  out so search never surfaces someone you've cut contact with. */
export async function searchProfiles(
  query: string,
): Promise<SearchProfileResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${escapeIlike(q)}%`;
  const [{ data: rows }, blocked, blockedBy] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("id, name, username, avatar_url")
      .or(`name.ilike.${like},username.ilike.${like}`)
      .limit(30),
    fetchBlocked(),
    fetchBlockedBy(),
  ]);
  const hidden = new Set<string>([...blocked, ...blockedBy]);
  const out: SearchProfileResult[] = [];
  for (const r of (rows ?? []) as Array<{
    id: string | null;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  }>) {
    if (!r.id || hidden.has(r.id)) continue;
    out.push({
      id: r.id,
      name: r.name ?? "Someone",
      username: r.username,
      avatarUrl: r.avatar_url,
    });
  }
  return out;
}

export async function searchPosts(
  query: string,
): Promise<SearchPostResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${escapeIlike(q)}%`;
  type Row = {
    id: string;
    title: string | null;
    body: string | null;
    poster_url: string | null;
    community: FeedCommunity;
    author: { id: string; name: string | null } | null;
  };
  const [{ data: rows }, blocked, blockedBy] = await Promise.all([
    supabase
      .from("feed_posts")
      .select(
        "id, title, body, poster_url, community, " +
          "author:profiles_public!feed_posts_user_id_fkey ( id, name )",
      )
      .or(`title.ilike.${like},body.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(30),
    fetchBlocked(),
    fetchBlockedBy(),
  ]);
  const hidden = new Set<string>([...blocked, ...blockedBy]);
  const out: SearchPostResult[] = [];
  for (const r of (rows ?? []) as unknown as Row[]) {
    const authorId = r.author?.id ?? "";
    if (!authorId || hidden.has(authorId)) continue;
    out.push({
      id: r.id,
      title: r.title ?? "",
      body: r.body,
      posterUrl: r.poster_url,
      community: r.community,
      authorId,
      author: r.author?.name ?? "Someone",
    });
  }
  return out;
}

export interface FollowSuggestion {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** How many of the current user's follows also follow this person. */
  mutual: number;
}

/** Friends-of-friends ranked by mutual-overlap count. Returns empty
 *  when the current user follows no-one (caller pairs this with
 *  [fetchSuggestedPeople] for the cold-start surface). Hidden:
 *  yourself, anyone you already follow, anyone either side has
 *  blocked. */
export async function fetchFollowSuggestions(
  limit = 30,
): Promise<FollowSuggestion[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const mine = await fetchFollowing();
  if (mine.length === 0) return [];
  type Row = {
    follower_id: string;
    followee: { id: string; name: string; avatar_url: string | null } | null;
  };
  const [{ data: rows }, blocked, blockedBy] = await Promise.all([
    supabase
      .from("feed_follows")
      .select(
        "follower_id, " +
          "followee:profiles_public!feed_follows_followee_id_fkey ( id, name, avatar_url )",
      )
      .in("follower_id", mine),
    fetchBlocked(),
    fetchBlockedBy(),
  ]);
  const hidden = new Set<string>([
    user.id,
    ...mine,
    ...blocked,
    ...blockedBy,
  ]);
  const scored = new Map<
    string,
    { name: string; avatarUrl: string | null; mutual: number }
  >();
  for (const r of (rows ?? []) as unknown as Row[]) {
    const p = r.followee;
    if (!p?.id || hidden.has(p.id)) continue;
    const prev = scored.get(p.id);
    scored.set(p.id, {
      name: p.name ?? "Someone",
      avatarUrl: p.avatar_url,
      mutual: (prev?.mutual ?? 0) + 1,
    });
  }
  const entries = [...scored.entries()].sort(
    (a, b) => b[1].mutual - a[1].mutual,
  );
  return entries.slice(0, limit).map(([id, v]) => ({
    id,
    name: v.name,
    avatarUrl: v.avatarUrl,
    mutual: v.mutual,
  }));
}

/** Looks up a profile id from a `@handle` (case-insensitive).
 *  Backs the @mention tap-handler in [MentionText]; returns `null`
 *  when the handle doesn't exist (don't throw — the UI shows a
 *  toast in that case). */
export async function resolveUsernameToId(
  username: string,
): Promise<string | null> {
  const handle = username.replace(/^@/, "").trim();
  if (!handle) return null;
  const { data } = await supabase
    .from("profiles_public")
    .select("id")
    .ilike("username", handle)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
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

/** Follows/unfollows a profile; returns the new following state.
 *  Refuses to create the tie if either side has blocked the other —
 *  server-side it'd be possible to insert one (the RLS policies don't
 *  cross-reference feed_blocks), so this guard is the only thing
 *  preventing a silent "blocked but still followable" state. */
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
  const { data: block } = await supabase
    .from("feed_blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${followeeId}),` +
        `and(blocker_id.eq.${followeeId},blocked_id.eq.${user.id})`,
    )
    .maybeSingle();
  if (block) {
    throw new Error("Unblock this person before following them.");
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

/** Profile ids of users who blocked the current user — needed to
 *  filter them out of suggestions / follower lists so the blocker's
 *  account isn't surfaced to someone they don't want contact with. */
export async function fetchBlockedBy(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_blocks")
    .select("blocker_id")
    .eq("blocked_id", user.id);
  return (data ?? []).map((r) => (r as { blocker_id: string }).blocker_id);
}

/** Blocked profiles with display names + avatars — for the Settings list. */
export async function fetchBlockedProfiles(): Promise<
  { id: string; name: string; avatarUrl: string | null }[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("feed_blocks")
    .select(
      "blocked:profiles_public!feed_blocks_blocked_id_fkey ( id, name, avatar_url )",
    )
    .eq("blocker_id", user.id);
  const rows = (data ?? []) as unknown as {
    blocked: ProfileEmbed | ProfileEmbed[] | null;
  }[];
  return rows
    .map((r) => (Array.isArray(r.blocked) ? r.blocked[0] : r.blocked))
    .filter((p): p is ProfileEmbed => !!p)
    .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatar_url }));
}

/** Blocks a profile — also drops any follow tie so neither side keeps
 *  a stale connection. Their follow on you is just as wrong as yours
 *  on them after a block; the OR filter expresses both at once and
 *  RLS (widened in 20260523030000_feed_follows_followee_delete) allows
 *  both rows to be deleted. */
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
    .or(
      `and(follower_id.eq.${user.id},followee_id.eq.${blockedId}),` +
        `and(follower_id.eq.${blockedId},followee_id.eq.${user.id})`,
    );
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
export async function fetchProfile(profileId: string): Promise<{
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  interests: string[];
  tags: string[];
} | null> {
  const { data } = await supabase
    .from("profiles_public")
    .select("id, name, avatar_url, bio, interests, tags")
    .eq("id", profileId)
    .maybeSingle();
  if (!data) return null;
  const row = data as ProfileEmbed & {
    bio: string | null;
    interests: string[] | null;
    tags: string[] | null;
  };
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    interests: row.interests ?? [],
    tags: row.tags ?? [],
  };
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
  const postIds = rows.map((p) => p.id);
  const [commentScores, postScores] = await Promise.all([
    loadCommentScores(commentIds),
    loadPostScores(postIds),
  ]);
  return rows.map((p) => mapPost(p, commentScores, postScores.get(p.id) ?? 0));
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

// ---------------------------------------------------------------------------
// Server notifications (feed_notifications)
// ---------------------------------------------------------------------------

/** One of: follow, comment_on_post, reply_to_comment, friend_post,
 *  post_upvote, comment_upvote — matches the Postgres
 *  `feed_notification_kind` enum exactly. A new server value the
 *  client doesn't render yet falls through to a generic card. */
export type FeedNotificationKind =
  | "follow"
  | "comment_on_post"
  | "reply_to_comment"
  | "friend_post"
  | "post_upvote"
  | "comment_upvote";

export interface FeedNotification {
  id: string;
  kind: FeedNotificationKind | string;
  createdAt: string;
  readAt: string | null;
  actorId: string | null;
  actorName: string;
  actorAvatarUrl: string | null;
  postId: string | null;
  commentId: string | null;
  postTitle: string | null;
  commentBody: string | null;
}

/** The current user's notification feed — newest first, capped at 100.
 *  Reads via the `feed_notifications_select_own` RLS policy. */
export async function fetchNotifications(): Promise<FeedNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("feed_notifications")
    .select(
      `id, kind, created_at, read_at, post_id, comment_id,
       actor:profiles_public!feed_notifications_actor_id_fkey ( id, name, avatar_url ),
       post:feed_posts!feed_notifications_post_id_fkey ( title ),
       comment:feed_comments!feed_notifications_comment_id_fkey ( body )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  type ActorEmbed = {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  const rows = (data ?? []) as unknown as {
    id: string;
    kind: string;
    created_at: string;
    read_at: string | null;
    post_id: string | null;
    comment_id: string | null;
    actor: ActorEmbed | ActorEmbed[] | null;
    post: { title: string } | { title: string }[] | null;
    comment: { body: string } | { body: string }[] | null;
  }[];
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;
  return rows.map((r) => {
    const actor = one(r.actor);
    const post = one(r.post);
    const comment = one(r.comment);
    return {
      id: r.id,
      kind: r.kind,
      createdAt: r.created_at,
      readAt: r.read_at,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? "Someone",
      actorAvatarUrl: actor?.avatar_url ?? null,
      postId: r.post_id,
      commentId: r.comment_id,
      postTitle: post?.title ?? null,
      commentBody: comment?.body ?? null,
    };
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("feed_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("feed_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

export async function deleteNotification(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("feed_notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
}

export async function clearAllNotifications(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("feed_notifications")
    .delete()
    .eq("user_id", user.id);
}
