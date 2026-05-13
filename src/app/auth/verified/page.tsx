"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLoader } from "@/components/ui/loader";

const VerifiedContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth.emailVerified");
  const next = searchParams?.get("next") ?? "/dashboard";

  useEffect(() => {
    // Signal the original "verify your email" tab via localStorage
    try {
      localStorage.setItem("smart_advisor_email_verified", Date.now().toString());
    } catch {
      // Ignore storage errors
    }
    // Redirect to the intended destination
    router.replace(next);
  }, [router, next]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("message")}
        </p>
      </div>
    </div>
  );
};

const VerifiedFallback = () => {
  const tc = useTranslations("Common");
  return <PageLoader text={tc("loading")} />;
};

const VerifiedPage = () => (
  <Suspense fallback={<VerifiedFallback />}>
    <VerifiedContent />
  </Suspense>
);

export default VerifiedPage;
