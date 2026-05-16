"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthRedirect } from "@/features/auth/hooks/use-auth-redirect";
import { AuthForm, AuthLayout } from "@/features/auth/components";
import { PageLoader } from "@/components/ui/loader";

const AuthPageContent = () => {
  const router = useRouter();
  const { authFormProps } = useAuthRedirect();

  return (
    <AuthLayout onLogoClick={() => router.push("/")}>
      <AuthForm {...authFormProps} />
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
