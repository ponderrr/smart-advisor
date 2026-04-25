"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { MfaSetup } from "@/features/auth/components/mfa-setup";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";

export default function MfaSetupPage() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

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
              router.push("/account/security");
            }}
            onSkip={() => {
              router.push("/dashboard");
            }}
          />
        </div>
      </main>
    </div>
  );
}
