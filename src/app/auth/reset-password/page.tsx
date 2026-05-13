"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authService } from "@/features/auth/services/auth-service";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/features/auth/components";
import {
  AuthHoverButton,
  FieldRequirements,
  FormField,
  PasswordInput,
} from "@/features/auth/components/auth-shared";
import {
  PASSWORD_RULES,
  isValidPassword,
} from "@/features/auth/utils/validation";

const REDIRECT_DELAY = 3000;

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations("Auth.resetPassword");
  const tPasswordRules = useTranslations("Auth.passwordRules");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const passwordAnchorRef = useRef<HTMLDivElement>(null);
  const confirmAnchorRef = useRef<HTMLDivElement>(null);

  const passwordRules = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        label: tPasswordRules(rule.key),
        met: rule.test(password),
      })),
    [password, tPasswordRules],
  );
  const confirmRules = useMemo(
    () => [
      {
        label: t("matchesRule"),
        met: confirmPassword.length > 0 && confirmPassword === password,
      },
    ],
    [confirmPassword, password, t],
  );

  const passwordAllMet = passwordRules.every((r) => r.met);
  const confirmAllMet = confirmRules.every((r) => r.met);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasRecoverySession(!!data.session);
      setSessionChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isValidPassword(password) || password !== confirmPassword || !confirmPassword) {
      next.general = t("fixHighlighted");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(false);

    setLoading(true);
    setErrors({});
    const { error } = await authService.updatePassword(password);
    setLoading(false);

    if (error) {
      setErrors({ general: error });
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/auth"), REDIRECT_DELAY);
    }
  };

  if (!sessionChecked) {
    return (
      <AuthLayout onLogoClick={() => router.push("/")}>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </AuthLayout>
    );
  }

  if (!hasRecoverySession) {
    return (
      <AuthLayout onLogoClick={() => router.push("/")}>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t("invalidTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("invalidBody")}
          </p>
          <AuthHoverButton
            type="button"
            onClick={() => router.push("/auth")}
            className="mt-6"
          >
            {t("backToSignIn")}
          </AuthHoverButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t("successTitle")}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("successBody")}
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {t("title")}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>

            <div>
              <div ref={passwordAnchorRef}>
                <FormField
                  label={t("newPassword")}
                  htmlFor="new-password"
                  invalid={submitAttempted && !passwordAllMet}
                >
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((p) => !p)}
                  />
                </FormField>
              </div>
              <FieldRequirements
                rules={passwordRules}
                visible={
                  passwordFocused || (submitAttempted && !passwordAllMet)
                }
                anchorRef={passwordAnchorRef}
                title={t("passwordRequirementsTitle")}
              />
            </div>

            {password.length > 0 && (
              <div className="flex gap-1">
                {passwordRules.map((rule, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      rule.met
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            )}

            <div>
              <div ref={confirmAnchorRef}>
                <FormField
                  label={t("confirmPassword")}
                  htmlFor="confirm-password"
                  invalid={submitAttempted && !confirmAllMet}
                >
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfirmPassword(e.target.value)
                    }
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    showPassword={showConfirm}
                    onTogglePassword={() => setShowConfirm((p) => !p)}
                  />
                </FormField>
              </div>
              <FieldRequirements
                rules={confirmRules}
                visible={
                  confirmFocused || (submitAttempted && !confirmAllMet)
                }
                anchorRef={confirmAnchorRef}
                title={t("confirmRulesTitle")}
              />
            </div>

            {errors.general && (
              <p className="text-sm text-red-500">{errors.general}</p>
            )}

            <AuthHoverButton type="submit" disabled={loading}>
              {loading ? t("submitting") : t("submit")}
            </AuthHoverButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
