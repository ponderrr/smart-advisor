"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useFeed, useFollowing } from "@/features/feed/use-feed";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";
import { FollowButton } from "@/features/feed/components/follow-button";

interface SuggestedProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Add-friends / discover-people page. "Suggested" people are the distinct
 * authors who've posted in the feed, minus yourself and anyone you
 * already follow. Search filters the list by display name.
 */
const PeoplePage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const { data: posts, isLoading } = useFeed();
  const { data: followingIds } = useFollowing();

  const suggested = useMemo<SuggestedProfile[]>(() => {
    const followed = new Set(followingIds ?? []);
    const seen = new Map<string, SuggestedProfile>();
    for (const p of posts ?? []) {
      if (
        p.authorId &&
        p.authorId !== user?.id &&
        !followed.has(p.authorId) &&
        !seen.has(p.authorId)
      ) {
        seen.set(p.authorId, {
          id: p.authorId,
          name: p.author,
          avatarUrl: p.authorAvatarUrl ?? null,
        });
      }
    }
    const all = [...seen.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const q = query.trim().toLowerCase();
    return q.length === 0
      ? all
      : all.filter((p) => p.name.toLowerCase().includes(q));
  }, [posts, followingIds, user?.id, query]);

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
            People who&apos;ve shared picks in your feed.
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
              placeholder="Search by name"
              autoFocus
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Suggested
          </p>
          {isLoading ? (
            <div className="mt-3 px-4 py-10 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : suggested.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              {query.trim().length === 0
                ? "Nobody in your feed yet. Posts you read here will surface their authors."
                : "No matches for that name."}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-900/60">
              {suggested.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <FeedAvatar
                    name={profile.name}
                    url={profile.avatarUrl ?? undefined}
                    size={36}
                  />
                  <button
                    type="button"
                    onClick={() => router.push(`/feed/u/${profile.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-black tracking-tight">
                      {profile.name}
                    </p>
                  </button>
                  <FollowButton
                    authorId={profile.id}
                    authorName={profile.name}
                    size="sm"
                  />
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
