"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Film,
  Heart,
  Music,
  Sparkles,
} from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import { cn } from "@/lib/utils";

/** Shape of the recommendation rows we pull for the public share view. */
export interface SharedRec {
  id: string;
  type: "movie" | "book" | "music";
  title: string;
  director: string | null;
  author: string | null;
  artist: string | null;
  year: number | null;
  genres: string[] | null;
  poster_url: string | null;
  is_favorited: boolean;
  created_at: string;
}

interface WrappedShareViewProps {
  year: number;
  displayName: string | null;
  recs: SharedRec[];
}

export const WrappedShareView = ({
  year,
  displayName,
  recs,
}: WrappedShareViewProps) => {
  const movies = recs.filter((r) => r.type === "movie").length;
  const books = recs.filter((r) => r.type === "book").length;
  const music = recs.filter((r) => r.type === "music").length;
  const favorites = recs.filter((r) => r.is_favorited).length;
  const watchHours = Math.round((movies * 110) / 60);

  const genreCounts = new Map<string, number>();
  recs.forEach((r) => {
    (r.genres ?? []).forEach((g) => {
      const k = g.trim();
      if (!k) return;
      genreCounts.set(k, (genreCounts.get(k) ?? 0) + 1);
    });
  });
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const creatorCounts = new Map<
    string,
    { name: string; type: "director" | "author" | "artist"; count: number }
  >();
  recs.forEach((r) => {
    const name = r.director || r.author || r.artist;
    if (!name) return;
    const role: "director" | "author" | "artist" = r.director
      ? "director"
      : r.author
        ? "author"
        : "artist";
    const key = `${role}::${name.toLowerCase()}`;
    const cur = creatorCounts.get(key) ?? { name, type: role, count: 0 };
    cur.count += 1;
    creatorCounts.set(key, cur);
  });
  const topCreator =
    [...creatorCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null;

  // Favorites first, newest first inside that. Same order the owner sees
  // on /wrapped so a share never feels like a different shortlist.
  const topPicks = [...recs]
    .sort((a, b) => {
      if (a.is_favorited === b.is_favorited) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return a.is_favorited ? -1 : 1;
    })
    .slice(0, 6);

  const possessive = displayName
    ? `${displayName}${displayName.endsWith("s") ? "’" : "’s"}`
    : "A reader’s";
  const isEmpty = recs.length === 0;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-50/60 via-transparent to-amber-50/60 dark:from-violet-500/10 dark:via-transparent dark:to-amber-500/10"
        aria-hidden
      />

      <header className="flex h-[72px] items-center px-4 sm:px-6 md:px-12">
        <Link
          href="/"
          className="inline-flex items-center transition-opacity duration-200 hover:opacity-80"
        >
          <BrandWordmark imageClassName="h-11" />
        </Link>
      </header>

      <main className="px-4 pb-20 pt-2 sm:px-6 sm:pt-6">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-xs">
              Year in Review
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              {possessive}{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                {year}
              </span>
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
              A look at what Smart Advisor picked for them this year.
            </p>
          </div>

          {isEmpty ? (
            <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
              <p className="text-sm font-bold tracking-tight">
                No picks logged for {year} yet.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Check back later or take your own quiz below.
              </p>
            </div>
          ) : (
            <>
              {/* Stat grid */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <StatCard
                  icon={<Sparkles size={14} />}
                  label="Total picks"
                  value={recs.length}
                />
                <StatCard
                  icon={<Film size={14} />}
                  label="Movies"
                  value={movies}
                  hint={watchHours > 0 ? `~${watchHours}h` : null}
                  accent="amber"
                />
                <StatCard
                  icon={<BookOpen size={14} />}
                  label="Books"
                  value={books}
                  accent="emerald"
                />
                <StatCard
                  icon={<Music size={14} />}
                  label="Albums"
                  value={music}
                  accent="rose"
                />
              </div>

              {/* Favorites + top creator chip row */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                {favorites > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    <Heart size={12} className="fill-current" />
                    {favorites} favorited
                  </span>
                )}
                {topCreator && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 font-bold text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
                    Most picked {topCreator.type}: {topCreator.name}
                  </span>
                )}
              </div>

              {/* Top genres */}
              {topGenres.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Top genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topGenres.map(([g, count]) => (
                      <span
                        key={g}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {g}
                        <span className="text-slate-400 dark:text-slate-500">
                          · {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top picks */}
              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-xs">
                  Standout picks
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {topPicks.map((p) => (
                    <SharedPickCard key={p.id} rec={p} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer CTA */}
          <div className="mt-12 rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-center shadow-sm backdrop-blur-md sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Curated with Smart Advisor
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
              Make your own picks.
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Take a two-minute quiz and get personalized movie, book, and
              album recommendations.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-900"
            >
              Try Smart Advisor
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

/* -------------------- Stat card -------------------- */

const STAT_ACCENTS: Record<
  "neutral" | "amber" | "emerald" | "rose",
  { iconBg: string; iconText: string }
> = {
  neutral: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconText: "text-slate-500 dark:text-slate-400",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-300",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-500/15",
    iconText: "text-rose-600 dark:text-rose-300",
  },
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
  accent = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string | null;
  accent?: "neutral" | "amber" | "emerald" | "rose";
}) => {
  const a = STAT_ACCENTS[accent];
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            a.iconBg,
            a.iconText,
          )}
        >
          {icon}
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="-mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

/* -------------------- Pick card -------------------- */

const SharedPickCard = ({ rec }: { rec: SharedRec }) => {
  const Icon = rec.type === "movie" ? Film : rec.type === "book" ? BookOpen : Music;
  const creator = rec.director || rec.author || rec.artist || null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
      <div
        className={cn(
          "relative bg-slate-200 dark:bg-slate-800",
          rec.type === "music" ? "aspect-square" : "aspect-[2/3]",
        )}
      >
        {rec.poster_url ? (
          <img
            src={rec.poster_url}
            alt={rec.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Icon size={28} />
          </div>
        )}
        {rec.is_favorited && (
          <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
            <Heart size={12} className="fill-current" />
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-black tracking-tight">
          {rec.title}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {creator ?? rec.type}
          {rec.year ? ` · ${rec.year}` : ""}
        </p>
      </div>
    </div>
  );
};
