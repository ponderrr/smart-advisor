"use client";

import React, { useState, useEffect } from "react";
import { authService } from "../services/auth-service";
import { ShieldCheck, ArrowRight, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MfaSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const MfaSetup = ({ onComplete, onSkip }: MfaSetupProps) => {
  const [step, setStep] = useState<"intro" | "qr" | "verify">("intro");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
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
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);
    const { error: verifyError } = await authService.verifyMFA(factorId, code);
    setLoading(false);

    if (verifyError) {
      setError(verifyError);
      toast.error(verifyError);
    } else {
      toast.success("MFA enabled successfully!");
      onComplete();
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret copied to clipboard");
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
      >
        <ShieldCheck className="h-10 w-10 text-violet-600 dark:text-violet-400" />
      </motion.div>

      {step === "intro" && (
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
              onClick={handleEnroll}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? "Setting up..." : "Set up 2FA"}
            </Button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
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
            <div className="my-6 flex justify-center rounded-xl border-4 border-white bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-800">
              <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
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
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
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
            I've scanned it <ArrowRight className="ml-2 h-4 w-4" />
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
            className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Back to QR Code
          </button>
        </motion.div>
      )}
    </div>
  );
};
