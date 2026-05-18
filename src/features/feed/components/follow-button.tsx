"use client";

import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFeedStore } from "@/features/feed/store";
import { mockFollowerCount } from "@/features/feed/types";

interface FollowButtonProps {
  author: string;
  /** Append the (mock) follower count after the label. */
  showCount?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Explicit Follow / Following control. "Following" flips to a red
 * "Unfollow" on hover so the destructive action is discoverable without a
 * menu — the pattern most social apps use. Reads/writes the in-memory feed
 * store; "you" can't follow yourself.
 */
export function FollowButton({
  author,
  showCount = false,
  size = "md",
  className,
}: FollowButtonProps) {
  const following = useFeedStore((s) => s.following.has(author));
  const toggleFollow = useFeedStore((s) => s.toggleFollow);
  const [hovered, setHovered] = useState(false);

  if (author === "you") return null;

  const count = mockFollowerCount(author) + (following ? 1 : 0);
  const label = following ? (hovered ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const now = toggleFollow(author);
        toast[now ? "success" : "message"](
          now ? `Following ${author}` : `Unfollowed ${author}`,
        );
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight transition-colors",
        size === "sm"
          ? "px-2.5 py-1 text-[11px]"
          : "px-3.5 py-1.5 text-xs",
        following
          ? hovered
            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
            : "bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300"
          : "bg-violet-500/10 text-violet-600 hover:bg-violet-500/15 dark:bg-violet-400/15 dark:text-violet-300",
        className,
      )}
    >
      {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
      {label}
      {showCount && (
        <span className="opacity-60">· {count.toLocaleString()}</span>
      )}
    </button>
  );
}
