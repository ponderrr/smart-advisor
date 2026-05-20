"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Mail, CalendarDays } from "lucide-react";
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

type ContentTone = "family" | "standard";
const CONTENT_TONE_KEY = "smart_advisor_pref_content_tone";

const OnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading, refreshUser } = useAuth();
  const t = useTranslations("Onboarding");
  const tc = useTranslations("Common");
  const currentLocale = useLocale() as Locale;

  // Preview mode = a re-visit from Settings → Help → "Show onboarding".
  // We render the form as-is so the user can see what onboarding looks
  // like, but swap Save/Skip for a single Close button so a replay can't
  // clobber the real profile name + locale.
  const previewMode = searchParams.get("preview") === "true";

  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate the form from the profile once useAuth resolves. We only ever
  // pull `name` and `locale` here — age + email are display-only.
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name ?? "");
    if (user.locale && isSupportedLocale(user.locale)) {
      setLocale(user.locale);
    }
  }, [user]);

  // Direct hits to /onboarding without a session get bounced back to /auth,
  // same pattern as the mfa-setup route.
  useEffect(() => {
    if (mounted && !loading && !session) {
      router.push("/auth");
    }
  }, [mounted, loading, session, router]);

  const persist = async (skip: boolean): Promise<boolean> => {
    if (!user) return false;
    const trimmedName = displayName.trim();
    if (!skip && !trimmedName) {
      setError(t("errors.displayNameRequired"));
      return false;
    }

    // Content tone never appears in this simplified flow but still needs a
    // sensible default per age. Minors are locked to family-friendly.
    const tone: ContentTone =
      typeof user.age === "number" && user.age < 18 ? "family" : "standard";

    const finalName = skip ? user.name : trimmedName || user.name;

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
        CONTENT_TONE_KEY,
        user.content_tone ?? tone,
      );
    }

    if (locale !== currentLocale) {
      await setLocaleAction(locale);
    }

    await refreshUser?.();
    return true;
  };

  const handleSubmit = async () => {
    // Defensive: hitting Enter while in preview mode could still hit the
    // form's onSubmit even with Save/Skip buttons hidden.
    if (previewMode) {
      router.push("/settings?section=help");
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await persist(false);
    setSubmitting(false);
    if (!ok) return;
    toast.success(t("savedToast"));
    router.push("/feed");
  };

  const handleSkip = async () => {
    if (previewMode) {
      router.push("/settings?section=help");
      return;
    }
    setError(null);
    setSubmitting(true);
    await persist(true);
    setSubmitting(false);
    router.push("/feed");
  };

  if (!mounted || loading) {
    return <PageLoader text={tc("loading")} />;
  }

  if (!user || !session) {
    return null;
  }

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl dark:text-slate-100">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("subtitle")}
        </p>

        {/* Read-only confirmation of the bits the user already gave us at
            signup — they can edit these later in settings. */}
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ConfirmRow
            icon={<Mail size={14} />}
            label={t("readonly.email")}
            value={user.email}
          />
          <ConfirmRow
            icon={<CalendarDays size={14} />}
            label={t("readonly.age")}
            value={String(user.age)}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          {t("readonly.editLater")}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="mt-6 space-y-4"
          noValidate
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
              className="focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
            />
          </FormField>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("fields.language.label")}
            </p>
            <SegmentedControl<Locale>
              layoutId="onboarding-language"
              value={locale}
              onChange={setLocale}
              disabled={submitting}
              ariaLabel={t("fields.language.label")}
              options={[
                { value: "en", label: t("fields.language.en") },
                { value: "es", label: t("fields.language.es") },
              ]}
            />
          </div>

          {error && !previewMode && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          {previewMode ? (
            <StatefulButton
              type="button"
              state="idle"
              onClick={() => router.push("/settings?section=help")}
              className="w-full"
            >
              {t("previewClose")}
            </StatefulButton>
          ) : (
            <>
              <StatefulButton
                type="submit"
                state={submitting ? "loading" : "idle"}
                disabled={submitting}
                className="w-full"
              >
                {t("submit")}
              </StatefulButton>

              <button
                type="button"
                onClick={() => void handleSkip()}
                disabled={submitting}
                className="block w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t("skip")}
              </button>
            </>
          )}
        </form>
      </motion.div>
    </AuthLayout>
  );
};

const ConfirmRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-700/60 dark:bg-slate-800/40">
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200"
        title={value}
      >
        {value}
      </p>
    </div>
  </div>
);

export default OnboardingPage;
