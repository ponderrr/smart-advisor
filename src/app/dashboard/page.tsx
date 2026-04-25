"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQueryState, parseAsStringLiteral } from "nuqs";

const GenrePieChart = dynamic(() => import("@/components/genre-pie-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center text-sm text-slate-400">
      Loading chart...
    </div>
  ),
});
import {
  ArrowRight,
  BookOpen,
  Film,
  Settings,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  BookCheck,
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import {
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUser,
  SidebarNavShell,
} from "@/components/sidebar-nav";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { databaseService } from "@/features/recommendations/services/database-service";
import { libraryService } from "@/features/library/services/library-service";
import {
  RATING_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type LibraryItem,
} from "@/features/library/types/library";
import { LogToLibraryButton } from "@/features/library/components/log-to-library-button";
import { formatDistanceToNowStrict } from "date-fns";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Dialog } from "@/components/ui/dialog";
import { WhyThisPick } from "@/components/why-this-pick";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";
import { MfaSetupPrompt } from "@/components/mfa-setup-prompt";

const RecommendationModal = ({
  rec,
  onClose,
}: {
  rec: Recommendation;
  onClose: () => void;
}) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      ariaLabel={`Details for ${rec.title}`}
      hideCloseButton
    >
      {rec.poster_url && (
        <div className="relative aspect-[2/3] max-h-[300px] w-full overflow-hidden rounded-t-3xl bg-slate-200 dark:bg-slate-800">
          <Image
            src={rec.poster_url}
            alt={rec.title}
            fill
            sizes="(max-width: 640px) 100vw, 500px"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {rec.type === "movie" ? (
                <Film size={10} />
              ) : (
                <BookOpen size={10} />
              )}
              {rec.type}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="text-2xl font-black tracking-tight">{rec.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {rec.author
            ? `By ${rec.author}`
            : rec.director
              ? `Directed by ${rec.director}`
              : ""}
          {rec.year ? ` · ${rec.year}` : ""}
        </p>

        {rec.genres?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {rec.genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {rec.explanation && (
          <WhyThisPick text={rec.explanation} className="mt-4" />
        )}

        {rec.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {rec.description}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const dashTabs = ["overview", "picks", "genres"] as const;
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(dashTabs).withDefault("overview"),
  );
  // Tab transitions always slide rightward — entering content starts on the
  // left and moves to center — so the motion feels consistent regardless of
  // which tab the user came from.
  const slideDir = -1;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [recsResult, libResult] = await Promise.all([
        databaseService.getUserRecommendations({ sortBy: "newest", limit: 36 }),
        libraryService.list({ limit: 12 }),
      ]);
      if (!active) return;
      setRecommendations(recsResult.error ? [] : recsResult.data);
      setLibraryItems(libResult.error ? [] : libResult.data);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const genreChartData = useMemo(() => {
    const byGenre = new Map<
      string,
      { genre: string; movie: number; book: number; total: number }
    >();
    recommendations.forEach((rec) => {
      const genres =
        Array.isArray(rec.genres) && rec.genres.length > 0
          ? rec.genres
              .flatMap((g) => g.split(/[,&/|]/g))
              .map((g) => g.trim())
              .filter(Boolean)
          : ["Other"];
      genres.forEach((genre) => {
        const label =
          genre.length > 14 ? `${genre.slice(0, 14).trim()}…` : genre;
        const cur = byGenre.get(label) ?? {
          genre: label,
          movie: 0,
          book: 0,
          total: 0,
        };
        if (rec.type === "movie") cur.movie += 1;
        if (rec.type === "book") cur.book += 1;
        cur.total += 1;
        byGenre.set(label, cur);
      });
    });
    return [...byGenre.values()].sort((a, b) => b.total - a.total).slice(0, 6);
  }, [recommendations]);

  const stats = useMemo(() => {
    const movies = recommendations.filter((r) => r.type === "movie").length;
    const books = recommendations.filter((r) => r.type === "book").length;
    const favorites = recommendations.filter((r) => r.is_favorited).length;
    return { total: recommendations.length, movies, books, favorites };
  }, [recommendations]);

  const lastPick = recommendations[0] ?? null;
  const lastLogged = libraryItems[0] ?? null;
  const ratedItems = useMemo(
    () => libraryItems.filter((i) => i.rating !== null).slice(0, 3),
    [libraryItems],
  );
  const loggedTitleKeys = useMemo(
    () =>
      new Set(libraryItems.map((i) => `${i.medium}::${i.title.toLowerCase()}`)),
    [libraryItems],
  );
  const lastPickAlreadyLogged = lastPick
    ? loggedTitleKeys.has(`${lastPick.type}::${lastPick.title.toLowerCase()}`)
    : false;
  const topGenre = genreChartData[0] ?? null;

  const picksTabs = ["all", "movies", "books", "favorites"] as const;
  type PicksFilter = (typeof picksTabs)[number];
  const [picksFilter, setPicksFilter] = useState<PicksFilter>("all");

  const filteredPicks = useMemo(() => {
    if (picksFilter === "movies")
      return recommendations.filter((r) => r.type === "movie");
    if (picksFilter === "books")
      return recommendations.filter((r) => r.type === "book");
    if (picksFilter === "favorites")
      return recommendations.filter((r) => r.is_favorited);
    return recommendations;
  }, [recommendations, picksFilter]);

  /**
   * Pick a single contextual nudge based on user state. Order matters —
   * we surface the most actionable next step first.
   */
  const suggestion = useMemo(() => {
    if (loading) return null;
    if (recommendations.length === 0) {
      return {
        title: "Take your first quiz",
        body: "Answer a few questions and the AI will hand you a tailored pick.",
        cta: "Start quiz",
        href: "/content-selection",
      };
    }
    if (libraryItems.length === 0) {
      return {
        title: "Log a reaction",
        body: 'Tell the AI what landed and what didn\'t — your reactions become a taste signal on every future quiz.',
        cta: "Open results",
        href: "/results",
      };
    }
    if (lastPick) {
      const ageDays =
        (Date.now() - new Date(lastPick.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (ageDays > 7) {
        return {
          title: "Time for another pick?",
          body: `Your last quiz was ${formatDistanceToNowStrict(new Date(lastPick.created_at))} ago. The AI now knows ${libraryItems.length} of your reactions.`,
          cta: "Take another quiz",
          href: "/content-selection",
        };
      }
    }
    return null;
  }, [loading, recommendations.length, libraryItems.length, lastPick]);

  if (!ready) return <PageLoader text="Loading..." />;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                Dashboard
              </p>
              <h1 className="mt-2 break-words text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Welcome{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your personalized recommendation hub.
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
                className="flex items-center gap-2 whitespace-nowrap bg-white px-8 py-4 text-base font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                <Sparkles size={16} />
                Start Quiz
              </HoverBorderGradient>
            </div>
          </div>

          {/* Sidebar + content layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell>
              <nav aria-label="Dashboard views" className="flex-1">
                <SidebarNavGroup label="Views" />
                {[
                  {
                    id: "overview" as const,
                    label: "Overview",
                    icon: <TrendingUp size={16} />,
                  },
                  {
                    id: "picks" as const,
                    label: "Recent Picks",
                    icon: <Sparkles size={16} />,
                  },
                  {
                    id: "genres" as const,
                    label: "Genres",
                    icon: <BarChart3 size={16} />,
                  },
                ].map((tab) => (
                  <SidebarNavItem
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </nav>

              <div className="mt-6">
                <SidebarUser
                  name={user?.name ?? ""}
                  email={user?.email ?? ""}
                  avatarUrl={user?.avatar_url}
                />
              </div>
            </SidebarNavShell>

            <div className="min-w-0 flex-1">
              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: slideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Last Pick Spotlight */}
                    {loading ? (
                      <div className="flex gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                        <div className="h-32 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    ) : lastPick ? (
                      <article className="group flex gap-4 rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/65">
                        <button
                          type="button"
                          onClick={() => setSelectedRec(lastPick)}
                          aria-label={`Open details for ${lastPick.title}`}
                          className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
                        >
                          {lastPick.poster_url ? (
                            <Image
                              src={lastPick.poster_url}
                              alt={lastPick.title}
                              fill
                              sizes="96px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              {lastPick.type === "movie" ? (
                                <Film size={24} />
                              ) : (
                                <BookOpen size={24} />
                              )}
                            </div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                            Latest pick
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                              ·
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {formatDistanceToNowStrict(
                                new Date(lastPick.created_at),
                                { addSuffix: true },
                              )}
                            </span>
                          </p>
                          <h2 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">
                            {lastPick.title}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {lastPick.author
                              ? `By ${lastPick.author}`
                              : lastPick.director
                                ? `Directed by ${lastPick.director}`
                                : ""}
                            {lastPick.year ? ` · ${lastPick.year}` : ""}
                          </p>
                          {lastPick.explanation && (
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {lastPick.explanation}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <LogToLibraryButton
                              medium={lastPick.type}
                              title={lastPick.title}
                              creator={
                                lastPick.author ?? lastPick.director ?? null
                              }
                              year={lastPick.year ?? null}
                              poster_url={lastPick.poster_url ?? null}
                              source_recommendation_id={lastPick.id}
                              initialLogged={lastPickAlreadyLogged}
                              variant="compact"
                            />
                            <button
                              type="button"
                              onClick={() => router.push("/history")}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70"
                            >
                              View all
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-10 text-center dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                        <Sparkles className="mx-auto h-10 w-10 text-indigo-300 dark:text-indigo-500/60" />
                        <h2 className="mt-4 text-2xl font-black tracking-tight">
                          No picks yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                          Take your first quiz and your latest pick will live
                          here so it&apos;s always one click away.
                        </p>
                      </div>
                    )}

                    {/* Stats — compact, with secondary descriptors */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                      {[
                        {
                          label: "Total picks",
                          value: stats.total,
                          icon: TrendingUp,
                          color:
                            "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
                          hint:
                            stats.total === 0
                              ? "Take your first quiz"
                              : `${stats.movies} movies · ${stats.books} books`,
                          href: "/history",
                        },
                        {
                          label: "In your library",
                          value: libraryItems.length,
                          icon: BookCheck,
                          color:
                            "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
                          hint:
                            libraryItems.length === 0
                              ? "Log a reaction"
                              : `${ratedItems.length} rated`,
                          href: "/library",
                        },
                        {
                          label: "Favorites",
                          value: stats.favorites,
                          icon: Heart,
                          color:
                            "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
                          hint:
                            stats.total > 0
                              ? `${Math.round((stats.favorites / stats.total) * 100)}% of picks`
                              : "—",
                          href: "/history?filter=favorites",
                        },
                        {
                          label: "Top genre",
                          value: topGenre?.genre ?? "—",
                          icon: BarChart3,
                          color:
                            "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
                          hint: topGenre
                            ? `${topGenre.total} pick${topGenre.total === 1 ? "" : "s"}`
                            : "Take a quiz",
                          href: "?tab=genres",
                          /** Genre tile uses smaller font since it's a label, not a number. */
                          smallValue: true,
                        },
                      ].map((stat) => (
                        <button
                          key={stat.label}
                          onClick={() => {
                            if (stat.href.startsWith("?")) {
                              setActiveTab("genres");
                            } else {
                              router.push(stat.href);
                            }
                          }}
                          className="group rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-4 dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600/80"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full",
                                stat.color,
                              )}
                            >
                              <stat.icon size={13} />
                            </span>
                            <ArrowRight
                              size={12}
                              className="text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
                            />
                          </div>
                          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {stat.label}
                          </p>
                          <p
                            className={cn(
                              "mt-1 font-black tracking-tight",
                              stat.smallValue
                                ? "truncate text-base sm:text-lg"
                                : "text-2xl",
                            )}
                          >
                            {loading ? "–" : stat.value}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {stat.hint}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Library snapshot + Smart suggestion */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Library snapshot */}
                      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <BookCheck size={13} />
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                                Taste signal
                              </p>
                              <h3 className="text-sm font-black tracking-tight">
                                Your library
                              </h3>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push("/library")}
                            className="text-[11px] font-bold tracking-tight text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
                          >
                            View all
                          </button>
                        </div>
                        {libraryItems.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Nothing logged yet. Hit{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              I watched / read this
                            </span>{" "}
                            on a result and it&apos;ll show up here as a taste
                            signal for future quizzes.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {libraryItems.slice(0, 3).map((item) => {
                              const RatingIcon =
                                item.rating === 1
                                  ? ThumbsDown
                                  : item.rating === 3
                                    ? ThumbsUp
                                    : Bookmark;
                              return (
                                <li
                                  key={item.id}
                                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40"
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    {item.medium === "movie" ? (
                                      <Film size={14} />
                                    ) : (
                                      <BookOpen size={14} />
                                    )}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold tracking-tight">
                                      {item.title}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                          STATUS_TONE[item.status].chip,
                                        )}
                                      >
                                        {STATUS_LABELS[item.status]}
                                      </span>
                                      {item.rating !== null && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                          <RatingIcon size={10} />
                                          {RATING_LABELS[item.rating]}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* Smart suggestion / quick links */}
                      {suggestion ? (
                        <button
                          type="button"
                          onClick={() => router.push(suggestion.href)}
                          className="group relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500"
                          />
                          <div className="relative flex items-center gap-2 pl-2">
                            <Sparkles
                              size={14}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                              Suggested next
                            </p>
                          </div>
                          <h3 className="mt-2 pl-2 text-lg font-black tracking-tight sm:text-xl">
                            {suggestion.title}
                          </h3>
                          <p className="mt-1 pl-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {suggestion.body}
                          </p>
                          <p className="mt-3 inline-flex items-center gap-1 pl-2 text-sm font-bold text-indigo-600 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-indigo-400">
                            {suggestion.cta}
                            <ArrowRight size={14} />
                          </p>
                        </button>
                      ) : (
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Shortcuts
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                label: "History",
                                icon: Clock,
                                href: "/history",
                              },
                              {
                                label: "Library",
                                icon: BookCheck,
                                href: "/library",
                              },
                              {
                                label: "Settings",
                                icon: Settings,
                                href: "/settings",
                              },
                              {
                                label: "Take quiz",
                                icon: Sparkles,
                                href: "/content-selection",
                              },
                            ].map((s) => (
                              <button
                                key={s.label}
                                type="button"
                                onClick={() => router.push(s.href)}
                                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5 text-left text-sm font-bold tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 dark:hover:border-slate-600"
                              >
                                <s.icon
                                  size={14}
                                  className="text-slate-500 dark:text-slate-400"
                                />
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "picks" && (
                  <motion.div
                    key="picks"
                    initial={{ opacity: 0, x: slideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Filter pills + see-all */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div
                        role="tablist"
                        aria-label="Recent picks filter"
                        className="flex flex-wrap gap-2"
                      >
                        {(
                          [
                            { id: "all", label: "All" },
                            { id: "movies", label: "Movies" },
                            { id: "books", label: "Books" },
                            { id: "favorites", label: "Favorites" },
                          ] as { id: PicksFilter; label: string }[]
                        ).map((opt) => {
                          const active = picksFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setPicksFilter(opt.id)}
                              className={cn(
                                "rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.98]",
                                active
                                  ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                                  : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60",
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/history")}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-indigo-700 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800/70 dark:hover:text-indigo-300"
                      >
                        See all in history
                        <ArrowRight
                          size={12}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={picksFilter}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                      >
                        {loading ? (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/40"
                              >
                                <div className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800" />
                              </div>
                            ))}
                          </div>
                        ) : filteredPicks.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-12 text-center dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                            <Sparkles
                              className="mx-auto h-10 w-10 text-indigo-300 dark:text-indigo-500/60"
                              aria-hidden="true"
                            />
                            <h3 className="mt-4 text-2xl font-black tracking-tight">
                              {recommendations.length === 0
                                ? "No picks yet"
                                : "Nothing matches that filter"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                              {recommendations.length === 0
                                ? "Take a quiz and your picks will collect here."
                                : "Try a different filter or take a new quiz."}
                            </p>
                            {recommendations.length === 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push("/content-selection")
                                }
                                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                              >
                                <Sparkles size={14} />
                                Start quiz
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                            {filteredPicks.slice(0, 15).map((rec) => {
                              const inLibrary = loggedTitleKeys.has(
                                `${rec.type}::${rec.title.toLowerCase()}`,
                              );
                              return (
                                <article
                                  key={rec.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedRec(rec)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedRec(rec);
                                    }
                                  }}
                                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950"
                                >
                                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                                    {rec.poster_url ? (
                                      <Image
                                        src={rec.poster_url}
                                        alt={rec.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        {rec.type === "movie" ? (
                                          <Film size={24} />
                                        ) : (
                                          <BookOpen size={24} />
                                        )}
                                      </div>
                                    )}

                                    {/* Status badges, top-right */}
                                    <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                                      {rec.is_favorited && (
                                        <span
                                          aria-label="Favorited"
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30"
                                        >
                                          <Heart
                                            size={11}
                                            fill="currentColor"
                                          />
                                        </span>
                                      )}
                                      {inLibrary && (
                                        <span
                                          aria-label="In your library"
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                        >
                                          <BookCheck size={11} />
                                        </span>
                                      )}
                                    </div>

                                    {/* Title overlay */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3">
                                      <p className="line-clamp-2 text-sm font-black tracking-tight leading-tight text-white">
                                        {rec.title}
                                      </p>
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-sm">
                                          {rec.type === "movie" ? (
                                            <Film size={9} />
                                          ) : (
                                            <BookOpen size={9} />
                                          )}
                                          {rec.type}
                                        </span>
                                        {rec.year && (
                                          <span className="text-[9px] font-bold text-white/70">
                                            {rec.year}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {activeTab === "genres" && (
                  <motion.div
                    key="genres"
                    initial={{ opacity: 0, x: slideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Top genres leaderboard */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                          <BarChart3 size={13} />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                            Genre breakdown
                          </p>
                          <h2 className="text-lg font-black tracking-tight sm:text-xl">
                            Where your taste leans
                          </h2>
                        </div>
                      </div>
                      {loading ? (
                        <div className="space-y-2">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                            />
                          ))}
                        </div>
                      ) : genreChartData.length === 0 ? (
                        <div className="flex h-40 items-center justify-center px-6 text-center text-base font-bold tracking-tight text-slate-500 dark:text-slate-400">
                          Take a quiz to see your genres.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {genreChartData.map((g, i) => {
                            const pct = stats.total
                              ? Math.round((g.total / stats.total) * 100)
                              : 0;
                            return (
                              <li
                                key={g.genre}
                                className="rounded-xl border border-slate-100 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span
                                      className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                                        i === 0
                                          ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20"
                                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                                      )}
                                    >
                                      {i + 1}
                                    </span>
                                    <span className="truncate text-sm font-bold tracking-tight">
                                      {g.genre}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    {g.movie > 0 && (
                                      <span className="inline-flex items-center gap-1">
                                        <Film size={10} />
                                        {g.movie}
                                      </span>
                                    )}
                                    {g.book > 0 && (
                                      <span className="inline-flex items-center gap-1">
                                        <BookOpen size={10} />
                                        {g.book}
                                      </span>
                                    )}
                                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      i === 0
                                        ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                                        : "bg-slate-300 dark:bg-slate-600",
                                    )}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Pie chart visualization */}
                    {!loading && genreChartData.length > 0 && (
                      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          Distribution
                        </p>
                        <GenrePieChart data={genreChartData} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {selectedRec && (
        <RecommendationModal
          rec={selectedRec}
          onClose={() => setSelectedRec(null)}
        />
      )}

      <MfaSetupPrompt userId={user?.id} />
    </div>
  );
};

export default DashboardPage;
