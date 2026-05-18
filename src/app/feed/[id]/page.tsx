"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { useFeedStore } from "@/features/feed/store";
import { FollowButton } from "@/features/feed/components/follow-button";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import { useFeedPrefs } from "@/features/feed/use-feed-prefs";
import {
  ACTIVITY_VERB,
  COMMUNITY_CONTENT,
  COMMUNITY_TAG,
  agoLabel,
  buildCommentTree,
  type FeedCommentNode,
} from "@/features/feed/types";

/* ─── A single threaded comment + its replies ───────────────────────── */

function CommentNode({
  node,
  postId,
  depth,
}: {
  node: FeedCommentNode;
  postId: string;
  depth: number;
}) {
  const setCommentVote = useFeedStore((s) => s.setCommentVote);
  const commentVotes = useFeedStore((s) => s.commentVotes);
  const addComment = useFeedStore((s) => s.addComment);
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");

  const key = `${postId}#${node.id}`;
  const vote = commentVotes[key] ?? 0;
  const replyCount = node.replies.reduce(
    (n, r) => n + 1 + countDescendants(r),
    0,
  );

  const submitReply = () => {
    if (!draft.trim()) return;
    addComment(postId, draft.trim(), node.id);
    setDraft("");
    setReplying(false);
    toast.success("Reply added");
  };

  return (
    <div className={cn(depth > 0 && "ml-3 sm:ml-4")}>
      <div
        className={cn(
          "rounded-2xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/55",
        )}
      >
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={collapsed ? "Expand thread" : "Collapse thread"}
          >
            [{collapsed ? "+" : "−"}]
          </button>
          <FeedAvatar name={node.author} size={22} />
          <Link
            href={`/feed/u/${encodeURIComponent(node.author)}`}
            className="font-extrabold text-slate-800 hover:underline dark:text-slate-100"
          >
            {node.author}
          </Link>
          <span className="text-slate-400">{agoLabel(node.ageHours)}</span>
          {collapsed && replyCount > 0 && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              · {replyCount} more
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Upvote"
              onClick={() => setCommentVote(key, 1)}
              className={cn(
                "transition-colors",
                vote === 1 ? "text-violet-600 dark:text-violet-300" : "text-slate-400",
              )}
            >
              <ChevronUp size={16} />
            </button>
            <span className="min-w-5 text-center text-[11px] font-bold text-slate-500">
              {node.score + vote}
            </span>
            <button
              type="button"
              aria-label="Downvote"
              onClick={() => setCommentVote(key, -1)}
              className={cn(
                "transition-colors",
                vote === -1 ? "text-rose-500" : "text-slate-400",
              )}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
              {node.body}
            </p>
            <button
              type="button"
              onClick={() => setReplying((r) => !r)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-violet-600 dark:hover:text-violet-300"
            >
              <CornerDownRight size={12} /> Reply
            </button>

            {replying && (
              <div className="mt-2 space-y-2">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder={`Reply to ${node.author}…`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!draft.trim()} onClick={submitReply}>
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplying(false);
                      setDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!collapsed && node.replies.length > 0 && (
        <div className="mt-2 flex">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse thread"
            className="group flex w-4 shrink-0 justify-center sm:w-5"
          >
            <span className="h-full w-0.5 rounded bg-slate-200/70 transition-colors group-hover:bg-violet-400 dark:bg-slate-700/60 dark:group-hover:bg-violet-500" />
          </button>
          <div className="flex-1 space-y-2">
            {node.replies.map((child) => (
              <CommentNode
                key={child.id}
                node={child}
                postId={postId}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function countDescendants(n: FeedCommentNode): number {
  return n.replies.reduce((acc, r) => acc + 1 + countDescendants(r), 0);
}

/* ─── Thread page ───────────────────────────────────────────────────── */

export default function FeedThreadPage() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id ?? "";

  const post = useFeedStore((s) => s.posts.find((p) => p.id === postId));
  const saved = useFeedStore((s) => (post ? s.saved.has(post.id) : false));
  const toggleSave = useFeedStore((s) => s.toggleSave);
  const addComment = useFeedStore((s) => s.addComment);
  const [draft, setDraft] = useState("");
  const [{ commentSort }] = useFeedPrefs();

  const tree = useMemo(
    () => (post ? buildCommentTree(post.comments, commentSort) : []),
    [post, commentSort],
  );

  if (!ready) return <PageLoader text="Loading" />;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );

  if (!post) {
    // The feed store is in-memory — a cold-loaded deep link has no data yet.
    return shell(
      <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-16 text-center backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/50">
        <h1 className="text-2xl font-black tracking-tight">
          This post isn&apos;t available
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          It may have been removed, or you opened the link directly before the
          feed loaded.
        </p>
        <Link
          href="/feed"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold tracking-tight text-white transition-colors hover:bg-violet-500"
        >
          Back to feed
        </Link>
      </div>,
    );
  }

  const t = getAccentTone(COMMUNITY_CONTENT[post.community]);

  return shell(
    <>
      <button
        type="button"
        onClick={() => router.push("/feed")}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-x-0.5 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200"
      >
        <ArrowLeft size={14} /> Back to feed
      </button>

      {/* Post */}
      <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-black",
              t.iconCircle,
            )}
          >
            {COMMUNITY_TAG[post.community]}
          </span>
          {post.tasteMatch > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black",
                t.iconCircle,
              )}
            >
              {post.tasteMatch}% your taste
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href={`/feed/u/${encodeURIComponent(post.author)}`}
            className="group/author flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"
          >
            <FeedAvatar name={post.author} size={28} />
            <span className="group-hover/author:underline">{post.author}</span>
          </Link>
          <span>
            {ACTIVITY_VERB[post.activity]} · {agoLabel(post.ageHours)}
          </span>
          <FollowButton author={post.author} size="sm" className="ml-1" />
        </div>

        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {post.title}
        </h1>

        {post.posterUrl && (
          <div className="mt-3 flex items-start gap-3">
            <Image
              src={post.posterUrl}
              alt=""
              width={64}
              height={post.community === "music" ? 64 : 96}
              unoptimized
              className="rounded-md object-cover"
            />
            {post.creator && (
              <p className="pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {post.creator}
                {post.year ? ` · ${post.year}` : ""}
              </p>
            )}
          </div>
        )}

        {post.body && (
          <p className="mt-3 text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
            {post.body}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              const now = toggleSave(post.id);
              if (now) toast.success(`"${post.title}" saved to your library`);
              else toast.message("Removed from your library");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold transition-transform hover:scale-105",
              saved ? t.text : "text-slate-400 dark:text-slate-500",
            )}
          >
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {saved ? "Saved" : "Save"}
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            <MessageCircle size={16} />
            {post.comments.length} comments
          </span>
        </div>
      </article>

      {/* Add a top-level comment */}
      <div className="mt-5 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add to the discussion…"
          className="w-full rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/55"
        />
        <Button
          disabled={!draft.trim()}
          onClick={() => {
            addComment(post.id, draft.trim(), null);
            setDraft("");
            toast.success("Comment added");
          }}
        >
          Comment
        </Button>
      </div>

      {/* Thread */}
      <div className="mt-6 space-y-3">
        {tree.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No comments yet — start the thread.
          </p>
        ) : (
          tree.map((node) => (
            <CommentNode
              key={node.id}
              node={node}
              postId={post.id}
              depth={0}
            />
          ))
        )}
      </div>
    </>,
  );
}
