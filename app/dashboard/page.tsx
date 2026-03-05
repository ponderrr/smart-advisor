"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Film, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { databaseService } from "@/features/recommendations/services/database-service";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error } = await databaseService.getUserRecommendations({
        sortBy: "newest",
        limit: 36,
      });

      if (!active) return;

      if (error) {
        setRecommendations([]);
      } else {
        setRecommendations(data);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const genreChartData = useMemo(() => {
    const byGenre = new Map<string, { genre: string; movie: number; book: number; total: number }>();

    recommendations.forEach((rec) => {
      const normalizedGenres =
        Array.isArray(rec.genres) && rec.genres.length > 0
          ? rec.genres
            .flatMap((g) => g.split(/[,&/|]/g))
            .map((g) => g.trim())
            .filter(Boolean)
          : ["Other"];

      normalizedGenres.forEach((genre) => {
        const label =
          genre.length > 16 ? `${genre.slice(0, 16).trim()}...` : genre;
        const current = byGenre.get(label) ?? {
          genre: label,
          movie: 0,
          book: 0,
          total: 0,
        };

        if (rec.type === "movie") current.movie += 1;
        if (rec.type === "book") current.book += 1;
        current.total += 1;
        byGenre.set(label, current);
      });
    });

    return [...byGenre.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [recommendations]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const dashboardNavItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex w-[320px] shrink-0 items-center">
            <NavbarLogo />
          </div>

          <div className="flex flex-1 justify-center">
            <NavItems items={dashboardNavItems} className="justify-center px-2" />
          </div>

          <div className="flex w-[320px] shrink-0 items-center justify-end gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen}>
            {dashboardNavItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  router.push(item.link);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
            <button
              type="button"
              onClick={async () => {
                await handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-rose-600 dark:text-rose-400"
            >
              Sign Out
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Dashboard
              </p>
              <h1 className="mt-3 text-5xl font-black tracking-tighter md:text-6xl">
                Welcome{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
                Continue where you left off, or start a new recommendation quiz.
              </p>
            </div>
            <div className="md:pb-1">
              <HoverBorderGradient
                onClick={() => router.push("/content-selection")}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="139, 92, 246"
                darkHighlightColor="167, 139, 250"
                containerClassName="rounded-full w-fit"
                className="whitespace-nowrap bg-white px-12 py-5 text-xl font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                Start Quiz
              </HoverBorderGradient>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <button
              onClick={() => router.push("/settings")}
              className={cn(
                "rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg",
                "dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
              )}
            >
              <h3 className="mb-3 text-xl font-black tracking-tight">Account Settings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Update your profile details and preferences.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Go <ArrowRight size={14} />
              </span>
            </button>

            <button
              onClick={() => router.push("/results")}
              className={cn(
                "rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg",
                "dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
              )}
            >
              <h3 className="mb-3 text-xl font-black tracking-tight">View Latest Results</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Jump into your latest recommendation set.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Continue <ArrowRight size={14} />
              </span>
            </button>

            <button
              onClick={() => router.push("/history")}
              className={cn(
                "rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg",
                "dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
              )}
            >
              <h3 className="mb-3 text-xl font-black tracking-tight">View History</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Review favorites and past recommendations.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Open <ArrowRight size={14} />
              </span>
            </button>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mb-10 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 md:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Favorite Genres
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Your movie and book mix based on recent recommendations.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Building your genre graph...
              </p>
            ) : genreChartData.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Take a quiz to see your genre graph here.
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={genreChartData}
                    margin={{ top: 10, right: 14, left: -20, bottom: 0 }}
                    barGap={6}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-slate-200/70 dark:text-slate-700/70"
                    />
                    <XAxis
                      dataKey="genre"
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      className="text-slate-600 dark:text-slate-300"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      className="text-slate-600 dark:text-slate-300"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid rgba(148, 163, 184, 0.35)",
                        background: "rgba(15, 23, 42, 0.92)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="movie"
                      stackId="a"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      name="Movies"
                    />
                    <Bar
                      dataKey="book"
                      stackId="a"
                      fill="#22c55e"
                      radius={[6, 6, 0, 0]}
                      name="Books"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight">Recent Recommendations</h2>
              <button
                onClick={() => router.push("/history")}
                className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                See all
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-slate-600 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300">
                Loading your recent recommendations...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center text-slate-600 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300">
                No recommendations yet. Start a quiz to generate your first set.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {recommendations.slice(0, 8).map((rec) => (
                  <article
                    key={rec.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                      {rec.poster_url ? (
                        <img
                          src={rec.poster_url}
                          alt={rec.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
                          {rec.type === "movie" ? <Film size={28} /> : <BookOpen size={28} />}
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4">
                        <p className="line-clamp-2 text-base font-black tracking-tight text-white">{rec.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white">
                            {rec.type === "movie" ? <Film size={12} /> : <BookOpen size={12} />}
                            {rec.type}
                          </span>
                          {typeof rec.rating === "number" && (
                            <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white">
                              {rec.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-300">
                        {rec.explanation || rec.description || `A tailored ${rec.type} recommendation based on your recent quiz choices.`}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main >
    </div >
  );
};

export default DashboardPage;
