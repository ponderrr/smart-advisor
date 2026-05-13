"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { setLocaleAction } from "@/app/actions/locale";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { SegmentedControl } from "@/components/ui/segmented-control";

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
      <SegmentedControl<Locale>
        layoutId="settings-language"
        value={optimistic}
        onChange={select}
        disabled={pending}
        ariaLabel={t("title")}
        options={SUPPORTED_LOCALES.map((code) => ({
          value: code,
          label: `${FLAG[code]}  ${t(`options.${code}`)}`,
          pillClassName: "bg-indigo-500",
        }))}
      />
      {pending && (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("saving")}
        </p>
      )}
    </div>
  );
};
