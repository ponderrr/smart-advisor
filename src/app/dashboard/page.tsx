"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQueryState, parseAsStringLiteral } from "nuqs";

const GenreBarChart = dynamic(() => import("@/components/genre-bar-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center text-sm text-slate-400">
      Loading chart...
    </div>
  ),
});
const ActivitySparkline = dynamic(
  () => import("@/components/activity-sparkline"),
  { ssr: false },
);
import {
  ArrowRight,
  BookOpen,
  Film,
  Sparkles,
  TrendingUp,
  BarChart3,
  BookCheck,
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Trophy,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
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
import { TrailerEmbed } from "@/components/trailer-embed";
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

        <div className="mt-4">
          <TrailerEmbed
            type={rec.type}
            title={rec.title}
            year={rec.year ?? null}
            author={rec.author ?? null}
          />
        </div>

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
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");
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

  const activity = useMemo(() => {
    const days = 14;
    const buckets = new Array(days).fill(0) as number[];
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    recommendations.forEach((rec) => {
      const t = new Date(rec.created_at).getTime();
      const dayIdx = Math.floor((startOfToday - t) / dayMs);
      if (dayIdx >= 0 && dayIdx < days) {
        buckets[days - 1 - dayIdx] += 1;
      }
    });
    const sevenDay = buckets.slice(-7).reduce((a, b) => a + b, 0);
    const prevSevenDay = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
    return { series: buckets, sevenDay, prevSevenDay };
  }, [recommendations]);

  const streak = useMemo(() => {
    const dayKey = (t: number) => {
      const d = new Date(t);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };
    const days = new Set<string>();
    recommendations.forEach((r) =>
      days.add(dayKey(new Date(r.created_at).getTime())),
    );
    libraryItems.forEach((i) =>
      days.add(dayKey(new Date(i.logged_at).getTime())),
    );
    if (days.size === 0) return 0;
    const oneDay = 86400000;
    const now = new Date();
    let cursor: Date | null;
    if (days.has(dayKey(now.getTime()))) {
      cursor = now;
    } else if (days.has(dayKey(now.getTime() - oneDay))) {
      cursor = new Date(now.getTime() - oneDay);
    } else {
      return 0;
    }
    let count = 0;
    while (days.has(dayKey(cursor.getTime()))) {
      count += 1;
      cursor = new Date(cursor.getTime() - oneDay);
    }
    return count;
  }, [recommendations, libraryItems]);

  const ratedCount = useMemo(
    () => libraryItems.filter((i) => i.rating !== null).length,
    [libraryItems],
  );

  const achievements = useMemo(() => {
    const uniqueGenres = new Set<string>();
    recommendations.forEach((r) => {
      (r.genres ?? []).forEach((g) => {
        if (g) uniqueGenres.add(g.toLowerCase().trim());
      });
    });
    const list = [
      {
        id: "first-pick",
        label: "First Pick",
        icon: Sparkles,
        tone: "indigo" as const,
        progress: stats.total,
        target: 1,
      },
      {
        id: "ten-picks",
        label: "10 Picks",
        icon: TrendingUp,
        tone: "indigo" as const,
        progress: stats.total,
        target: 10,
      },
      {
        id: "wide-taste",
        label: "Wide Taste",
        icon: BarChart3,
        tone: "violet" as const,
        progress: uniqueGenres.size,
        target: 5,
      },
      {
        id: "cinephile",
        label: "Cinephile",
        icon: Film,
        tone: "amber" as const,
        progress: stats.movies,
        target: 10,
      },
      {
        id: "bookworm",
        label: "Bookworm",
        icon: BookOpen,
        tone: "amber" as const,
        progress: stats.books,
        target: 10,
      },
      {
        id: "curator",
        label: "Curator",
        icon: Heart,
        tone: "rose" as const,
        progress: stats.favorites,
        target: 5,
      },
      {
        id: "reflective",
        label: "Reflective",
        icon: ThumbsUp,
        tone: "emerald" as const,
        progress: ratedCount,
        target: 5,
      },
      {
        id: "streaker",
        label: "Week Streak",
        icon: Flame,
        tone: "orange" as const,
        progress: streak,
        target: 7,
      },
    ];
    const earned = list.filter((a) => a.progress >= a.target).length;
    return { list, earned };
  }, [recommendations, stats, ratedCount, streak]);

  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const greetings = [
      "Welcome back",
      "Hey",
      "Good to see you",
      "Hi there",
      "Howdy",
      "Hello again",
      "Glad you're back",
      "Look who's back",
      "The legend returns",
      "Well, well, well",
      "Greetings, mortal",
      "Fancy seeing you",
      "The plot thickens",
      "Sequel time",
      "Now showing",
      "Roll credits",
      "Drumroll please",
      "Brace yourself",
      "Ready, set, scroll",
    ];
    const dayIndex = Math.floor(Date.now() / 86400000) % greetings.length;
    setGreeting(greetings[dayIndex]);
  }, []);

  const greetName = useMemo(() => {
    const username = user?.username?.trim();
    if (username) return username;
    const name = user?.name?.trim();
    if (!name) return "";
    return name.split(/\s+/)[0];
  }, [user?.username, user?.name]);

  // Year-in-review surfaces only during Dec (wrap up the current year) and
  // January (look back at the year that just ended). Computed in an effect so
  // SSR can't disagree with the client's local time.
  const [wrappedSeason, setWrappedSeason] = useState<{
    show: boolean;
    year: number;
  }>({ show: false, year: new Date().getFullYear() });
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    if (month === 11) {
      setWrappedSeason({ show: true, year: now.getFullYear() });
    } else if (month === 0) {
      setWrappedSeason({ show: true, year: now.getFullYear() - 1 });
    } else {
      setWrappedSeason({ show: false, year: now.getFullYear() });
    }
  }, []);

  const headerHook = useMemo(() => {
    if (loading) return "Your personalized recommendation hub.";
    if (stats.total === 0) return "Take your first quiz to get started.";
    if (activity.sevenDay === 0) return "Quiet week — ready for a new pick?";
    const delta = activity.sevenDay - activity.prevSevenDay;
    const noun = `pick${activity.sevenDay === 1 ? "" : "s"}`;
    if (delta > 0)
      return `${activity.sevenDay} new ${noun} this week · up ${delta} from last week.`;
    if (delta < 0)
      return `${activity.sevenDay} new ${noun} this week · down ${-delta} from last week.`;
    return `${activity.sevenDay} new ${noun} this week.`;
  }, [loading, stats.total, activity]);

  const picksTabs = ["all", "favorites"] as const;
  type PicksFilter = (typeof picksTabs)[number];
  const [picksFilter, setPicksFilter] = useState<PicksFilter>("all");

  const movieRail = useMemo(
    () => recommendations.filter((r) => r.type === "movie").slice(0, 15),
    [recommendations],
  );
  const bookRail = useMemo(
    () => recommendations.filter((r) => r.type === "book").slice(0, 15),
    [recommendations],
  );
  const favoritesGrid = useMemo(
    () => recommendations.filter((r) => r.is_favorited).slice(0, 15),
    [recommendations],
  );

  const renderPickCard = (rec: Recommendation) => {
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

          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            {rec.is_favorited && (
              <span
                aria-label="Favorited"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30"
              >
                <Heart size={11} fill="currentColor" />
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
  };

  /**
   * Pick a single contextual nudge based on user state. Order matters —
   * we surface the most actionable next step first.
   */
  const suggestion = useMemo(() => {
    if (loading) return null;
    if (recommendations.length === 0) {
      return {
        title: "Take Your First Quiz",
        body: "Answer a few questions and the AI will hand you a tailored pick.",
        cta: "Start Quiz",
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

  if (!ready) return <PageLoader text={tc("loading")} />;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                {t("eyebrow")}
              </p>
              <h1 className="mt-2 break-words text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                {greeting}
                {greetName ? `, ${greetName}` : ""}.
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {headerHook}
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
                {t("startQuiz")}
              </HoverBorderGradient>
            </div>
          </div>

          {/* Mobile pill nav */}
          <div
            className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={t("viewsAria")}
          >
            {(
              [
                {
                  id: "overview" as const,
                  label: t("tabs.overview"),
                  icon: TrendingUp,
                },
                { id: "picks" as const, label: t("tabs.picks"), icon: Sparkles },
                {
                  id: "genres" as const,
                  label: t("tabs.genres"),
                  icon: BarChart3,
                },
              ] as {
                id: (typeof dashTabs)[number];
                label: string;
                icon: typeof TrendingUp;
              }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.98]",
                    active
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                      : "border-slate-200 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
                  )}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sidebar + content layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell className="hidden md:flex">
              <nav aria-label={t("viewsAria")} className="flex-1">
                <SidebarNavGroup label={t("viewsGroup")} />
                {[
                  {
                    id: "overview" as const,
                    label: t("tabs.overview"),
                    icon: <TrendingUp size={16} />,
                  },
                  {
                    id: "picks" as const,
                    label: t("tabs.recentPicks"),
                    icon: <Sparkles size={16} />,
                  },
                  {
                    id: "genres" as const,
                    label: t("tabs.genres"),
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
                    {/* Year in Review — only surfaces in Dec / Jan */}
                    {!loading && wrappedSeason.show && stats.total > 0 && (
                      <button
                        type="button"
                        onClick={() => router.push("/wrapped")}
                        className="group relative w-full overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-100 via-rose-50 to-violet-100 p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-amber-500/30 dark:from-amber-500/15 dark:via-rose-500/10 dark:to-violet-500/15 sm:p-8"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-amber-400/40 to-rose-400/40 blur-3xl"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/30 to-indigo-400/30 blur-3xl"
                        />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                                <Trophy size={15} />
                              </span>
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                Year in Review
                              </p>
                            </div>
                            <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
                              Your{" "}
                              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                                {wrappedSeason.year}
                              </span>{" "}
                              in Picks
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              Top genres, longest streak, most-picked
                              creator — wrapped up in a card.
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-black tracking-tight text-white shadow-md transition-transform duration-200 group-hover:translate-x-0.5 sm:self-auto dark:bg-white dark:text-slate-900">
                            Open Wrapped
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Suggestion banner — promoted hero CTA */}
                    {!loading && suggestion && (
                      <button
                        type="button"
                        onClick={() => router.push(suggestion.href)}
                        className="group relative w-full overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10 sm:p-6"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-400 to-violet-500"
                        />
                        <div className="relative flex flex-col gap-4 pl-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Sparkles
                                size={14}
                                className="text-indigo-600 dark:text-indigo-400"
                              />
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                                Suggested next
                              </p>
                            </div>
                            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                              {suggestion.title}
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {suggestion.body}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-transform duration-200 group-hover:translate-x-0.5 sm:self-auto dark:bg-white dark:text-slate-900">
                            {suggestion.cta}
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </button>
                    )}

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
                          No Picks Yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                          Take your first quiz and your latest pick will live
                          here so it&apos;s always one click away.
                        </p>
                      </div>
                    )}

                    {/* Pulse — rhythm card with sparkline */}
                    {!loading && stats.total > 0 && (
                      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                <TrendingUp size={13} />
                              </span>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                                Pulse
                              </p>
                            </div>
                            <h3 className="mt-2 text-lg font-black tracking-tight sm:text-xl">
                              {activity.sevenDay > 0
                                ? `${activity.sevenDay} pick${activity.sevenDay === 1 ? "" : "s"} this week`
                                : "Quiet Week"}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {(() => {
                                  const d =
                                    activity.sevenDay - activity.prevSevenDay;
                                  if (d > 0) return `↑ ${d} from last week`;
                                  if (d < 0) return `↓ ${-d} from last week`;
                                  return "Last 14 days";
                                })()}
                              </p>
                              {streak >= 2 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                                  <Flame size={10} />
                                  {streak}-day streak
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="hidden h-14 w-48 shrink-0 sm:block">
                            <ActivitySparkline
                              data={activity.series}
                              className="h-full w-full"
                            />
                          </div>
                        </div>
                        <div className="mt-3 h-12 w-full sm:hidden">
                          <ActivitySparkline
                            data={activity.series}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            {
                              label: "Picks",
                              value: stats.total,
                              icon: TrendingUp,
                              hint: `${stats.movies}m · ${stats.books}b`,
                              color: "text-indigo-600 dark:text-indigo-400",
                              bg: "bg-indigo-100 dark:bg-indigo-500/15",
                              href: "/history",
                              smallValue: false,
                            },
                            {
                              label: "Library",
                              value: libraryItems.length,
                              icon: BookCheck,
                              hint:
                                ratedItems.length > 0
                                  ? `${ratedItems.length} rated`
                                  : "—",
                              color: "text-emerald-600 dark:text-emerald-400",
                              bg: "bg-emerald-100 dark:bg-emerald-500/15",
                              href: "/library",
                              smallValue: false,
                            },
                            {
                              label: "Favorites",
                              value: stats.favorites,
                              icon: Heart,
                              hint:
                                stats.total > 0
                                  ? `${Math.round((stats.favorites / stats.total) * 100)}%`
                                  : "—",
                              color: "text-rose-600 dark:text-rose-400",
                              bg: "bg-rose-100 dark:bg-rose-500/15",
                              href: "/history?filter=favorites",
                              smallValue: false,
                            },
                            {
                              label: "Top Genre",
                              value: topGenre?.genre ?? "—",
                              icon: BarChart3,
                              hint: topGenre
                                ? `${topGenre.total} pick${topGenre.total === 1 ? "" : "s"}`
                                : "—",
                              color: "text-violet-600 dark:text-violet-400",
                              bg: "bg-violet-100 dark:bg-violet-500/15",
                              href: "?tab=genres",
                              smallValue: true,
                            },
                          ].map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() =>
                                s.href.startsWith("?")
                                  ? setActiveTab("genres")
                                  : router.push(s.href)
                              }
                              className="group flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/60 px-3 py-2 text-left transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                            >
                              <span
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                  s.bg,
                                  s.color,
                                )}
                              >
                                <s.icon size={13} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                  {s.label}
                                </p>
                                <p
                                  className={cn(
                                    "font-black tracking-tight",
                                    s.smallValue
                                      ? "truncate text-sm"
                                      : "text-base",
                                  )}
                                  title={String(s.value)}
                                >
                                  {s.value}
                                </p>
                                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                  {s.hint}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones — client-computed achievements */}
                    {!loading && stats.total > 0 && (
                      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                              <Trophy size={13} />
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                                Milestones
                              </p>
                              <h3 className="text-sm font-black tracking-tight">
                                {achievements.earned} of{" "}
                                {achievements.list.length} earned
                              </h3>
                            </div>
                          </div>
                        </div>
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {achievements.list.map((a) => {
                            const earned = a.progress >= a.target;
                            const pct = Math.min(
                              100,
                              Math.round((a.progress / a.target) * 100),
                            );
                            const Icon = a.icon;
                            const earnedTone: Record<typeof a.tone, string> = {
                              indigo:
                                "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
                              violet:
                                "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
                              amber:
                                "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
                              rose:
                                "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
                              emerald:
                                "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
                              orange:
                                "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
                            };
                            return (
                              <li
                                key={a.id}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
                                  earned
                                    ? "border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-white shadow-sm dark:border-amber-500/40 dark:from-amber-500/10 dark:to-slate-900/40"
                                    : "border-slate-100 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40",
                                )}
                              >
                                <span
                                  className={cn(
                                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                    earned
                                      ? earnedTone[a.tone]
                                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
                                  )}
                                >
                                  <Icon size={15} />
                                  {!earned && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                      <Lock size={8} />
                                    </span>
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "truncate text-xs font-black tracking-tight",
                                      !earned &&
                                        "text-slate-500 dark:text-slate-400",
                                    )}
                                  >
                                    {a.label}
                                  </p>
                                  <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {earned
                                      ? "Unlocked"
                                      : `${a.progress}/${a.target}`}
                                  </p>
                                  {!earned && (
                                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                      <div
                                        className="h-full rounded-full bg-slate-400 transition-all duration-500 dark:bg-slate-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Library snapshot — full width */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                            <BookCheck size={13} />
                          </span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                              Taste Signal
                            </p>
                            <h3 className="text-sm font-black tracking-tight">
                              Your Library
                            </h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/library")}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70"
                        >
                          View all
                          <ArrowRight size={12} />
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
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {libraryItems.slice(0, 4).map((item) => {
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
                          <div className="space-y-6">
                            {[0, 1].map((rail) => (
                              <div
                                key={rail}
                                className="rounded-3xl border border-slate-200/70 bg-white/80 py-5 pl-6 pr-0 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65"
                              >
                                <div className="mb-3 h-3 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="flex gap-3 overflow-hidden pr-6">
                                  {[...Array(6)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 sm:w-40"
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : recommendations.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-12 text-center dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                            <Sparkles
                              className="mx-auto h-10 w-10 text-indigo-300 dark:text-indigo-500/60"
                              aria-hidden="true"
                            />
                            <h3 className="mt-4 text-2xl font-black tracking-tight">
                              No Picks Yet
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                              Take a quiz and your picks will collect here.
                            </p>
                            <button
                              type="button"
                              onClick={() => router.push("/content-selection")}
                              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            >
                              <Sparkles size={14} />
                              Start Quiz
                            </button>
                          </div>
                        ) : picksFilter === "favorites" ? (
                          favoritesGrid.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 p-12 text-center dark:border-slate-700/70 dark:from-rose-500/5 dark:via-slate-900/40 dark:to-pink-500/5">
                              <Heart
                                className="mx-auto h-10 w-10 text-rose-300 dark:text-rose-500/60"
                                aria-hidden="true"
                              />
                              <h3 className="mt-4 text-2xl font-black tracking-tight">
                                No favorites yet
                              </h3>
                              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                Tap the heart on any pick to save it here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                              {favoritesGrid.map(renderPickCard)}
                            </div>
                          )
                        ) : (
                          <div className="space-y-6">
                            {movieRail.length > 0 && (
                              <section className="rounded-3xl border border-slate-200/70 bg-white/80 py-5 pl-6 pr-0 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                                <div className="mb-3 flex items-center justify-between gap-2 pr-6">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                      <Film size={13} />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                                      Movies
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                      {movieRail.length}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                  {movieRail.map((rec) => (
                                    <div
                                      key={rec.id}
                                      className="w-36 shrink-0 snap-start sm:w-40"
                                    >
                                      {renderPickCard(rec)}
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
                            {bookRail.length > 0 && (
                              <section className="rounded-3xl border border-slate-200/70 bg-white/80 py-5 pl-6 pr-0 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                                <div className="mb-3 flex items-center justify-between gap-2 pr-6">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                                      <BookOpen size={13} />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                                      Books
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                      {bookRail.length}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                  {bookRail.map((rec) => (
                                    <div
                                      key={rec.id}
                                      className="w-36 shrink-0 snap-start sm:w-40"
                                    >
                                      {renderPickCard(rec)}
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
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
                    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                            <BarChart3 size={13} />
                          </span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                              Genre breakdown
                            </p>
                            <h2 className="text-lg font-black tracking-tight sm:text-xl">
                              Where Your Taste Leans
                            </h2>
                          </div>
                        </div>
                        {topGenre && stats.total > 0 && (
                          <div className="hidden shrink-0 text-right sm:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                              Top
                            </p>
                            <p className="text-sm font-black tracking-tight">
                              {topGenre.genre}{" "}
                              <span className="text-slate-400 dark:text-slate-500">
                                ·{" "}
                                {Math.round(
                                  (topGenre.total / stats.total) * 100,
                                )}
                                %
                              </span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {topGenre.movie > topGenre.book
                                ? "mostly movies"
                                : topGenre.book > topGenre.movie
                                  ? "mostly books"
                                  : "even split"}
                            </p>
                          </div>
                        )}
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
                        <GenreBarChart data={genreChartData} />
                      )}
                    </div>
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
