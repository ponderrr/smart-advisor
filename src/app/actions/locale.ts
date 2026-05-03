"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";

export async function setLocaleAction(value: string): Promise<Locale> {
  const locale: Locale = isSupportedLocale(value) ? value : DEFAULT_LOCALE;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return locale;
}
