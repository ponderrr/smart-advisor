"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Bell,
  MessageCircle,
  CornerDownRight,
  Heart,
  MessageSquare,
  ThumbsUp,
  Trash2,
  UserPlus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "@/features/feed/use-feed";
import type { FeedNotification } from "@/features/feed/feed-service";
import { cn } from "@/lib/utils";

/** Per-kind icon + accent. Keep these in sync with the mobile inbox
 *  cards (apps/mobile/lib/features/notifications/notifications_screen.dart)
 *  so the same kinds read the same way on both clients. */
function kindStyle(kind: string): { Icon: typeof Bell; color: string } {
  switch (kind) {
    case "follow":
      return { Icon: UserPlus, color: "text-indigo-500" };
    case "comment_on_post":
      return { Icon: MessageSquare, color: "text-violet-500" };
    case "reply_to_comment":
      return { Icon: CornerDownRight, color: "text-violet-500" };
    case "friend_post":
      return { Icon: MessageCircle, color: "text-emerald-500" };
    case "post_upvote":
    case "comment_upvote":
      return { Icon: ThumbsUp, color: "text-amber-500" };
    default:
      return { Icon: Heart, color: "text-slate-500" };
  }
}

function titleFor(n: FeedNotification): string {
  switch (n.kind) {
    case "follow":
      return `${n.actorName} started following you`;
    case "comment_on_post":
      return `${n.actorName} commented on your post`;
    case "reply_to_comment":
      return `${n.actorName} replied to your comment`;
    case "friend_post":
      return `${n.actorName} shared a new post`;
    case "post_upvote":
      return `${n.actorName} upvoted your post`;
    case "comment_upvote":
      return `${n.actorName} upvoted your comment`;
    default:
      return `${n.actorName} interacted with you`;
  }
}

function subtitleFor(n: FeedNotification): string | null {
  const body = (n.commentBody ?? "").trim();
  const title = (n.postTitle ?? "").trim();
  if (body) return `“${body}”`;
  if (title) return title;
  return null;
}

function routeFor(n: FeedNotification): string | null {
  if (n.postId) return `/feed/${n.postId}`;
  if (n.kind === "follow" && n.actorId) return `/feed/u/${n.actorId}`;
  return null;
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 365)}y ago`;
}

/** Navbar bell — opens an inbox dropdown of `feed_notifications`. Reads
 *  the live React Query cache (which the rest of the feed already
 *  populates) so opening the panel is instant. Marks everything read
 *  the first time the panel opens with anything unread, so the badge
 *  clears as soon as the user acknowledges. */
export function NotificationsBell() {
  const router = useRouter();
  const { data: items = [] } = useNotifications();
  const unread = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) markAllRead.mutate();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Notifications
          </p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => clearAll.mutate()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Bell
                size={28}
                className="text-slate-300 dark:text-slate-600"
                aria-hidden
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You&rsquo;re all caught up.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((n) => {
                const { Icon, color } = kindStyle(n.kind);
                const subtitle = subtitleFor(n);
                const route = routeFor(n);
                const isClickable = route !== null;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-3 px-3 py-3 transition-colors",
                      isClickable &&
                        "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40",
                      n.readAt === null && "bg-indigo-500/[0.04]",
                    )}
                    onClick={() => {
                      if (!isClickable) return;
                      if (n.readAt === null) markRead.mutate(n.id);
                      router.push(route!);
                    }}
                  >
                    <div className="relative h-9 w-9 shrink-0">
                      {n.actorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={n.actorAvatarUrl}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                          {(n.actorName[0] ?? "?").toUpperCase()}
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900",
                          "bg-white dark:bg-slate-900",
                        )}
                      >
                        <Icon
                          size={10}
                          className={color}
                          aria-hidden
                        />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {titleFor(n)}
                      </p>
                      {subtitle && (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {subtitle}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {ago(n.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOne.mutate(n.id);
                      }}
                      className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 group-hover:flex dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Optional helper for layouts that want to refresh the bell on a
 *  client-side event (e.g. after a comment post). Returns a stable
 *  refresh callback. */
export function useNotificationsRefresher() {
  const { refetch } = useNotifications();
  useEffect(() => {
    // No-op effect to make this a hook; refetch is exposed below.
  }, []);
  return refetch;
}
