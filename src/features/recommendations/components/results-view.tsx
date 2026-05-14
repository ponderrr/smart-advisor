"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Copy,
  Film,
  Mail,
  Music,
  RotateCcw,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMessages, useTranslations } from "next-intl";
import { toast } from "sonner";

import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { PillButton } from "@/components/ui/pill-button";
import { SectionHeader } from "@/components/section-header";
import { libraryService } from "@/features/library/services/library-service";
import type { LibraryStatus } from "@/features/library/types/library";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { RecommendationCard } from "@/features/recommendations/components/recommendation-card";
import { databaseService } from "@/features/recommendations/services/database-service";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import { cn } from "@/lib/utils";

interface ResultsViewProps {
  /** Recommendations to render. */
  recommendations: Recommendation[];
  /** Called when the user clicks the "Get another" CTA. */
  onRestart: () => void;
}

/**
 * Full results body: hero headline, per-type sections of RecommendationCard,
 * favorite toggle, share menu, and action buttons. Designed to be embedded
 * inside the unified /quiz orchestrator (which mounts AppNavbar around it)
 * so the user reaches recommendations without a route navigation.
 */
export const ResultsView = ({
  recommendations: initialRecs,
  onRestart,
}: ResultsViewProps) => {
  const router = useRouter();
  const tb = useTranslations("Results.body");
  const messages = useMessages() as {
    Results?: { body?: { headlines?: string[]; headline?: string } };
  };
  const { contentType } = useQuizStore();
  const tone = getAccentTone(contentType);
  const [recommendations, setRecommendations] =
    useState<Recommendation[]>(initialRecs);

  // Pick one headline at mount time from the per-locale bank so the user
  // gets variety across quiz runs. Falls back to the single `headline` key
  // if the array is missing (older locales / cache miss).
  const headline = useMemo(() => {
    const bank = messages.Results?.body?.headlines;
    if (bank && bank.length > 0) {
      return bank[Math.floor(Math.random() * bank.length)];
    }
    return messages.Results?.body?.headline ?? tb("headline");
  }, [messages, tb]);
  const [loggedTitleMap, setLoggedTitleMap] = useState<
    Map<string, LibraryStatus>
  >(() => new Map());
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Keep local recs in sync if the parent hands us a fresh batch (e.g. after
  // a user-triggered regenerate from outside the view).
  useEffect(() => {
    setRecommendations(initialRecs);
  }, [initialRecs]);

  useEffect(() => {
    void libraryService.list().then(({ data }) => {
      setLoggedTitleMap(
        new Map(
          data.map((i) => [`${i.medium}::${i.title.toLowerCase()}`, i.status]),
        ),
      );
    });
  }, []);

  // Warn before tab-close so the user doesn't lose a fresh batch they haven't
  // logged or screenshotted yet.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recommendations.length > 0) {
        e.preventDefault();
        e.returnValue = tb("beforeUnload");
        return tb("beforeUnload");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [recommendations.length, tb]);

  const libraryStatusOf = useCallback(
    (rec: Recommendation): LibraryStatus | null =>
      loggedTitleMap.get(`${rec.type}::${rec.title.toLowerCase()}`) ?? null,
    [loggedTitleMap],
  );

  const isAlreadyLogged = useCallback(
    (rec: Recommendation): boolean => libraryStatusOf(rec) !== null,
    [libraryStatusOf],
  );

  const handleToggleFavorite = async (recommendationId: string) => {
    try {
      if (!recommendationId) return;

      const { error: toggleError } =
        await databaseService.toggleFavorite(recommendationId);
      if (toggleError) {
        toast.error(tb("shareToasts.favoriteFailed"));
        return;
      }
      const rec = recommendations.find((r) => r.id === recommendationId);
      toast.success(
        rec?.is_favorited
          ? tb("shareToasts.favoriteRemoved")
          : tb("shareToasts.favoriteAdded"),
      );
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recommendationId
            ? { ...r, is_favorited: !r.is_favorited }
            : r,
        ),
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const buildShareText = () => {
    const mRecs = recommendations.filter((r) => r.type === "movie");
    const bRecs = recommendations.filter((r) => r.type === "book");
    const musicRecsLocal = recommendations.filter((r) => r.type === "music");
    const lines: string[] = [tb("shareText.title"), ""];

    if (mRecs.length > 0) {
      lines.push(tb("shareText.movies"));
      mRecs.forEach((r) => {
        const detail = [
          r.director &&
            tb("shareText.directorPrefix", { director: r.director }),
          r.year,
        ]
          .filter(Boolean)
          .join(", ");
        lines.push(`  ${r.title}${detail ? ` (${detail})` : ""}`);
        if (r.genres?.length)
          lines.push(
            `  ${tb("shareText.genres", { list: r.genres.join(", ") })}`,
          );
      });
      lines.push("");
    }

    if (bRecs.length > 0) {
      lines.push(tb("shareText.books"));
      bRecs.forEach((r) => {
        const detail = [
          r.author && tb("shareText.byAuthorShort", { author: r.author }),
          r.year,
        ]
          .filter(Boolean)
          .join(", ");
        lines.push(`  ${r.title}${detail ? ` (${detail})` : ""}`);
        if (r.genres?.length)
          lines.push(
            `  ${tb("shareText.genres", { list: r.genres.join(", ") })}`,
          );
      });
      lines.push("");
    }

    if (musicRecsLocal.length > 0) {
      lines.push(tb("shareText.music"));
      musicRecsLocal.forEach((r) => {
        const detail = [
          r.artist && tb("shareText.byArtistShort", { artist: r.artist }),
          r.year,
        ]
          .filter(Boolean)
          .join(", ");
        lines.push(`  ${r.title}${detail ? ` (${detail})` : ""}`);
        if (r.genres?.length)
          lines.push(
            `  ${tb("shareText.genres", { list: r.genres.join(", ") })}`,
          );
      });
      lines.push("");
    }

    lines.push(tb("shareText.footer"));
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: tb("shareText.title"), text });
        return;
      } catch {
        // User cancelled — fall through to share menu
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success(tb("shareToasts.copySuccess"));
    } catch {
      toast.error(tb("shareToasts.copyFailed"));
    }
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const titles = recommendations.map((r) => r.title).join(", ");
    const text = encodeURIComponent(tb("shareTwitter", { titles }));
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(tb("shareEmailSubject"));
    const body = encodeURIComponent(buildShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareMenu(false);
  };

  const movieRecs = recommendations.filter((r) => r.type === "movie");
  const bookRecs = recommendations.filter((r) => r.type === "book");
  const musicRecs = recommendations.filter((r) => r.type === "music");

  const isMixedFlow = contentType === "both" || contentType === "mix";

  // No outer max-width wrapper here — this view renders inside the quiz
  // card surface, which already controls width and padding.
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 sm:mb-8"
      >
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs",
            tone.text,
          )}
        >
          {tb("eyebrow")}
        </p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tighter sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl">
          {headline}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:mt-2 dark:text-slate-400">
          {tb("subhead", { count: recommendations.length })}
        </p>
      </motion.div>

      {isMixedFlow ? (
        <>
          {movieRecs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mb-10"
            >
              <SectionHeader
                icon={<Film size={14} />}
                eyebrow={tb("sections.movie.eyebrow")}
                title={tb("sections.movie.title")}
                count={movieRecs.length}
                accent="violet"
              />
              <div className="grid gap-5">
                {movieRecs.map((rec, i) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    index={i}
                    alreadyLogged={isAlreadyLogged(rec)}
                    libraryStatus={libraryStatusOf(rec)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {bookRecs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-10"
            >
              <SectionHeader
                icon={<BookOpen size={14} />}
                eyebrow={tb("sections.book.eyebrow")}
                title={tb("sections.book.title")}
                count={bookRecs.length}
                accent="emerald"
              />
              <div className="grid gap-5">
                {bookRecs.map((rec, i) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    index={i}
                    alreadyLogged={isAlreadyLogged(rec)}
                    libraryStatus={libraryStatusOf(rec)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {musicRecs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="mb-10"
            >
              <SectionHeader
                icon={<Music size={14} />}
                eyebrow={tb("sections.music.eyebrow")}
                title={tb("sections.music.title")}
                count={musicRecs.length}
                accent="rose"
              />
              <div className="grid gap-5">
                {musicRecs.map((rec, i) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    index={i}
                    alreadyLogged={isAlreadyLogged(rec)}
                    libraryStatus={libraryStatusOf(rec)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </>
      ) : (
        <div className="grid gap-5">
          {recommendations.map((rec, i) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              index={i}
              alreadyLogged={isAlreadyLogged(rec)}
              libraryStatus={libraryStatusOf(rec)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <HoverBorderGradient
          onClick={onRestart}
          idleColor="17, 24, 39"
          darkIdleColor="255, 255, 255"
          highlightColor="99, 102, 241"
          darkHighlightColor="129, 140, 248"
          containerClassName="rounded-full w-full sm:w-auto"
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black sm:w-auto dark:bg-black dark:text-white"
        >
          <RotateCcw size={16} />
          {tb("actions.retake")}
        </HoverBorderGradient>
        <PillButton
          onClick={() => router.push("/history")}
          className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
        >
          {tb("actions.viewHistory")}
          <ArrowRight size={16} />
        </PillButton>
        <div className="relative w-full sm:w-auto">
          <PillButton
            onClick={handleShare}
            className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <Share2 size={16} />
            {tb("actions.share")}
          </PillButton>

          <AnimatePresence>
            {showShareMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowShareMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-900"
                >
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Copy size={14} />
                    {tb("shareMenu.copy")}
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 fill-current"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {tb("shareMenu.shareX")}
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Mail size={14} />
                    {tb("shareMenu.shareEmail")}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
