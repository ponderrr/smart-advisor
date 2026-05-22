"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { setLocaleAction } from "@/app/actions/locale";
import { Input } from "@/components/ui/input";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { PageLoader } from "@/components/ui/loader";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AuthLayout, FormField } from "@/features/auth/components";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import {
  PREF_CONTENT_KEY,
  PREF_CONTENT_TONE_KEY,
  type ContentFocus,
} from "@/app/settings/_hooks/use-content-preferences";
import { cn } from "@/lib/utils";

type ContentTone = "family" | "standard";

/** Mirrors the curated movie-genre chip list in Settings → Recommendation
 *  filters so the baseline a user picks here lines up with what they see
 *  later. Per-format slices on the filter blob get the same list applied
 *  to all three formats when the user picks any chip during onboarding. */
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

/** 5 paged steps: name → language → focus → avoid genres → review. The
 *  review step is a last-look summary with per-row Edit links that jump
 *  back to the relevant step before saving. */
const TOTAL_STEPS = 5;

const FOCUS_HUE: Record<ContentFocus, string> = {
  movie: "bg-amber-500",
  book: "bg-emerald-500",
  music: "bg-rose-500",
  both: "bg-violet-500",
  mix: "bg-violet-500",
};

const OnboardingPage = () => {
  const router = useRouter();
  const { user, session, loading, refreshUser } = useAuth();
  const t = useTranslations("Onboarding");
  const tc = useTranslations("Common");
  const currentLocale = useLocale() as Locale;

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [contentFocus, setContentFocus] = useState<ContentFocus>("mix");
  const [avoidGenres, setAvoidGenres] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name ?? "");
    if (user.locale && isSupportedLocale(user.locale)) {
      setLocale(user.locale);
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !loading && !session) {
      router.push("/auth");
    }
  }, [mounted, loading, session, router]);

  const persist = async (skip: boolean): Promise<boolean> => {
    if (!user) return false;
    const trimmedName = displayName.trim();
    if (!skip && step === 0 && !trimmedName) {
      // Name is the only required step; everything else has a sensible
      // default so Skip from a later step doesn't trip the gate.
      setError(t("errors.displayNameRequired"));
      return false;
    }

    const tone: ContentTone =
      typeof user.age === "number" && user.age < 18 ? "family" : "standard";
    const finalName = skip
      ? user.name ?? trimmedName
      : trimmedName || user.name;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: finalName,
        content_tone: user.content_tone ?? tone,
        locale,
        setup_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[onboarding] save failed", updateError);
      setError(t("errors.saveFailed"));
      return false;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PREF_CONTENT_TONE_KEY,
        user.content_tone ?? tone,
      );
      if (!skip) {
        window.localStorage.setItem(PREF_CONTENT_KEY, contentFocus);
      }
    }

    if (!skip && avoidGenres.size > 0) {
      // Apply the avoid-genre baseline to every format slice so the user
      // never sees it across movies/books/music until they tune per-format
      // in Settings.
      const slice = { avoidGenres: Array.from(avoidGenres) };
      try {
        await supabase
          .from("profiles")
          .update({
            recommendation_filters: {
              movie: slice,
              book: slice,
              music: slice,
            },
          })
          .eq("id", user.id);
      } catch (err) {
        console.warn("[onboarding] failed to write avoid-genre baseline", err);
        // Non-fatal — user can re-pick from Settings later.
      }
    }

    if (locale !== currentLocale) {
      await setLocaleAction(locale);
    }

    await refreshUser?.();
    return true;
  };

  const finish = async (skip: boolean) => {
    setError(null);
    setSubmitting(true);
    const ok = await persist(skip);
    setSubmitting(false);
    if (!ok) return;
    toast.success(t("savedToast"));
    router.push("/feed");
  };

  const toggleGenre = (g: string) =>
    setAvoidGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const canAdvance = useMemo(() => {
    if (step === 0) return displayName.trim().length > 0;
    return true;
  }, [step, displayName]);

  const handleNext = () => {
    if (step === 0 && !displayName.trim()) {
      setError(t("errors.displayNameRequired"));
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else void finish(false);
  };

  const handleBack = () => {
    if (step === 0) return;
    setError(null);
    setStep((s) => s - 1);
  };

  if (!mounted || loading) {
    return <PageLoader text={tc("loading")} />;
  }

  if (!user || !session) {
    return null;
  }

  const isLast = step === TOTAL_STEPS - 1;
  const focusHue = FOCUS_HUE[contentFocus] ?? "bg-violet-500";

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <ProgressDots active={step} total={TOTAL_STEPS} />

        <div className="mt-8 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {step === 0 && (
                <StepShell
                  eyebrow={t("steps.name.eyebrow")}
                  title={t("steps.name.title")}
                  subtitle={t("steps.name.subtitle")}
                >
                  <FormField
                    label={t("fields.displayName.label")}
                    htmlFor="onboarding-name"
                    invalid={!!error && !displayName.trim()}
                  >
                    <Input
                      id="onboarding-name"
                      type="text"
                      value={displayName}
                      onChange={(event) => {
                        setError(null);
                        setDisplayName(event.target.value);
                      }}
                      placeholder={t("fields.displayName.placeholder")}
                      maxLength={64}
                      disabled={submitting}
                      autoFocus
                      className="text-center focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
                    />
                  </FormField>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell
                  eyebrow={t("steps.language.eyebrow")}
                  title={t("steps.language.title")}
                  subtitle={t("steps.language.subtitle")}
                >
                  <SegmentedControl<Locale>
                    layoutId="onboarding-language"
                    value={locale}
                    onChange={(next) => {
                      setLocale(next);
                      // Switch the app locale right away so the rest of
                      // onboarding renders in the chosen language — not
                      // only after the final persist.
                      void setLocaleAction(next);
                    }}
                    disabled={submitting}
                    ariaLabel={t("fields.language.label")}
                    options={[
                      {
                        value: "en",
                        label: t("fields.language.en"),
                        pillClassName: "bg-indigo-500",
                      },
                      {
                        value: "es",
                        label: t("fields.language.es"),
                        pillClassName: "bg-indigo-500",
                      },
                    ]}
                  />
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  eyebrow={t("steps.focus.eyebrow")}
                  title={t("steps.focus.title")}
                  subtitle={t("steps.focus.subtitle")}
                >
                  <SegmentedControl<ContentFocus>
                    layoutId="onboarding-focus"
                    value={contentFocus}
                    onChange={setContentFocus}
                    disabled={submitting}
                    ariaLabel={t("steps.focus.title")}
                    options={[
                      {
                        value: "movie",
                        label: t("fields.focus.movie"),
                        pillClassName: "bg-amber-500",
                      },
                      {
                        value: "book",
                        label: t("fields.focus.book"),
                        pillClassName: "bg-emerald-500",
                      },
                      {
                        value: "music",
                        label: t("fields.focus.music"),
                        pillClassName: "bg-rose-500",
                      },
                      {
                        value: "mix",
                        label: t("fields.focus.mix"),
                        pillClassName: "bg-violet-500",
                      },
                    ]}
                  />
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    {t("steps.focus.hint")}
                  </p>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  eyebrow={t("steps.avoid.eyebrow")}
                  title={t("steps.avoid.title")}
                  subtitle={t("steps.avoid.subtitle")}
                >
                  <div className="flex flex-wrap justify-center gap-2">
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
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    {avoidGenres.size === 0
                      ? t("steps.avoid.emptyHint")
                      : t("steps.avoid.selectedHint", {
                          count: avoidGenres.size,
                        })}
                  </p>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  eyebrow={t("steps.review.eyebrow")}
                  title={t("steps.review.title")}
                  subtitle={t("steps.review.subtitle")}
                >
                  <ul className="space-y-2 text-left">
                    <ReviewRow
                      label={t("steps.name.title")}
                      value={
                        displayName.trim() ||
                        user.name ||
                        t("steps.review.empty")
                      }
                      onEdit={() => setStep(0)}
                      editLabel={t("steps.review.edit")}
                    />
                    <ReviewRow
                      label={t("steps.language.title")}
                      value={t(`fields.language.${locale}` as const)}
                      onEdit={() => setStep(1)}
                      editLabel={t("steps.review.edit")}
                    />
                    <ReviewRow
                      label={t("steps.focus.title")}
                      value={t(`fields.focus.${contentFocus}` as const, {
                        default: contentFocus,
                      })}
                      onEdit={() => setStep(2)}
                      editLabel={t("steps.review.edit")}
                      valueClassName={cn(
                        "font-extrabold",
                        contentFocus === "movie" &&
                          "text-amber-600 dark:text-amber-300",
                        contentFocus === "book" &&
                          "text-emerald-600 dark:text-emerald-300",
                        contentFocus === "music" &&
                          "text-rose-600 dark:text-rose-300",
                        (contentFocus === "mix" || contentFocus === "both") &&
                          "text-violet-600 dark:text-violet-300",
                      )}
                    />
                    <ReviewRow
                      label={t("steps.avoid.title")}
                      value={
                        avoidGenres.size === 0
                          ? t("steps.review.noGenres")
                          : Array.from(avoidGenres).sort().join(", ")
                      }
                      onEdit={() => setStep(3)}
                      editLabel={t("steps.review.edit")}
                    />
                  </ul>
                </StepShell>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-center text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-0 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft size={14} />
              {t("back")}
            </button>
            <button
              type="button"
              onClick={() => void finish(true)}
              disabled={submitting}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("skip")}
            </button>
          </div>
          <StatefulButton
            type="button"
            state={submitting ? "loading" : "idle"}
            disabled={submitting || (!canAdvance && step === 0)}
            onClick={handleNext}
            className={cn(
              "w-full transition-colors",
              // Tint the primary button with the focus hue once the
              // user lands on the content-focus step — the affordance
              // mirrors the segmented control above it.
              step === 2 && focusHue,
            )}
          >
            {isLast ? (
              t("finish")
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {t("next")}
                <ArrowRight size={14} />
              </span>
            )}
          </StatefulButton>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

