"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { MfaSetup } from "@/features/auth/components/mfa-setup";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || !session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-4">
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
    </div>
  );
}
