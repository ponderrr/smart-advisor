"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthForm, AuthLayout } from "@/features/auth/components";

const AuthPage = () => {
  const router = useRouter();
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
    mockSignIn,
  } = useAuth();

  useEffect(() => {
    if ((session || user) && !loading) {
      router.push("/dashboard");
    }
  }, [session, user, loading, router]);

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
        onMockSignIn={mockSignIn}
      />
    </AuthLayout>
  );
};

export default AuthPage;
