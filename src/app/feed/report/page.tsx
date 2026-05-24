"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { toast } from "sonner";

import { AppNavbar } from "@/components/app-navbar";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import {
  useBlockUser,
  useReportComment,
  useReportPost,
} from "@/features/feed/use-feed";

/**
 * Dedicated report flow for a post or comment. Replaces the inline
 * `window.prompt` from the post / comment menus — gives the user a
 * reason taxonomy and an optional free-text note, matching how other
 * social apps handle reporting.
 *
 * Route: /feed/report?postId=…  or  /feed/report?commentId=…
 */
const REASONS = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate", label: "Hate speech or symbols" },
  { id: "violence", label: "Violence or threats" },
  { id: "sexual", label: "Sexual or explicit content" },
  { id: "misinformation", label: "False information" },
  { id: "other", label: "Something else" },
] as const;

type ReasonId = (typeof REASONS)[number]["id"];

function ReportPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready } = useRequireAuth();
  const { user } = useAuth();

  const postId = params.get("postId");
  const commentId = params.get("commentId");
  // Passed by post-menu / comment-menu so the form can offer a one-tap
  // block alongside the report. Optional — if missing we just hide the
  // toggle (and the toggle is also hidden when the target is yourself).
  const authorId = params.get("authorId");
  const author = params.get("author");
  const isPost = Boolean(postId);
  const isComment = Boolean(commentId);

  const [selected, setSelected] = useState<ReasonId | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);

  const reportPost = useReportPost();
  const reportComment = useReportComment();
  const blockUser = useBlockUser();
  const showBlockToggle =
    !!authorId && authorId.length > 0 && authorId !== user?.id;

  if (!ready) {
    return <PageLoader text="Loading…" />;
  }

  if (!isPost && !isComment) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AppNavbar />
        <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
          <div className="mx-auto w-full max-w-[560px]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nothing to report — open this page from the menu on a post or
              comment.
            </p>
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <ArrowLeft size={15} />
              Back to feed
            </button>
          </div>
        </main>
      </div>
    );
  }

  const title = isPost ? "Report this post" : "Report this comment";
  const busy = reportPost.isPending || reportComment.isPending;

  function handleSubmit() {
    if (!selected || busy) return;
    const trimmed = details.trim();
    const reason = trimmed.length === 0 ? selected : `${selected}: ${trimmed}`;
    const onSuccess = () => {
      // Block AFTER the report lands so a block failure (or a checked-but-self
      // edge case) doesn't swallow the report's success path.
      if (alsoBlock && authorId && authorId !== user?.id) {
        blockUser.mutate(authorId, {
          onSettled: () => {
            toast.success(
              author
                ? `Thanks — we'll take a look. Blocked @${author}.`
                : "Thanks — we'll take a look.",
            );
            router.back();
          },
        });
      } else {
        toast.success("Thanks — we'll take a look.");
        router.back();
      }
    };
    const onError = () =>
      toast.error("Couldn't send that report. Please try again.");
    if (isPost && postId) {
      reportPost.mutate({ postId, reason }, { onSuccess, onError });
    } else if (isComment && commentId) {
      reportComment.mutate({ commentId, reason }, { onSuccess, onError });
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-[560px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">
            <Flag size={11} /> Report
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Tell us why so our team can take a look.
          </p>

          <fieldset className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            <legend className="sr-only">Report reason</legend>
            {REASONS.map((r) => {
              const active = selected === r.id;
              return (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={active}
                    onChange={() => setSelected(r.id)}
                    className="h-4 w-4 accent-rose-500"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {r.label}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label
            htmlFor="report-details"
            className="mt-6 block text-sm font-black text-slate-800 dark:text-slate-100"
          >
            Add details (optional)
          </label>
          <textarea
            id="report-details"
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="A short note helps us prioritize."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-rose-900/40"
          />

          {showBlockToggle && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-rose-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                  {author ? `Also block @${author}` : "Also block this person"}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  You won&rsquo;t see their posts or comments anymore.
                </span>
              </span>
            </label>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || busy}
            className="mt-6 w-full bg-rose-500 text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300 dark:bg-rose-600 dark:hover:bg-rose-500 dark:disabled:bg-rose-900"
          >
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  // useSearchParams needs to live under a Suspense boundary in app router.
  return (
    <Suspense fallback={<PageLoader text="Loading…" />}>
      <ReportPageInner />
    </Suspense>
  );
}
