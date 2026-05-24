"use client";

import {
  CornerDownRight,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  UserPlus,
} from "lucide-react";

import { useMutedKinds } from "@/features/notifications/use-muted-kinds";

import { SectionCard, SectionHeader } from "./settings-ui";

type Row = {
  kind: string;
  title: string;
  description: string;
  Icon: typeof UserPlus;
};

/** Per-kind notification toggles. One row per feed_notification_kind
 *  enum value. Muted kinds are filtered out at useNotifications, so
 *  the bell badge + the inbox dropdown stay in lockstep with these
 *  switches without any additional wiring. */
const ROWS: Row[] = [
  {
    kind: "follow",
    title: "New followers",
    description: "When someone follows you.",
    Icon: UserPlus,
  },
  {
    kind: "friend_post",
    title: "Posts from friends",
    description: "When someone you follow shares something new.",
    Icon: MessageCircle,
  },
  {
    kind: "comment_on_post",
    title: "Comments on your posts",
    description: "When someone comments on a post you wrote.",
    Icon: MessageSquare,
  },
  {
    kind: "reply_to_comment",
    title: "Replies to your comments",
    description: "When someone replies to a comment you left.",
    Icon: CornerDownRight,
  },
  {
    kind: "post_upvote",
    title: "Upvotes on your posts",
    description: "When someone upvotes a post you wrote.",
    Icon: ThumbsUp,
  },
  {
    kind: "comment_upvote",
    title: "Upvotes on your comments",
    description: "When someone upvotes a comment you left.",
    Icon: ThumbsUp,
  },
];

export function ActivityNotificationsCard() {
  const { muted, setMuted } = useMutedKinds();
  return (
    <SectionCard>
      <SectionHeader
        title="Activity"
        description="What other people do — pick which of these show up in your inbox and the bell badge."
      />
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {ROWS.map(({ kind, title, description, Icon }) => {
          const on = !muted.has(kind);
          const id = `notif-${kind}`;
          return (
            <li
              key={kind}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <Icon
                size={18}
                className="shrink-0 text-slate-500 dark:text-slate-400"
                aria-hidden
              />
              <label
                htmlFor={id}
                className="flex-1 cursor-pointer select-none"
              >
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </span>
              </label>
              <input
                id={id}
                type="checkbox"
                role="switch"
                checked={on}
                onChange={(e) => setMuted(kind, !e.target.checked)}
                aria-label={title}
                className="h-5 w-5 accent-indigo-500"
              />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
