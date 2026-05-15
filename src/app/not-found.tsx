"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { BrandWordmark } from "@/components/brand-wordmark";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const router = useRouter();
  const t = useTranslations("System.notFound");

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Soft ambient gradient — matches the muted brand surface used
          across the app instead of a loud single-hue radial. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-50/60 via-transparent to-rose-50/60 dark:from-violet-500/10 dark:via-transparent dark:to-rose-500/10"
        aria-hidden
      />

      <header className="flex h-[72px] items-center px-4 sm:px-6 md:px-12">
        <button
          onClick={handleGoHome}
          className="inline-flex cursor-pointer items-center transition-opacity duration-200 hover:opacity-80"
          aria-label={t("goHome")}
        >
          <BrandWordmark imageClassName="h-11" />
        </button>
      </header>

      <main className="flex flex-col items-center justify-center px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md sm:p-12 dark:border-slate-700/60 dark:bg-slate-900/65">
            {/* Eyebrow pill — frames the 404 as a system state, not a
                mistake, and matches the visual language of the rest of
                the app's chrome. */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-400">
              <Compass size={11} />
              404
            </span>

            <h1
              className={cn(
                "mt-6 bg-gradient-to-b bg-clip-text text-[clamp(4.5rem,16vw,9rem)] font-black leading-none tracking-tighter text-transparent",
                "from-slate-900 to-slate-400 dark:from-slate-100 dark:to-slate-500",
              )}
            >
              404
            </h1>

            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              {t("title")}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
              {t("body")}
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <PillButton
                onClick={handleGoBack}
                className="inline-flex w-full items-center justify-center gap-1.5 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <ArrowLeft size={14} />
                {t("goBack")}
              </PillButton>
              <button
                onClick={handleGoHome}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto dark:bg-white dark:text-slate-900"
              >
                {t("goHome")}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
