"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as svc from "./feed-service";
import type { FeedPost } from "./types";

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

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: svc.fetchNotifications,
  });
}

/** Unread count summed across all kinds — the navbar bell reads this
 *  instead of recomputing from the list. */
export function useUnreadNotificationsCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => n.readAt === null).length;
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
