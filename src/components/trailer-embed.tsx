"use client";

import { useEffect, useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type WatchProviders = {
  region: string;
  link: string | null;
  flatrate: {
    id: number;
    name: string;
    logo: string | null;
    link: string | null;
  }[];
};

type TrailerData =
  | {
      provider: "youtube";
      youtubeKey: string | null;
      name: string | null;
      tmdbId: number;
      posterUrl: string | null;
      overview: string | null;
      watchProviders: WatchProviders | null;
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
  region?: string;
  className?: string;
}

const WatchProvidersRow = ({ providers }: { providers: WatchProviders }) => {
  if (providers.flatrate.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        Where to watch
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {providers.flatrate.map((p) => {
          const inner = (
            <>
              {p.logo && (
                <img
                  src={p.logo}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                  loading="lazy"
                />
              )}
              {p.name}
            </>
          );
          const baseClass =
            "inline-flex h-7 items-center gap-1.5 overflow-hidden rounded-full border border-slate-200/80 bg-white px-1 pr-2.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200";
          if (p.link) {
            return (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                title={`Search ${p.name} for this title`}
                className={cn(
                  baseClass,
                  "transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300",
                )}
              >
                {inner}
              </a>
            );
          }
          return (
            <span key={p.id} title={p.name} className={baseClass}>
              {inner}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const TrailerEmbed = ({
  type,
  title,
  year,
  author,
  region,
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
    if (region) params.set("region", region);
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
  }, [type, title, year, author, region]);

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

  if (data.provider === "youtube") {
    const providers = data.watchProviders;
    const hasProviders = providers && providers.flatrate.length > 0;

    if (!data.youtubeKey && !hasProviders) return null;

    const providersRow = hasProviders ? (
      <WatchProvidersRow providers={providers} />
    ) : null;

    if (!data.youtubeKey) {
      return <div className={cn("space-y-3", className)}>{providersRow}</div>;
    }

    const trailer = !showPlayer ? (
      <button
        type="button"
        onClick={() => setShowPlayer(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
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
    ) : (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
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

    return (
      <div className={cn("space-y-3", className)}>
        {trailer}
        {providersRow}
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
