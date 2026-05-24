"use client";

import { useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import {
  useMyFollowingProfiles,
  useSendPick,
} from "@/features/feed/use-feed";

/** "Send to a friend" — lightweight DM that reuses the feed_pick_sends
 *  table. Lists everyone the user follows, with an optional one-liner
 *  above; tap a row to send. Multi-select is intentionally NOT
 *  supported — a pick blasted to fifty people is spam, not a
 *  recommendation. */
export function SendPickDialog({
  open,
  onClose,
  postId,
  postTitle,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}) {
  const { data: following = [], isLoading } = useMyFollowingProfiles();
  const sendPick = useSendPick();
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return following;
    return following.filter((p) => p.name.toLowerCase().includes(q));
  }, [following, query]);

  const send = async (recipientId: string, recipientName: string) => {
    if (pending) return;
    setPending(recipientId);
    try {
      await sendPick.mutateAsync({
        postId,
        recipientId,
        message: message.trim() || undefined,
      });
      toast.success(`Sent to ${recipientName}`);
      // Reset state so the next "Send to a friend" open is clean.
      setMessage("");
      setQuery("");
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't send — try again.",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="md" ariaLabel="Send to a friend">
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
          Send to a friend
        </p>
        <h2 className="mt-1 line-clamp-2 text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
          {postTitle}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Tap a friend to send. They&apos;ll get a notification.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a one-liner (optional)…"
          rows={2}
          maxLength={280}
          className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-indigo-500"
        />

        {following.length >= 6 && (
          <div className="relative mt-3">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter your friends"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>
        )}

        <div className="mt-4 max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              Loading your friends…
            </p>
          ) : following.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              You&apos;re not following anyone yet. Add friends to send picks.
            </p>
          ) : visible.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 dark:divide-slate-700/60 dark:border-slate-700/60">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => send(p.id, p.name)}
                    disabled={pending !== null}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 disabled:opacity-50 sm:px-5 dark:hover:bg-slate-800/40"
                  >
                    <FeedAvatar
                      name={p.name}
                      url={p.avatarUrl ?? undefined}
                      size={36}
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-black tracking-tight">
                      {p.name}
                    </p>
                    <Send
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    {pending === p.id && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Sending…
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
