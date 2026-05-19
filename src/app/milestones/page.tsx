"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { databaseService } from "@/features/recommendations/services/database-service";
import { libraryService } from "@/features/library/services/library-service";
import type { LibraryItem } from "@/features/library/types/library";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import { cn } from "@/lib/utils";

import { useAchievements } from "./_hooks/use-achievements";
import { useMilestoneCelebrations } from "./_hooks/use-milestone-celebrations";

/**
 * /milestones — dedicated home for the achievement tier rollup. Lifted
 * out of the (now-retired) Dashboard, which used to host this as a tab.
 *
 * Owns its own data fetch + the small derivations useAchievements needs
 * (stats, streak, ratedCount) so it doesn't drag in the full Dashboard
 * data hook. Reuses the same celebrations animation hook.
 */
const MilestonesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const tb = useTranslations("Dashboard.body");
  const tc = useTranslations("Common");

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user?.id) return;
    let cancelled = false;
    void (async () => {
      const [recsRes, libRes] = await Promise.all([
        databaseService.getUserRecommendations({
          sortBy: "newest",
          limit: 5000,
        }),
        libraryService.list(),
      ]);
      if (cancelled) return;
      setRecommendations(recsRes.data ?? []);
      setLibraryItems(libRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user?.id]);

  const stats = useMemo(
    () => ({
      total: recommendations.length,
      movies: recommendations.filter((r) => r.type === "movie").length,
      books: recommendations.filter((r) => r.type === "book").length,
      music: recommendations.filter((r) => r.type === "music").length,
      favorites: recommendations.filter((r) => r.is_favorited).length,
    }),
    [recommendations],
  );

  // Streak = consecutive days ending today (or yesterday if nothing
  // logged today yet) with at least one rec OR library log. Lifted
  // verbatim from the retired use-dashboard-data hook.
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

  if (!ready || loading) {
    return <PageLoader text={tc("loading")} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← {tb("milestones.backToFeed")}
          </button>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
            {tb("tabs.milestones")}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl">
            {tb("milestones.pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {tb("milestones.earnedSummary", {
              earned: achievements.earned,
              total: achievements.list.length,
            })}
          </p>

          <div className="mt-8 space-y-5">
            {(["easy", "medium", "hard", "master"] as const).map((tier) => {
              const items = achievements.list.filter((a) => a.tier === tier);
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
                      <motion.span
                        aria-hidden
                        initial={{ scale: 0.6, opacity: 0.6 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 1.6, ease: "easeOut" }}
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
                      const earnedTone: Record<typeof a.tone, string> = {
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
                      const isCelebrating = celebratingMilestones.has(a.id);
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
                              setOpenMilestoneId(isOpen ? null : a.id)
                            }
                            aria-expanded={isOpen}
                            aria-controls={`milestone-detail-${a.id}`}
                            className="flex w-full items-center gap-2.5 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                          >
                            {isCelebrating && (
                              <motion.span
                                aria-hidden
                                initial={{ scale: 0.4, opacity: 0.7 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 1.4, ease: "easeOut" }}
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
                                id={`milestone-detail-${a.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default MilestonesPage;
