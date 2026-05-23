"use client";

import { MoreHorizontal, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBlockUser } from "@/features/feed/use-feed";
import { cn } from "@/lib/utils";

interface BlockMenuButtonProps {
  /** Profile id of the post/comment author. */
  authorId?: string;
  /** Display name — used in the menu label + confirm copy. */
  author: string;
  /** Pass "media" when the menu sits over a poster image — the icon
   *  flips to white-on-scrim so it reads on any cover. Default is the
   *  muted slate used over light card backgrounds. */
  variant?: "default" | "media";
  size?: number;
  className?: string;
}

/**
 * Three-dot overflow that drops a "Block @handle" action. Hides itself
 * on your own posts, stops tap propagation so it doesn't trigger the
 * enclosing card's onClick, and confirms before blocking.
 */
export function BlockMenuButton({
  authorId,
  author,
  variant = "default",
  size = 16,
  className,
}: BlockMenuButtonProps) {
  const { user } = useAuth();
  const blockUser = useBlockUser();

  if (!authorId || authorId === user?.id) return null;

  const buttonClasses =
    variant === "media"
      ? "text-white/90 hover:text-white drop-shadow-md"
      : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More from ${author}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            buttonClasses,
            className,
          )}
        >
          <MoreHorizontal size={size} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="min-w-[180px]"
      >
        <DropdownMenuItem
          onSelect={() => {
            if (
              !window.confirm(
                `Block @${author}? Their posts and comments will disappear from your feed. You can unblock them later in Settings → Feed.`,
              )
            ) {
              return;
            }
            blockUser.mutate(authorId, {
              onSuccess: () => toast.success(`Blocked @${author}`),
            });
          }}
          className="gap-2 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
        >
          <UserX size={14} />
          Block @{author}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
