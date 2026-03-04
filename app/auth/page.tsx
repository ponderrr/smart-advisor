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
    clearError,
    loading,
    error: authError,
    user,
    session,
  } = useAuth();

  useEffect(() => {
    if (user && session && !loading) {
      router.push("/content-selection");
    }
  }, [user, session, loading, router]);

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <AuthForm
        loading={loading}
        authError={authError}
        onSignIn={signIn}
        onGoogleSignIn={signInWithGoogle}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        onClearError={clearError}
      />
    </AuthLayout>
  );
};

export default AuthPage;
