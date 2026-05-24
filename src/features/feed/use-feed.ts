"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as svc from "./feed-service";
import type { FeedPost } from "./types";
import { useMutedKinds } from "@/features/notifications/use-muted-kinds";

/** Query keys for the feed data set — all invalidated together by id. */
const KEYS = {
  feed: ["feed", "posts"] as const,
  following: ["feed", "following"] as const,
  blocked: ["feed", "blocked"] as const,
  saved: ["feed", "saved"] as const,
  commentVotes: ["feed", "comment-votes"] as const,
  postVotes: ["feed", "post-votes"] as const,
  profile: (id: string) => ["feed", "profile", id] as const,
  followerCount: (id: string) => ["feed", "followers", id] as const,
  userPosts: (id: string) => ["feed", "user-posts", id] as const,
};

/* ── queries ──────────────────────────────────────────────────────── */

export function useFeed() {
  return useQuery({ queryKey: KEYS.feed, queryFn: svc.fetchFeed });
}

export function useFollowing() {
  return useQuery({
    queryKey: KEYS.following,
    queryFn: svc.fetchFollowing,
  });
}

export function useBlocked() {
  return useQuery({ queryKey: KEYS.blocked, queryFn: svc.fetchBlocked });
}

export function useBlockedProfiles() {
  return useQuery({
    queryKey: ["feed", "blocked-profiles"],
    queryFn: svc.fetchBlockedProfiles,
  });
}

export function useSaved() {
  return useQuery({ queryKey: KEYS.saved, queryFn: svc.fetchSaved });
}

export function useMyCommentVotes() {
  return useQuery({
    queryKey: KEYS.commentVotes,
    queryFn: svc.fetchMyCommentVotes,
  });
}

export function useMyPostVotes() {
  return useQuery({
    queryKey: KEYS.postVotes,
    queryFn: svc.fetchMyPostVotes,
  });
}

export function useFeedProfile(profileId: string) {
  return useQuery({
    queryKey: KEYS.profile(profileId),
    queryFn: () => svc.fetchProfile(profileId),
    enabled: !!profileId,
  });
}

export function useFollowerCount(profileId: string) {
  return useQuery({
    queryKey: KEYS.followerCount(profileId),
    queryFn: () => svc.fetchFollowerCount(profileId),
    enabled: !!profileId,
  });
}

export function useUserPosts(profileId: string) {
  return useQuery({
    queryKey: KEYS.userPosts(profileId),
    queryFn: () => svc.fetchUserPosts(profileId),
    enabled: !!profileId,
  });
}

/**
 * The feed with blocked authors filtered out — posts AND comments
 * authored by a blocked profile are dropped. Mirrors the old
 * useVisiblePosts. Returns the loading/error state of the underlying
 * feed query so callers can render placeholders.
 */
export function useVisibleFeed() {
  const feed = useFeed();
  const blocked = useBlocked();
  const blockedSet = useMemo(
    () => new Set(blocked.data ?? []),
    [blocked.data],
  );
  const posts = useMemo<FeedPost[]>(() => {
    const all = feed.data ?? [];
    if (blockedSet.size === 0) return all;
    return all
      .filter((p) => !p.authorId || !blockedSet.has(p.authorId))
      .map((p) => {
        const visible = p.comments.filter(
          (c) => !c.authorId || !blockedSet.has(c.authorId),
        );
        return visible.length === p.comments.length
          ? p
          : { ...p, comments: visible };
      });
  }, [feed.data, blockedSet]);
  return {
    posts,
    isLoading: feed.isLoading,
    isError: feed.isError,
    error: feed.error,
  };
}

/** Batched reaction aggregates for a list of post + comment ids.
 *  One query per kind, so passing both is cheaper than two hooks.
 *  Keyed by sorted ids so two render passes with the same set of
 *  ids share the same cache entry. */
export function useReactions(args: {
  postIds: string[];
  commentIds?: string[];
}) {
  const { postIds, commentIds } = args;
  const sortedPosts = useMemo(() => [...postIds].sort(), [postIds]);
  const sortedComments = useMemo(
    () => [...(commentIds ?? [])].sort(),
    [commentIds],
  );
  return useQuery({
    queryKey: ["feed", "reactions", sortedPosts, sortedComments] as const,
    queryFn: () =>
      svc.fetchReactions({ postIds: sortedPosts, commentIds: sortedComments }),
    enabled: sortedPosts.length > 0 || sortedComments.length > 0,
  });
}

/** Live profile-search results for the given query. Caller should
 *  debounce upstream (or accept the staleness — react-query keeps the
 *  previous query's data while a new one loads). */
export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ["feed", "search", "profiles", query] as const,
    queryFn: () => svc.searchProfiles(query),
    enabled: query.trim().length >= 2,
  });
}

