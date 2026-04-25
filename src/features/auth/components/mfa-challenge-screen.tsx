"use client";

import { ShieldCheck, KeyRound, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthHoverButton } from "./auth-shared";
import { cn } from "@/lib/utils";

export const MfaChallengeScreen = ({
  mfaCode,
  onMfaCodeChange,
  mfaInputMode,
  onToggleMfaInputMode,
  onVerify,
  verifying,
  success = false,
  error,
  onBackToSignIn,
}: {
  mfaCode: string;
  onMfaCodeChange: (code: string) => void;
  mfaInputMode: "totp" | "backup";
  onToggleMfaInputMode: () => void;
  onVerify: () => void;
  verifying: boolean;
  /** Renders a green confirmation state for the brief window between
   *  successful verification and the dashboard redirect. */
  success?: boolean;
  error: string | null;
  onBackToSignIn: () => void;
}) => {
  const isTotp = mfaInputMode === "totp";

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col items-center justify-center space-y-5 py-8 text-center"
      >
        <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
          <Check
            className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
            strokeWidth={3}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Verified
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Taking you to your dashboard…
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-5 py-4 text-center">
      <div className="rounded-full bg-violet-100 p-4 dark:bg-violet-900/30">
        {isTotp ? (
          <ShieldCheck className="h-10 w-10 text-violet-600 dark:text-violet-400" />
        ) : (
          <KeyRound className="h-10 w-10 text-violet-600 dark:text-violet-400" />
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {isTotp ? "Enter verification code" : "Enter backup code"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {isTotp
            ? "Open your authenticator app and enter the 6-digit code."
            : "Enter one of your pre-generated backup codes."}
        </p>
      </div>

      <div className="w-full max-w-xs">
        {isTotp ? (
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => onMfaCodeChange(e.target.value.replace(/\D/g, ""))}
            className={cn(
              "w-full rounded-lg border-2 bg-white px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 transition-colors focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60"
                : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 dark:border-slate-700",
            )}
            placeholder="000000"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && mfaCode.length === 6) onVerify();
            }}
          />
        ) : (
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => onMfaCodeChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border-2 bg-white px-4 py-3 text-center font-mono text-lg font-semibold tracking-wider text-slate-900 placeholder-slate-300 uppercase transition-colors focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60"
                : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 dark:border-slate-700",
            )}
            placeholder="XXXXX-XXXXX"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && mfaCode.trim()) onVerify();
            }}
          />
        )}

        <AnimatePresence initial={false} mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              role="alert"
              className="mt-2 text-sm font-semibold text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <AuthHoverButton
          type="button"
          onClick={onVerify}
          disabled={
            verifying || (isTotp ? mfaCode.length !== 6 : !mfaCode.trim())
          }
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-violet-600 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
        >
          {verifying ? "Verifying..." : "Verify"}
        </AuthHoverButton>

        <button
          type="button"
          onClick={onToggleMfaInputMode}
          className="w-full text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {isTotp
            ? "Can't access your authenticator? Use a backup code"
            : "Use authenticator app instead"}
        </button>

        <button
          type="button"
          onClick={onBackToSignIn}
          className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};
