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
    signInAsMockUser,
    signUp,
    resetPassword,
    resendVerificationEmail,
    clearError,
    loading,
    error: authError,
    user,
    session,
  } = useAuth();

  const handleMockSignIn = async () => {
    const result = await signInAsMockUser();
    if (!result.error) {
      router.push("/dashboard");
    }
    return result;
  };

  useEffect(() => {
    if ((session || user) && !loading) {
      router.push("/content-selection");
    }
  }, [session, user, loading, router]);

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <AuthForm
        loading={loading}
        authError={authError}
        onSignIn={signIn}
        onGoogleSignIn={signInWithGoogle}
        onSignInAsMockUser={handleMockSignIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        onResendVerificationEmail={resendVerificationEmail}
        onClearError={clearError}
      />
    </AuthLayout>
  );
};

export default AuthPage;
