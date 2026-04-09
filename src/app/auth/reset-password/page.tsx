"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth-service";
import { AuthLayout } from "@/features/auth/components";
import {
  AuthHoverButton,
  FormField,
  PasswordInput,
} from "@/features/auth/components/auth-shared";

const REDIRECT_DELAY = 3000;
const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (!confirmPassword) {
      next.confirm = "Please confirm your password";
    } else if (password !== confirmPassword) {
      next.confirm = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Password Updated
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your password has been changed successfully. Redirecting you to
              sign in...
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Set New Password
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Enter your new secure password below.
              </p>
            </div>

            <FormField
              label="New Password"
              htmlFor="new-password"
              error={errors.password}
            >
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((p) => !p)}
              />
            </FormField>

            {password.length > 0 && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= level * 3
                        ? level <= 1
                          ? "bg-red-400"
                          : level <= 2
                            ? "bg-amber-400"
                            : level <= 3
                              ? "bg-emerald-400"
                              : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            )}

            <FormField
              label="Confirm New Password"
              htmlFor="confirm-password"
              error={errors.confirm}
            >
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirm: "" }));
                }}
                showPassword={showConfirm}
                onTogglePassword={() => setShowConfirm((p) => !p)}
              />
            </FormField>

            {errors.general && (
              <p className="text-sm text-red-500">{errors.general}</p>
            )}

            <AuthHoverButton type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </AuthHoverButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
