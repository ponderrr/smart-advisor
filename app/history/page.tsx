'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/navigation';
import { BookOpen, Film, Heart, LogOut, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { databaseService, FilterOptions } from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { ThemeToggle } from "@/components/theme-toggle";
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

type HistoryFilter = "all" | "movies" | "books" | "favorites";
type SortMode = "newest" | "oldest" | "favorites_first";

const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movies", label: "Movies" },
  { value: "books", label: "Books" },
  { value: "favorites", label: "Favorites" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "favorites_first", label: "Favorites First" },
];

const AccountHistoryPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortMode>("newest");

  const historyNavItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);

        const filterConfig: FilterOptions = { sortBy };
        if (filter === "movies") filterConfig.contentType = "movie";
        if (filter === "books") filterConfig.contentType = "book";
        if (filter === "favorites") filterConfig.isFavorited = true;

        const { data, error } = await databaseService.getUserRecommendations(filterConfig);

        if (error) {
          console.error("Error loading recommendations:", error);
          setRecommendations([]);
        } else {
          setRecommendations(data);
        }
      } catch (error) {
        console.error("Error loading recommendations:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [filter, sortBy]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleToggleFavorite = async (recommendationId: string) => {
    const { error } = await databaseService.toggleFavorite(recommendationId);
    if (!error) {
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, is_favorited: !rec.is_favorited }
            : rec,
        ),
      );
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    const shouldDelete = window.confirm("Delete this recommendation?");
    if (!shouldDelete) return;

    const { error } = await databaseService.deleteRecommendation(recommendationId);
    if (!error) {
      setRecommendations((prev) => prev.filter((rec) => rec.id !== recommendationId));
    }
  };

  const stats = useMemo(() => {
    const favorites = recommendations.filter((rec) => rec.is_favorited).length;
    const movies = recommendations.filter((rec) => rec.type === "movie").length;
    const books = recommendations.filter((rec) => rec.type === "book").length;
    return {
      total: recommendations.length,
      favorites,
      movies,
      books,
    };
  }, [recommendations]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex w-[320px] shrink-0 items-center">
            <NavbarLogo />
          </div>

          <div className="flex flex-1 justify-center">
            <NavItems items={historyNavItems} className="justify-center px-2" />
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
            {historyNavItems.map((item) => (
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
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                History
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tighter md:text-5xl">
                Your Recommendation Library
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
                Browse everything you have saved and refine what you keep.
              </p>
            </div>
            <button
              onClick={() => router.push('/content-selection')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus size={16} />
              Get New Recommendation
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: stats.total },
              { label: "Favorites", value: stats.favorites },
              { label: "Movies", value: stats.movies },
              { label: "Books", value: stats.books },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    filter === opt.value
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-slate-600 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300">
              Loading your recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
              <h2 className="text-2xl font-black tracking-tight">
                No recommendations found
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Try a different filter or generate a fresh recommendation set.
              </p>
              <button
                onClick={() => router.push('/content-selection')}
                className="mt-5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Start New Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {recommendations.map((rec) => (
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

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                      <p className="line-clamp-2 text-base font-black tracking-tight text-white">{rec.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white">
                          {rec.type === "movie" ? <Film size={12} /> : <BookOpen size={12} />}
                          {rec.type}
                        </span>
                        <span className="text-xs text-white/80">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-300">
                      {rec.explanation || rec.description || `A tailored ${rec.type} recommendation based on your recent quiz choices.`}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleFavorite(rec.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                          rec.is_favorited
                            ? "bg-rose-500 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                        )}
                      >
                        <Heart size={12} fill={rec.is_favorited ? "currentColor" : "none"} />
                        Favorite
                      </button>

                      <button
                        onClick={() => handleDeleteRecommendation(rec.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountHistoryPage;
