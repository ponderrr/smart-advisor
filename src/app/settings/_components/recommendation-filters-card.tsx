"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  cleanRecommendationFilters,
  PREF_RECOMMENDATION_FILTERS_KEY,
  type FormatFilters,
  type RecommendationFilters,
} from "@/features/recommendations/services/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { SectionCard, SectionHeader } from "./settings-ui";

type Format = "movie" | "book" | "music";

/** Curated common-genre buckets per format. Names mirror the labels used
 *  on the in-quiz "Pick Type" control and the mobile app's filter chips. */
const GENRES: Record<Format, readonly string[]> = {
  movie: [
    "Horror",
    "Romance",
    "Musical",
    "Documentary",
    "Anime",
    "Reality",
    "War",
    "Western",
    "Thriller",
    "Comedy",
  ],
  book: [
    "Sci-Fi",
    "Fantasy",
    "Romance",
    "Mystery",
    "Horror",
    "Historical",
    "Literary",
    "Young Adult",
    "Memoir",
    "Self-Help",
  ],
  music: [
    "Pop",
    "Rock",
    "Hip-Hop",
    "Country",
    "Jazz",
    "Classical",
    "Electronic",
    "R&B",
    "Metal",
    "Indie",
  ],
};

/** Movie runtime caps offered, in minutes. 0 = no cap. Movie-only. */
const RUNTIME_STOPS = [0, 90, 120, 150, 180] as const;

/** Per-format selected-chip style — a soft tint of the format's hue with
 *  matching text, rather than a solid bright fill, to stay in line with
 *  the app's muted control styling. */
const ACTIVE_HUE: Record<Format, string> = {
  movie:
    "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40",
  book:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40",
  music:
    "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40",
};

const HOVER_BORDER: Record<Format, string> = {
  movie:
    "hover:border-amber-300 hover:text-amber-600 dark:hover:border-amber-500/60 dark:hover:text-amber-300",
  book:
    "hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-500/60 dark:hover:text-emerald-300",
  music:
    "hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-500/60 dark:hover:text-rose-300",
};

const FORMATS: readonly Format[] = ["movie", "book", "music"];

type SliceState = {
  avoidGenres: Set<string>;
  runtimeIdx: number;
  language: string;
  avoidNote: string;
};

const EMPTY_SLICE = (): SliceState => ({
  avoidGenres: new Set<string>(),
  runtimeIdx: 0,
  language: "",
  avoidNote: "",
});

function sliceFromBlob(raw: FormatFilters | undefined): SliceState {
  const s = EMPTY_SLICE();
  if (!raw) return s;
  if (Array.isArray(raw.avoidGenres)) s.avoidGenres = new Set(raw.avoidGenres);
  if (typeof raw.language === "string") s.language = raw.language;
  if (typeof raw.avoidNote === "string") s.avoidNote = raw.avoidNote;
  const rt = typeof raw.maxRuntimeMinutes === "number" ? raw.maxRuntimeMinutes : 0;
  const i = RUNTIME_STOPS.indexOf(rt as (typeof RUNTIME_STOPS)[number]);
  s.runtimeIdx = i < 0 ? 0 : i;
  return s;
}

function sliceToBlob(s: SliceState, format: Format): FormatFilters {
  const out: FormatFilters = {};
  if (s.avoidGenres.size > 0) out.avoidGenres = Array.from(s.avoidGenres);
  if (format === "movie") {
    const rt = RUNTIME_STOPS[s.runtimeIdx];
    if (rt > 0) out.maxRuntimeMinutes = rt;
  }
  const lang = s.language.trim();
  if (lang.length > 0) out.language = lang;
  const note = s.avoidNote.trim();
  if (note.length > 0) out.avoidNote = note;
  return out;
}

/**
 * Settings → Content "Recommendation filters" block. Lets the user set
 * explicit dislikes + hard constraints (avoid genres, max movie runtime,
 * preferred language, free-text "never recommend") PER FORMAT — so e.g.
 * avoiding "Romance" movies doesn't also block romance novels. Persisted
 * as the `recommendation_filters` JSONB blob on the profile row (new
 * per-format shape; legacy single-bucket blob is migrated on read).
 */
