"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import Image from "next/image";
import {
  BookOpen,
  Film,
  Heart,
  Sparkles,
  Trash2,
  LayoutGrid,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import {
  databaseService,
  FilterOptions,
} from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
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
import { toast } from "sonner";

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

const HistoryShimmerLoader = () => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65"
        >
          <div className="shimmer-container aspect-[2/3] rounded-2xl" />
          <div className="mt-3 space-y-2">
            <div className="shimmer-container h-4 w-4/5 rounded-full" />
            <div className="shimmer-container h-3 w-3/5 rounded-full" />
            <div className="shimmer-container h-8 rounded-xl" />
            <div className="flex gap-2">
              <div className="shimmer-container h-7 w-1/2 rounded-full" />
              <div className="shimmer-container h-7 w-1/2 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
              {rec.type === "movie" ? <Film size={10} /> : <BookOpen size={10} />}
              {rec.type}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="text-2xl font-black tracking-tight">{rec.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {rec.author ? `By ${rec.author}` : rec.director ? `Directed by ${rec.director}` : ""}
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

const AccountHistoryPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { ready } = useRequireAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const historyTabs = ["all", "movies", "books", "favorites"] as const;
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(historyTabs).withDefault("all"),
  );
  const prevFilterIdx = useRef(0);
  const filterSlideDir = historyTabs.indexOf(filter) >= prevFilterIdx.current ? 1 : -1;
  useEffect(() => {
    prevFilterIdx.current = historyTabs.indexOf(filter);
  }, [filter]);
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  // Virtual scroll setup
  const scrollRef = useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = useState(2);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setColCount(5);
      else if (w >= 768) setColCount(3);
      else setColCount(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rowCount = Math.ceil(recommendations.length / colCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 420,
    overscan: 3,
  });

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

        const { data, error } =
          await databaseService.getUserRecommendations(filterConfig);

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
    if (error) {
      toast.error("Couldn't update your favorite — please try again");
    } else {
      const rec = recommendations.find((r) => r.id === recommendationId);
      toast.success(
        rec?.is_favorited ? "Removed from favorites" : "Added to favorites",
      );
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recommendationId
            ? { ...r, is_favorited: !r.is_favorited }
            : r,
        ),
      );
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    const shouldDelete = window.confirm("Delete this recommendation?");
    if (!shouldDelete) return;

    const { error } =
      await databaseService.deleteRecommendation(recommendationId);
    if (error) {
      toast.error("Couldn't remove that recommendation — please try again");
    } else {
      toast.success("Recommendation removed from your library");
      setRecommendations((prev) =>
        prev.filter((rec) => rec.id !== recommendationId),
      );
    }
  };

  const handleClearAll = async () => {
    const shouldClear = window.confirm(
      "Are you sure you want to delete all recommendations? This cannot be undone.",
    );
    if (!shouldClear) return;

    const { error } = await databaseService.deleteAllRecommendations();
    if (error) {
      toast.error("Couldn't clear your library — please try again");
    } else {
      toast.success("All recommendations cleared");
      setRecommendations([]);
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

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

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

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                History
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">
                Your Recommendation Library
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Browse everything you have saved and refine what you keep.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {recommendations.length > 0 && (
                <GlowPillButton
                  onClick={handleClearAll}
                  variant="destructive"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  <Trash2 size={14} />
                  Clear All
                </GlowPillButton>
              )}
              <HoverBorderGradient
                onClick={() => router.push("/content-selection")}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="99, 102, 241"
                darkHighlightColor="129, 140, 248"
                containerClassName="rounded-full w-fit"
                className="flex items-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
              >
                <Sparkles size={16} />
                Start Quiz
              </HoverBorderGradient>
            </div>
          </div>

          {/* Tab Navigation */}
          <AnimatedTabs
            tabs={[
              { id: "all" as const, label: "All", icon: <LayoutGrid size={15} /> },
              { id: "movies" as const, label: "Movies", icon: <Film size={15} /> },
              { id: "books" as const, label: "Books", icon: <BookOpen size={15} /> },
              { id: "favorites" as const, label: "Favorites", icon: <Star size={15} /> },
            ]}
            activeTab={filter}
            onTabChange={(tab) => setFilter(tab)}
          />

          {/* Stats + Sort */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {[
                { label: "Total", value: stats.total },
                { label: "Favorites", value: stats.favorites },
                { label: "Movies", value: stats.movies },
                { label: "Books", value: stats.books },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-lg font-black tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                aria-label="Sort recommendations"
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

          {/* Card Grid */}
          <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, x: filterSlideDir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: filterSlideDir * -30 }}
            transition={{ duration: 0.2 }}
          >
          {loading ? (
            <HistoryShimmerLoader />
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
              <h2 className="text-2xl font-black tracking-tight">
                No recommendations found
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Try a different filter or generate a fresh recommendation set.
              </p>
              <GlowPillButton
                onClick={() => router.push("/content-selection")}
                className="mt-5 bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Start New Quiz
              </GlowPillButton>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="h-[calc(100vh-340px)] overflow-auto"
            >
              <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIdx = virtualRow.index * colCount;
                  const rowItems = recommendations.slice(startIdx, startIdx + colCount);
                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute left-0 top-0 grid w-full gap-3"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                      }}
                    >
                      {rowItems.map((rec) => (
                        <article
                          key={rec.id}
                          className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <div
                            className="relative aspect-[2/3] cursor-pointer overflow-hidden bg-slate-200 dark:bg-slate-800"
                            onClick={() => setSelectedRec(rec)}
                          >
                            {rec.poster_url ? (
                              <Image
                                src={rec.poster_url}
                                alt={rec.title}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                                  {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-300">
                              {rec.explanation || rec.description || `A tailored ${rec.type} recommendation based on your recent quiz choices.`}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <GlowPillButton
                                onClick={() => handleToggleFavorite(rec.id)}
                                className={cn(
                                  "inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold",
                                  rec.is_favorited ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                )}
                              >
                                <Heart size={12} fill={rec.is_favorited ? "currentColor" : "none"} />
                                Favorite
                              </GlowPillButton>
                              <GlowPillButton
                                onClick={() => handleDeleteRecommendation(rec.id)}
                                variant="destructive"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                              >
                                <Trash2 size={12} />
                                Delete
                              </GlowPillButton>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </motion.div>
          </AnimatePresence>
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
    </div>
  );
};

export default AccountHistoryPage;
