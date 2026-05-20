"use client";

import { useState } from "react";
import { ShieldOff, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useFeedStore } from "@/features/feed/store";

interface BlockButtonProps {
  author: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Explicit Block / Unblock control for the profile page — discoverability
 * matters here, so the action is a labelled button rather than tucked
 * inside the overflow menu used on cards / comments. Mirrors the labelled
 * FollowButton pattern (the destructive action flips on hover).
 */
export function BlockButton({ author, size = "md", className }: BlockButtonProps) {
  const blocked = useFeedStore((s) => s.blocked.has(author.toLowerCase()));
  const block = useFeedStore((s) => s.block);
  const unblock = useFeedStore((s) => s.unblock);
  const [hovered, setHovered] = useState(false);

  if (author === "you") return null;

  const label = blocked ? (hovered ? "Unblock" : "Blocked") : "Block";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (blocked) {
          unblock(author);
          toast.message(`Unblocked @${author}`);
          return;
        }
        if (
          !window.confirm(
            `Block @${author}? Their posts and comments will disappear from your feed. You can unblock them later in Settings → Feed.`,
          )
        ) {
          return;
        }
        const ok = block(author);
        if (ok) toast.success(`Blocked @${author}`);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={blocked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight transition-colors",
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
