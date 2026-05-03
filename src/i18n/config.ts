export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (SUPPORTED_LOCALES as readonly string[]).includes(value);
