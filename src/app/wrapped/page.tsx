"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Film,
  Flame,
  Heart,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations, useMessages } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { databaseService } from "@/features/recommendations/services/database-service";
import { libraryService } from "@/features/library/services/library-service";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";

import { AppNavbar } from "@/components/app-navbar";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { PageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

const FALLBACK_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WrappedPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const t = useTranslations("Wrapped");
  const messages = useMessages() as { Wrapped?: { months?: string[] } };
  const monthLabels = messages.Wrapped?.months ?? FALLBACK_MONTHS;
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentYear = now.getFullYear();
  // In January we default to last year (the one that just ended); otherwise
  // we default to the current year.
  const defaultYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const [year, setYear] = useQueryState(
    "y",
    parseAsInteger.withDefault(defaultYear),
  );

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: recs }, { data: lib }] = await Promise.all([
        databaseService.getUserRecommendations({
          sortBy: "newest",
          limit: 5000,
        }),
        libraryService.list(),
      ]);
      if (cancelled) return;
      setRecommendations(recs);
      setLibraryItems(lib);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // Years that have at least one pick
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    recommendations.forEach((r) =>
      set.add(new Date(r.created_at).getFullYear()),
    );
    libraryItems.forEach((i) => set.add(new Date(i.logged_at).getFullYear()));
    if (set.size === 0) set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [recommendations, libraryItems, currentYear]);

  const yearRecs = useMemo(
    () =>
      recommendations.filter(
        (r) => new Date(r.created_at).getFullYear() === year,
      ),
    [recommendations, year],
  );

  const yearLibrary = useMemo(
    () =>
      libraryItems.filter(
        (i) => new Date(i.logged_at).getFullYear() === year,
      ),
    [libraryItems, year],
  );

  const stats = useMemo(() => {
    const movies = yearRecs.filter((r) => r.type === "movie").length;
    const books = yearRecs.filter((r) => r.type === "book").length;
    const favorites = yearRecs.filter((r) => r.is_favorited).length;

    // Watch-time estimate (avg movie ~110 min)
    const estMovieMinutes = movies * 110;
    const watchHours = Math.round(estMovieMinutes / 60);

    // Genre tally
    const genreCounts = new Map<string, number>();
    yearRecs.forEach((r) => {
      (r.genres ?? []).forEach((g) => {
        const k = g.trim();
        if (!k) return;
        genreCounts.set(k, (genreCounts.get(k) ?? 0) + 1);
      });
    });
    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Top creator (combined director/author)
    const creatorCounts = new Map<
      string,
      { name: string; type: "director" | "author"; count: number }
    >();
    yearRecs.forEach((r) => {
      const name = r.director || r.author;
      if (!name) return;
      const role: "director" | "author" = r.director ? "director" : "author";
      const key = `${role}::${name.toLowerCase()}`;
      const cur = creatorCounts.get(key) ?? { name, type: role, count: 0 };
      cur.count += 1;
      creatorCounts.set(key, cur);
    });
    const topCreator =
      [...creatorCounts.values()].sort((a, b) => b.count - a.count)[0] ??
      null;

    // Monthly distribution
    const monthly = new Array(12).fill(0) as number[];
    yearRecs.forEach((r) => {
      const m = new Date(r.created_at).getMonth();
      monthly[m] += 1;
    });
    const peakMonth = monthly.reduce(
      (best, count, idx) =>
        count > best.count ? { idx, count } : best,
      { idx: 0, count: 0 },
    );

    // Longest streak in this year
    const dayKeys = new Set<string>();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    yearRecs.forEach((r) => dayKeys.add(fmt(new Date(r.created_at))));
    yearLibrary.forEach((i) => dayKeys.add(fmt(new Date(i.logged_at))));

    const startOfYear = new Date(year, 0, 1);
    const endOfYear =
      year === currentYear ? new Date() : new Date(year, 11, 31);
    let longest = 0;
    let run = 0;
    const oneDay = 86400000;
    for (
      let t = startOfYear.getTime();
      t <= endOfYear.getTime();
      t += oneDay
    ) {
      if (dayKeys.has(fmt(new Date(t)))) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }

    // Top 5 favorite picks of the year
    const topPicks = [...yearRecs]
      .sort((a, b) => {
        if (a.is_favorited === b.is_favorited)
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        return a.is_favorited ? -1 : 1;
      })
      .slice(0, 5);

    return {
      total: yearRecs.length,
      movies,
      books,
      favorites,
      watchHours,
      topGenres,
      topCreator,
      monthly,
      peakMonth,
      longest,
      topPicks,
      libraryLogged: yearLibrary.length,
    };
  }, [yearRecs, yearLibrary, year, currentYear]);

  if (!ready) return <PageLoader text={t("loading")} />;

  const monthlyMax = Math.max(...stats.monthly, 1);
  const topGenreMax = stats.topGenres[0]?.[1] ?? 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                {t("eyebrow")}
              </p>
              <h1 className="mt-2 break-words text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                {user?.username ||
                  user?.name?.split(/\s+/)[0] ||
                  t("fallbackName")}{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                  {year}
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>
            <div className="shrink-0">
              <HoverBorderGradient
                onClick={() => router.push("/content-selection")}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="99, 102, 241"
                darkHighlightColor="129, 140, 248"
                containerClassName="rounded-full w-fit"
                className="flex items-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                <Sparkles size={16} />
                {t("startQuiz")}
              </HoverBorderGradient>
            </div>
          </div>

          {/* Year picker */}
          {availableYears.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {availableYears.map((y) => {
                const active = y === year;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.98]",
                      active
                        ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60",
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-10 text-center text-sm text-slate-500 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 dark:text-slate-400">
              {t("loading")}
            </div>
          ) : stats.total === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-12 text-center dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
              <Sparkles className="mx-auto h-10 w-10 text-indigo-300 dark:text-indigo-500/60" />
              <h2 className="mt-4 text-2xl font-black tracking-tight">
                {t("empty.title", { year })}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {year === currentYear
                  ? t("empty.current")
                  : t("empty.past")}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Hero stat */}
              <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/15 dark:via-slate-900/60 dark:to-violet-500/15 sm:p-8">
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-500/30 blur-3xl"
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                      {t("hero.eyebrow")}
                    </p>
                  </div>
                  <p className="mt-3 text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl">
                    {t("hero.picks", { count: stats.total })}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {t("hero.moviesPart", { count: stats.movies })}
                    {" · "}
                    {t("hero.booksPart", { count: stats.books })}
                    {stats.watchHours > 0 &&
                      ` · ${t("hero.watchTime", { hours: stats.watchHours })}`}
                    {stats.libraryLogged > 0 &&
                      ` · ${t("hero.libraryLogged", { count: stats.libraryLogged })}`}
                    .
                  </p>
                </div>
              </div>

              {/* Stat tile grid */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile
                  icon={Heart}
                  label={t("tiles.favorites")}
                  value={stats.favorites}
                  hint={
                    stats.total > 0
                      ? t("tiles.favoritesHint", {
                          percent: Math.round(
                            (stats.favorites / stats.total) * 100,
                          ),
                        })
                      : t("tiles.noData")
                  }
                  tone="rose"
                />
                <StatTile
                  icon={Flame}
                  label={t("tiles.longestStreak")}
                  value={stats.longest}
                  hint={
                    stats.longest === 1
                      ? t("tiles.streakDay")
                      : t("tiles.streakDays")
                  }
                  tone="orange"
                />
                <StatTile
                  icon={Calendar}
                  label={t("tiles.peakMonth")}
                  value={
                    stats.peakMonth.count > 0
                      ? monthLabels[stats.peakMonth.idx]
                      : t("tiles.noData")
                  }
                  hint={
                    stats.peakMonth.count > 0
                      ? t("tiles.picksHint", { count: stats.peakMonth.count })
                      : t("tiles.noData")
                  }
                  tone="violet"
                  smallValue
                />
                <StatTile
                  icon={BarChart3}
                  label={t("tiles.topGenre")}
                  value={stats.topGenres[0]?.[0] ?? t("tiles.noData")}
                  hint={
                    stats.topGenres[0]
                      ? t("tiles.picksHint", { count: stats.topGenres[0][1] })
                      : t("tiles.noData")
                  }
                  tone="indigo"
                  smallValue
                />
              </div>

              {/* Top creator + Movies vs Books split */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                      <Trophy size={13} />
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                      {t("creator.eyebrow")}
                    </p>
                  </div>
                  {stats.topCreator ? (
                    <>
                      <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                        {stats.topCreator.name}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {stats.topCreator.type === "director"
                          ? t("creator.director")
                          : t("creator.author")}{" "}
                        ·{" "}
                        {t("tiles.picksHint", {
                          count: stats.topCreator.count,
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {t("creator.noData")}
                    </p>
                  )}
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <TrendingUp size={13} />
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                      {t("formatMix.eyebrow")}
                    </p>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <SplitBar
                      icon={Film}
                      label={t("formatMix.movies")}
                      value={stats.movies}
                      total={stats.total}
                      color="bg-indigo-500"
                    />
                    <SplitBar
                      icon={BookOpen}
                      label={t("formatMix.books")}
                      value={stats.books}
                      total={stats.total}
                      color="bg-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly distribution */}
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <Calendar size={13} />
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                    {t("monthly.eyebrow")}
                  </p>
                </div>
                <div className="flex h-32 items-end gap-1.5 sm:gap-2">
                  {stats.monthly.map((count, idx) => {
                    const pct = (count / monthlyMax) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex flex-1 flex-col items-center gap-1.5"
                      >
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className={cn(
                              "w-full rounded-t-md transition-all duration-500",
                              count > 0
                                ? "bg-gradient-to-t from-indigo-500 to-violet-500"
                                : "bg-slate-100 dark:bg-slate-800",
                            )}
                            style={{
                              height: count > 0 ? `${Math.max(pct, 6)}%` : "6%",
                            }}
                            title={`${monthLabels[idx]}: ${count}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {monthLabels[idx][0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top genres */}
              {stats.topGenres.length > 0 && (
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                      <BarChart3 size={13} />
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                      {t("genres.eyebrow")}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {stats.topGenres.map(([name, count], i) => {
                      const pct = topGenreMax
                        ? Math.round((count / topGenreMax) * 100)
                        : 0;
                      return (
                        <li
                          key={name}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                              i === 0
                                ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                            )}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-sm font-bold tracking-tight">
                                {name}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {t("tiles.picksHint", { count })}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-700",
                                  i === 0
                                    ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                                    : "bg-slate-300 dark:bg-slate-600",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Top picks */}
              {stats.topPicks.length > 0 && (
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                        <Star size={13} />
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
                        {t("standouts.eyebrow")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/history")}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70"
                    >
                      {t("standouts.fullHistory")}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {stats.topPicks.map((rec, i) => (
                      <li
                        key={rec.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {i + 1}
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {rec.type === "movie" ? (
                            <Film size={13} />
                          ) : (
                            <BookOpen size={13} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold tracking-tight">
                            {rec.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {rec.year ? `${rec.year} · ` : ""}
                            {rec.director || rec.author || ""}
                          </p>
                        </div>
                        {rec.is_favorited && (
                          <Heart
                            size={13}
                            className="shrink-0 text-rose-500"
                            fill="currentColor"
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

interface StatTileProps {
  icon: typeof Heart;
  label: string;
  value: string | number;
  hint: string;
  tone: "indigo" | "violet" | "rose" | "orange";
  smallValue?: boolean;
}

const TONE_CLASSES: Record<StatTileProps["tone"], string> = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
};

const StatTile = ({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  smallValue,
}: StatTileProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60">
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          TONE_CLASSES[tone],
        )}
      >
        <Icon size={13} />
      </span>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-black tracking-tight",
          smallValue ? "truncate text-base sm:text-lg" : "text-2xl",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    </div>
  );
};

interface SplitBarProps {
  icon: typeof Film;
  label: string;
  value: number;
  total: number;
  color: string;
}

const SplitBar = ({ icon: Icon, label, value, total, color }: SplitBarProps) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-tight">
          <Icon size={12} />
          {label}
        </span>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default WrappedPage;
