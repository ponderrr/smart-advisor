"use client";

import { ShieldCheck, KeyRound } from "lucide-react";
import { AuthHoverButton } from "./auth-shared";

export const MfaChallengeScreen = ({
  mfaCode,
  onMfaCodeChange,
  mfaInputMode,
  onToggleMfaInputMode,
  onVerify,
  verifying,
  error,
  onBackToSignIn,
}: {
  mfaCode: string;
  onMfaCodeChange: (code: string) => void;
  mfaInputMode: "totp" | "backup";
  onToggleMfaInputMode: () => void;
  onVerify: () => void;
  verifying: boolean;
  error: string | null;
  onBackToSignIn: () => void;
}) => {
  const isTotp = mfaInputMode === "totp";

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
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
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
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-center font-mono text-lg font-semibold tracking-wider text-slate-900 placeholder-slate-300 uppercase focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
            placeholder="XXXXX-XXXXX"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && mfaCode.trim()) onVerify();
            }}
          />
        )}

        {error && (
          <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
        )}
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
