"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthForm, AuthLayout } from "@/features/auth/components";
import { PageLoader } from "@/components/ui/loader";

const AuthPageContent = () => {
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

  // Track whether MFA challenge UI is showing (blocks dashboard redirect)
  const [mfaChallengeActive, setMfaChallengeActive] = useState(false);

  // Set immediately before a passkey-driven router.replace so the next
  // run of the AAL effect skips elevation (which would otherwise flash
  // the MFA challenge screen). Ref so it doesn't retrigger renders.
  const skipNextAalCheckRef = useRef(false);

  // Check for mfa_required param from OAuth callback
  const oauthMfaRequired = searchParams?.get("mfa_required") === "true";

  // Session expired message from redirect
  const sessionExpiredParam =
    searchParams?.get("session_expired") === "true" || sessionExpired;

  // Clear session expired flag when user starts interacting
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

  // Only auto-redirect to dashboard if MFA challenge is NOT active
  useEffect(() => {
    // mfaPending comes from the auth context — set synchronously inside signIn()
    // when MFA is required, so it's batched with setLoading(false) and blocks
    // this redirect from firing during the race window.
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

      // Double-check AAL before redirecting
      if (session) {
        getAALLevel().then(({ data, error }) => {
          // If AAL check fails, stay on auth page — never redirect without confirmation
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

  const handleClearError = () => {
    clearError();
    clearSessionExpired();
  };

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <AuthForm
        loading={loading}
        authError={effectiveAuthError}
        signupCooldown={signupCooldown}
        onSignIn={signIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        onResendVerificationEmail={resendVerificationEmail}
        onClearError={handleClearError}
        onVerifyMFA={verifyMFA}
        onListMFAFactors={listMFAFactors}
        onVerifyBackupCode={verifyBackupCode}
        initialMfaRequired={mfaChallengeActive || mfaPending}
        onMfaChallengeResolved={() => {
          setMfaChallengeActive(false);
          clearMfaPending();
        }}
        onMfaChallengeStarted={() => setMfaChallengeActive(true)}
        onPasskeySignedIn={() => {
          skipNextAalCheckRef.current = true;
        }}
      />
    </AuthLayout>
  );
};

const AuthPageFallback = () => {
  const tc = useTranslations("Common");
  return <PageLoader text={tc("loading")} />;
};

const AuthPage = () => (
  <Suspense fallback={<AuthPageFallback />}>
    <AuthPageContent />
  </Suspense>
);

export default AuthPage;
