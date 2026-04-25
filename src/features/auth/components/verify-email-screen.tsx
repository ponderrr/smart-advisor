"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthHoverButton } from "./auth-shared";

export const VerifyEmailScreen = ({
  email,
  onResend,
  isResending,
  onBackToSignIn,
  showMfaHint = false,
}: {
  email: string;
  onResend: () => Promise<{ error: string | null }>;
  isResending: boolean;
  onBackToSignIn: () => void;
  showMfaHint?: boolean;
}) => {
  const router = useRouter();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // Listen for email verification completed in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "smart_advisor_email_verified") {
        router.replace("/dashboard");
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Also check on tab focus (handles mobile in-app browsers)
    const handleFocus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace("/dashboard");
        }
      } catch {
        // Ignore errors
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleFocus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  const handleResend = async () => {
    setResendMessage(null);
    setResendError(null);
    const result = await onResend();
    if (result.error) {
      setResendError(result.error);
    } else {
      setResendMessage("Verification email sent. Check your inbox.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4 text-center">
      <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
        <svg
          className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Verify your email
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          We sent a verification link to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {email}
          </span>
          . Click the link to activate your account.
        </p>
      </div>

      {showMfaHint && (
        <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800/40 dark:bg-violet-900/20">
          <ShieldCheck className="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Next up:
            </span>{" "}
            After verifying your email, you'll be able to add two-factor
            authentication for extra security.
          </p>
        </div>
      )}

      {resendMessage && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {resendMessage}
        </p>
      )}
      {resendError && <p className="text-sm text-red-500">{resendError}</p>}

      <div className="w-full space-y-3">
        <AuthHoverButton
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-all hover:border-violet-400 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {isResending ? "Resending..." : "Resend verification email"}
        </AuthHoverButton>
        <button
          type="button"
          onClick={onBackToSignIn}
          className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};
