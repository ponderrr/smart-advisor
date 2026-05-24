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
  Flag,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import {
  useCreateComment,
  useDeleteComment,
  useMyCommentVotes,
  useMyPostVotes,
  useReactions,
  useSaved,
  useSetCommentVote,
  useSetPostVote,
  useToggleSave,
  useUpdateComment,
  useVisibleFeed,
} from "@/features/feed/use-feed";
import { FollowButton } from "@/features/feed/components/follow-button";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import { BlockMenuButton } from "@/features/feed/components/block-menu";
import { MentionText } from "@/features/feed/mention-text";
import { PostMenuButton } from "@/features/feed/components/post-menu";
import { ReactionBar } from "@/features/feed/reaction-bar";
import type { ReactionAggregates } from "@/features/feed/feed-service";
import { useFeedPrefs } from "@/features/feed/use-feed-prefs";
import {
  activityLabel,
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
  reactions,
}: {
  node: FeedCommentNode;
  postId: string;
  depth: number;
  reactions: ReactionAggregates;
}) {
  const router = useRouter();
  const setCommentVote = useSetCommentVote();
  const { data: myVotes } = useMyCommentVotes();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();
  const { user } = useAuth();
  const isOwnComment =
    node.authorId != null && node.authorId === user?.id;
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  // Edit state — only own comments can enter this branch.
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(node.body);

  const vote = (myVotes ?? {})[node.id] ?? 0;
  const replyCount = node.replies.reduce(
    (n, r) => n + 1 + countDescendants(r),
    0,
  );

  const submitReply = () => {
    if (!draft.trim() || createComment.isPending) return;
    createComment.mutate(
      { postId, body: draft.trim(), parentId: node.id },
      {
        onSuccess: () => {
          setDraft("");
          setReplying(false);
          toast.success("Reply added");
        },
        onError: () => toast.error("Couldn't post your reply."),
      },
    );
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
          <FeedAvatar
            name={node.author}
            url={node.authorAvatarUrl ?? undefined}
            size={22}
          />
          <Link
            href={`/feed/u/${node.authorId ?? ""}`}
            className="font-extrabold text-slate-800 hover:underline dark:text-slate-100"
          >
            {node.author}
          </Link>
          <span className="text-slate-400">
            {agoLabel(node.ageHours)}
            {node.edited && (
              <span className="ml-1 italic">· edited</span>
            )}
          </span>
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
              onClick={() =>
                setCommentVote.mutate({
                  commentId: node.id,
                  dir: vote === 1 ? 0 : 1,
                })
              }
              className={cn(
                "transition-colors",
                vote === 1 ? "text-violet-600 dark:text-violet-300" : "text-slate-400",
              )}
            >
              <ChevronUp size={16} />
            </button>
            <span className="min-w-5 text-center text-[11px] font-bold text-slate-500">
              {node.score}
            </span>
            <button
              type="button"
              aria-label="Downvote"
              onClick={() =>
                setCommentVote.mutate({
                  commentId: node.id,
                  dir: vote === -1 ? 0 : -1,
                })
              }
              className={cn(
                "transition-colors",
                vote === -1 ? "text-rose-500" : "text-slate-400",
              )}
            >
              <ChevronDown size={16} />
            </button>
            <BlockMenuButton
              authorId={node.authorId}
              author={node.author}
              size={14}
            />
          </div>
        </div>

        {!collapsed && editing && (
          <div className="mt-1.5 space-y-2">
            <textarea
              autoFocus
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={
                  !editDraft.trim() ||
                  editDraft.trim() === node.body ||
                  updateComment.isPending
                }
                onClick={() =>
                  updateComment.mutate(
                    { commentId: node.id, body: editDraft.trim() },
                    {
                      onSuccess: () => {
                        setEditing(false);
                        toast.success("Comment updated");
                      },
                      onError: () =>
                        toast.error("Couldn't update the comment."),
                    },
                  )
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditDraft(node.body);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!collapsed && !editing && (
          <>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
              <MentionText body={node.body} />
            </p>
            <ReactionBar
              targetKind="comment"
              targetId={node.id}
              counts={reactions.counts[node.id] ?? {}}
              mine={reactions.mine[node.id] ?? null}
            />
            <button
              type="button"
              onClick={() => setReplying((r) => !r)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-violet-600 dark:hover:text-violet-300"
            >
              <CornerDownRight size={12} /> Reply
            </button>
            {isOwnComment ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditDraft(node.body);
                    setEditing(true);
                  }}
                  className="ml-3 mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-violet-600 dark:hover:text-violet-300"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this comment? Any replies under it are removed too.",
                      )
                    ) {
                      return;
                    }
                    deleteComment.mutate(node.id, {
                      onSuccess: () => toast.success("Comment deleted"),
                      onError: () =>
                        toast.error("Couldn't delete the comment."),
                    });
                  }}
                  className="ml-3 mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-300"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // Carry the comment author through so the report page
                  // can offer an "Also block @author" toggle without
                  // re-fetching.
                  const qs = new URLSearchParams({
                    commentId: node.id,
                    ...(node.authorId ? { authorId: node.authorId } : {}),
                    ...(node.author ? { author: node.author } : {}),
                  }).toString();
                  router.push(`/feed/report?${qs}`);
                }}
                className="ml-3 mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-600 dark:hover:text-amber-300"
              >
                <Flag size={12} /> Report
              </button>
            )}

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
                reactions={reactions}
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

  // Use the block-filtered list so a blocked author's deep-link reads
  // as "not available" instead of revealing the post anyway.
  const { posts: visiblePosts, isLoading: feedLoading } = useVisibleFeed();
  const post = useMemo(
    () => visiblePosts.find((p) => p.id === postId),
    [visiblePosts, postId],
  );
  const { data: savedIds } = useSaved();
  const saved = post ? (savedIds ?? []).includes(post.id) : false;
  const toggleSave = useToggleSave();
  const setPostVote = useSetPostVote();
  const { data: myPostVotes } = useMyPostVotes();
  const postVote = post ? (myPostVotes ?? {})[post.id] ?? 0 : 0;
  const createComment = useCreateComment();
  const [draft, setDraft] = useState("");
  const [{ commentSort }] = useFeedPrefs();

  const tree = useMemo(
    () => (post ? buildCommentTree(post.comments, commentSort) : []),
    [post, commentSort],
  );

  // Single batched reactions query for the post + every comment on
  // the page — collapses into one round-trip per kind so adding a
  // hundred-comment thread stays cheap.
  const commentIds = useMemo(
    () => (post ? post.comments.map((c) => c.id) : []),
    [post],
  );
  const { data: reactions } = useReactions({
    postIds: post ? [post.id] : [],
    commentIds,
  });
  const reactionsView: ReactionAggregates = reactions ?? {
    counts: {},
    mine: {},
  };

  if (!ready) return <PageLoader text="Loading" />;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );

  if (feedLoading) {
    return shell(
      <div className="py-16 text-center text-sm text-slate-400">
        Loading…
      </div>,
    );
  }

  if (!post) {
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
          <button
            type="button"
            onClick={() => router.push(`/feed?community=${post.community}`)}
            className={cn(
              "cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-black transition-transform hover:scale-105",
              t.iconCircle,
            )}
          >
            {COMMUNITY_TAG[post.community]}
          </button>
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
            href={`/feed/u/${post.authorId ?? ""}`}
            className="group/author flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"
          >
            <FeedAvatar
              name={post.author}
              url={post.authorAvatarUrl ?? undefined}
              size={28}
            />
            <span className="group-hover/author:underline">{post.author}</span>
          </Link>
          <span>
            {activityLabel(post)} · {agoLabel(post.ageHours)}
          </span>
          <FollowButton
            authorId={post.authorId}
            authorName={post.author}
            size="sm"
            className="ml-1"
          />
          <span className="ml-auto">
            <PostMenuButton
              postId={post.id}
              postTitle={post.title}
              authorId={post.authorId}
              author={post.author}
              onEdit={() => router.push(`/feed?edit=${post.id}`)}
            />
          </span>
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
            <MentionText body={post.body} />
          </p>
        )}

        <ReactionBar
          targetKind="post"
          targetId={post.id}
          counts={reactionsView.counts[post.id] ?? {}}
          mine={reactionsView.mine[post.id] ?? null}
        />

        <div className="mt-4 flex items-center gap-4 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              aria-label="Upvote"
              onClick={() =>
                setPostVote.mutate({
                  postId: post.id,
                  dir: postVote === 1 ? 0 : 1,
                })
              }
              className={cn(
                "transition-colors",
                postVote === 1
                  ? "text-violet-600 dark:text-violet-300"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
              )}
            >
              <ChevronUp size={18} />
            </button>
            <span className="min-w-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
              {post.score}
            </span>
            <button
              type="button"
              aria-label="Downvote"
              onClick={() =>
                setPostVote.mutate({
                  postId: post.id,
                  dir: postVote === -1 ? 0 : -1,
                })
              }
              className={cn(
                "transition-colors",
                postVote === -1
                  ? "text-rose-500"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
              )}
            >
              <ChevronDown size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              toggleSave.mutate(post.id, {
                onSuccess: (now) =>
                  now
                    ? toast.success(
                        `"${post.title}" saved to your library`,
                      )
                    : toast.message("Removed from your library"),
              })
            }
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
          disabled={!draft.trim() || createComment.isPending}
          onClick={() =>
            createComment.mutate(
              { postId: post.id, body: draft.trim(), parentId: null },
              {
                onSuccess: () => {
                  setDraft("");
                  toast.success("Comment added");
                },
                onError: () => toast.error("Couldn't post your comment."),
              },
            )
          }
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
              reactions={reactionsView}
            />
          ))
        )}
      </div>
    </>,
  );
}
