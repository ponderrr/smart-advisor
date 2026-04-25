"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
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
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import {
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUser,
  SidebarNavShell,
} from "@/components/sidebar-nav";
import {
  databaseService,
  FilterOptions,
} from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { libraryService } from "@/features/library/services/library-service";
import {
  RATING_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type LibraryItem,
} from "@/features/library/types/library";
import { LogToLibraryButton } from "@/features/library/components/log-to-library-button";
import { PillButton } from "@/components/ui/pill-button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
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
  libraryEntry,
  onClose,
}: {
  rec: Recommendation;
  libraryEntry: LibraryItem | null;
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

        {libraryEntry && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-800/40">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              In your library
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                STATUS_TONE[libraryEntry.status].chip,
              )}
            >
              {STATUS_LABELS[libraryEntry.status]}
            </span>
            {libraryEntry.rating !== null && (
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                · {RATING_LABELS[libraryEntry.rating]}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <LogToLibraryButton
            medium={rec.type}
            title={rec.title}
            creator={rec.author ?? rec.director ?? null}
            year={rec.year ?? null}
            poster_url={rec.poster_url ?? null}
            source_recommendation_id={rec.id}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
  );
};

const AccountHistoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const historyTabs = ["all", "movies", "books", "favorites"] as const;
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(historyTabs).withDefault("all"),
  );
  // Filter transitions always slide rightward — entering content starts on
  // the left and moves to center — so the motion feels consistent regardless
  // of which filter the user came from.
  const filterSlideDir = -1;
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  // Index by source_recommendation_id and (medium, lower(title)) so the
  // modal can show "In your library: …" without re-querying per click.
  const libraryByRec = useMemo(() => {
    const bySource = new Map<string, LibraryItem>();
    const byTitle = new Map<string, LibraryItem>();
    for (const item of libraryItems) {
      if (item.source_recommendation_id) {
        bySource.set(item.source_recommendation_id, item);
      }
      byTitle.set(`${item.medium}::${item.title.toLowerCase()}`, item);
    }
    return { bySource, byTitle };
  }, [libraryItems]);

  const matchLibrary = useCallback(
    (rec: Recommendation): LibraryItem | null =>
      libraryByRec.bySource.get(rec.id) ??
      libraryByRec.byTitle.get(
        `${rec.type}::${rec.title.toLowerCase()}`,
      ) ??
      null,
    [libraryByRec],
  );

  useEffect(() => {
    if (!ready) return;
    void libraryService.list().then(({ data }) => setLibraryItems(data));
  }, [ready]);

  // Virtual scroll setup — uses the window scroll so the global navbar's
  // scroll-blur logic still fires on this page.
  const listRef = useRef<HTMLDivElement>(null);
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

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    // Reasonable seed value — measureElement on each row replaces this with
    // the actual rendered height as soon as the row is on screen, so the
    // initial estimate only needs to be in the ballpark.
    estimateSize: () => 440,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

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
      toast.success("Recommendation removed from your history");
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
      toast.error("Couldn't clear your history — please try again");
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
    return <PageLoader text="Loading..." />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                History
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
                Your suggestion history
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Everything the AI has picked for you. Mark a favorite to keep
                it close, or log one to your library to teach the AI how you
                felt.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {recommendations.length > 0 && (
                <PillButton
                  onClick={handleClearAll}
                  variant="destructive"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  <Trash2 size={14} />
                  Clear All
                </PillButton>
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

          {/* Sidebar + content layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell>
              <nav aria-label="History filters" className="flex-1">
                <SidebarNavGroup label="Filters" />
                {[
                  { id: "all" as const, label: "All", icon: <LayoutGrid size={16} /> },
                  { id: "movies" as const, label: "Movies", icon: <Film size={16} /> },
                  { id: "books" as const, label: "Books", icon: <BookOpen size={16} /> },
                  { id: "favorites" as const, label: "Favorites", icon: <Star size={16} /> },
                ].map((tab) => (
                  <SidebarNavItem
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    active={filter === tab.id}
                    onClick={() => setFilter(tab.id)}
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
            </div>
          ) : (
            <div ref={listRef}>
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
                      data-index={virtualRow.index}
                      ref={(el) => {
                        if (el) rowVirtualizer.measureElement(el);
                      }}
                      className="absolute left-0 top-0 grid w-full items-start gap-2 pb-2"
                      style={{
                        transform: `translateY(${virtualRow.start - (rowVirtualizer.options.scrollMargin ?? 0)}px)`,
                        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                      }}
                    >
                      {rowItems.map((rec) => (
                        <article
                          key={rec.id}
                          className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Open details for ${rec.title}`}
                            className="relative aspect-[2/3] cursor-pointer overflow-hidden bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
                            onClick={() => setSelectedRec(rec)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedRec(rec);
                              }
                            }}
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
                              <div className="mt-2 flex items-center justify-end">
                                <span className="text-xs text-white/80">
                                  {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                              {rec.explanation || rec.description || `A tailored ${rec.type} recommendation based on your recent quiz choices.`}
                            </p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <PillButton
                                onClick={() => handleToggleFavorite(rec.id)}
                                aria-label={rec.is_favorited ? "Remove from favorites" : "Add to favorites"}
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-full p-0",
                                  rec.is_favorited ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                )}
                              >
                                <Heart size={13} fill={rec.is_favorited ? "currentColor" : "none"} />
                              </PillButton>
                              <PillButton
                                onClick={() => handleDeleteRecommendation(rec.id)}
                                variant="destructive"
                                aria-label="Delete"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full p-0"
                              >
                                <Trash2 size={13} />
                              </PillButton>
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
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRec && (
          <RecommendationModal
            rec={selectedRec}
            libraryEntry={matchLibrary(selectedRec)}
            onClose={() => setSelectedRec(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountHistoryPage;
