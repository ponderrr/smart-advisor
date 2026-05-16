"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  Film,
  Heart,
  Music,
  Sparkles,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { MusicPreview } from "@/components/music-preview";
import { TrailerEmbed } from "@/components/trailer-embed";
import { LogToLibraryButton } from "@/features/library/components/log-to-library-button";
import { WishlistButton } from "@/features/library/components/wishlist-button";
import type { LibraryStatus } from "@/features/library/types/library";
import type { Recommendation } from "@/features/recommendations/types/recommendation";
import {
  deriveMatchScore,
  MATCH_TONE_CLASSES,
} from "@/features/recommendations/utils/match-score";
import { cn } from "@/lib/utils";

/* ---------- Why Tones ----------
 * Per-type accent palette for the "Why this pick" callout inside the
 * expanded panel. Movies = amber, books = emerald, music = rose. */
type WhyTone = {
  border: string;
  surface: string;
  bar: string;
  icon: string;
  eyebrow: string;
  /** Tinted text + hover bg for inline links (e.g. show more/less). */
  link: string;
};

const WHY_TONES: Record<"movie" | "book" | "music", WhyTone> = {
  movie: {
    border: "border-amber-200/60 dark:border-amber-500/30",
    surface:
      "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-orange-500/10",
    bar: "from-amber-400 to-orange-500",
    icon: "text-amber-600 dark:text-amber-400",
    eyebrow: "text-amber-700 dark:text-amber-300",
    link: "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10",
  },
  book: {
    border: "border-emerald-200/60 dark:border-emerald-500/30",
    surface:
      "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    bar: "from-emerald-400 to-teal-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    eyebrow: "text-emerald-700 dark:text-emerald-300",
    link: "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10",
  },
  music: {
    border: "border-rose-200/60 dark:border-rose-500/30",
    surface:
      "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-pink-500/10",
    bar: "from-rose-400 to-pink-500",
    icon: "text-rose-600 dark:text-rose-400",
    eyebrow: "text-rose-700 dark:text-rose-300",
    link: "text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10",
  },
};

const TYPE_ICON: Record<"movie" | "book" | "music", typeof Film> = {
  movie: Film,
  book: BookOpen,
  music: Music,
};

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
  alreadyLogged: boolean;
  libraryStatus: LibraryStatus | null;
  onToggleFavorite: (id: string) => void;
}

/**
 * Compact, collapsible row designed to live inside the morphing quiz card.
 * Header row shows poster thumb, title, creator, type chip, match %, fav,
 * chevron, and a one-line italic preview of "why this pick". Tap to expand
 * for the full callout, description, log/wishlist actions, and trailer or
 * music preview. The first card (index === 0) starts expanded so the
 * payoff is visible without interaction.
 */
