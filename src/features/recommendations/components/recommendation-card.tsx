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
import { motion } from "motion/react";
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
 * Per-type accent palette for the "Why this pick" callout inside the card.
 * Movies = amber, books = emerald, music = rose. */
type WhyTone = {
  border: string;
  surface: string;
  bar: string;
  icon: string;
  eyebrow: string;
};

const WHY_TONES: Record<"movie" | "book" | "music", WhyTone> = {
  movie: {
    border: "border-amber-200/60 dark:border-amber-500/30",
    surface:
      "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-orange-500/10",
    bar: "from-amber-400 to-orange-500",
    icon: "text-amber-600 dark:text-amber-400",
    eyebrow: "text-amber-700 dark:text-amber-300",
  },
  book: {
    border: "border-emerald-200/60 dark:border-emerald-500/30",
    surface:
      "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    bar: "from-emerald-400 to-teal-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    eyebrow: "text-emerald-700 dark:text-emerald-300",
  },
  music: {
    border: "border-rose-200/60 dark:border-rose-500/30",
    surface:
      "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-pink-500/10",
    bar: "from-rose-400 to-pink-500",
    icon: "text-rose-600 dark:text-rose-400",
    eyebrow: "text-rose-700 dark:text-rose-300",
  },
};

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
  alreadyLogged: boolean;
  libraryStatus: LibraryStatus | null;
  onToggleFavorite: (id: string) => void;
}

