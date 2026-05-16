"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * Encapsulates the post-auth redirect orchestration for the auth page:
 * the MFA challenge gate, OAuth `mfa_required` handoff, AAL2 elevation
 * double-check, passkey fast-path, `?next=` return URL, and the
 * session-expired message.
 *
 * Behaviour is identical to the previous inline implementation in
 * `page.tsx`; this only relocates the race-prone logic into one named,
 * documented place and returns a props bag to spread onto `<AuthForm />`.
 */
export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations("Auth");
  const {
    signIn,
    signUp,
    resetPassword,
    resendVerificationEmail,
    clearError,
    loading,
    error: authError,
    signupCooldown,
    user,
    session,
    verifyMFA,
    listMFAFactors,
    verifyBackupCode,
    getAALLevel,
    mfaPending,
    clearMfaPending,
    sessionExpired,
    clearSessionExpired,
  } = useAuth();

  // Whether the MFA challenge UI is showing (blocks the dashboard redirect).
  const [mfaChallengeActive, setMfaChallengeActive] = useState(false);

  // Set immediately before a passkey-driven router.replace so the next run
  // of the AAL effect skips elevation (which would otherwise flash the MFA
  // challenge screen). Ref so it doesn't retrigger renders.
  const skipNextAalCheckRef = useRef(false);

  // mfa_required param from the OAuth callback.
  const oauthMfaRequired = searchParams?.get("mfa_required") === "true";

  // Session-expired message from a redirect.
  const sessionExpiredParam =
    searchParams?.get("session_expired") === "true" || sessionExpired;

  const effectiveAuthError = useMemo(() => {
    if (sessionExpiredParam && !authError) {
      return tAuth("sessionExpired");
    }
    return authError;
  }, [sessionExpiredParam, authError, tAuth]);

  useEffect(() => {
    if (oauthMfaRequired && session) {
      setMfaChallengeActive(true);
    }
  }, [oauthMfaRequired, session]);

  // Only auto-redirect to dashboard if the MFA challenge is NOT active.
  useEffect(() => {
    // mfaPending comes from the auth context — set synchronously inside
    // signIn() when MFA is required, so it's batched with setLoading(false)
    // and blocks this redirect from firing during the race window.
    if (
      (session || user) &&
      !loading &&
      !mfaChallengeActive &&
      !oauthMfaRequired &&
      !mfaPending
    ) {
      // After auth, honor a ?next=/some/path return URL if it points within
      // the app (relative path) — otherwise fall back to dashboard.
      const rawNext = searchParams?.get("next") ?? null;
      const nextPath =
        rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
          ? rawNext
          : "/dashboard";

      // Passkey just signed in — skip the AAL elevation that would
      // otherwise flash the MFA challenge before our redirect lands.
      if (skipNextAalCheckRef.current) {
        skipNextAalCheckRef.current = false;
        router.push(nextPath);
        return;
      }

      // Double-check AAL before redirecting.
      if (session) {
        getAALLevel().then(({ data, error }) => {
          // If the AAL check fails, stay on the auth page — never redirect
          // without confirmation.
          if (error || !data) return;
          if (data.nextLevel === "aal2" && data.currentLevel === "aal1") {
            setMfaChallengeActive(true);
          } else {
            router.push(nextPath);
          }
        });
      } else {
        router.push(nextPath);
      }
    }
  }, [
    session,
    user,
    loading,
    mfaChallengeActive,
    oauthMfaRequired,
    mfaPending,
    router,
    getAALLevel,
    searchParams,
  ]);

  const authFormProps = {
    loading,
    authError: effectiveAuthError,
    signupCooldown,
    onSignIn: signIn,
    onSignUp: signUp,
    onResetPassword: resetPassword,
    onResendVerificationEmail: resendVerificationEmail,
    onClearError: () => {
      clearError();
      clearSessionExpired();
    },
    onVerifyMFA: verifyMFA,
    onListMFAFactors: listMFAFactors,
    onVerifyBackupCode: verifyBackupCode,
    initialMfaRequired: mfaChallengeActive || mfaPending,
    onMfaChallengeResolved: () => {
      setMfaChallengeActive(false);
      clearMfaPending();
    },
    onMfaChallengeStarted: () => setMfaChallengeActive(true),
    onPasskeySignedIn: () => {
      skipNextAalCheckRef.current = true;
    },
  };

  return { authFormProps };
}
