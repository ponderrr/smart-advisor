"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
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
import { MfaSetupPrompt } from "@/components/mfa-setup-prompt";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
});

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
      setRecommendations(error ? [] : data);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  const genreChartData = useMemo(() => {
    const byGenre = new Map<string, { genre: string; movie: number; book: number; total: number }>();
    recommendations.forEach((rec) => {
      const genres = Array.isArray(rec.genres) && rec.genres.length > 0
        ? rec.genres.flatMap((g) => g.split(/[,&/|]/g)).map((g) => g.trim()).filter(Boolean)
        : ["Other"];
      genres.forEach((genre) => {
        const label = genre.length > 14 ? `${genre.slice(0, 14).trim()}…` : genre;
        const cur = byGenre.get(label) ?? { genre: label, movie: 0, book: 0, total: 0 };
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <Navbar>
        <NavBody>
          <div className="flex w-[320px] shrink-0 items-center">
            <NavbarLogo />
          </div>
          <div className="flex flex-1 justify-center">
            <NavItems items={navItems} className="justify-center px-2" />
          </div>
          <div className="flex w-[320px] shrink-0 items-center justify-end gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
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
            {navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => { router.push(item.link); setIsMobileMenuOpen(false); }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
            <button
              type="button"
              onClick={async () => { await handleSignOut(); setIsMobileMenuOpen(false); }}
              className="text-left text-xl font-black tracking-tight text-rose-600 dark:text-rose-400"
            >
              Sign Out
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div {...fadeUp(0)} className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                Dashboard
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">
                Welcome{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
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
          </motion.div>

          {/* Stats Row */}
          <motion.div {...fadeUp(0.05)} className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Picks", value: stats.total, icon: TrendingUp, color: "text-indigo-500" },
              { label: "Movies", value: stats.movies, icon: Film, color: "text-violet-500" },
              { label: "Books", value: stats.books, icon: BookOpen, color: "text-emerald-500" },
              { label: "Favorites", value: stats.favorites, icon: Sparkles, color: "text-amber-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60"
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
          </motion.div>

          {/* Quick Actions */}
          <motion.div {...fadeUp(0.1)} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Account Settings", desc: "Update profile and preferences.", icon: Settings, href: "/settings" },
              { title: "Latest Results", desc: "Jump to your latest picks.", icon: Sparkles, href: "/results" },
              { title: "History", desc: "Browse past recommendations.", icon: Clock, href: "/history" },
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
                  <card.icon size={18} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold tracking-tight">{card.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
                </div>
                <ArrowRight size={14} className="mt-1 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </motion.div>

          {/* Two-column: Chart + Recent */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Genre Chart */}
            <motion.section
              {...fadeUp(0.15)}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60 lg:col-span-2"
            >
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" />
                <h2 className="text-lg font-bold tracking-tight">Genre Breakdown</h2>
              </div>

              {loading ? (
                <div className="flex h-56 items-center justify-center text-sm text-slate-400">Loading...</div>
              ) : genreChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                  Take a quiz to see your genres.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barGap={4}>
                      <XAxis
                        dataKey="genre"
                        tick={{ fill: "currentColor", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        className="text-slate-500 dark:text-slate-400"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "currentColor", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        className="text-slate-500 dark:text-slate-400"
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid rgba(148, 163, 184, 0.25)",
                          background: "rgba(15, 23, 42, 0.92)",
                          color: "#fff",
                          fontSize: "12px",
                          padding: "8px 12px",
                        }}
                      />
                      <Bar dataKey="movie" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} name="Movies" />
                      <Bar dataKey="book" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} name="Books" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.section>

            {/* Recent Recommendations */}
            <motion.section
              {...fadeUp(0.2)}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60 lg:col-span-3"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <h2 className="text-lg font-bold tracking-tight">Recent Picks</h2>
                </div>
                <button
                  onClick={() => router.push("/history")}
                  className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
                >
                  See all
                </button>
              </div>

              {loading ? (
                <div className="flex h-56 items-center justify-center text-sm text-slate-400">Loading...</div>
              ) : recommendations.length === 0 ? (
                <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
                  <Sparkles size={24} className="text-slate-300 dark:text-slate-600" />
                  <p>No recommendations yet. Start a quiz!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                  {recommendations.slice(0, 8).map((rec) => (
                    <article
                      key={rec.id}
                      className="group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                        {rec.poster_url ? (
                          <img
                            src={rec.poster_url}
                            alt={rec.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            {rec.type === "movie" ? <Film size={24} /> : <BookOpen size={24} />}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                          <p className="line-clamp-2 text-sm font-bold leading-tight text-white">{rec.title}</p>
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/90">
                            {rec.type === "movie" ? <Film size={10} /> : <BookOpen size={10} />}
                            {rec.type}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </main>

      <MfaSetupPrompt userId={user?.id} />
    </div>
  );
};

export default DashboardPage;