export function useSearchPosts(query: string) {
  return useQuery({
    queryKey: ["feed", "search", "posts", query] as const,
    queryFn: () => svc.searchPosts(query),
    enabled: query.trim().length >= 2,
  });
}

export function useMyFollowingProfiles() {
  return useQuery({
    queryKey: ["feed", "my-following-profiles"] as const,
    queryFn: svc.fetchMyFollowingProfiles,
  });
}

export function useSendPick() {
  return useMutation({
    mutationFn: svc.sendPickToFriend,
  });
}

export function useFollowSuggestions() {
  return useQuery({
    queryKey: ["feed", "follow-suggestions"] as const,
    queryFn: () => svc.fetchFollowSuggestions(),
  });
}

export function useSetReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.setReaction,
    // Reactions don't carry a per-query cache key fine enough to
    // surgically invalidate, so invalidate the whole reactions family.
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["feed", "reactions"] }),
  });
}

/* ── mutations ────────────────────────────────────────────────────── */

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.feed }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.updatePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.feed });
      qc.invalidateQueries({ queryKey: ["feed", "user-posts"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.deletePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.feed });
      qc.invalidateQueries({ queryKey: ["feed", "user-posts"] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.deleteComment,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.feed }),
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { commentId: string; body: string }) =>
      svc.updateComment(v.commentId, v.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.feed }),
  });
}

/** Reporting files a moderation row — nothing in the feed changes, so
 *  these mutations don't invalidate any queries. */
export function useReportPost() {
  return useMutation({
    mutationFn: (v: { postId: string; reason?: string }) =>
      svc.reportPost(v.postId, v.reason),
  });
}

export function useReportComment() {
  return useMutation({
    mutationFn: (v: { commentId: string; reason?: string }) =>
      svc.reportComment(v.commentId, v.reason),
  });
}

export function useMyReports() {
  return useQuery({
    queryKey: ["feed", "my-reports"],
    queryFn: svc.fetchMyReports,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      postId: string;
      body: string;
      parentId?: string | null;
    }) => svc.createComment(v.postId, v.body, v.parentId ?? null),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.feed }),
  });
}

export function useSetCommentVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { commentId: string; dir: -1 | 0 | 1 }) =>
      svc.setCommentVote(v.commentId, v.dir),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.feed });
      qc.invalidateQueries({ queryKey: KEYS.commentVotes });
    },
  });
}

export function useSetPostVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { postId: string; dir: -1 | 0 | 1 }) =>
      svc.setPostVote(v.postId, v.dir),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.feed });
      qc.invalidateQueries({ queryKey: KEYS.postVotes });
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.toggleFollow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.following });
      qc.invalidateQueries({ queryKey: ["feed", "followers"] });
    },
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.toggleSave,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.saved }),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.blocked });
      qc.invalidateQueries({ queryKey: ["feed", "blocked-profiles"] });
      qc.invalidateQueries({ queryKey: KEYS.following });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.unblockUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.blocked }),
  });
}

// ---------------------------------------------------------------------------
// Reports moderation (admin)
// ---------------------------------------------------------------------------

/** Admin reports list — see [fetchAllReports]. Non-admins get an empty
 *  array (RLS), so any non-admin landing on a moderation page just sees
 *  the empty state. */
export function useAllReports() {
  return useQuery({
    queryKey: ["feed", "all-reports"],
    queryFn: svc.fetchAllReports,
  });
}

export function useSetReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { reportId: string; status: svc.ReportStatus }) =>
      svc.setReportStatus(v.reportId, v.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed", "all-reports"] });
      qc.invalidateQueries({ queryKey: ["feed", "my-reports"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Notifications (feed_notifications)
// ---------------------------------------------------------------------------

const NOTIF_KEY = ["feed", "notifications"] as const;

/** Raw query — every row from feed_notifications, unfiltered. Other
 *  hooks layer the muted-kinds filter on top so the bell badge + the
 *  inbox + the settings counter all share one source of truth. */
function useNotificationsRaw() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: svc.fetchNotifications,
  });
}

export function useNotifications() {
  const raw = useNotificationsRaw();
  const { muted } = useMutedKinds();
  const data = useMemo(() => {
    const all = raw.data ?? [];
    if (muted.size === 0) return all;
    return all.filter((n) => !muted.has(n.kind));
  }, [raw.data, muted]);
  return { ...raw, data };
}

/** Unread count summed across all kinds the user hasn't muted — the
 *  navbar bell reads this so muting a kind clears its contribution to
 *  the badge immediately. */
export function useUnreadNotificationsCount(): number {
  const { data } = useNotifications();
  return data.filter((n) => n.readAt === null).length;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.deleteNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.clearAllNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  });
}
