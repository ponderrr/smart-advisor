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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await authService.updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/auth"), REDIRECT_DELAY);
    }
  };

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <div className="mx-auto w-full max-w-md p-6">
        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-black">Password Updated</h1>
            <p className="mt-2 text-slate-600">
              Your password has been changed successfully. Redirecting you to
              sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <h1 className="text-2xl font-black">Set New Password</h1>
              <p className="text-slate-500">
                Enter your new secure password below.
              </p>
            </div>

            <FormField label="New Password" htmlFor="new-password">
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((p) => !p)}
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              htmlFor="confirm-password"
              error={error ?? undefined}
            >
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                showPassword={showConfirm}
                onTogglePassword={() => setShowConfirm((p) => !p)}
              />
            </FormField>

            <AuthHoverButton type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </AuthHoverButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
