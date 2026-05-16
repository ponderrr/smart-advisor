"use client";

import Image from "next/image";
import { BookOpen, Film, Music } from "lucide-react";
import { useTranslations } from "next-intl";

import { Dialog } from "@/components/ui/dialog";
import { MusicPreview } from "@/components/music-preview";
import { TrailerEmbed } from "@/components/trailer-embed";
import { WhyThisPick } from "@/components/why-this-pick";
import { Recommendation } from "@/features/recommendations/types/recommendation";

/**
 * Detail modal for a single recommendation on the dashboard. Self-contained:
 * it reads no dashboard page state, only the rec it's handed and an
 * onClose callback. Extracted verbatim from dashboard/page.tsx.
 */
export const RecommendationModal = ({
  rec,
  onClose,
}: {
  rec: Recommendation;
  onClose: () => void;
}) => {
  const t = useTranslations("Dashboard.body");
  return (
    <Dialog
      open={true}
      onClose={onClose}
      ariaLabel={t("modal.ariaLabel", { title: rec.title })}
      hideCloseButton
    >
      {rec.poster_url && (
        <div className="relative aspect-[2/3] max-h-[300px] w-full overflow-hidden rounded-t-3xl bg-slate-200 dark:bg-slate-800">
          <Image
            src={rec.poster_url}
            alt={rec.title}
            fill
            sizes="(max-width: 640px) 100vw, 500px"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {rec.type === "movie" ? (
                <Film size={10} />
              ) : rec.type === "music" ? (
                <Music size={10} />
              ) : (
                <BookOpen size={10} />
              )}
              {rec.type}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="text-2xl font-black tracking-tight">{rec.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {rec.artist
            ? t("modal.byArtist", { artist: rec.artist })
            : rec.author
              ? t("modal.byAuthor", { author: rec.author })
              : rec.director
                ? t("modal.byDirector", { director: rec.director })
                : ""}
          {rec.year ? ` · ${rec.year}` : ""}
        </p>

        {rec.genres?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {rec.genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {rec.explanation && (
          <WhyThisPick text={rec.explanation} type={rec.type} className="mt-4" />
        )}

        {rec.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {rec.description}
          </p>
        )}

        {rec.type === "music" && rec.preview_url ? (
          <div className="mt-4">
            <MusicPreview
              previewUrl={rec.preview_url}
              title={rec.title}
              artist={rec.artist}
              artworkUrl={rec.poster_url}
            />
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

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t("modal.close")}
        </button>
      </div>
    </Dialog>
  );
};
