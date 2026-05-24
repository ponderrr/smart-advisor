"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Send,
  Share2,
  Flag,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { SendPickDialog } from "@/features/feed/send-pick-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useBlockUser,
  useDeletePost,
} from "@/features/feed/use-feed";
import { cn } from "@/lib/utils";

interface PostMenuButtonProps {
  postId: string;
  postTitle: string;
  /** Post author's profile id. */
  authorId?: string;
  /** Author display name — used in menu/confirm copy. */
  author: string;
  /** Picked "Edit post" — opens the composer in edit mode. Only shown on
   *  your own posts, and only when provided (surfaces without a composer
   *  omit it). */
  onEdit?: () => void;
  /** "media" flips the icon to white-on-scrim for poster overlays. */
  variant?: "default" | "media";
  size?: number;
  className?: string;
}

/** Shares a post: native share sheet when available, else copy the link. */
async function sharePost(postId: string, postTitle: string): Promise<void> {
  const url = `${window.location.origin}/feed/${postId}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: postTitle, url });
    } catch {
      // Sheet dismissed or share failed — nothing more to do.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Couldn't share this post.");
  }
}

/**
 * Three-dot overflow for a feed post. Own posts: Edit / Share / Delete.
 * Everyone else's: Share / Report / Block. Stops tap propagation so it
 * doesn't trigger the enclosing card's onClick.
 */
export function PostMenuButton({
  postId,
  postTitle,
  authorId,
  author,
  onEdit,
  variant = "default",
  size = 16,
  className,
}: PostMenuButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const blockUser = useBlockUser();
  const deletePost = useDeletePost();
  const [sendOpen, setSendOpen] = useState(false);

  if (!authorId) return null;
  const isOwn = authorId === user?.id;

  const buttonClasses =
    variant === "media"
      ? "text-white/90 hover:text-white drop-shadow-md"
      : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200";

  return (
    <>
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
        {isOwn && onEdit && (
          <DropdownMenuItem onSelect={() => onEdit()} className="gap-2">
            <Pencil size={14} />
            Edit post
          </DropdownMenuItem>
        )}

        {user && (
          <DropdownMenuItem
            onSelect={(e) => {
              // The Radix dropdown closes-then-fires onSelect; defer so the
              // dialog opens after the menu has unmounted (otherwise the
              // backdrop pointer-events race makes the dialog
              // un-clickable for a frame).
              e.preventDefault();
              setSendOpen(true);
            }}
            className="gap-2"
          >
            <Send size={14} />
            Send to a friend
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onSelect={() => void sharePost(postId, postTitle)}
          className="gap-2"
        >
          <Share2 size={14} />
          Share
        </DropdownMenuItem>

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
          <>
            <DropdownMenuItem
              onSelect={() => {
                const qs = new URLSearchParams({
                  postId,
                  ...(authorId ? { authorId } : {}),
                  ...(author ? { author } : {}),
                }).toString();
                router.push(`/feed/report?${qs}`);
              }}
              className="gap-2"
            >
              <Flag size={14} />
              Report post
            </DropdownMenuItem>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    <SendPickDialog
      open={sendOpen}
      onClose={() => setSendOpen(false)}
      postId={postId}
      postTitle={postTitle}
    />
    </>
  );
}
