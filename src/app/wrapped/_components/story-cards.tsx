"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Film,
  Flame,
  Heart,
  Music,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  STEP_DURATION_MS,
  stepBackgrounds,
  type StoryStats,
  type StoryStep,
} from "../_lib/story";

/* -------------------- Poster mosaic backdrop -------------------- */

/** Wallpapers the screen with the user's own poster artwork. Cycles
 *  through whatever posters we have so a sparse year still produces a
 *  filled wall. A radial darkening veil sits on top so the centered
 *  headline stays legible against the bright covers. */
export const PosterMosaic = ({ posters }: { posters: string[] }) => {
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

/* -------------------- Chrome (progress + close + share + year) -------------------- */

export type TStory = ReturnType<typeof useTranslations<"Wrapped">>;

export interface ChromeProps {
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

export const StoryChrome = ({
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

export const IntroCard = ({
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

export const TotalCard = ({
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

export const FormatCard = ({
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

export const FormatRow = ({
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
export const GENRE_TILE_GRADIENTS = [
  "from-amber-400 to-rose-500",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-fuchsia-600",
  "from-violet-500 to-indigo-700",
  "from-sky-400 to-cyan-600",
  "from-orange-500 to-red-600",
];

export const GenresCard = ({
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

export const CreatorCard = ({
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

export const StandoutCard = ({
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

export const PicksCard = ({
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

export const OutroCard = ({
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
