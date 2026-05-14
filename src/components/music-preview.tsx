"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPreviewProps {
  previewUrl?: string | null;
  className?: string;
}

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const total = Math.floor(safe);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/** Three pulsing vertical bars used in place of the play icon while audio
 *  is playing — visually says "sound is happening" without a literal
 *  waveform display. */
const Equalizer = () => (
  <span
    aria-hidden
    className="flex h-3.5 items-end gap-[2px]"
  >
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-[3px] rounded-sm bg-current"
        initial={{ scaleY: 0.35 }}
        animate={{ scaleY: [0.35, 1, 0.35] }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          delay: i * 0.12,
          ease: "easeInOut",
        }}
        style={{ height: "100%", originY: 1 }}
      />
    ))}
  </span>
);

export const MusicPreview = ({ previewUrl, className }: MusicPreviewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrubRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingBeforeDragRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Deezer previews are ~30s.
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.pause();
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const seekToClientX = (clientX: number) => {
    const bar = scrubRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );
    const next = ratio * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    // Pause during the drag so seeking is silent — feels like a Spotify
    // scrub. We resume on pointerup if it was playing.
    wasPlayingBeforeDragRef.current = playing;
    if (playing) audio.pause();
    seekToClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekToClientX(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    const audio = audioRef.current;
    if (audio && wasPlayingBeforeDragRef.current) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      audio.currentTime = Math.min(duration, audio.currentTime + 1);
      setCurrentTime(audio.currentTime);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 1);
      setCurrentTime(audio.currentTime);
    } else if (e.key === "Home") {
      e.preventDefault();
      audio.currentTime = 0;
      setCurrentTime(0);
    } else if (e.key === "End") {
      e.preventDefault();
      audio.currentTime = duration;
      setCurrentTime(duration);
    }
  };

  if (!previewUrl) return null;

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className={cn("flex w-full max-w-xs flex-col gap-2", className)}>
      <audio ref={audioRef} src={previewUrl} preload="none" />

      {/* Top row: round play button + label/time, Spotify-mini-player style. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause preview" : "Play 30 second preview"}
          aria-pressed={playing}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95",
            "from-rose-500 to-pink-500",
          )}
        >
          {playing ? (
            <Equalizer />
          ) : (
            <Play size={16} className="ml-[2px]" fill="currentColor" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-black tracking-tight text-slate-800 dark:text-slate-100">
            {playing ? "Now playing" : "30-second preview"}
          </span>
          <span className="text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Scrubber — thin track that the user can drag, click, or arrow-key
          through to seek. Pause-while-dragging so the audio doesn't stutter
          while they pull the thumb across the bar. */}
      <div
        ref={scrubRef}
        role="slider"
        tabIndex={0}
        aria-label="Preview position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative w-full cursor-pointer touch-none select-none rounded-full bg-slate-200 transition-all dark:bg-slate-700/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60",
          isDragging ? "h-1.5" : "h-1 hover:h-1.5",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 to-pink-500",
            // Snap to position during drag for responsiveness, ease while
            // playing back so the fill flows with the audio.
            isDragging
              ? "transition-none"
              : "transition-[width] duration-100 ease-linear",
          )}
          style={{ width: `${progress * 100}%` }}
        />
        {/* Scrubber thumb — visible on hover, focus, or while dragging so
            the user has a concrete handle to grab. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-md transition-opacity",
            isDragging
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* Pause hint — small inline cue under the bar while playing so the
          user knows the round button toggles. */}
      {playing && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <Pause size={10} />
          Tap to pause
        </span>
      )}
    </div>
  );
};
