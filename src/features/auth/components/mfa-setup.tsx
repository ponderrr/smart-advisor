"use client";

import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { authService } from "../services/auth-service";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Download,
  KeyRound,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MfaSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  skipIntro?: boolean;
  /** When adding an additional authenticator, skip the backup-code step so
   *  we don't invalidate the user's already-saved codes. */
  skipBackupCodes?: boolean;
}

type SetupStep = "intro" | "method" | "qr" | "verify" | "backup-codes";

export const MfaSetup = ({
  onComplete,
  onSkip,
  skipIntro = false,
  skipBackupCodes = false,
}: MfaSetupProps) => {
  const [step, setStep] = useState<SetupStep>(skipIntro ? "method" : "intro");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  const handleEnroll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: enrollError } = await authService.enrollMFA();
    setLoading(false);

    if (enrollError) {
      setError(enrollError);
      toast.error(enrollError);
      return;
    }

    if (data?.totp?.qr_code && data?.id) {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret || "");
      setFactorId(data.id);
      setStep("qr");
    }
  }, []);

  // Auto-submit when six digits are present on the verify step.
  useEffect(() => {
    if (step === "verify" && code.length === 6 && !loading && factorId) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);
    const { error: verifyError } = await authService.verifyMFA(factorId, code);

    if (verifyError) {
      setLoading(false);
      setError(verifyError);
      toast.error(verifyError);
      return;
    }

    if (skipBackupCodes) {
      setLoading(false);
      toast.success("Authenticator added");
      onComplete();
      return;
    }

    // Generate backup codes after successful MFA setup
    const { codes, error: backupError } =
      await authService.generateBackupCodes();
    setLoading(false);

    if (backupError || codes.length === 0) {
      // MFA is enabled but backup codes failed — still proceed but warn
      toast.success("Two-factor authentication is now active!");
      toast.warning(
        "We couldn't generate backup codes right now. You can create them anytime from your Security settings.",
      );
      onComplete();
      return;
    }

    setBackupCodes(codes);
    toast.success("Two-factor authentication is now active!");
    setStep("backup-codes");
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret code copied — paste it in your authenticator app");
    }
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
    toast.success("Backup codes copied to your clipboard");
  };

  const handleDownloadBackupCodes = () => {
    const text = [
      "Smart Advisor - MFA Backup Codes",
      "================================",
      "Store these codes in a safe place.",
      "Each code can only be used once.",
      "",
      ...backupCodes,
      "",
      `Generated: ${format(new Date(), "PP")}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smart-advisor-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup codes saved to your downloads");
  };

  const backTarget: SetupStep | null =
    step === "method"
      ? skipIntro
        ? null
        : "intro"
      : step === "qr"
        ? "method"
        : step === "verify"
          ? "qr"
          : null;

  const handleBack = () => {
    if (!backTarget) return;
    setError(null);
    setCode("");
    setStep(backTarget);
  };

  return (
    <div className="relative flex flex-col items-center text-center p-6">
      {backTarget && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
      >
        <ShieldCheck className="h-10 w-10 text-violet-600 dark:text-violet-400" />
      </motion.div>

      {step === "intro" && !skipIntro && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Secure your account
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Add an extra layer of security with Two-Factor Authentication (2FA).
              You'll need to enter a code from your phone during sign in.
            </p>
            <div className="mt-8 w-full space-y-3">
              <Button
                onClick={() => setStep("method")}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                Set up 2FA
              </Button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
      )}

      {step === "method" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Choose your method
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            How do you want to sign in going forward?
          </p>

          <div className="mt-6 space-y-3 text-left">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="relative flex w-full cursor-not-allowed items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="shrink-0 rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                <KeyRound className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Passkey
                  </p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Use Touch ID, Face ID, Windows Hello, or a hardware key.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleEnroll}
              disabled={loading}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-violet-400 hover:bg-violet-50/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-violet-500 dark:hover:bg-violet-900/10"
            >
              <div className="shrink-0 rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Authenticator app
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Scan a QR code with Google Authenticator, Authy, or 1Password.
                </p>
              </div>
              {loading ? (
                <div className="h-5 w-5 animate-spin self-center rounded-full border-2 border-indigo-500 border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4 self-center text-slate-400" />
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
          )}

          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-6 w-full text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          )}
        </motion.div>
      )}

      {step === "qr" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Scan QR Code
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Use Google Authenticator, Microsoft Authenticator, or Authy to scan
            this code.
          </p>

          {qrCode && (
            <div className="my-6">
              <div className="flex justify-center rounded-xl border-4 border-white bg-white p-3 shadow-xl">
                <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Can't scan? Enter this code manually:
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                {secret}
              </code>
              <button
                onClick={handleCopySecret}
                className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={() => setStep("verify")}
            variant="outline"
            className="mt-6 w-full"
          >
            I&apos;ve scanned it <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {step === "verify" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Verify your code
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter the 6-digit code from your authenticator app.
          </p>

          <div className="mt-6 w-full">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-4 text-center text-4xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
              placeholder="000000"
            />
            {error && (
              <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
            )}
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            size="lg"
            className="mt-6 w-full"
          >
            {loading ? "Verifying..." : "Verify & Enable 2FA"}
          </Button>

          <button
            onClick={() => {
              setCode("");
              setError(null);
              setStep("qr");
            }}
            className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Back to QR Code
          </button>
        </motion.div>
      )}

      {step === "backup-codes" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Save your backup codes
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            If you lose access to your authenticator app, you can use one of
            these codes to sign in. Each code can only be used once.
          </p>

          <div className="mt-6 rounded-lg border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Store these in a safe place
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((backupCode, i) => (
                <code
                  key={i}
                  className="rounded bg-white px-2 py-1.5 text-center font-mono text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  {backupCode}
                </code>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleCopyBackupCodes}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {backupCodesCopied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {backupCodesCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              onClick={handleDownloadBackupCodes}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <Button onClick={onComplete} size="lg" className="mt-6 w-full">
            I've saved my codes
          </Button>
        </motion.div>
      )}
    </div>
  );
};
