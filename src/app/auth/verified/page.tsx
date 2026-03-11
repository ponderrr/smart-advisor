"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const VerifiedContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/content-selection";

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
          Email verified! Redirecting...
        </p>
      </div>
    </div>
  );
};

const VerifiedPage = () => (
  <Suspense>
    <VerifiedContent />
  </Suspense>
);

export default VerifiedPage;
