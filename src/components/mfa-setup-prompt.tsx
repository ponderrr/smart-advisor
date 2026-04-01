"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/features/auth/services/auth-service";
import { MFAFactor } from "@/features/auth/types/mfa";

const MFA_PROMPT_KEY = "smart_advisor_mfa_prompt_dismissed_at";
const MFA_PROMPT_INTERVAL_DAYS = 7;

interface MfaSetupPromptProps {
  userId: string | undefined;
}

export const MfaSetupPrompt = ({ userId }: MfaSetupPromptProps) => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkMfa = async () => {
      // Check if MFA is already enabled
      const { data } = await authService.listMFAFactors();
      const hasVerified =
        data?.totp?.some((f: MFAFactor) => f.status === "verified") ?? false;

      if (hasVerified) return; // MFA already enabled, no prompt needed

      // Check if user recently dismissed the prompt
      const dismissedAt = localStorage.getItem(MFA_PROMPT_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - Number(dismissedAt);
        const intervalMs = MFA_PROMPT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
        if (elapsed < intervalMs) return; // Not time to prompt yet
      }

      setVisible(true);
    };

    // Delay the check so it doesn't block initial page load
    const timer = setTimeout(checkMfa, 2000);
    return () => clearTimeout(timer);
  }, [userId]);

  const handleDismiss = () => {
    localStorage.setItem(MFA_PROMPT_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleSetup = () => {
    handleDismiss();
    router.push("/settings");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
        >
          <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/95">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss MFA setup prompt"
              className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-violet-100 p-2 dark:bg-violet-900/30">
                <ShieldCheck
                  size={20}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Secure your account
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enable two-factor authentication to add an extra layer of
                  protection to your account.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleSetup}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                  >
                    Set up 2FA
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
