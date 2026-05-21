"use client";

import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useFollowerCount,
  useFollowing,
  useToggleFollow,
} from "@/features/feed/use-feed";

interface FollowButtonProps {
  /** Profile id of the person this button follows. */
  authorId?: string;
  /** Display name — used only for the toast. */
  authorName: string;
  /** Append the live follower count after the label. */
  showCount?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Explicit Follow / Following control. "Following" flips to a red
 * "Unfollow" on hover so the destructive action is discoverable without a
 * menu — the pattern most social apps use. Backed by feed_follows; you
 * can't follow yourself.
 */
export function FollowButton({
  authorId,
  authorName,
  showCount = false,
  size = "md",
  className,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { data: following } = useFollowing();
  const { data: followerCount } = useFollowerCount(showCount ? authorId ?? "" : "");
  const toggleFollow = useToggleFollow();
  const [hovered, setHovered] = useState(false);

  if (!authorId || authorId === user?.id) return null;

  const isFollowing = (following ?? []).includes(authorId);
  const count = (followerCount ?? 0) + (isFollowing ? 1 : 0);
  const label = isFollowing
    ? hovered
      ? "Unfollow"
      : "Following"
    : "Follow";

  return (
    <button
      type="button"
      disabled={toggleFollow.isPending}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFollow.mutate(authorId, {
          onSuccess: (now) =>
            toast[now ? "success" : "message"](
              now ? `Following ${authorName}` : `Unfollowed ${authorName}`,
            ),
        });
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isFollowing}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight transition-colors disabled:opacity-60",
        size === "sm"
          ? "px-2.5 py-1 text-[11px]"
          : "px-3.5 py-1.5 text-xs",
        isFollowing
          ? hovered
            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
            : "bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300"
          : "bg-violet-500/10 text-violet-600 hover:bg-violet-500/15 dark:bg-violet-400/15 dark:text-violet-300",
        className,
      )}
    >
      {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
      {label}
      {showCount && (
        <span className="opacity-60">· {count.toLocaleString()}</span>
      )}
    </button>
  );
}