export const RecommendationFiltersCard = () => {
  const t = useTranslations("Settings.content.filters");
  const { user } = useAuth();

  const [active, setActive] = useState<Format>("movie");
  const [slices, setSlices] = useState<Record<Format, SliceState>>(() => ({
    movie: EMPTY_SLICE(),
    book: EMPTY_SLICE(),
    music: EMPTY_SLICE(),
  }));
  const [saving, setSaving] = useState(false);

  const hydrate = (raw: unknown) => {
    const cleaned = cleanRecommendationFilters(raw) ?? {};
    setSlices({
      movie: sliceFromBlob(cleaned.movie),
      book: sliceFromBlob(cleaned.book),
      music: sliceFromBlob(cleaned.music),
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(
        PREF_RECOMMENDATION_FILTERS_KEY,
      );
      if (cached) {
        try {
          hydrate(JSON.parse(cached));
        } catch {
          /* ignore malformed cache */
        }
      }
    }
    if (!user?.id) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("recommendation_filters")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.recommendation_filters) {
          hydrate(data.recommendation_filters);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const current = slices[active];
  const setCurrent = (next: SliceState) =>
    setSlices((prev) => ({ ...prev, [active]: next }));

  const toggleGenre = (g: string) => {
    const nextGenres = new Set(current.avoidGenres);
    if (nextGenres.has(g)) nextGenres.delete(g);
    else nextGenres.add(g);
    setCurrent({ ...current, avoidGenres: nextGenres });
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error(t("notAuthed"));
      return;
    }
    setSaving(true);
    const filters: RecommendationFilters = {
      movie: sliceToBlob(slices.movie, "movie"),
      book: sliceToBlob(slices.book, "book"),
      music: sliceToBlob(slices.music, "music"),
    };
    // Drop empty slices so the stored blob mirrors what the EF will read.
    for (const k of FORMATS) {
      if (Object.keys(filters[k] ?? {}).length === 0) delete filters[k];
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          recommendation_filters: filters,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PREF_RECOMMENDATION_FILTERS_KEY,
          JSON.stringify(cleanRecommendationFilters(filters) ?? {}),
        );
      }
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title={t("title")} description={t("description")} />

      <div className="space-y-6">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("formatLabel")}
          </p>
          <SegmentedControl<Format>
            layoutId="settings-rec-filter-format"
            value={active}
            onChange={setActive}
            ariaLabel={t("formatLabel")}
            options={[
              {
                value: "movie",
                label: t("format.movie"),
                pillClassName: "bg-amber-500",
              },
              {
                value: "book",
                label: t("format.book"),
                pillClassName: "bg-emerald-500",
              },
              {
                value: "music",
                label: t("format.music"),
                pillClassName: "bg-rose-500",
              },
            ]}
          />
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("avoidGenresLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES[active].map((g) => {
              const selected = current.avoidGenres.has(g);
              return (
                <button
                  key={`${active}-${g}`}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold tracking-tight transition-all",
                    selected
                      ? cn("border-transparent", ACTIVE_HUE[active])
                      : cn(
                        "border-slate-200/80 bg-white text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300",
                        HOVER_BORDER[active],
                      ),
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {active === "movie" && (
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("runtimeLabel")}
            </p>
            <SegmentedControl<string>
              layoutId="settings-rec-filter-runtime"
              value={String(current.runtimeIdx)}
              onChange={(v) => setCurrent({ ...current, runtimeIdx: Number(v) })}
              ariaLabel={t("runtimeLabel")}
              options={RUNTIME_STOPS.map((stop, i) => ({
                value: String(i),
                label:
                  stop === 0
                    ? t("runtimeNoCap")
                    : t("runtimeMinutes", { minutes: stop }),
                pillClassName: "bg-amber-500",
              }))}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {current.runtimeIdx === 0
                ? t("runtimeHintNone")
                : t("runtimeHint", {
                  minutes: RUNTIME_STOPS[current.runtimeIdx],
                })}
            </p>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("languageLabel")}
          </span>
          <input
            type="text"
            value={current.language}
            onChange={(e) =>
              setCurrent({ ...current, language: e.target.value })
            }
            placeholder={t("languagePlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("avoidNoteLabel")}
          </span>
          <textarea
            value={current.avoidNote}
            onChange={(e) =>
              setCurrent({ ...current, avoidNote: e.target.value })
            }
            placeholder={t(`avoidNotePlaceholder.${active}`)}
            rows={3}
            maxLength={500}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("avoidNoteHint")}
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          {t("appliesNext")}
        </span>
        <StatefulButton
          onClick={handleSave}
          state={saving ? "loading" : "idle"}
          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
        >
          {t("save")}
        </StatefulButton>
      </div>
    </SectionCard>
  );
};
