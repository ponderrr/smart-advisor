"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    // Focus the modal container on mount
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${rec.title}`}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/70 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-900 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
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
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Why this pick
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {rec.explanation}
              </p>
            </div>
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
      </motion.div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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
      const { data, error } = await databaseService.getUserRecommendations({
        sortBy: "newest",
        limit: 36,
      });
      if (!active) return;
      setRecommendations(error ? [] : data);
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
              <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
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
                    className="space-y-4"
                  >
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                      {[
                        {
                          label: "Total Picks",
                          value: stats.total,
                          icon: TrendingUp,
                          color: "text-indigo-500",
                        },
                        {
                          label: "Movies",
                          value: stats.movies,
                          icon: Film,
                          color: "text-violet-500",
                        },
                        {
                          label: "Books",
                          value: stats.books,
                          icon: BookOpen,
                          color: "text-emerald-500",
                        },
                        {
                          label: "Favorites",
                          value: stats.favorites,
                          icon: Sparkles,
                          color: "text-amber-500",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:p-4 dark:border-slate-700/60 dark:bg-slate-900/60"
                        >
                          <div className="flex items-center gap-2">
                            <stat.icon size={15} className={stat.color} />
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {stat.label}
                            </span>
                          </div>
                          <p className="mt-2 text-2xl font-black tracking-tight">
                            {loading ? "–" : stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                      {[
                        {
                          title: "Account Settings",
                          desc: "Update profile and preferences.",
                          icon: Settings,
                          href: "/settings",
                        },
                        {
                          title: "Latest Results",
                          desc: "Jump to your latest picks.",
                          icon: Sparkles,
                          href: "/history",
                        },
                        {
                          title: "History",
                          desc: "Browse past recommendations.",
                          icon: Clock,
                          href: "/history",
                        },
                      ].map((card) => (
                        <button
                          key={card.title}
                          onClick={() => router.push(card.href)}
                          className={cn(
                            "group flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md",
                            "dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-indigo-500/50",
                          )}
                        >
                          <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
                            <card.icon
                              size={18}
                              className="text-slate-600 dark:text-slate-300"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold tracking-tight">
                              {card.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {card.desc}
                            </p>
                          </div>
                          <ArrowRight
                            size={14}
                            className="mt-1 text-slate-400 transition-transform group-hover:translate-x-0.5"
                          />
                        </button>
                      ))}
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
                  >
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">
                          Recent Picks
                        </h2>
                        <button
                          onClick={() => router.push("/history")}
                          className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
                        >
                          See all in history
                        </button>
                      </div>
                      {loading ? (
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
                            >
                              <div className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800" />
                            </div>
                          ))}
                        </div>
                      ) : recommendations.length === 0 ? (
                        <div className="flex h-56 flex-col items-center justify-center gap-3 px-6 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-xl font-bold tracking-tight">
                            No recommendations yet. Start a quiz!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {recommendations.slice(0, 15).map((rec) => (
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
                              className="group cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/40 dark:focus-visible:ring-offset-slate-950"
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
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                                  <p className="line-clamp-2 text-sm font-bold leading-tight text-white">
                                    {rec.title}
                                  </p>
                                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/90">
                                    {rec.type === "movie" ? (
                                      <Film size={10} />
                                    ) : (
                                      <BookOpen size={10} />
                                    )}
                                    {rec.type}
                                  </span>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "genres" && (
                  <motion.div
                    key="genres"
                    initial={{ opacity: 0, x: slideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * -30 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-500" />
                        <h2 className="text-lg font-bold tracking-tight">
                          Genre Breakdown
                        </h2>
                      </div>
                      {loading ? (
                        <div className="flex h-72 items-end gap-3 px-4 pb-4">
                          {[0.6, 0.8, 0.45, 0.7, 0.55, 0.35].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 animate-pulse rounded-t-md bg-slate-200 dark:bg-slate-800"
                              style={{ height: `${h * 100}%` }}
                            />
                          ))}
                        </div>
                      ) : genreChartData.length === 0 ? (
                        <div className="flex h-72 items-center justify-center px-6 text-center text-xl font-bold tracking-tight text-slate-500 dark:text-slate-400">
                          Take a quiz to see your genres.
                        </div>
                      ) : (
                        <GenrePieChart data={genreChartData} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRec && (
          <RecommendationModal
            rec={selectedRec}
            onClose={() => setSelectedRec(null)}
          />
        )}
      </AnimatePresence>

      <MfaSetupPrompt userId={user?.id} />
    </div>
  );
};

export default DashboardPage;
