"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { SessionsManagement } from "@/features/auth/components/sessions-management";
import { MfaManagement } from "@/features/auth/components/mfa-management";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";

export default function AccountSecurityPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Account Security
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your authentication methods and active sessions
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* MFA Management */}
          <MfaManagement
            mfaEnabled={user.mfa_enabled || false}
            onMfaStatusChange={() => {
              // Trigger a refresh if needed
            }}
          />

          {/* Sessions Management */}
          <SessionsManagement userId={user.id} />

          {/* Security Tips */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6 dark:border-blue-900/30 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>
                ✓ Enable 2FA for an extra layer of protection against
                unauthorized access
              </li>
              <li>
                ✓ Review active sessions regularly and sign out devices you
                don't recognize
              </li>
              <li>✓ Use a strong, unique password and update it regularly</li>
              <li>
                ✓ Be cautious with login links and only sign in from trusted
                devices
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
