"use client";

import React, { useState, useEffect } from "react";
import { authService } from "../services/auth-service";
import { AuthHoverButton } from "./auth-form";
import { ShieldCheck, ArrowRight, QrCode, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface MfaSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const MfaSetup = ({ onComplete, onSkip }: MfaSetupProps) => {
  const [step, setStep] = useState<"intro" | "qr" | "verify">("intro");
  const [qrCode, setQrCode] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    const { data, error } = await authService.enrollMFA();
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    if (data?.totp?.qr_code) {
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setStep("qr");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    const { error } = await authService.verifyMFA(factorId, code);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-2">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/30"
      >
        <ShieldCheck className="h-10 w-10 text-violet-600 dark:text-violet-400" />
      </motion.div>

      {step === "intro" && (
        <>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Secure your account
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Add an extra layer of security with Multi-Factor Authentication (MFA).
          </p>
          <div className="mt-8 w-full space-y-3">
            <AuthHoverButton onClick={handleEnroll} disabled={loading}>
              Set up MFA Now
            </AuthHoverButton>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Skip for now
              </button>
            )}
          </div>
        </>
      )}

      {step === "qr" && (
        <>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Scan QR Code
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Use Google Authenticator or Authy to scan this code.
          </p>

          <div className="my-6 rounded-xl border-4 border-white bg-white p-2 shadow-xl dark:border-slate-800">
            <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
          </div>

          <AuthHoverButton onClick={() => setStep("verify")}>
            I've scanned it <ArrowRight className="ml-2 h-4 w-4" />
          </AuthHoverButton>
        </>
      )}

      {step === "verify" && (
        <>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Enter Verification Code
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter the 6-digit code from your app.
          </p>

          <div className="mt-6 w-full max-w-[240px]">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.5em] text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="000000"
            />
            {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
          </div>

          <div className="mt-8 w-full">
            <AuthHoverButton
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              Verify & Enable
            </AuthHoverButton>
          </div>
        </>
      )}
    </div>
  );
};