export const RecommendationCard = ({
  rec,
  index,
  alreadyLogged,
  libraryStatus,
  onToggleFavorite,
}: RecommendationCardProps) => {
  const tb = useTranslations("Results.body");
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const explanation = rec.explanation ?? "";
  const description = rec.description ?? "";
  const showDescription = description.length > 0 && description !== explanation;
  const { score: matchScore, tone: matchTone } = deriveMatchScore(rec);
  const whyTone = WHY_TONES[rec.type] ?? WHY_TONES.book;

  useEffect(() => {
    if (expanded || !showDescription) return;
    const el = descRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, showDescription, description]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      className={cn(
        "group overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        rec.type === "movie"
          ? "border-amber-200/60 from-amber-50/80 to-white dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-900/40"
          : rec.type === "music"
            ? "border-rose-200/60 from-rose-50/80 to-white dark:border-rose-500/30 dark:from-rose-500/10 dark:to-slate-900/40"
            : "border-emerald-200/60 from-emerald-50/80 to-white dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900/40",
      )}
    >
      {/* Mobile: poster + header on top; rich body below spans full width.
          Desktop (sm+): grid with full poster column on the left. */}
      <div className="flex gap-3 p-3 sm:hidden">
        <div
          className={cn(
            "relative w-24 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800",
            rec.type === "music" ? "aspect-square" : "aspect-[2/3]",
          )}
        >
          {rec.poster_url ? (
            <Image
              src={rec.poster_url}
              alt={rec.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              {rec.type === "movie" ? (
                <Film size={20} />
              ) : rec.type === "music" ? (
                <Music size={20} />
              ) : (
                <BookOpen size={20} />
              )}
            </div>
          )}
          <div
            className={cn(
              "absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm backdrop-blur-sm",
              MATCH_TONE_CLASSES[matchTone],
            )}
          >
            {tb("matchPercent", { score: matchScore })}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {rec.type === "movie" ? (
                  <Film size={9} />
                ) : rec.type === "music" ? (
                  <Music size={9} />
                ) : (
                  <BookOpen size={9} />
                )}
                {rec.type}
              </span>
              <h2 className="mt-1 text-base font-black leading-tight tracking-tight">
                {rec.title}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                {rec.artist
                  ? tb("byArtist", { artist: rec.artist })
                  : rec.author
                    ? tb("byAuthor", { author: rec.author })
                    : rec.director
                      ? tb("byDirector", { director: rec.director })
                      : ""}
                {rec.year ? ` · ${rec.year}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavorite(rec.id)}
              aria-label={
                rec.is_favorited
                  ? tb("favoriteRemove", { title: rec.title })
                  : tb("favoriteAdd", { title: rec.title })
              }
              className={cn(
                "shrink-0 rounded-full p-1.5 transition-all active:scale-[0.95]",
                rec.is_favorited
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <Heart
                size={13}
                fill={rec.is_favorited ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {typeof rec.rating === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Star size={10} className="fill-current" />
                {rec.rating}
              </span>
            )}
            {rec.genres?.slice(0, 2).map((g) => (
              <span
                key={g}
                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-only body (below the header strip) */}
      <div className="space-y-3 px-3 pb-3 sm:hidden">
        {explanation && (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-gradient-to-br p-3",
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
              <Sparkles size={12} className={whyTone.icon} />
              <p
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.16em]",
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

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
        </div>
        {rec.type === "music" && rec.preview_url && (
          <MusicPreview previewUrl={rec.preview_url} />
        )}

        {showDescription && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {tb("about")}
            </p>
            <p
              className="overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-400"
              style={
                expanded
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
            {description.length > 180 && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
              >
                {expanded ? tb("showLess") : tb("showMore")}
                <ChevronDown
                  size={10}
                  className={cn(
                    "transition-transform duration-200",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </div>
        )}

        {rec.type !== "music" && (
          <TrailerEmbed
            type={rec.type}
            title={rec.title}
            year={rec.year ?? null}
            author={rec.author ?? null}
          />
        )}
      </div>

      <div className="hidden sm:grid sm:grid-cols-[168px_1fr]">
        {/* Poster — full-bleed for tall movie/book posters; for music
            albums we wrap the square cover in a tinted column so it sits
            as a centered, properly-aspected card-within-card rather than
            getting vertically cropped by the grid row stretching to match
            the content side. */}
        {rec.type === "music" ? (
          <div
            className={cn(
              "relative flex items-center justify-center p-5 bg-gradient-to-br",
              whyTone.surface,
            )}
          >
            <div className="relative aspect-square w-full max-w-[136px] overflow-hidden rounded-2xl bg-slate-200 shadow-lg shadow-rose-500/10 dark:bg-slate-800">
              {rec.poster_url ? (
                <Image
                  src={rec.poster_url}
                  alt={rec.title}
                  fill
                  sizes="136px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Music size={32} />
                </div>
              )}
            </div>
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Music size={10} />
              {rec.type}
            </div>
            <div
              className={cn(
                "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm",
                MATCH_TONE_CLASSES[matchTone],
              )}
            >
              {tb("matchSuffix", { score: matchScore })}
            </div>
          </div>
        ) : (
          <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
            {rec.poster_url ? (
              <Image
                src={rec.poster_url}
                alt={rec.title}
                fill
                sizes="168px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                {rec.type === "movie" ? (
                  <Film size={32} />
                ) : (
                  <BookOpen size={32} />
                )}
              </div>
            )}
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {rec.type === "movie" ? (
                <Film size={10} />
              ) : (
                <BookOpen size={10} />
              )}
              {rec.type}
            </div>
            <div
              className={cn(
                "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm",
                MATCH_TONE_CLASSES[matchTone],
              )}
            >
              {tb("matchSuffix", { score: matchScore })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                {rec.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {rec.artist
                  ? tb("byArtist", { artist: rec.artist })
                  : rec.author
                    ? tb("byAuthor", { author: rec.author })
                    : rec.director
                      ? tb("byDirector", { director: rec.director })
                      : ""}
                {rec.year ? ` · ${rec.year}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LogToLibraryButton
                medium={rec.type}
                title={rec.title}
                creator={rec.artist ?? rec.author ?? rec.director ?? null}
                year={rec.year ?? null}
                poster_url={rec.poster_url ?? null}
                source_recommendation_id={rec.id}
                initialLogged={alreadyLogged}
              />
              <WishlistButton
                medium={rec.type}
                title={rec.title}
                creator={rec.artist ?? rec.author ?? rec.director ?? null}
                year={rec.year ?? null}
                poster_url={rec.poster_url ?? null}
                source_recommendation_id={rec.id}
                initialStatus={libraryStatus}
              />
              <button
                type="button"
                onClick={() => onToggleFavorite(rec.id)}
                aria-label={
                  rec.is_favorited
                    ? tb("favoriteRemove", { title: rec.title })
                    : tb("favoriteAdd", { title: rec.title })
                }
                className={cn(
                  "rounded-full p-2 transition-all active:scale-[0.95]",
                  rec.is_favorited
                    ? "bg-rose-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                )}
              >
                <Heart
                  size={16}
                  fill={rec.is_favorited ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>

          {(typeof rec.rating === "number" || rec.genres?.length) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {typeof rec.rating === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Star size={12} className="fill-current" />
                  {rec.rating}
                </span>
              )}
              {rec.genres?.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {explanation && (
            <div
              className={cn(
                "relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-4",
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
              <div className="flex items-center gap-2 pl-2">
                <Sparkles size={14} className={whyTone.icon} />
                <p
                  className={cn(
                    "text-[11px] font-black uppercase tracking-[0.16em]",
                    whyTone.eyebrow,
                  )}
                >
                  {tb("whyThisPick")}
                </p>
              </div>
              <p className="mt-2 pl-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                {explanation}
              </p>
            </div>
          )}

          {showDescription && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {tb("about")}
              </p>
              <p
                ref={descRef}
                className="overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                style={
                  expanded
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
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-label={expanded ? tb("showLess") : tb("showMore")}
                  aria-expanded={expanded}
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  {expanded ? tb("showLess") : tb("showMore")}
                  <ChevronDown
                    size={12}
                    className={cn(
                      "transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>
          )}

          {rec.type === "music" && rec.preview_url ? (
            <div className="mt-4">
              <MusicPreview previewUrl={rec.preview_url} />
            </div>
          ) : rec.type !== "music" ? (
            <div className="mt-4">
              <TrailerEmbed
                type={rec.type}
                title={rec.title}
                year={rec.year ?? null}
                author={rec.author ?? null}
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
};
