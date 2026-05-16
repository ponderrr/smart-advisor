"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQueryState, parseAsStringLiteral } from "nuqs";

const GenreBarChartLoading = () => {
  const t = useTranslations("Dashboard.body");
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-400">
      {t("loadingChart")}
    </div>
  );
};

const GenreFormatChart = dynamic(
  () => import("@/components/genre-format-chart"),
  {
    ssr: false,
    loading: () => <GenreBarChartLoading />,
  },
);
const ActivitySparkline = dynamic(
  () => import("@/components/activity-sparkline"),
  { ssr: false },
);
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Film,
  Music,
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
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations, useMessages } from "next-intl";
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
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getRecTypeAccent } from "@/features/recommendations/utils/type-accent";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";
import { MfaSetupPrompt } from "@/components/mfa-setup-prompt";
import { RecommendationModal } from "./_components/recommendation-modal";
import { useAchievements } from "./_hooks/use-achievements";
import { useDashboardData } from "./_hooks/use-dashboard-data";
import { useMilestoneCelebrations } from "./_hooks/use-milestone-celebrations";
import { PickCard } from "./_components/pick-card";

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();

  // OAuth signups skip the post-verify funnel that routes through /onboarding,
  // so a freshly-arrived Google/etc. user lands here with setup_completed_at
  // still null. Nudge them through the setup screen once; returning users
  // already have a timestamp (either real or backfilled to created_at).
  useEffect(() => {
    if (!ready || !user) return;
    if (user.setup_completed_at) return;
    router.replace("/onboarding?from=signup");
  }, [ready, user, router]);
  const t = useTranslations("Dashboard");
  const tb = useTranslations("Dashboard.body");
  const tc = useTranslations("Common");
  const messages = useMessages() as {
    Dashboard?: { body?: { greetings?: string[] } };
  };
  const greetings = useMemo(
    () => messages.Dashboard?.body?.greetings ?? [],
    [messages],
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const dashTabs = ["overview", "picks", "genres", "milestones"] as const;
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(dashTabs).withDefault("overview"),
  );
  // Tab transitions always slide rightward — entering content starts on the
  // left and moves to center — so the motion feels consistent regardless of
  // which tab the user came from.
  const slideDir = -1;

  // Snap to top when the tab changes so the user lands at the start of the
  // new section instead of mid-page in empty space. Instant (not smooth)
  // to avoid iOS Safari's URL-bar wobble. Skips the initial mount.
  const tabInitialRenderRef = useRef(true);
  useEffect(() => {
    if (tabInitialRenderRef.current) {
      tabInitialRenderRef.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [activeTab]);

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

  const {
    genreChartData,
    genreByFormat,
    stats,
    lastPick,
    lastLogged,
    ratedItems,
    inProgressItems,
    loggedTitleKeys,
    lastPickAlreadyLogged,
    topGenre,
    activity,
    streak,
    ratedCount,
    movieRail,
    bookRail,
    musicRail,
    favoritesGrid,
  } = useDashboardData({ recommendations, libraryItems });

  const handleMarkFinished = async (item: LibraryItem) => {
    const { error } = await libraryService.update(item.id, {
      status: "finished",
    });
    if (error) {
      toast.error(error);
      return;
    }
    const finishedAt = new Date().toISOString();
    setLibraryItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "finished", finished_at: finishedAt }
          : entry,
      ),
    );
    toast.success(tb("inProgress.markedFinishedToast", { title: item.title }));
  };

  const achievements = useAchievements({
    recommendations,
    libraryItems,
    stats,
    ratedCount,
    streak,
  });

  const {
    celebratingMilestones,
    celebratingTiers,
    openMilestoneId,
    setOpenMilestoneId,
  } = useMilestoneCelebrations(achievements);

  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    if (greetings.length === 0) return;
    const dayIndex = Math.floor(Date.now() / 86400000) % greetings.length;
    setGreeting(greetings[dayIndex]);
  }, [greetings]);

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
    if (loading) return tb("headerHook.loading");
    if (stats.total === 0) return tb("headerHook.empty");
    if (activity.sevenDay === 0) return tb("headerHook.quietWeek");
    const delta = activity.sevenDay - activity.prevSevenDay;
    if (delta > 0)
      return tb("headerHook.up", { n: activity.sevenDay, delta });
    if (delta < 0)
      return tb("headerHook.down", { n: activity.sevenDay, delta: -delta });
    return tb("headerHook.flat", { n: activity.sevenDay });
  }, [loading, stats.total, activity, tb]);

  const picksTabs = ["all", "favorites"] as const;
  type PicksFilter = (typeof picksTabs)[number];
  const [picksFilter, setPicksFilter] = useState<PicksFilter>("all");


  const renderPickCard = (rec: Recommendation) => (
    <PickCard
      key={rec.id}
      rec={rec}
      inLibrary={loggedTitleKeys.has(
        `${rec.type}::${rec.title.toLowerCase()}`,
      )}
      onSelect={() => setSelectedRec(rec)}
    />
  );

  /**
   * Pick a single contextual nudge based on user state. Order matters —
   * we surface the most actionable next step first.
   */
  const suggestion = useMemo(() => {
    if (loading) return null;
    if (recommendations.length === 0) {
      return {
        title: tb("suggestion.firstQuiz.title"),
        body: tb("suggestion.firstQuiz.body"),
        cta: tb("suggestion.firstQuiz.cta"),
        href: "/quiz",
      };
    }
    if (libraryItems.length === 0) {
      return {
        title: tb("suggestion.logReaction.title"),
        body: tb("suggestion.logReaction.body"),
        cta: tb("suggestion.logReaction.cta"),
        href: "/results",
      };
    }
    if (lastPick) {
      const ageDays =
        (Date.now() - new Date(lastPick.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (ageDays > 7) {
        return {
          title: tb("suggestion.anotherPick.title"),
          body: tb("suggestion.anotherPick.body", {
            ago: formatDistanceToNowStrict(new Date(lastPick.created_at)),
            count: libraryItems.length,
          }),
          cta: tb("suggestion.anotherPick.cta"),
          href: "/quiz",
        };
      }
    }
    return null;
  }, [loading, recommendations.length, libraryItems.length, lastPick, tb]);

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
                onClick={() => router.push("/quiz")}
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

          {/* Mobile pill nav — icons omitted so the longest label
              ("Milestones") gets enough horizontal room inside its 1/4
              segment share on narrow phones. Pill colour still flags the
              Milestones tab. */}
          <div className="mb-4 md:hidden">
            <SegmentedControl<(typeof dashTabs)[number]>
              layoutId="dashboard-mobile-tabs"
              value={activeTab}
              onChange={setActiveTab}
              size="sm"
              ariaLabel={t("viewsAria")}
              options={[
                {
                  value: "overview",
                  label: t("tabs.overview"),
                  pillClassName: "bg-indigo-500",
                },
                {
                  value: "picks",
                  label: t("tabs.picks"),
                  pillClassName: "bg-indigo-500",
                },
                {
                  value: "genres",
                  label: t("tabs.genres"),
                  pillClassName: "bg-indigo-500",
                },
                {
                  value: "milestones",
                  label: t("tabs.milestones"),
                  pillClassName: "bg-amber-500",
                },
              ]}
            />
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
                  {
                    id: "milestones" as const,
                    label: t("tabs.milestones"),
                    icon: <Trophy size={16} />,
                    iconClassName: "text-amber-500 dark:text-amber-400",
                  },
                ].map((tab) => {
                  const iconClassName =
                    "iconClassName" in tab
                      ? (tab.iconClassName as string)
                      : undefined;
                  return (
                    <SidebarNavItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      iconClassName={iconClassName}
                    />
                  );
                })}
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
              <AnimatePresence mode="popLayout">
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
                                {tb("wrapped.eyebrow")}
                              </p>
                            </div>
                            <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
                              {tb("wrapped.titleLead")}{" "}
                              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                                {wrappedSeason.year}
                              </span>{" "}
                              {tb("wrapped.titleTail")}
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {tb("wrapped.body")}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-black tracking-tight text-white shadow-md transition-transform duration-200 group-hover:translate-x-0.5 sm:self-auto dark:bg-white dark:text-slate-900">
                            {tb("wrapped.cta")}
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
                                {tb("suggestion.eyebrow")}
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
                      <article className="group relative flex gap-4 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-5 pl-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/65">
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-y-0 left-0 w-1",
                            getRecTypeAccent(lastPick.type).stripe,
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedRec(lastPick)}
                          aria-label={tb("spotlight.openDetailsAria", { title: lastPick.title })}
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
                          <p
                            className={cn(
                              "text-[10px] font-black uppercase tracking-[0.18em]",
                              getRecTypeAccent(lastPick.type).tileText,
                            )}
                          >
                            {tb("spotlight.eyebrow")}
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
                              ? tb("spotlight.byAuthor", { author: lastPick.author })
                              : lastPick.director
                                ? tb("spotlight.byDirector", { director: lastPick.director })
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
                              {tb("spotlight.viewAll")}
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-10 text-center dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                        <Sparkles className="mx-auto h-10 w-10 text-indigo-300 dark:text-indigo-500/60" />
                        <h2 className="mt-4 text-2xl font-black tracking-tight">
                          {tb("noPicks.title")}
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                          {tb("noPicks.body")}
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
                                {tb("pulse.eyebrow")}
                              </p>
                            </div>
                            <h3 className="mt-2 text-lg font-black tracking-tight sm:text-xl">
                              {activity.sevenDay > 0
                                ? tb("pulse.thisWeek", { count: activity.sevenDay })
                                : tb("pulse.quietWeek")}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {(() => {
                                  const d =
                                    activity.sevenDay - activity.prevSevenDay;
                                  if (d > 0) return tb("pulse.up", { delta: d });
                                  if (d < 0) return tb("pulse.down", { delta: -d });
                                  return tb("pulse.lastFourteenDays");
                                })()}
                              </p>
                              {streak >= 2 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                                  <Flame size={10} />
                                  {tb("pulse.streakBadge", { count: streak })}
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
                              label: tb("pulse.stat.picks"),
                              value: stats.total,
                              icon: TrendingUp,
                              hint: tb("pulse.picksHint", {
                                movies: stats.movies,
                                books: stats.books,
                                music: stats.music,
                              }),
                              color: "text-indigo-600 dark:text-indigo-400",
                              bg: "bg-indigo-100 dark:bg-indigo-500/15",
                              href: "/history",
                              smallValue: false,
                            },
                            {
                              label: tb("pulse.stat.library"),
                              value: libraryItems.length,
                              icon: BookCheck,
                              hint:
                                ratedItems.length > 0
                                  ? tb("pulse.ratedHint", { count: ratedItems.length })
                                  : tb("pulse.noData"),
                              color: "text-emerald-600 dark:text-emerald-400",
                              bg: "bg-emerald-100 dark:bg-emerald-500/15",
                              href: "/library",
                              smallValue: false,
                            },
                            {
                              label: tb("pulse.stat.favorites"),
                              value: stats.favorites,
                              icon: Heart,
                              hint:
                                stats.total > 0
                                  ? tb("pulse.favoritesPercent", { percent: Math.round((stats.favorites / stats.total) * 100) })
                                  : tb("pulse.noData"),
                              color: "text-rose-600 dark:text-rose-400",
                              bg: "bg-rose-100 dark:bg-rose-500/15",
                              href: "/history?filter=favorites",
                              smallValue: false,
                            },
                            {
                              label: tb("pulse.stat.topGenre"),
                              value: topGenre?.genre ?? tb("pulse.noData"),
                              icon: BarChart3,
                              hint: topGenre
                                ? tb("pulse.topGenrePicks", { count: topGenre.total })
                                : tb("pulse.noData"),
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

                    {/* Milestones — compact summary; full grid lives in the
                        Milestones tab. */}
                    {!loading && stats.total > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("milestones")}
                        className="group flex w-full items-center gap-4 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900/60 dark:to-amber-500/5 sm:p-6"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30">
                          <Trophy size={20} />
                        </span>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                            {tb("milestones.eyebrow")}
                          </p>
                          <h3 className="mt-0.5 text-lg font-black tracking-tight sm:text-xl">
                            {tb("milestones.earnedSummary", {
                              earned: achievements.earned,
                              total: achievements.list.length,
                            })}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {tb("milestones.summaryHint")}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-amber-700 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5 dark:border-amber-500/40 dark:bg-slate-900/60 dark:text-amber-300">
                          {tb("milestones.summaryCta")}
                          <ArrowRight size={12} />
                        </span>
                      </button>
                    )}

                    {/* In-progress rail — surfaced only when there's something to pick up */}
                    {inProgressItems.length > 0 && (
                      <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm backdrop-blur-md dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900/60 dark:to-amber-500/5">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                              <BookOpen size={13} />
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                                {tb("inProgress.eyebrow")}
                              </p>
                              <h3 className="text-sm font-black tracking-tight">
                                {tb("inProgress.title")}
                              </h3>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push("/library?status=in_progress")}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70"
                          >
                            {tb("inProgress.viewAll")}
                            <ArrowRight size={12} />
                          </button>
                        </div>
                        <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
                          {inProgressItems.map((item) => (
                            <li
                              key={item.id}
                              className="group relative flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/70 sm:w-40"
                            >
                              <div className="relative aspect-[2/3] w-full bg-slate-200 dark:bg-slate-800">
                                {item.poster_url ? (
                                  <Image
                                    src={item.poster_url}
                                    alt={item.title}
                                    fill
                                    sizes="160px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                    {item.medium === "movie" ? (
                                      <Film size={22} />
                                    ) : (
                                      <BookOpen size={22} />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 p-2.5">
                                <p
                                  className="line-clamp-2 text-xs font-black leading-tight tracking-tight"
                                  title={item.title}
                                >
                                  {item.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleMarkFinished(item)}
                                  className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <CheckCircle2 size={11} />
                                  {tb("inProgress.markFinished")}
                                </button>
                              </div>
                            </li>
                          ))}
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
                              {tb("library.eyebrow")}
                            </p>
                            <h3 className="text-sm font-black tracking-tight">
                              {tb("library.title")}
                            </h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/library")}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70"
                        >
                          {tb("library.viewAll")}
                          <ArrowRight size={12} />
                        </button>
                      </div>
                      {libraryItems.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {tb("library.emptyLead")}{" "}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {tb("library.emptyAction")}
                          </span>{" "}
                          {tb("library.emptyTail")}
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
                      <SegmentedControl<PicksFilter>
                        layoutId="dashboard-picks-filter"
                        value={picksFilter}
                        onChange={setPicksFilter}
                        size="sm"
                        ariaLabel={tb("picks.filterAria")}
                        options={[
                          {
                            value: "all",
                            label: tb("picks.all"),
                            pillClassName: "bg-indigo-500",
                          },
                          {
                            value: "favorites",
                            label: tb("picks.favorites"),
                            pillClassName: "bg-rose-500",
                          },
                        ]}
                      />
                      <button
                        type="button"
                        onClick={() => router.push("/history")}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-indigo-700 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800/70 dark:hover:text-indigo-300"
                      >
                        {tb("picks.seeAllInHistory")}
                        <ArrowRight
                          size={12}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </button>
                    </div>

                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={picksFilter}
                        initial={{ opacity: 0, x: slideDir * 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: slideDir * -30 }}
                        transition={{ duration: 0.2 }}
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
                              {tb("picks.noPicksTitle")}
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                              {tb("picks.noPicksBody")}
                            </p>
                            <button
                              type="button"
                              onClick={() => router.push("/quiz")}
                              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            >
                              <Sparkles size={14} />
                              {tb("picks.startQuiz")}
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
                                {tb("picks.noFavoritesTitle")}
                              </h3>
                              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                {tb("picks.noFavoritesBody")}
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
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                                      <Film size={13} />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                                      {tb("picks.movies")}
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
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                                      <BookOpen size={13} />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                                      {tb("picks.books")}
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
                            {musicRail.length > 0 && (
                              <section className="rounded-3xl border border-slate-200/70 bg-white/80 py-5 pl-6 pr-0 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                                <div className="mb-3 flex items-center justify-between gap-2 pr-6">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                                      <Music size={13} />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">
                                      {tb("picks.music")}
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                      {musicRail.length}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                  {musicRail.map((rec) => (
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

                {activeTab === "milestones" && (
                  <motion.div
                    key="milestones"
                    initial={{ opacity: 0, x: slideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Tier sections — easy first, hard last. Each tier
                        renders the same click-to-expand tile as Overview. */}
                    {(["easy", "medium", "hard", "master"] as const).map((tier) => {
                      const items = achievements.list.filter(
                        (a) => a.tier === tier,
                      );
                      const earnedInTier = items.filter(
                        (a) => a.progress >= a.target,
                      ).length;
                      const tierTone: Record<typeof tier, string> = {
                        easy: "from-emerald-50/80 to-white border-emerald-200/60 dark:from-emerald-500/10 dark:to-slate-900/40 dark:border-emerald-500/30",
                        medium:
                          "from-indigo-50/80 to-white border-indigo-200/60 dark:from-indigo-500/10 dark:to-slate-900/40 dark:border-indigo-500/30",
                        hard: "from-amber-50/80 to-white border-amber-300/60 dark:from-amber-500/10 dark:to-slate-900/40 dark:border-amber-500/40",
                        master:
                          "from-violet-50/80 via-fuchsia-50/40 to-rose-50/60 border-violet-300/60 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-rose-500/15 dark:border-violet-500/40",
                      };
                      const tierEyebrowTone: Record<typeof tier, string> = {
                        easy: "text-emerald-600 dark:text-emerald-400",
                        medium: "text-indigo-600 dark:text-indigo-400",
                        hard: "text-amber-600 dark:text-amber-400",
                        master:
                          "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300",
                      };
                      const isTierCelebrating = celebratingTiers.has(tier);
                      return (
                        <motion.section
                          key={tier}
                          animate={
                            isTierCelebrating
                              ? {
                                  scale: [1, 1.02, 1],
                                  transition: {
                                    duration: 0.9,
                                    ease: [0.22, 1, 0.36, 1],
                                    times: [0, 0.4, 1],
                                  },
                                }
                              : undefined
                          }
                          className={cn(
                            "relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm backdrop-blur-md",
                            tierTone[tier],
                            isTierCelebrating &&
                              "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
                          )}
                        >
                          {isTierCelebrating && (
                            <>
                              {/* Sweep — a bright gradient strip that pans
                                  across the band on completion. */}
                              <motion.span
                                aria-hidden
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={{ x: "120%", opacity: [0, 0.7, 0] }}
                                transition={{
                                  duration: 1.4,
                                  ease: "easeInOut",
                                  times: [0, 0.5, 1],
                                }}
                                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30"
                              />
                              {/* Soft amber halo that pulses out from the
                                  band center. */}
                              <motion.span
                                aria-hidden
                                initial={{ scale: 0.6, opacity: 0.6 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{
                                  duration: 1.6,
                                  ease: "easeOut",
                                }}
                                className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-300/30 via-amber-200/15 to-transparent blur-xl"
                              />
                            </>
                          )}
                          <div className="relative mb-3 flex items-center justify-between">
                            <p
                              className={cn(
                                "text-[10px] font-black uppercase tracking-[0.16em]",
                                tierEyebrowTone[tier],
                              )}
                            >
                              {tb(`milestones.tiers.${tier}`)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {tb("milestones.earnedSummary", {
                                earned: earnedInTier,
                                total: items.length,
                              })}
                            </p>
                          </div>
                          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {items.map((a) => {
                              const earned = a.progress >= a.target;
                              const pct = Math.min(
                                100,
                                Math.round((a.progress / a.target) * 100),
                              );
                              const Icon = a.icon;
                              const earnedTone: Record<
                                typeof a.tone,
                                string
                              > = {
                                indigo:
                                  "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
                                violet:
                                  "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
                                amber:
                                  "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
                                rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
                                emerald:
                                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
                                orange:
                                  "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
                              };
                              const isCelebrating =
                                celebratingMilestones.has(a.id);
                              const isOpen = openMilestoneId === a.id;
                              return (
                                <motion.li
                                  key={a.id}
                                  animate={
                                    isCelebrating
                                      ? {
                                          scale: [1, 1.06, 1],
                                          transition: {
                                            duration: 0.7,
                                            ease: [0.22, 1, 0.36, 1],
                                            times: [0, 0.4, 1],
                                          },
                                        }
                                      : undefined
                                  }
                                  className={cn(
                                    "relative overflow-hidden rounded-xl border transition-all",
                                    earned
                                      ? "border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-white shadow-sm dark:border-amber-500/40 dark:from-amber-500/10 dark:to-slate-900/40"
                                      : "border-slate-100 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40",
                                    isCelebrating &&
                                      "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
                                    isOpen &&
                                      "ring-2 ring-indigo-400/60 dark:ring-indigo-500/50",
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMilestoneId(
                                        isOpen ? null : a.id,
                                      )
                                    }
                                    aria-expanded={isOpen}
                                    aria-controls={`milestone-detail-tab-${a.id}`}
                                    className="flex w-full items-center gap-2.5 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                                  >
                                    {isCelebrating && (
                                      <motion.span
                                        aria-hidden
                                        initial={{
                                          scale: 0.4,
                                          opacity: 0.7,
                                        }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        transition={{
                                          duration: 1.4,
                                          ease: "easeOut",
                                        }}
                                        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-amber-300/50 via-amber-200/30 to-transparent blur-md"
                                      />
                                    )}
                                    <motion.span
                                      animate={
                                        isCelebrating
                                          ? {
                                              scale: [1, 1.35, 1],
                                              rotate: [0, 360],
                                              transition: {
                                                duration: 0.9,
                                                ease: [0.22, 1, 0.36, 1],
                                              },
                                            }
                                          : undefined
                                      }
                                      className={cn(
                                        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                        earned
                                          ? earnedTone[a.tone]
                                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
                                      )}
                                    >
                                      <Icon size={16} />
                                      {!earned && (
                                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                          <Lock size={8} />
                                        </span>
                                      )}
                                    </motion.span>
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={cn(
                                          "truncate text-sm font-black tracking-tight",
                                          !earned &&
                                            "text-slate-500 dark:text-slate-400",
                                        )}
                                      >
                                        {a.label}
                                      </p>
                                      <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        {earned
                                          ? tb("milestones.unlocked")
                                          : tb("milestones.progress", {
                                              progress: a.progress,
                                              target: a.target,
                                            })}
                                      </p>
                                      {!earned && (
                                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                          <div
                                            className="h-full rounded-full bg-slate-400 transition-all duration-500 dark:bg-slate-500"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                  <AnimatePresence initial={false}>
                                    {isOpen && (
                                      <motion.div
                                        key="detail"
                                        id={`milestone-detail-tab-${a.id}`}
                                        initial={{
                                          height: 0,
                                          opacity: 0,
                                        }}
                                        animate={{
                                          height: "auto",
                                          opacity: 1,
                                        }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                          duration: 0.22,
                                          ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="overflow-hidden"
                                      >
                                        <div className="border-t border-slate-200/70 px-3 py-2.5 dark:border-slate-700/60">
                                          <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
                                            {a.description}
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.section>
                      );
                    })}
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
                              {tb("genres.eyebrow")}
                            </p>
                            <h2 className="text-lg font-black tracking-tight sm:text-xl">
                              {tb("genres.title")}
                            </h2>
                          </div>
                        </div>
                        {topGenre && stats.total > 0 && (
                          <div className="hidden shrink-0 text-right sm:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                              {tb("genres.topLabel")}
                            </p>
                            <p className="text-sm font-black tracking-tight">
                              {topGenre.genre}{" "}
                              <span className="text-slate-400 dark:text-slate-500">
                                ·{" "}
                                {tb("genres.topPercent", {
                                  percent: Math.round(
                                    (topGenre.total / stats.total) * 100,
                                  ),
                                })}
                              </span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {(() => {
                                const counts: Array<[
                                  "movie" | "book" | "music",
                                  number,
                                ]> = [
                                  ["movie", topGenre.movie],
                                  ["book", topGenre.book],
                                  ["music", topGenre.music],
                                ];
                                counts.sort((a, b) => b[1] - a[1]);
                                if (counts[0][1] === 0) return tb("genres.evenSplit");
                                if (counts[0][1] === counts[1][1])
                                  return tb("genres.evenSplit");
                                if (counts[0][0] === "movie")
                                  return tb("genres.mostlyMovies");
                                if (counts[0][0] === "book")
                                  return tb("genres.mostlyBooks");
                                return tb("genres.mostlyMusic");
                              })()}
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
                          {tb("genres.empty")}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                          {(
                            [
                              {
                                format: "movie" as const,
                                data: genreByFormat.movie,
                                count: stats.movies,
                                accent:
                                  "border-amber-200/60 dark:border-amber-500/30",
                                label: tb("genres.format.movies"),
                                badge:
                                  "text-amber-600 dark:text-amber-400",
                              },
                              {
                                format: "book" as const,
                                data: genreByFormat.book,
                                count: stats.books,
                                accent:
                                  "border-emerald-200/60 dark:border-emerald-500/30",
                                label: tb("genres.format.books"),
                                badge:
                                  "text-emerald-600 dark:text-emerald-400",
                              },
                              {
                                format: "music" as const,
                                data: genreByFormat.music,
                                count: stats.music,
                                accent:
                                  "border-rose-200/60 dark:border-rose-500/30",
                                label: tb("genres.format.music"),
                                badge:
                                  "text-rose-600 dark:text-rose-400",
                              },
                            ]
                          ).map((panel) => (
                            <div
                              key={panel.format}
                              className={cn(
                                "rounded-2xl border bg-white/60 p-4 dark:bg-slate-900/40",
                                panel.accent,
                              )}
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <p
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.16em]",
                                    panel.badge,
                                  )}
                                >
                                  {panel.label}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                  {tb("genres.format.totalPicks", {
                                    count: panel.count,
                                  })}
                                </p>
                              </div>
                              {panel.data.length === 0 ? (
                                <div className="flex h-32 items-center justify-center text-center text-xs font-semibold tracking-tight text-slate-400 dark:text-slate-500">
                                  {tb("genres.format.empty")}
                                </div>
                              ) : (
                                <GenreFormatChart
                                  format={panel.format}
                                  data={panel.data}
                                />
                              )}
                            </div>
                          ))}
                        </div>
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
