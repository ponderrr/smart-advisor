"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { MfaSetup } from "@/features/auth/components/mfa-setup";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import {
  getMfaSetupCompleteTarget,
  getMfaSetupSkipTarget,
} from "@/lib/auth/post-verify";

function MfaSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  const completeTarget = getMfaSetupCompleteTarget(
    searchParams?.get("from") ?? null,
  );
  const skipTarget = getMfaSetupSkipTarget();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !session) {
      router.push("/auth");
    }
  }, [mounted, loading, session, router]);

  if (!mounted || loading) {
    return <PageLoader text="Loading..." />;
  }

  if (!user || !session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="flex items-start justify-center px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="w-full max-w-md">
          <MfaSetup
            onComplete={() => {
              router.push(completeTarget);
            }}
            onSkip={() => {
              router.push(skipTarget);
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default function MfaSetupPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <MfaSetupContent />
    </Suspense>
  );
}
