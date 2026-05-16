"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { PASSWORD_RULES } from "@/features/auth/utils/validation";

/**
 * Derives the live password-strength checklist + confirm-match rule for
 * the settings change-password form. Extracted verbatim from
 * settings/page.tsx; owns its own translations (the "Auth.passwordRules"
 * and "Settings" namespaces, matching the page's tPasswordRules / t).
 */
export function usePasswordRules(newPassword: string, confirmPassword: string) {
  const tPasswordRules = useTranslations("Auth.passwordRules");
  const t = useTranslations("Settings");

  const newPasswordRules = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        label: tPasswordRules(rule.key),
        met: rule.test(newPassword || ""),
      })),
    [newPassword, tPasswordRules],
  );

  const confirmPasswordRules = useMemo(
    () => [
      {
        label: t("password.matches"),
        met: !!confirmPassword && confirmPassword === newPassword,
      },
    ],
    [confirmPassword, newPassword, t],
  );

  return { newPasswordRules, confirmPasswordRules };
}
