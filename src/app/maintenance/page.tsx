import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Wrench } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";

export const metadata: Metadata = {
  title: "Out to lunch — Smart Advisor",
  description:
    "Smart Advisor is currently undergoing scheduled maintenance. We'll be back shortly.",
  robots: "noindex, nofollow",
};

export default async function MaintenancePage() {
  const t = await getTranslations("System.maintenance");

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Same ambient backdrop as the 404 page so the system states feel
          like siblings rather than two unrelated screens. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/50 via-transparent to-violet-50/60 dark:from-amber-500/10 dark:via-transparent dark:to-violet-500/10"
        aria-hidden
      />

      <header className="flex h-[72px] items-center px-4 sm:px-6 md:px-12">
        <BrandWordmark imageClassName="h-11" />
      </header>

      <main className="flex flex-col items-center justify-center px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md sm:p-12 dark:border-slate-700/60 dark:bg-slate-900/65">
            {/* Status pill — frames this as a known operational state,
                not a generic error. */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Wrench size={11} />
              {/* Inline status string — kept as English-only since it's
                  a tight status badge and i18n already covers the body. */}
              Maintenance
            </span>

            {/* Three bouncing dots — kept from the original, recolored to
                slate so they read as a calm "working on it" rather than
                an attention-seeking loader. */}
            <div
              className="mt-7 flex items-center justify-center gap-2"
              aria-hidden
            >
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-slate-500" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-slate-500" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" />
            </div>

            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
              {t("body")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
