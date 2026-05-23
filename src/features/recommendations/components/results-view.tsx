"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  History,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Share2,
  Wand2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMessages, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { PillButton } from "@/components/ui/pill-button";
import { libraryService } from "@/features/library/services/library-service";
import type { LibraryStatus } from "@/features/library/types/library";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { RecommendationCard } from "@/features/recommendations/components/recommendation-card";
import { databaseService } from "@/features/recommendations/services/database-service";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import { cn } from "@/lib/utils";
import { nativeShareOrCopy } from "@/lib/share";

/** Quick-tap steers appended to the free-text feedback (mobile parity). */
const REFINE_CHIPS = [
  "Lighter",
  "Darker",
  "Shorter",
  "More obscure",
  "More popular",
] as const;

interface ResultsViewProps {
  /** Recommendations to render. */
  recommendations: Recommendation[];
  /** Called when the user clicks the "Get another" CTA. */
  onRestart: () => void;
  /** Called with the user's free-text steer to re-run the SAME quiz
   *  context with a refinement layered on top. Omit to hide the
   *  "Refine these" affordance (e.g. read-only result views). */
  onRefine?: (feedbackText: string) => void;
}

/**
 * Slim results body for the quiz card. Renders a compact heading and a
 * single unified list of collapsible RecommendationCard rows (no per-type
 * sections — each row carries its own type chip). The footer collapses to
 * one primary CTA + a "More" overflow with history and share entries.
 */
export const ResultsView = ({
  recommendations: initialRecs,
  onRestart,
  onRefine,
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

  // "Refine these" sheet state.
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");

  // Append/remove a chip word without clobbering the user's free text —
  // comma-joined, toggles off if the word is already present (mobile
  // addChip parity).
  const toggleChip = (word: string) => {
    setRefineText((cur) => {
      const parts = cur
        .split(/[\s,]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const has = cur.toLowerCase().includes(word.toLowerCase());
      if (has) {
        return cur
          .replace(new RegExp(`\\b${word}\\b`, "i"), "")
          .replace(/\s*,\s*,\s*/g, ", ")
          .replace(/^[\s,]+|[\s,]+$/g, "");
      }
      return parts.length === 0 ? word : `${cur.trim()}, ${word}`;
    });
  };

  const submitRefine = () => {
    const fb = refineText.trim();
    if (!fb || !onRefine) return;
    setRefineOpen(false);
    setRefineText("");
    onRefine(fb);
  };

  // Pick one headline at mount time from the per-locale bank so the user
  // gets variety across quiz runs.
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

  // Only surface the native "Share…" entry where the OS share sheet
  // exists. Resolved after mount to avoid an SSR/client markup mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator?.share === "function");
  }, []);

  // Keep local recs in sync if the parent hands us a fresh batch.
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

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success(tb("shareToasts.copySuccess"));
    } catch {
      toast.error(tb("shareToasts.copyFailed"));
    }
  };

  const handleNativeShare = async () => {
    const status = await nativeShareOrCopy({
      title: tb("shareText.title"),
      text: buildShareText(),
    });
    if (status === "copied") toast.success(tb("shareToasts.copySuccess"));
    else if (status === "failed") toast.error(tb("shareToasts.shareFailed"));
  };

  const handleShareTwitter = () => {
    const titles = recommendations.map((r) => r.title).join(", ");
    const text = encodeURIComponent(tb("shareTwitter", { titles }));
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(tb("shareEmailSubject"));
    const body = encodeURIComponent(buildShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // No outer max-width wrapper — this view renders inside the quiz card,
  // which already controls width and padding.
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 sm:mb-5"
      >
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs",
            tone.text,
          )}
        >
          {tb("eyebrow")}
        </p>
        <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
          {headline}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {tb("subhead", { count: recommendations.length })}
        </p>
      </motion.div>

      <div className="grid gap-3">
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

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-6 flex items-center justify-center gap-2 sm:gap-3"
      >
        <HoverBorderGradient
          onClick={onRestart}
          idleColor="17, 24, 39"
          darkIdleColor="255, 255, 255"
          highlightColor="99, 102, 241"
          darkHighlightColor="129, 140, 248"
          containerClassName="rounded-full"
          className="flex items-center justify-center gap-2 whitespace-nowrap bg-white px-5 py-2.5 text-sm font-black leading-none tracking-tight text-black dark:bg-black dark:text-white"
        >
          <RotateCcw size={15} />
          {tb("actions.retake")}
        </HoverBorderGradient>

        {onRefine && (
          <PillButton
            onClick={() => setRefineOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <Wand2 size={15} />
            {tb("refine.cta")}
          </PillButton>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PillButton
              aria-label={tb("actions.moreAriaLabel")}
              className="inline-flex items-center justify-center gap-1.5 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <MoreHorizontal size={16} />
              {tb("actions.more")}
            </PillButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem
              onSelect={() => router.push("/history")}
              className="gap-2"
            >
              <History size={14} />
              {tb("actions.viewHistory")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canNativeShare && (
              <DropdownMenuItem
                onSelect={() => void handleNativeShare()}
                className="gap-2"
              >
                <Share2 size={14} />
                {tb("shareMenu.share")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => void handleCopyToClipboard()}
              className="gap-2"
            >
              <Copy size={14} />
              {tb("shareMenu.copy")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleShareTwitter} className="gap-2">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {tb("shareMenu.shareX")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleShareEmail} className="gap-2">
              <Mail size={14} />
              {tb("shareMenu.shareEmail")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {onRefine && (
        <Dialog
          open={refineOpen}
          onClose={() => setRefineOpen(false)}
          ariaLabel={tb("refine.title")}
          hideCloseButton
        >
          <div className="p-5">
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs",
                tone.text,
              )}
            >
              {tb("refine.eyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              {tb("refine.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tb("refine.subtitle")}
            </p>

            <textarea
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              placeholder={tb("refine.placeholder")}
              rows={3}
              maxLength={400}
              autoFocus
              className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {REFINE_CHIPS.map((c) => {
                const active = refineText
                  .toLowerCase()
                  .includes(c.toLowerCase());
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChip(c)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold tracking-tight transition-all",
                      active
                        ? "border-transparent bg-indigo-500 text-white shadow-sm"
                        : "border-slate-200/80 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRefineOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {tb("refine.cancel")}
              </button>
              <PillButton
                onClick={submitRefine}
                disabled={refineText.trim().length === 0}
                className="inline-flex items-center justify-center gap-1.5 border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-2 text-sm font-black tracking-tight text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Wand2 size={15} />
                {tb("refine.submit")}
              </PillButton>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};
