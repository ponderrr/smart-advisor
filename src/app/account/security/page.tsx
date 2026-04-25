"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { SessionsManagement } from "@/features/auth/components/sessions-management";
import { MfaManagement } from "@/features/auth/components/mfa-management";
import { PasskeyManagement } from "@/features/auth/components/passkey-management";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";

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
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:bg-white sm:text-sm dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Account · Security
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
              Lock things down
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage two-factor authentication, passkeys, and active sessions
              across your devices.
            </p>
          </div>

          <div className="space-y-6">
            <MfaManagement
              mfaEnabled={user.mfa_enabled || false}
              onMfaStatusChange={() => {
                // Trigger a refresh if needed
              }}
            />

            <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
              <PasskeyManagement />
            </div>

            <SessionsManagement userId={user.id} />

            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-5 sm:p-6 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500"
              />
              <div className="flex items-center gap-2 pl-2">
                <ShieldCheck
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                  Security tips
                </p>
              </div>
              <ul className="mt-3 space-y-1.5 pl-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <li>
                  Enable 2FA for an extra layer of protection against
                  unauthorized access.
                </li>
                <li>
                  Review active sessions regularly and sign out devices you
                  don&apos;t recognize.
                </li>
                <li>
                  Use a strong, unique password and update it regularly.
                </li>
                <li>
                  Be cautious with login links and only sign in from trusted
                  devices.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
