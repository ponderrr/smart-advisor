"use client";

import { useState } from "react";
import { ShieldOff, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useBlocked,
  useBlockUser,
  useUnblockUser,
} from "@/features/feed/use-feed";

interface BlockButtonProps {
  /** Profile id of the person this button blocks. */
  authorId?: string;
  /** Display name — used in the confirm + toast copy. */
  authorName: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Explicit Block / Unblock control for the profile page — discoverability
 * matters here, so the action is a labelled button rather than tucked
 * inside the overflow menu used on cards / comments. Backed by
 * feed_blocks; you can't block yourself.
 */
export function BlockButton({
  authorId,
  authorName,
  size = "md",
  className,
}: BlockButtonProps) {
  const { user } = useAuth();
  const { data: blockedIds } = useBlocked();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const [hovered, setHovered] = useState(false);

  if (!authorId || authorId === user?.id) return null;

  const blocked = (blockedIds ?? []).includes(authorId);
  const label = blocked ? (hovered ? "Unblock" : "Blocked") : "Block";
  const pending = blockUser.isPending || unblockUser.isPending;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (blocked) {
          unblockUser.mutate(authorId, {
            onSuccess: () => toast.message(`Unblocked @${authorName}`),
          });
          return;
        }
        if (
          !window.confirm(
            `Block @${authorName}? Their posts and comments will disappear from your feed. You can unblock them later in Settings → Feed.`,
          )
        ) {
          return;
        }
        blockUser.mutate(authorId, {
          onSuccess: () => toast.success(`Blocked @${authorName}`),
        });
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={blocked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight transition-colors disabled:opacity-60",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
        blocked
          ? hovered
            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300"
            : "bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300"
          : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:bg-rose-400/15 dark:text-rose-300",
        className,
      )}
    >
      {blocked ? <ShieldOff size={13} /> : <ShieldX size={13} />}
      {label}
    </button>
  );
}
