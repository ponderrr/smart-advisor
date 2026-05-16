"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  Flame,
  Heart,
  Loader2,
  Music,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMessages, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { databaseService } from "@/features/recommendations/services/database-service";
import { libraryService } from "@/features/library/services/library-service";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import type { LibraryItem } from "@/features/library/types/library";

import { Dialog } from "@/components/ui/dialog";
import { PageLoader } from "@/components/ui/loader";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  FALLBACK_MONTHS,
  STEPS,
  type StoryStep,
  type StoryStats,
} from "./_lib/story";
import { nativeShareOrCopy } from "@/lib/share";

const SWIPE_THRESHOLD = 50;
/** How long each card stays before auto-advancing (after Press Play).
 *  Tuned by Spotify Wrapped — long enough to read the headline + scan
 *  the visual, short enough to keep momentum. */
const STEP_DURATION_MS = 5000;

const WrappedPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const t = useTranslations("Wrapped");
  const messages = useMessages() as { Wrapped?: { months?: string[] } };
  const monthLabels = messages.Wrapped?.months ?? FALLBACK_MONTHS;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const [year, setYear] = useQueryState(
    "y",
    parseAsInteger.withDefault(defaultYear),
  );

  // Step index. Year change resets to intro so the story restarts from
  // the top whenever the user picks a different year.
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    setStepIdx(0);
  }, [year]);

  // Auto-advance kicks in once the user has moved past the intro. Outro
  // stops the chain so the final card stays put for the share CTA.
  const isPlaying = stepIdx > 0 && stepIdx < STEPS.length - 1;

  // Share-token state (mints lazily on dialog open, cached per year).
  const [showShare, setShowShare] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareTokenYear, setShareTokenYear] = useState<number | null>(null);
  const [shareTokenLoading, setShareTokenLoading] = useState(false);

  // Year picker dropdown (rendered as a chip in the chrome).
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Native OS share sheet — resolved after mount to avoid SSR mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator?.share === "function");
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: recs }, { data: lib }] = await Promise.all([
        databaseService.getUserRecommendations({
          sortBy: "newest",
          limit: 5000,
        }),
        libraryService.list(),
      ]);
      if (cancelled) return;
      setRecommendations(recs);
      setLibraryItems(lib);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    recommendations.forEach((r) =>
      set.add(new Date(r.created_at).getFullYear()),
    );
    libraryItems.forEach((i) => set.add(new Date(i.logged_at).getFullYear()));
    if (set.size === 0) set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [recommendations, libraryItems, currentYear]);

  const stats = useMemo<StoryStats>(() => {
    const yearRecs = recommendations.filter(
      (r) => new Date(r.created_at).getFullYear() === year,
    );
    const yearLibrary = libraryItems.filter(
      (i) => new Date(i.logged_at).getFullYear() === year,
    );

    const movies = yearRecs.filter((r) => r.type === "movie").length;
    const books = yearRecs.filter((r) => r.type === "book").length;
    const music = yearRecs.filter((r) => r.type === "music").length;
    const favorites = yearRecs.filter((r) => r.is_favorited).length;
    const watchHours = Math.round((movies * 110) / 60);

    const genreCounts = new Map<string, number>();
    yearRecs.forEach((r) => {
      (r.genres ?? []).forEach((g) => {
        const k = g.trim();
        if (!k) return;
        genreCounts.set(k, (genreCounts.get(k) ?? 0) + 1);
      });
    });
    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const creatorCounts = new Map<
      string,
      { name: string; type: "director" | "author" | "artist"; count: number }
    >();
    yearRecs.forEach((r) => {
      const name = r.director || r.author || r.artist;
      if (!name) return;
      const role: "director" | "author" | "artist" = r.director
        ? "director"
        : r.author
          ? "author"
          : "artist";
      const key = `${role}::${name.toLowerCase()}`;
      const cur = creatorCounts.get(key) ?? { name, type: role, count: 0 };
      cur.count += 1;
      creatorCounts.set(key, cur);
    });
    const topCreator =
      [...creatorCounts.values()].sort((a, b) => b.count - a.count)[0] ??
      null;

    const monthly = new Array(12).fill(0) as number[];
    yearRecs.forEach((r) => {
      const m = new Date(r.created_at).getMonth();
      monthly[m] += 1;
    });
    const peakMonth = monthly.reduce(
      (best, count, idx) =>
        count > best.count ? { idx, count } : best,
      { idx: 0, count: 0 },
    );

    const dayKeys = new Set<string>();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    yearRecs.forEach((r) => dayKeys.add(fmt(new Date(r.created_at))));
    yearLibrary.forEach((i) => dayKeys.add(fmt(new Date(i.logged_at))));
    const startOfYear = new Date(year, 0, 1);
    const endOfYear =
      year === currentYear ? new Date() : new Date(year, 11, 31);
    let longest = 0;
    let run = 0;
    const oneDay = 86400000;
    for (
      let tDay = startOfYear.getTime();
      tDay <= endOfYear.getTime();
      tDay += oneDay
    ) {
      if (dayKeys.has(fmt(new Date(tDay)))) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }

    const topPicks = [...yearRecs]
      .sort((a, b) => {
        if (a.is_favorited === b.is_favorited)
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        return a.is_favorited ? -1 : 1;
      })
      .slice(0, 6);

    // Poster pools. Favorites first so the most "earned" covers appear
    // when we sample a few; skip records without poster_url since they'd
    // render as a blank tile.
    const sortedForPosters = [...yearRecs].sort((a, b) => {
      if (a.is_favorited === b.is_favorited) return 0;
      return a.is_favorited ? -1 : 1;
    });
    const moviePosters = sortedForPosters
      .filter((r) => r.type === "movie" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);
    const bookPosters = sortedForPosters
      .filter((r) => r.type === "book" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);
    const musicPosters = sortedForPosters
      .filter((r) => r.type === "music" && r.poster_url)
      .slice(0, 4)
      .map((r) => r.poster_url as string);

    const creatorPosters = topCreator
      ? sortedForPosters
          .filter((r) => {
            const name = r.director || r.author || r.artist;
            return (
              name && name.toLowerCase() === topCreator.name.toLowerCase()
            );
          })
          .filter((r) => r.poster_url)
          .slice(0, 6)
          .map((r) => r.poster_url as string)
      : [];

    const allPosters = sortedForPosters
      .filter((r) => r.poster_url)
      .slice(0, 24)
      .map((r) => r.poster_url as string);

    return {
      total: yearRecs.length,
      movies,
      books,
      music,
      favorites,
      watchHours,
      topGenres,
      topCreator,
      monthly,
      peakMonth,
      longest,
      topPicks,
      libraryLogged: yearLibrary.length,
      moviePosters,
      bookPosters,
      musicPosters,
      creatorPosters,
      allPosters,
    };
  }, [recommendations, libraryItems, year, currentYear]);

  const totalSteps = STEPS.length;
  const goNext = useCallback(() => {
    setStepIdx((i) => Math.min(totalSteps - 1, i + 1));
  }, [totalSteps]);
  const goBack = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);
  const exit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Auto-advance timer. Cleared on step change, share dialog open, year
  // picker open, or unmount. Skipping manually (click/key) resets it.
  useEffect(() => {
    if (!isPlaying) return;
    if (showShare || showYearPicker) return;
    const timer = window.setTimeout(goNext, STEP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [stepIdx, isPlaying, showShare, showYearPicker, goNext]);

  // Keyboard navigation across the whole story.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showShare || showYearPicker) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goBack, exit, showShare, showYearPicker]);

  // Touch swipe — track start X and decide on touchend.
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (delta < -SWIPE_THRESHOLD) goNext();
    else if (delta > SWIPE_THRESHOLD) goBack();
    touchStartX.current = null;
  };

  const handleOpenShare = async () => {
    setShowShare(true);
    if (shareToken && shareTokenYear === year) return;
    setShareTokenLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error(t("share.signInRequired"));
        setShareTokenLoading(false);
        return;
      }
      const res = await fetch("/api/wrapped/share-token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t("share.failed"));
        setShareTokenLoading(false);
        return;
      }
      const { token } = (await res.json()) as { token: string };
      setShareToken(token);
      setShareTokenYear(year);
    } catch (err) {
      console.error("Failed to mint share token:", err);
      toast.error(t("share.failed"));
    } finally {
      setShareTokenLoading(false);
    }
  };

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/wrapped/share/${shareToken}`
      : null;

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("share.linkCopied"));
    } catch {
      toast.error(t("share.copyFailed"));
    }
  };

  const handleNativeShareLink = async () => {
    if (!shareUrl) return;
    const status = await nativeShareOrCopy({
      title: t("share.dialogTitle"),
      text: t("share.dialogSubtitle", { year }),
      url: shareUrl,
    });
    if (status === "copied") toast.success(t("share.linkCopied"));
    else if (status === "failed") toast.error(t("share.shareFailed"));
  };

  if (!ready || loading) return <PageLoader text={t("loading")} />;

  const displayName =
    user?.username || user?.name?.split(/\s+/)[0] || t("fallbackName");

  // Empty year: keep the existing card empty state. Story mode doesn't
  // make sense with zero data, and this is consistent with the dashboard
  // version we're replacing.
  if (stats.total === 0) {
    return (
      <div className="relative flex min-h-[100svh] flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <StoryChrome
          year={year}
          availableYears={availableYears}
          onPickYear={setYear}
          showYearPicker={showYearPicker}
          setShowYearPicker={setShowYearPicker}
          onShare={handleOpenShare}
          onExit={exit}
          currentStep={0}
          totalSteps={totalSteps}
          tStory={t}
          showProgress={false}
          isPlaying={false}
        />
        <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-24 sm:px-6">
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300/80 bg-white/60 p-12 text-center dark:border-slate-700/70 dark:bg-slate-900/40">
            <Sparkles className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-2xl font-black tracking-tight">
              {t("empty.title", { year })}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {year === currentYear ? t("empty.current") : t("empty.past")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[stepIdx];

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-slate-950 text-white antialiased">
      {/* Per-step gradient backdrop. Sits behind everything; cross-fades
          as the user advances so the room itself feels like it's
          changing color, not just the foreground card. */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className={cn(
            "pointer-events-none absolute inset-0 z-0 bg-gradient-to-br",
            stepBackgrounds[currentStep],
          )}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* Poster mosaic overlay — only on intro + outro, where we want the
          "wrapped" feeling of seeing the whole year's artwork in one
          glance. Sits above the gradient so it adds texture without
          drowning the color story. */}
      <AnimatePresence>
        {(currentStep === "intro" || currentStep === "outro") &&
          stats.allPosters.length > 0 && (
            <motion.div
              key={`mosaic-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-[1]"
              aria-hidden="true"
            >
              <PosterMosaic posters={stats.allPosters} />
            </motion.div>
          )}
      </AnimatePresence>

      <StoryChrome
        year={year}
        availableYears={availableYears}
        onPickYear={setYear}
        showYearPicker={showYearPicker}
        setShowYearPicker={setShowYearPicker}
        onShare={handleOpenShare}
        onExit={exit}
        currentStep={stepIdx}
        totalSteps={totalSteps}
        tStory={t}
        showProgress
        isPlaying={isPlaying}
      />

      {/* Tap zones. Left third = back, rest = forward. Sit between the
          backdrop and the card content so taps anywhere on the body
          advance, but interactive elements (Share CTA, year chip, etc.)
          still intercept clicks via z-index. */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Previous"
        className="absolute inset-y-0 left-0 z-10 w-1/3"
      />
      <button
        type="button"
        onClick={goNext}
        aria-label="Next"
        className="absolute inset-y-0 right-0 z-10 w-2/3"
      />

      {/* Desktop chevron affordances. Always visible at low opacity so
          first-time users see that they can navigate without having to
          guess the keyboard shortcuts; brighten on hover. Hidden on
          mobile where the tap zones + swipe already do the job. */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Previous step"
        className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:text-white sm:flex disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/10"
        disabled={stepIdx === 0}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next step"
        className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:text-white sm:flex disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/10"
        disabled={stepIdx === STEPS.length - 1}
      >
        <ChevronRight size={18} />
      </button>

      <main
        className="relative z-20 flex flex-1 items-center justify-center px-6 pb-16 pt-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            // pointer-events-none on the wrapper, pointer-events-auto on
            // the actual card — lets the tap zones behind work everywhere
            // EXCEPT over interactive bits we explicitly opt back in.
            className="pointer-events-none w-full max-w-3xl text-center"
          >
            {currentStep === "intro" && (
              <IntroCard
                name={displayName}
                year={year}
                onAdvance={goNext}
                tStory={t}
              />
            )}
            {currentStep === "total" && (
              <TotalCard stats={stats} tStory={t} />
            )}
            {currentStep === "format" && (
              <FormatCard stats={stats} tStory={t} />
            )}
            {currentStep === "genres" && (
              <GenresCard stats={stats} tStory={t} />
            )}
            {currentStep === "creator" && (
              <CreatorCard stats={stats} tStory={t} />
            )}
            {currentStep === "standout" && (
              <StandoutCard
                stats={stats}
                monthLabels={monthLabels}
                tStory={t}
              />
            )}
            {currentStep === "picks" && (
              <PicksCard stats={stats} tStory={t} />
            )}
            {currentStep === "outro" && (
              <OutroCard
                stats={stats}
                onShare={handleOpenShare}
                onRestart={() => setStepIdx(0)}
                onNewQuiz={() => router.push("/quiz")}
                tStory={t}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>


      {/* Share dialog */}
      <Dialog
        open={showShare}
        onClose={() => setShowShare(false)}
        ariaLabel={t("share.dialogTitle")}
        size="sm"
      >
        <div className="px-6 pb-8 pt-10 text-center sm:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("share.dialogTitle")}
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t("share.dialogSubtitle", { year })}
          </p>
          <div className="mx-auto mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {shareUrl ? (
              <QRCodeSVG
                value={shareUrl}
                size={208}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
                marginSize={0}
                aria-label={t("share.dialogTitle")}
              />
            ) : (
              <div className="flex h-[208px] w-[208px] items-center justify-center text-slate-400">
                {shareTokenLoading ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <QrCode size={64} strokeWidth={1.2} />
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShareLink()}
                disabled={!shareUrl}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <Share2 size={12} />
                {t("share.shareButton")}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyShareLink}
              disabled={!shareUrl}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <Copy size={12} />
              {t("share.copyLink")}
            </button>
            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto dark:bg-white dark:text-slate-900"
            >
              {t("share.close")}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default WrappedPage;

/* -------------------- Poster mosaic backdrop -------------------- */

/** Wallpapers the screen with the user's own poster artwork. Cycles
 *  through whatever posters we have so a sparse year still produces a
 *  filled wall. A radial darkening veil sits on top so the centered
 *  headline stays legible against the bright covers. */
const PosterMosaic = ({ posters }: { posters: string[] }) => {
  // 24 cells = a comfortable wall density at sm: 6x4 grid. Cycling
  // means a 4-poster year still fills the grid (each appearing 6 times).
  const cells = Array.from(
    { length: 24 },
    (_, i) => posters[i % posters.length],
  );
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="grid h-full w-full grid-cols-4 grid-rows-6 sm:grid-cols-6 sm:grid-rows-4">
        {cells.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        ))}
      </div>
      {/* Radial darkening — strongest at the center where the headline
          sits, fading toward the edges so the actual artwork still
          breathes around the frame. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
};

/* -------------------- Per-step backdrops -------------------- */

const stepBackgrounds: Record<StoryStep, string> = {
  intro: "from-violet-600 via-fuchsia-600 to-rose-600",
  total: "from-indigo-700 via-indigo-600 to-violet-700",
  format: "from-amber-500 via-rose-500 to-fuchsia-600",
  genres: "from-fuchsia-600 via-violet-600 to-indigo-700",
  creator: "from-amber-500 via-orange-600 to-rose-600",
  standout: "from-orange-500 via-amber-500 to-yellow-500",
  picks: "from-slate-900 via-slate-800 to-slate-900",
  outro: "from-rose-500 via-fuchsia-600 to-indigo-700",
};

/* -------------------- Chrome (progress + close + share + year) -------------------- */

type TStory = ReturnType<typeof useTranslations<"Wrapped">>;

interface ChromeProps {
  year: number;
  availableYears: number[];
  onPickYear: (y: number) => void;
  showYearPicker: boolean;
  setShowYearPicker: (v: boolean) => void;
  onShare: () => void;
  onExit: () => void;
  currentStep: number;
  totalSteps: number;
  tStory: TStory;
  showProgress: boolean;
  isPlaying: boolean;
}

const StoryChrome = ({
  year,
  availableYears,
  onPickYear,
  showYearPicker,
  setShowYearPicker,
  onShare,
  onExit,
  currentStep,
  totalSteps,
  tStory,
  showProgress,
  isPlaying,
}: ChromeProps) => {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 sm:pt-6">
      {showProgress && (
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const filled = i < currentStep;
            const active = i === currentStep;
            return (
              <div
                key={i}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                {filled ? (
                  // Past step — show as fully filled, no animation needed.
                  <div className="h-full w-full rounded-full bg-white/85" />
                ) : active ? (
                  // Active step. While auto-playing, animate the fill
                  // over the step duration so the dot acts as a live
                  // timer (Instagram-stories style). When the user is
                  // sitting on the intro waiting to press Play, the bar
                  // stays empty.
                  <motion.div
                    key={`fill-${currentStep}`}
                    initial={{ width: "0%" }}
                    animate={{ width: isPlaying ? "100%" : "0%" }}
                    transition={{
                      duration: isPlaying ? STEP_DURATION_MS / 1000 : 0.2,
                      ease: "linear",
                    }}
                    className="h-full rounded-full bg-white/85"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="pointer-events-auto relative">
          {availableYears.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setShowYearPicker(!showYearPicker)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-tight text-white backdrop-blur-md transition-colors hover:bg-white/15"
              >
                {tStory("story.pickYear")} · {year}
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform",
                    showYearPicker && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence>
                {showYearPicker && (
                  <>
                    {/* Click-away catcher */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowYearPicker(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1.5 min-w-[100px] overflow-hidden rounded-xl border border-white/15 bg-slate-900/90 shadow-xl backdrop-blur-xl"
                    >
                      {availableYears.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            onPickYear(y);
                            setShowYearPicker(false);
                          }}
                          className={cn(
                            "block w-full px-4 py-2 text-left text-xs font-bold tracking-tight transition-colors hover:bg-white/10",
                            y === year ? "text-white" : "text-white/60",
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          ) : (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-tight text-white backdrop-blur-md">
              {year}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label={tStory("share.action")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <Share2 size={14} />
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label={tStory("story.exit")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

/* -------------------- Story cards -------------------- */

/** Wraps any card body in a focused white text column, with auto-applied
 *  pointer-events-auto so child interactive elements (rare) work. The
 *  outer slide motion still owns animation; this only owns layout. */
const cardBodyClass = "pointer-events-auto";

const IntroCard = ({
  name,
  year,
  onAdvance,
  tStory,
}: {
  name: string;
  year: number;
  onAdvance: () => void;
  tStory: TStory;
}) => (
  <div className={cardBodyClass}>
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
      {tStory("story.intro.eyebrow")}
    </p>
    <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl">
      {tStory("story.intro.kicker", { year })}
    </h1>
    <p className="mx-auto mt-4 max-w-md text-base font-medium text-white/80 sm:text-lg">
      {name}, {tStory("story.intro.subhead")}
    </p>
    <button
      type="button"
      onClick={onAdvance}
      className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black tracking-tight text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <Sparkles size={14} />
      {tStory("story.intro.cta")}
      <ArrowRight size={14} />
    </button>
    {/* Keyboard hint — sits directly under the CTA so users see the
        arrow-key affordance without hunting. Desktop only; on mobile,
        tap and swipe are the obvious paths. */}
    <p className="mt-4 hidden items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 sm:inline-flex">
      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/40 bg-white/15 px-1.5 font-mono text-[11px] text-white">
        ←
      </kbd>
      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/40 bg-white/15 px-1.5 font-mono text-[11px] text-white">
        →
      </kbd>
      {tStory("story.intro.keyHint")}
    </p>
  </div>
);

const TotalCard = ({
  stats,
  tStory,
}: {
  stats: StoryStats;
  tStory: TStory;
}) => (
  <div className={cardBodyClass}>
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
      {tStory("story.total.eyebrow")}
    </p>
    <p className="mt-4 text-[clamp(5rem,18vw,11rem)] font-black leading-[0.85] tracking-tighter">
      {stats.total}
    </p>
    <p className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
      {tStory("hero.picks", { count: stats.total })}
    </p>
    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
      {tStory("story.total.subhead", {
        movies: stats.movies,
        books: stats.books,
        music: stats.music,
      })}
    </p>
  </div>
);

const FormatCard = ({
  stats,
  tStory,
}: {
  stats: StoryStats;
  tStory: TStory;
}) => {
  const total = Math.max(1, stats.total);
  const pctMovies = Math.round((stats.movies / total) * 100);
  const pctBooks = Math.round((stats.books / total) * 100);
  const pctMusic = Math.round((stats.music / total) * 100);
  const max = Math.max(pctMovies, pctBooks, pctMusic);
  const callout =
    max < 45
      ? tStory("story.format.balanced")
      : pctMovies === max
        ? tStory("story.format.movieHeavy")
        : pctBooks === max
          ? tStory("story.format.bookHeavy")
          : tStory("story.format.musicHeavy");

  return (
    <div className={cardBodyClass}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
        {tStory("story.format.eyebrow")}
      </p>
      <h2 className="mt-3 text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl">
        {callout}
      </h2>

      <div className="mx-auto mt-8 max-w-md space-y-4 text-left">
        <FormatRow
          icon={<Film size={16} />}
          label={tStory("story.format.movies")}
          pct={pctMovies}
          count={stats.movies}
          posters={stats.moviePosters}
        />
        <FormatRow
          icon={<BookOpen size={16} />}
          label={tStory("story.format.books")}
          pct={pctBooks}
          count={stats.books}
          posters={stats.bookPosters}
        />
        <FormatRow
          icon={<Music size={16} />}
          label={tStory("story.format.music")}
          pct={pctMusic}
          count={stats.music}
          posters={stats.musicPosters}
        />
      </div>
    </div>
  );
};

const FormatRow = ({
  icon,
  label,
  pct,
  count,
  posters,
}: {
  icon: ReactNode;
  label: string;
  pct: number;
  count: number;
  posters: string[];
}) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-bold tracking-tight">
      <span className="inline-flex items-center gap-2 text-white/90">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-2">
        {/* Tiny poster stack — a glimpse of the actual covers behind the
            number. Square-crops so a music 1:1 and a movie 2:3 line up. */}
        {posters.length > 0 && (
          <div className="flex -space-x-1.5">
            {posters.slice(0, 3).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="h-7 w-7 rounded-md border border-white/30 object-cover shadow-sm"
                loading="eager"
              />
            ))}
          </div>
        )}
        <span className="text-white/70">
          {pct}% · {count}
        </span>
      </div>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="h-full rounded-full bg-white"
      />
    </div>
  </div>
);

/** Deterministic tile gradients keyed by rank. Each genre tile uses a
 *  distinct hue so the wall feels like a Spotify mosaic, not a tinted
 *  list. The first tile gets the brightest palette as a soft visual
 *  rank-1 emphasis. */
const GENRE_TILE_GRADIENTS = [
  "from-amber-400 to-rose-500",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-fuchsia-600",
  "from-violet-500 to-indigo-700",
  "from-sky-400 to-cyan-600",
  "from-orange-500 to-red-600",
];

const GenresCard = ({
  stats,
  tStory,
}: {
  stats: StoryStats;
  tStory: TStory;
}) => {
  const top = stats.topGenres[0]?.[0];
  // Always render six tile slots so the grid never looks ragged when
  // the user only has 2-3 distinct genres. Empty slots stay subtle.
  const tiles = Array.from({ length: 6 }).map((_, i) => stats.topGenres[i]);

  return (
    <div className={cardBodyClass}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
        {tStory("story.genres.eyebrow")}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl md:text-6xl">
        {top
          ? tStory("story.genres.headline", { top })
          : tStory("story.genres.fallback")}
      </h2>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            className={cn(
              "relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl p-3 text-left shadow-lg sm:p-4",
              entry
                ? cn("bg-gradient-to-br text-white", GENRE_TILE_GRADIENTS[i])
                : "border border-white/10 bg-white/5 text-white/40",
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
              #{i + 1}
            </span>
            {entry ? (
              <div>
                <p className="text-base font-black leading-tight tracking-tight sm:text-lg">
                  {entry[0]}
                </p>
                <p className="mt-0.5 text-[11px] font-bold opacity-80">
                  {tStory("tiles.picksHint", { count: entry[1] })}
                </p>
              </div>
            ) : (
              <p className="text-[11px] font-bold opacity-50">—</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const CreatorCard = ({
  stats,
  tStory,
}: {
  stats: StoryStats;
  tStory: TStory;
}) => {
  if (!stats.topCreator) {
    return (
      <div className={cardBodyClass}>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
          {tStory("story.creator.eyebrow")}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tighter sm:text-5xl">
          {tStory("story.creator.fallback")}
        </h2>
      </div>
    );
  }

  const headlineKey =
    stats.topCreator.type === "director"
      ? "story.creator.headlineDirector"
      : stats.topCreator.type === "author"
        ? "story.creator.headlineAuthor"
        : "story.creator.headlineArtist";

  const hasWall = stats.creatorPosters.length >= 2;
  const isSquare = stats.topCreator.type === "artist";

  return (
    <div className={cardBodyClass}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
        {tStory("story.creator.eyebrow")}
      </p>

      {hasWall ? (
        // Cover wall — the creator's own picks fanned out as the visual
        // anchor. Alternating tilt makes it feel like artwork pinned to
        // a board rather than a sterile row of thumbnails.
        <div className="mx-auto mt-6 flex max-w-md items-end justify-center gap-2 sm:max-w-xl sm:gap-3">
          {stats.creatorPosters.slice(0, 4).map((url, i) => {
            const tilt = i % 2 === 0 ? -4 : 4;
            return (
              <motion.img
                key={i}
                initial={{ opacity: 0, y: 18, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: tilt }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                src={url}
                alt=""
                className={cn(
                  "w-20 rounded-xl border-2 border-white/40 object-cover shadow-2xl sm:w-24 md:w-28",
                  isSquare ? "aspect-square" : "aspect-[2/3]",
                )}
                loading="eager"
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md sm:h-24 sm:w-24">
          <Trophy size={32} strokeWidth={1.5} />
        </div>
      )}

      <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tighter sm:text-5xl md:text-6xl">
        {tStory(headlineKey, { name: stats.topCreator.name })}
      </h2>
      <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-white/70">
        {tStory("story.creator.subhead", { count: stats.topCreator.count })}
      </p>
    </div>
  );
};

const StandoutCard = ({
  stats,
  monthLabels,
  tStory,
}: {
  stats: StoryStats;
  monthLabels: string[];
  tStory: TStory;
}) => {
  const peakCount = stats.peakMonth.count;
  return (
    <div className={cardBodyClass}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
        {tStory("story.standout.eyebrow")}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl">
        {peakCount > 0
          ? tStory("story.standout.peakSubhead", {
              count: peakCount,
              month: monthLabels[stats.peakMonth.idx],
            })
          : tStory("story.standout.peakMonth")}
      </h2>

      {/* 12-month heatmap. Each tile's fill intensity tracks pick volume
          relative to the peak month so the user can see which months were
          loud vs quiet at a glance. */}
      <div className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-2 sm:max-w-xl sm:grid-cols-4">
        {stats.monthly.map((count, idx) => {
          const intensity = peakCount > 0 ? count / peakCount : 0;
          const isPeak = idx === stats.peakMonth.idx && count > 0;
          // Map 0..1 → 0.15..1 with a slight floor so empty months are
          // still visible. Peak month is rendered as a solid white tile
          // with dark text so it pops against the rest.
          const opacity =
            count === 0 ? 0.12 : 0.25 + intensity * 0.55;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 + idx * 0.03 }}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border text-left shadow-sm",
                isPeak
                  ? "border-white bg-white text-slate-900"
                  : "border-white/15 text-white",
              )}
              style={isPeak ? undefined : { backgroundColor: `rgba(255,255,255,${opacity})` }}
            >
              <div className="flex h-full flex-col justify-between p-2 sm:p-3">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.16em]",
                    isPeak ? "text-slate-700" : "text-white/80",
                  )}
                >
                  {monthLabels[idx]}
                </span>
                <span
                  className={cn(
                    "text-lg font-black leading-none tracking-tight sm:text-xl",
                    count === 0 && !isPeak && "text-white/40",
                  )}
                >
                  {count}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {stats.longest > 0 && (
        <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-tight text-white backdrop-blur-md">
          <Flame
            size={12}
            className="text-amber-300"
            fill="currentColor"
          />
          {tStory("story.standout.streakSubhead", { count: stats.longest })}
        </p>
      )}
    </div>
  );
};

const PicksCard = ({
  stats,
  tStory,
}: {
  stats: StoryStats;
  tStory: TStory;
}) => (
  <div className={cardBodyClass}>
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
      {tStory("story.picks.eyebrow")}
    </p>
    <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl">
      {tStory("story.picks.headline")}
    </h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
      {tStory("story.picks.subhead")}
    </p>
    <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.topPicks.map((rec, i) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
          className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm"
        >
          <div
            className={cn(
              "relative bg-white/5",
              rec.type === "music" ? "aspect-square" : "aspect-[2/3]",
            )}
          >
            {rec.poster_url ? (
              <img
                src={rec.poster_url}
                alt={rec.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/40">
                {rec.type === "movie" ? (
                  <Film size={28} />
                ) : rec.type === "music" ? (
                  <Music size={28} />
                ) : (
                  <BookOpen size={28} />
                )}
              </div>
            )}
            {rec.is_favorited && (
              <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
                <Heart size={11} className="fill-current" />
              </span>
            )}
          </div>
          <div className="p-2.5 text-left">
            <p className="line-clamp-1 text-xs font-black tracking-tight text-white">
              {rec.title}
            </p>
            <p className="line-clamp-1 text-[10px] text-white/60">
              {rec.year ? `${rec.year}` : rec.type}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const OutroCard = ({
  stats,
  onShare,
  onRestart,
  onNewQuiz,
  tStory,
}: {
  stats: StoryStats;
  onShare: () => void;
  onRestart: () => void;
  onNewQuiz: () => void;
  tStory: TStory;
}) => (
  <div className={cardBodyClass}>
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs">
      {tStory("story.outro.eyebrow")}
    </p>
    <h2 className="mt-3 text-4xl font-black tracking-tighter sm:text-6xl md:text-7xl">
      {tStory("story.outro.headline", { count: stats.total })}
    </h2>
    {stats.favorites > 0 && (
      <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-tight text-white backdrop-blur-md">
        <Star size={12} className="fill-current text-amber-300" />
        {tStory("tiles.favorites")} · {stats.favorites}
      </p>
    )}
    <p className="mx-auto mt-4 max-w-md text-sm text-white/85 sm:text-base">
      {tStory("story.outro.subhead")}
    </p>
    <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
      <button
        type="button"
        onClick={onShare}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black tracking-tight text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
      >
        <Share2 size={14} />
        {tStory("story.outro.share")}
      </button>
      <button
        type="button"
        onClick={onNewQuiz}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold tracking-tight text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:w-auto"
      >
        <Sparkles size={14} />
        {tStory("story.outro.newQuiz")}
      </button>
    </div>
    <button
      type="button"
      onClick={onRestart}
      className="mx-auto mt-4 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-tight text-white/70 transition-colors hover:text-white"
    >
      <RotateCcw size={12} />
      {tStory("story.outro.restart")}
    </button>
  </div>
);