export const RecommendationCard = ({
  rec,
  index,
  alreadyLogged,
  libraryStatus,
  onToggleFavorite,
}: RecommendationCardProps) => {
  const tb = useTranslations("Results.body");
  const [expanded, setExpanded] = useState(index === 0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const explanation = rec.explanation ?? "";
  const description = rec.description ?? "";
  const showDescription = description.length > 0 && description !== explanation;
  const { score: matchScore, tone: matchTone } = deriveMatchScore(rec);
  const whyTone = WHY_TONES[rec.type] ?? WHY_TONES.book;
  const TypeIcon = TYPE_ICON[rec.type] ?? BookOpen;

  const creatorLine = rec.artist
    ? tb("byArtist", { artist: rec.artist })
    : rec.author
      ? tb("byAuthor", { author: rec.author })
      : rec.director
        ? tb("byDirector", { director: rec.director })
        : "";

  // Only measure clamp once expanded — descRef doesn't render until then.
  useEffect(() => {
    if (!expanded || descExpanded || !showDescription) return;
    const el = descRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, descExpanded, showDescription, description]);

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 5) * 0.04 }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md",
        rec.type === "movie"
          ? "border-amber-200/60 from-amber-50/80 to-white dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900/40"
          : rec.type === "music"
            ? "border-rose-200/60 from-rose-50/80 to-white dark:border-rose-500/30 dark:from-rose-500/10 dark:to-slate-900/40"
            : "border-emerald-200/60 from-emerald-50/80 to-white dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900/40",
      )}
    >
      {/* Header row — always visible. The whole row toggles expand; the
          favorite button stops propagation. The chevron is a visual cue,
          not a separate hit target, so the entire row reads as one
          affordance. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full items-stretch gap-3 p-3 text-left transition-colors sm:gap-4 sm:p-4"
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800",
            rec.type === "music"
              ? "aspect-square w-14 sm:w-16"
              : "aspect-[2/3] w-12 sm:w-14",
          )}
        >
          {rec.poster_url ? (
            <Image
              src={rec.poster_url}
              alt={rec.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <TypeIcon size={18} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <TypeIcon size={9} />
              {tb(rec.type)}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                MATCH_TONE_CLASSES[matchTone],
              )}
            >
              {tb("matchSuffix", { score: matchScore })}
            </span>
          </div>
          <h2 className="mt-1 truncate text-sm font-black tracking-tight sm:text-base">
            {rec.title}
          </h2>
          {creatorLine ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {creatorLine}
              {rec.year ? ` · ${rec.year}` : ""}
            </p>
          ) : rec.year ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {rec.year}
            </p>
          ) : null}
          {explanation ? (
            <p className="mt-1 line-clamp-1 text-xs italic text-slate-500 dark:text-slate-400">
              {explanation}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-1.5">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(rec.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(rec.id);
              }
            }}
            aria-label={
              rec.is_favorited
                ? tb("favoriteRemove", { title: rec.title })
                : tb("favoriteAdd", { title: rec.title })
            }
            className={cn(
              "inline-flex items-center justify-center rounded-full p-1.5 transition-all active:scale-[0.95]",
              rec.is_favorited
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
            )}
          >
            <Heart
              size={13}
              fill={rec.is_favorited ? "currentColor" : "none"}
            />
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-slate-200/60 px-3 pb-4 pt-4 sm:px-4 dark:border-slate-700/60">
              {explanation && (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 sm:p-4",
                    whyTone.border,
                    whyTone.surface,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
                      whyTone.bar,
                    )}
                  />
                  <div className="flex items-center gap-1.5 pl-2">
                    <Sparkles size={13} className={whyTone.icon} />
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.16em] sm:text-[11px]",
                        whyTone.eyebrow,
                      )}
                    >
                      {tb("whyThisPick")}
                    </p>
                  </div>
                  <p className="mt-1.5 pl-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {explanation}
                  </p>
                </div>
              )}

              {(typeof rec.rating === "number" || rec.genres?.length) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {typeof rec.rating === "number" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Star size={10} className="fill-current" />
                      {rec.rating}
                    </span>
                  )}
                  {rec.genres?.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {showDescription && (
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {tb("about")}
                  </p>
                  <p
                    ref={descRef}
                    className="overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                    style={
                      descExpanded
                        ? undefined
                        : {
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }
                    }
                  >
                    {description}
                  </p>
                  {isClamped && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((p) => !p)}
                      aria-expanded={descExpanded}
                      className={cn(
                        "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        whyTone.link,
                      )}
                    >
                      {descExpanded ? tb("showLess") : tb("showMore")}
                      <ChevronDown
                        size={10}
                        className={cn(
                          "transition-transform duration-200",
                          descExpanded && "rotate-180",
                        )}
                      />
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <LogToLibraryButton
                  medium={rec.type}
                  title={rec.title}
                  creator={rec.artist ?? rec.author ?? rec.director ?? null}
                  year={rec.year ?? null}
                  poster_url={rec.poster_url ?? null}
                  source_recommendation_id={rec.id}
                  initialLogged={alreadyLogged}
                  variant="compact"
                />
                <WishlistButton
                  medium={rec.type}
                  title={rec.title}
                  creator={rec.artist ?? rec.author ?? rec.director ?? null}
                  year={rec.year ?? null}
                  poster_url={rec.poster_url ?? null}
                  source_recommendation_id={rec.id}
                  initialStatus={libraryStatus}
                  variant="compact"
                />
              </div>

              {rec.type === "music" && rec.preview_url ? (
                <MusicPreview
                  previewUrl={rec.preview_url}
                  title={rec.title}
                  artist={rec.artist}
                  artworkUrl={rec.poster_url}
                />
              ) : rec.type !== "music" ? (
                <TrailerEmbed
                  type={rec.type}
                  title={rec.title}
                  year={rec.year ?? null}
                  author={rec.author ?? null}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
