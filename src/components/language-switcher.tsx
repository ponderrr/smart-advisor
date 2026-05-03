"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { setLocaleAction } from "@/app/actions/locale";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const FLAG: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

export const LanguageSwitcher = () => {
  const t = useTranslations("Language");
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Locale>(current);

  const select = (next: Locale) => {
    if (next === optimistic || pending) return;
    setOptimistic(next);
    startTransition(async () => {
      await setLocaleAction(next);
      toast.success(t("saved"));
    });
  };

  return (
    <div>
      <p className="mb-1 text-base font-bold tracking-tight">{t("title")}</p>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        {t("description")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUPPORTED_LOCALES.map((code) => {
          const active = optimistic === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => select(code)}
              disabled={pending}
              aria-pressed={active}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl border bg-white/85 p-4 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950",
                active
                  ? "border-transparent shadow-indigo-500/15 ring-2 ring-indigo-500/70 dark:ring-indigo-400/70"
                  : "border-slate-200/70 hover:border-slate-300 dark:border-slate-700/60 dark:hover:border-slate-600/80",
                pending && "cursor-wait opacity-70",
              )}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {FLAG[code]}
              </span>
              <span className="flex-1">
                <span className="block text-base font-bold tracking-tight">
                  {t(`options.${code}`)}
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  {code}
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30 transition-all duration-300",
                  active ? "scale-100 opacity-100" : "scale-50 opacity-0",
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {pending && (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("saving")}
        </p>
      )}
    </div>
  );
};
