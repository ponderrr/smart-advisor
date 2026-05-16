"use client";

import Image from "next/image";
import { BookCheck, BookOpen, Film, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import { Recommendation } from "@/features/recommendations/types/recommendation";

/**
 * Poster card for a single recommendation in the dashboard rails/grid.
 * Extracted verbatim from dashboard/page.tsx's renderPickCard; the page
 * keeps a thin wrapper so existing `.map(renderPickCard)` call sites are
 * unchanged. Owns its own useTranslations("Dashboard.body").
 */
export const PickCard = ({
  rec,
  inLibrary,
  onSelect,
}: {
  rec: Recommendation;
  inLibrary: boolean;
  onSelect: () => void;
}) => {
  const tb = useTranslations("Dashboard.body");
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {rec.poster_url ? (
          <Image
            src={rec.poster_url}
            alt={rec.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            {rec.type === "movie" ? <Film size={24} /> : <BookOpen size={24} />}
          </div>
        )}

        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          {rec.is_favorited && (
            <span
              aria-label={tb("favoriteAria")}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30"
            >
              <Heart size={11} fill="currentColor" />
            </span>
          )}
          {inLibrary && (
            <span
              aria-label={tb("inLibraryAria")}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
            >
              <BookCheck size={11} />
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3">
          <p className="line-clamp-2 text-sm font-black tracking-tight leading-tight text-white">
            {rec.title}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-sm">
              {rec.type === "movie" ? <Film size={9} /> : <BookOpen size={9} />}
              {rec.type}
            </span>
            {rec.year && (
              <span className="text-[9px] font-bold text-white/70">
                {rec.year}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
