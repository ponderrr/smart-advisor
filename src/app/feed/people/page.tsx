"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import { motion } from "motion/react";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useFeedStore } from "@/features/feed/store";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import { FollowButton } from "@/features/feed/components/follow-button";

/**
 * Add-friends / discover-people page. Web port of the mobile
 * /feed/people screen (d373086).
 *
 * No backend — "suggested" people are the distinct post authors from
 * the in-memory feed store, minus yourself and anyone already
 * followed. Typing a handle that isn't in the suggested list reveals
 * an "Add @handle" affordance that follows that arbitrary username,
 * consistent with the prototype mock model.
 */
const PeoplePage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [query, setQuery] = useState("");

  // Hand-pick the slices we need so a comment vote or save doesn't
  // re-render the discovery list.
  const posts = useFeedStore((s) => s.posts);
  const following = useFeedStore((s) => s.following);
  const toggleFollow = useFeedStore((s) => s.toggleFollow);

  const suggested = useMemo(() => {
    const distinct = new Set<string>();
    for (const p of posts) {
      if (p.author && p.author !== "you" && !following.has(p.author)) {
        distinct.add(p.author);
      }
    }
    const all = Array.from(distinct).sort();
    const q = query.trim().toLowerCase();
    if (q.length === 0) return all;
    return all.filter((name) => name.toLowerCase().includes(q));
  }, [posts, following, query]);

  // Arbitrary-handle add: when the user types a handle that isn't in
  // the suggested list and isn't already followed (and isn't "you"),
  // offer a one-tap follow.
  const arbitraryHandle = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return null;
    if (q === "you") return null;
    if (following.has(q)) return null;
    if (suggested.some((s) => s.toLowerCase() === q)) return null;
    return q;
  }, [query, following, suggested]);

  if (!ready) {
    return <PageLoader text="Loading…" />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-[760px]">
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={15} />
            Back to feed
          </button>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
            Discover
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl">
            Add friends
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            People from your feed — follows are saved on this device
            until a backend lands.
          </p>

          <div className="relative mt-8">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username"
              autoFocus
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>

          {arbitraryHandle && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => toggleFollow(arbitraryHandle)}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-4 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/60 dark:to-violet-500/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <UserPlus size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black tracking-tight">
                  Add @{arbitraryHandle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow this handle even though they're not in your feed yet.
                </p>
              </div>
            </motion.button>
          )}

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Suggested
          </p>
          {suggested.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              {query.trim().length === 0
                ? "Nobody in your feed yet. Posts you read here will surface their authors."
                : "No matches. Try a different handle, or use Add @handle above."}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-900/60">
              {suggested.map((handle) => (
                <li
                  key={handle}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <FeedAvatar name={handle} size={36} />
                  <button
                    type="button"
                    onClick={() => router.push(`/feed/u/${handle}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-black tracking-tight">
                      @{handle}
                    </p>
                  </button>
                  <FollowButton author={handle} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default PeoplePage;
