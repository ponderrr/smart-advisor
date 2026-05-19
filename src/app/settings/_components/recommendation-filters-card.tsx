"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  cleanRecommendationFilters,
  PREF_RECOMMENDATION_FILTERS_KEY,
  type RecommendationFilters,
} from "@/features/recommendations/services/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { SectionCard, SectionHeader } from "./settings-ui";

/** Exact parity with the mobile app's _commonGenres list (account_screen). */
const COMMON_GENRES = [
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
] as const;

/** Runtime caps offered, in minutes. 0 = no cap (matches mobile stops). */
const RUNTIME_STOPS = [0, 90, 120, 150, 180] as const;

/**
 * Settings → Content "Recommendation filters" block. Lets the user set
 * explicit dislikes + hard constraints (avoid genres, max movie runtime,
 * preferred language, free-text "never recommend"). Persisted as the
 * `recommendation_filters` JSONB blob on the profile row (source of truth)
 * and mirrored to localStorage for instant hydration — parity with the
 * mobile Account > Recommendation filters section. Self-contained: owns
 * its own state + save, dropped into the content section like
 * SessionsManagement.
 */
export const RecommendationFiltersCard = () => {
  const t = useTranslations("Settings.content.filters");
  const { user } = useAuth();

  const [avoidGenres, setAvoidGenres] = useState<Set<string>>(new Set());
  const [runtimeIdx, setRuntimeIdx] = useState(0);
  const [language, setLanguage] = useState("");
  const [avoidNote, setAvoidNote] = useState("");
  const [saving, setSaving] = useState(false);

  const hydrate = (raw: unknown) => {
    const f = (raw ?? {}) as RecommendationFilters;
    setAvoidGenres(new Set(Array.isArray(f.avoidGenres) ? f.avoidGenres : []));
    setLanguage(typeof f.language === "string" ? f.language : "");
    setAvoidNote(typeof f.avoidNote === "string" ? f.avoidNote : "");
    const rt =
      typeof f.maxRuntimeMinutes === "number" ? f.maxRuntimeMinutes : 0;
    const i = RUNTIME_STOPS.indexOf(rt as (typeof RUNTIME_STOPS)[number]);
    setRuntimeIdx(i < 0 ? 0 : i);
  };

  // localStorage first for instant paint, then the profile row (source of
  // truth) overrides once it loads — same pattern as content-tone.
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

  const toggleGenre = (g: string) =>
    setAvoidGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const handleSave = async () => {
    if (!user?.id) {
      toast.error(t("notAuthed"));
      return;
    }
    setSaving(true);
    const runtime = RUNTIME_STOPS[runtimeIdx];
    const filters = {
      avoidGenres: Array.from(avoidGenres),
      maxRuntimeMinutes: runtime === 0 ? null : runtime,
      language: language.trim() || null,
      avoidNote: avoidNote.trim() || null,
    };
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
        // Mirror the cleaned shape so the hot cache matches what the AI
        // service would derive from the profile row.
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
            {t("avoidGenresLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_GENRES.map((g) => {
              const selected = avoidGenres.has(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold tracking-tight transition-all",
                    selected
                      ? "border-transparent bg-rose-500 text-white shadow-sm"
                      : "border-slate-200/80 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300 dark:hover:border-rose-500/60 dark:hover:text-rose-300",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("runtimeLabel")}
          </p>
          <SegmentedControl<string>
            layoutId="settings-rec-filter-runtime"
            value={String(runtimeIdx)}
            onChange={(v) => setRuntimeIdx(Number(v))}
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
            {runtimeIdx === 0
              ? t("runtimeHintNone")
              : t("runtimeHint", { minutes: RUNTIME_STOPS[runtimeIdx] })}
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("languageLabel")}
          </span>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder={t("languagePlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("avoidNoteLabel")}
          </span>
          <textarea
            value={avoidNote}
            onChange={(e) => setAvoidNote(e.target.value)}
            placeholder={t("avoidNotePlaceholder")}
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