interface StepShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const StepShell = ({ eyebrow, title, subtitle, children }: StepShellProps) => (
  <div className="space-y-5">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tighter text-slate-900 sm:text-3xl dark:text-slate-100">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
    <div>{children}</div>
  </div>
);

interface ReviewRowProps {
  label: string;
  value: string;
  onEdit: () => void;
  editLabel: string;
  valueClassName?: string;
}

const ReviewRow = ({
  label,
  value,
  onEdit,
  editLabel,
  valueClassName,
}: ReviewRowProps) => (
  <li className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/55">
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100",
          valueClassName,
        )}
        title={value}
      >
        {value}
      </p>
    </div>
    <button
      type="button"
      onClick={onEdit}
      className="shrink-0 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-700 transition-colors hover:bg-indigo-500/15 dark:bg-indigo-400/15 dark:text-indigo-300"
    >
      {editLabel}
    </button>
  </li>
);

interface ProgressDotsProps {
  active: number;
  total: number;
}

const ProgressDots = ({ active, total }: ProgressDotsProps) => (
  <div className="flex items-center justify-center gap-1.5">
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          i === active
            ? "w-6 bg-indigo-500"
            : "w-1.5 bg-slate-300/70 dark:bg-slate-700",
        )}
      />
    ))}
  </div>
);

export default OnboardingPage;
