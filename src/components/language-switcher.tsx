"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { setLocaleAction } from "@/app/actions/locale";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FLAG: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  pt: "🇵🇹",
  it: "🇮🇹",
  nl: "🇳🇱",
  ja: "🇯🇵",
  zh: "🇨🇳",
  ko: "🇰🇷",
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
      <Select
        value={optimistic}
        onValueChange={(value) => select(value as Locale)}
        disabled={pending}
      >
        <SelectTrigger className="w-full max-w-xs" aria-label={t("title")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              <span className="mr-2">{FLAG[code]}</span>
              {t(`options.${code}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("saving")}
        </p>
      )}
    </div>
  );
};
