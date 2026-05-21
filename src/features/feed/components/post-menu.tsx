"use client";

import { MoreHorizontal, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBlockUser, useDeletePost } from "@/features/feed/use-feed";
import { cn } from "@/lib/utils";

interface PostMenuButtonProps {
  postId: string;
  postTitle: string;
  /** Post author's profile id. */
  authorId?: string;
  /** Author display name — used in menu/confirm copy. */
  author: string;
  /** "media" flips the icon to white-on-scrim for poster overlays. */
  variant?: "default" | "media";
  size?: number;
  className?: string;
}

/**
 * Three-dot overflow for a feed post. On your own posts it offers
 * "Delete post"; on everyone else's it offers "Block @author". Stops
 * tap propagation so it doesn't trigger the enclosing card's onClick.
 */
export function PostMenuButton({
  postId,
  postTitle,
  authorId,
  author,
  variant = "default",
  size = 16,
  className,
}: PostMenuButtonProps) {
  const { user } = useAuth();
  const blockUser = useBlockUser();
  const deletePost = useDeletePost();

  if (!authorId) return null;
  const isOwn = authorId === user?.id;

  const buttonClasses =
    variant === "media"
      ? "text-white/90 hover:text-white drop-shadow-md"
      : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={isOwn ? "Post options" : `More from ${author}`}
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
        {isOwn ? (
          <DropdownMenuItem
            onSelect={() => {
              if (
                !window.confirm(
                  `Delete "${postTitle}"? This removes the post and its comments for everyone. This can't be undone.`,
                )
              ) {
                return;
              }
              deletePost.mutate(postId, {
                onSuccess: () => toast.success("Post deleted"),
                onError: () =>
                  toast.error("Couldn't delete the post — try again."),
              });
            }}
            className="gap-2 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
          >
            <Trash2 size={14} />
            Delete post
          </DropdownMenuItem>
        ) : (
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
