"use client";

import { Suspense, useEffect, useState } from "react";
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
  } = useAuth();

  // Track whether MFA challenge is active (blocks dashboard redirect)
  const [mfaChallengeActive, setMfaChallengeActive] = useState(false);

  // Check for mfa_required param from OAuth callback
  const oauthMfaRequired = searchParams?.get("mfa_required") === "true";

  useEffect(() => {
    if (oauthMfaRequired && session) {
      setMfaChallengeActive(true);
    }
  }, [oauthMfaRequired, session]);

  // Only auto-redirect to dashboard if MFA challenge is NOT active
  useEffect(() => {
    if (
      (session || user) &&
      !loading &&
      !mfaChallengeActive &&
      !oauthMfaRequired
    ) {
      // Double-check AAL before redirecting
      if (session) {
        getAALLevel().then(({ data }) => {
          if (
            data &&
            data.nextLevel === "aal2" &&
            data.currentLevel === "aal1"
          ) {
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
    router,
    getAALLevel,
  ]);

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <AuthForm
        loading={loading}
        authError={authError}
        signupCooldown={signupCooldown}
        onSignIn={signIn}
        onGoogleSignIn={signInWithGoogle}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        onResendVerificationEmail={resendVerificationEmail}
        onClearError={clearError}
        onVerifyMFA={verifyMFA}
        onListMFAFactors={listMFAFactors}
        onVerifyBackupCode={verifyBackupCode}
        initialMfaRequired={mfaChallengeActive}
        onMfaChallengeResolved={() => setMfaChallengeActive(false)}
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
