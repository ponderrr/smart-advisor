"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthForm, AuthLayout } from "@/features/auth/components";

const AuthPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    signIn,
    signInWithGoogle,
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

  // Check for mfa_required param from OAuth callback
  const oauthMfaRequired = searchParams?.get("mfa_required") === "true";

  // Session expired message from redirect
  const sessionExpiredParam =
    searchParams?.get("session_expired") === "true" || sessionExpired;

  // Clear session expired flag when user starts interacting
  const effectiveAuthError = useMemo(() => {
    if (sessionExpiredParam && !authError) {
      return "Your session has expired. Please sign in again.";
    }
    return authError;
  }, [sessionExpiredParam, authError]);

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
      // Double-check AAL before redirecting
      if (session) {
        getAALLevel().then(({ data, error }) => {
          // If AAL check fails, stay on auth page — never redirect without confirmation
          if (error || !data) return;
          if (data.nextLevel === "aal2" && data.currentLevel === "aal1") {
            setMfaChallengeActive(true);
          } else {
            router.push("/dashboard");
          }
        });
      } else {
        router.push("/dashboard");
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
        onGoogleSignIn={signInWithGoogle}
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
      />
    </AuthLayout>
  );
};

const AuthPage = () => (
  <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>}>
    <AuthPageContent />
  </Suspense>
);

export default AuthPage;
