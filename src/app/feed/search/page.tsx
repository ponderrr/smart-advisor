"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import {
  useSearchPosts,
  useSearchProfiles,
} from "@/features/feed/use-feed";
import { FeedAvatar } from "@/features/feed/components/feed-avatar";

/** Global search across people + picks. Two stacked sections — People
 *  first (avatar + name + @handle), then Picks (cover thumb + title +
 *  author). Empty / under-2-char queries render a hint card; results
 *  debounce ~250ms after the user stops typing so we don't spam
 *  ilike on every keystroke. Blocked users (either direction) are
 *  filtered out in the service. */
export default function FeedSearchPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");

  // Debounce: the input is the source of truth, [query] is what we
  // hand to react-query. Setting [query] directly on each keystroke
  // would queue an ilike per char.
  useEffect(() => {
    const id = setTimeout(() => setQuery(raw.trim()), 250);
    return () => clearTimeout(id);
  }, [raw]);

  const armed = query.length >= 2;
  const people = useSearchProfiles(query);
  const posts = useSearchPosts(query);
  const peopleList = people.data ?? [];
  const postList = posts.data ?? [];
  const loading = armed && (people.isLoading || posts.isLoading);
  const empty =
    armed && !loading && peopleList.length === 0 && postList.length === 0;

  if (!ready) return <PageLoader text="Loading…" />;

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
            Search
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl">
            Find people and picks
          </h1>

          <div className="relative mt-8">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Search people and picks…"
              autoFocus
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>

          {!armed ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              Type at least two characters to search.
            </div>
          ) : loading ? (
            <div className="mt-8 px-4 py-10 text-center text-sm text-slate-400">
              Searching…
            </div>
          ) : empty ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {peopleList.length > 0 && (
                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    People · {peopleList.length}
                  </p>
                  <ul className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-900/60">
                    {peopleList.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-3 sm:px-5"
                      >
                        <FeedAvatar
                          name={p.name}
                          url={p.avatarUrl ?? undefined}
                          size={36}
                        />
                        <button
                          type="button"
                          onClick={() => router.push(`/feed/u/${p.id}`)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-black tracking-tight">
                            {p.name}
                          </p>
                          {p.username && (
                            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              @{p.username}
                            </p>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {postList.length > 0 && (
                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Picks · {postList.length}
                  </p>
                  <ul className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-900/60">
                    {postList.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => router.push(`/feed/${p.id}`)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 sm:px-5 dark:hover:bg-slate-800/40"
                        >
                          {p.posterUrl ? (
                            <Image
                              src={p.posterUrl}
                              alt=""
                              width={36}
                              height={p.community === "music" ? 36 : 52}
                              unoptimized
                              className="shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-[52px] w-9 shrink-0 rounded-md bg-slate-200 dark:bg-slate-700" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black tracking-tight">
                              {p.title}
                            </p>
                            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {p.author}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
