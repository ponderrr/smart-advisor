"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsStringLiteral } from "nuqs";
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
import { DashboardTabContent } from "./_components/dashboard-tab-content";
import { useDashboardCopy } from "./_hooks/use-dashboard-copy";

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

  const { greetName, headerHook, suggestion, wrappedSeason } =
    useDashboardCopy({
      user,
      loading,
      stats,
      activity,
      recommendations,
      libraryItems,
      lastPick,
    });

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
              <DashboardTabContent
                genreChartData={genreChartData}
                genreByFormat={genreByFormat}
                stats={stats}
                lastPick={lastPick}
                topGenre={topGenre}
                ratedItems={ratedItems}
                inProgressItems={inProgressItems}
                lastPickAlreadyLogged={lastPickAlreadyLogged}
                movieRail={movieRail}
                bookRail={bookRail}
                musicRail={musicRail}
                favoritesGrid={favoritesGrid}
                activity={activity}
                streak={streak}
                celebratingMilestones={celebratingMilestones}
                celebratingTiers={celebratingTiers}
                openMilestoneId={openMilestoneId}
                setOpenMilestoneId={setOpenMilestoneId}
                suggestion={suggestion}
                wrappedSeason={wrappedSeason}
                achievements={achievements}
                loading={loading}
                recommendations={recommendations}
                libraryItems={libraryItems}
                activeTab={activeTab}
                setActiveTab={(tab) => setActiveTab(tab)}
                picksFilter={picksFilter}
                setPicksFilter={(f) => setPicksFilter(f)}
                slideDir={slideDir}
                setSelectedRec={(rec) => setSelectedRec(rec)}
                handleMarkFinished={handleMarkFinished}
                renderPickCard={renderPickCard}
              />
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
