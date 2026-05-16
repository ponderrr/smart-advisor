"use client";

import { useEffect, useState } from "react";
import { BookOpen, Film, Music, PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { MusicPreview } from "@/components/music-preview";
import { cn } from "@/lib/utils";

interface ResultTone {
  /** Outer card border + tinted surface gradient. */
  cardBorder: string;
  cardSurface: string;
  /** Small icon circle next to the type label. */
  circle: string;
  /** Uppercase tinted label color. */
  label: string;
  /** "Why this pick" callout — border, bg, gradient side-bar, sparkle icon, eyebrow. */
  whyBorder: string;
  whySurface: string;
  whyBar: string;
  whyIcon: string;
  whyEyebrow: string;
}

const RESULT_TONES: Record<"movie" | "book" | "music", ResultTone> = {
  movie: {
    cardBorder: "border-amber-200/60 dark:border-amber-500/30",
    cardSurface:
      "from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900/40",
    circle:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    label: "text-amber-700 dark:text-amber-300",
    whyBorder: "border-amber-200/60 dark:border-amber-500/30",
    whySurface:
      "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-orange-500/10",
    whyBar: "from-amber-400 to-orange-500",
    whyIcon: "text-amber-600 dark:text-amber-400",
    whyEyebrow: "text-amber-700 dark:text-amber-300",
  },
  book: {
    cardBorder: "border-emerald-200/60 dark:border-emerald-500/30",
    cardSurface:
      "from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900/40",
    circle:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    label: "text-emerald-700 dark:text-emerald-300",
    whyBorder: "border-emerald-200/60 dark:border-emerald-500/30",
    whySurface:
      "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-500/10 dark:via-slate-900/40 dark:to-teal-500/10",
    whyBar: "from-emerald-400 to-teal-500",
    whyIcon: "text-emerald-600 dark:text-emerald-400",
    whyEyebrow: "text-emerald-700 dark:text-emerald-300",
  },
  music: {
    cardBorder: "border-rose-200/60 dark:border-rose-500/30",
    cardSurface:
      "from-rose-50/80 to-white dark:from-rose-500/10 dark:to-slate-900/40",
    circle: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    label: "text-rose-700 dark:text-rose-300",
    whyBorder: "border-rose-200/60 dark:border-rose-500/30",
    whySurface:
      "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-500/10 dark:via-slate-900/40 dark:to-pink-500/10",
    whyBar: "from-rose-400 to-pink-500",
    whyIcon: "text-rose-600 dark:text-rose-400",
    whyEyebrow: "text-rose-700 dark:text-rose-300",
  },
};

type TrailerData =
  | {
      provider: "youtube";
      youtubeKey: string | null;
      name: string | null;
      tmdbId: number;
      posterUrl: string | null;
      overview: string | null;
    }
  | {
      provider: "open-library";
      workKey: string | null;
      infoLink: string | null;
      posterUrl: string | null;
    }
  | null;

interface ResultCardProps {
  type: "movie" | "book" | "music";
  title: string;
  creator?: string;
  year?: number;
  genres?: string[];
  explanation?: string;
  previewUrl?: string;
}

/**
 * Group-quiz synthesized result card (poster, "why this pick", trailer /
 * music preview). Self-contained — owns its own trailer fetch, media
 * state, and tone map; closes over no page state. Extracted verbatim
 * from group-quiz/[code]/page.tsx.
 */
export const ResultCard = ({
  type,
  title,
  creator,
  year,
  genres,
  explanation,
  previewUrl,
}: ResultCardProps) => {
  const t = useTranslations("GroupQuiz.result");
  const [media, setMedia] = useState<TrailerData>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const resultTone = RESULT_TONES[type];

  useEffect(() => {
    if (type === "music") {
      // Music doesn't go through the trailer endpoint — we render an inline
      // preview button instead, gated on a previewUrl prop from the parent.
      setMedia(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ title, type });
    if (year) params.set("year", String(year));
    if (creator && type === "book") params.set("author", creator);
    fetch(`/api/trailer?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json) => {
        if (cancelled) return;
        setMedia((json.data ?? null) as TrailerData);
      })
      .catch(() => {
        if (cancelled) return;
        setMedia(null);
      });
    return () => {
      cancelled = true;
    };
  }, [title, year, type, creator]);

  const posterUrl = media?.posterUrl ?? null;
  const youtubeKey = media?.provider === "youtube" ? media.youtubeKey : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm backdrop-blur-md",
        resultTone.cardBorder,
        resultTone.cardSurface,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
        {posterUrl && (
          <div
            className={cn(
              "relative shrink-0 self-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800 sm:self-auto",
              type === "music"
                ? "aspect-square w-28 sm:w-32"
                : "aspect-[2/3] w-24 sm:w-28",
            )}
          >
            {/* Plain <img> — Google Books / TMDB sizes vary, no need to pay
                for Image optimization on a single result. */}
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                resultTone.circle,
              )}
            >
              {type === "movie" ? (
                <Film size={13} />
              ) : type === "music" ? (
                <Music size={13} />
              ) : (
                <BookOpen size={13} />
              )}
            </span>
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em]",
                resultTone.label,
              )}
            >
              {type === "movie"
                ? t("movie")
                : type === "music"
                  ? t("music")
                  : t("book")}
            </p>
          </div>
          <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {creator
              ? type === "movie"
                ? t("byDirector", { creator })
                : type === "music"
                  ? t("byArtist", { creator })
                  : t("byAuthor", { creator })
              : ""}
            {year ? ` · ${year}` : ""}
          </p>
          {genres && genres.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {genres.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-900/50 dark:text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          {explanation && (
            <div
              className={cn(
                "relative mt-3 overflow-hidden rounded-xl border bg-gradient-to-br p-3 sm:p-3.5",
                resultTone.whyBorder,
                resultTone.whySurface,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
                  resultTone.whyBar,
                )}
              />
              <div className="flex items-center gap-1.5 pl-2">
                <Sparkles size={13} className={resultTone.whyIcon} />
                <p
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.16em] sm:text-[11px]",
                    resultTone.whyEyebrow,
                  )}
                >
                  {t("whyThisPick")}
                </p>
              </div>
              <p className="mt-1.5 pl-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {explanation}
              </p>
            </div>
          )}
          {media?.provider === "youtube" && media.overview && (
            <p className="mt-3 border-t border-slate-200/60 pt-2.5 text-xs leading-relaxed text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
              {media.overview}
            </p>
          )}
          {media?.provider === "open-library" && media.infoLink && (
            <a
              href={media.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-[11px] font-bold tracking-tight text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:text-white"
            >
              {t("viewOnOpenLibrary")}
            </a>
          )}
          {type === "music" && previewUrl && (
            <div className="mt-3">
              <MusicPreview
                previewUrl={previewUrl}
                title={title}
                artist={creator}
                artworkUrl={posterUrl}
              />
            </div>
          )}
        </div>
      </div>
      {youtubeKey && type === "movie" && (
        <div className="border-t border-slate-200/60 bg-white/40 p-4 dark:border-slate-700/50 dark:bg-slate-900/30 sm:p-5">
          {!showPlayer ? (
            <button
              type="button"
              onClick={() => setShowPlayer(true)}
              aria-label={t("playTrailerAria", { title })}
              className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-slate-900"
            >
              <img
                src={`https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg shadow-black/30 transition-transform duration-200 group-hover:scale-110">
                  <PlayCircle size={36} strokeWidth={1.5} />
                </span>
              </span>
              <span className="absolute bottom-3 left-3 right-3 truncate text-left text-xs font-bold text-white/90">
                {media?.provider === "youtube" && media.name
                  ? media.name
                  : t("watchTrailer")}
              </span>
            </button>
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                title={`${title} trailer`}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
