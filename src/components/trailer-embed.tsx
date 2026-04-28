"use client";

import { useEffect, useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";

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

interface TrailerEmbedProps {
  type: "movie" | "book";
  title: string;
  year?: number | null;
  author?: string | null;
  className?: string;
}

export const TrailerEmbed = ({
  type,
  title,
  year,
  author,
  className,
}: TrailerEmbedProps) => {
  const [data, setData] = useState<TrailerData>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setShowPlayer(false);
    const params = new URLSearchParams({ title, type });
    if (year) params.set("year", String(year));
    if (author) params.set("author", author);
    fetch(`/api/trailer?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json) => {
        if (cancelled) return;
        setData(json.data ?? null);
        setState("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [type, title, year, author]);

  if (state === "loading") {
    return (
      <div
        className={cn(
          "shimmer-container aspect-video w-full rounded-2xl",
          className,
        )}
      />
    );
  }

  if (state === "error" || !data) return null;

  if (data.provider === "youtube" && data.youtubeKey) {
    if (!showPlayer) {
      return (
        <button
          type="button"
          onClick={() => setShowPlayer(true)}
          className={cn(
            "group relative block aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
            className,
          )}
          aria-label={`Play trailer for ${title}`}
        >
          <img
            src={`https://img.youtube.com/vi/${data.youtubeKey}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg shadow-black/30 transition-transform duration-200 group-hover:scale-110">
              <PlayCircle size={32} strokeWidth={1.5} />
            </span>
          </span>
          <span className="absolute bottom-2 left-3 right-3 truncate text-left text-xs font-bold text-white/90">
            {data.name || "Watch trailer"}
          </span>
        </button>
      );
    }
    return (
      <div
        className={cn(
          "aspect-video w-full overflow-hidden rounded-2xl bg-black",
          className,
        )}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${data.youtubeKey}?autoplay=1&rel=0`}
          title={`${title} trailer`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  // Open Library — link out to the work info page
  if (data.provider === "open-library" && data.infoLink) {
    return (
      <a
        href={data.infoLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-indigo-700 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800/70 dark:hover:text-indigo-300",
          className,
        )}
      >
        View on Open Library
        <ExternalLink size={13} />
      </a>
    );
  }

  return null;
};
