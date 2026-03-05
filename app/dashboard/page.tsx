'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Film, Heart, LogOut, Sparkles } from "lucide-react";
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
        limit: 6,
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const dashboardNavItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Start Quiz", link: "/content-selection" },
    { name: "History", link: "/history" },
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
              className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <HoverBorderGradient
              onClick={() => router.push("/content-selection")}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="rounded-full"
              className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
            >
              Start Quiz
            </HoverBorderGradient>
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
            <HoverBorderGradient
              onClick={() => {
                router.push("/content-selection");
                setIsMobileMenuOpen(false);
              }}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="mt-2 w-full rounded-full"
              className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
            >
              Start Quiz
            </HoverBorderGradient>
            <button
              type="button"
              onClick={async () => {
                await handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
            >
              Sign Out
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tighter md:text-5xl">
              Welcome{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Continue where you left off, or start a new recommendation quiz.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={() => router.push("/content-selection")}
              className={cn(
                "rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg",
                "dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
              )}
            >
              <div className="mb-3 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={16} />
                <span className="text-sm font-bold">Start New Quiz</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Get fresh picks based on your current mood.</p>
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
              <div className="mb-3 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Film size={16} />
                <span className="text-sm font-bold">View Latest Results</span>
              </div>
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
              <div className="mb-3 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Heart size={16} />
                <span className="text-sm font-bold">View History</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Review favorites and past recommendations.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Open <ArrowRight size={14} />
              </span>
            </button>
          </div>

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
                {recommendations.slice(0, 6).map((rec) => (
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
      </main>
    </div>
  );
};

export default DashboardPage;
