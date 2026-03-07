"use client";

import React, { useState, useEffect } from "react";
import { authService } from "../services/auth-service";
import {
  ShieldOff,
  ShieldCheck,
  Loader,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface MfaManagementProps {
  mfaEnabled: boolean;
  onMfaStatusChange?: () => void;
}

export const MfaManagement = ({
  mfaEnabled,
  onMfaStatusChange,
}: MfaManagementProps) => {
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [backupCodeCount, setBackupCodeCount] = useState<number | null>(null);
  const [showRegeneratePanel, setShowRegeneratePanel] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  // Verification modal for disabling MFA
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingUnenrollId, setPendingUnenrollId] = useState<string | null>(null);

  useEffect(() => {
    loadFactors();
    loadBackupCodeCount();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await authService.listMFAFactors();
    setLoading(false);

    if (error) {
      toast.error("Failed to load MFA factors");
      return;
    }

    if (data?.totp) {
      setFactors(data.totp);
    }
  };

  const loadBackupCodeCount = async () => {
    const { count } = await authService.getRemainingBackupCodeCount();
    setBackupCodeCount(count);
  };

  const handleUnenroll = (factorId: string) => {
    setPendingUnenrollId(factorId);
    setVerifyCode("");
    setVerifyError("");
    setVerifyModalOpen(true);
  };

  const handleVerifyAndUnenroll = async () => {
    if (verifyCode.length !== 6) {
      setVerifyError("Enter a 6-digit code");
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");

    // Use the factor that's being unenrolled to verify
    const factorId = pendingUnenrollId;
    if (!factorId) return;

    const verifyResult = await authService.verifyMFA(factorId, verifyCode);
    if (verifyResult.error) {
      setVerifyError(verifyResult.error);
      setVerifyLoading(false);
      return;
    }

    // Verification succeeded — now unenroll
    setUnenrollingId(factorId);
    const { error } = await authService.unenrollMFA(factorId);
    setUnenrollingId(null);
    setVerifyLoading(false);
    setVerifyModalOpen(false);
    setPendingUnenrollId(null);

    if (error) {
      toast.error(error);
    } else {
      toast.success("MFA disabled successfully");
      await loadFactors();
      onMfaStatusChange?.();
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setRegenerating(true);
    const { codes, error } = await authService.generateBackupCodes();
    setRegenerating(false);

    if (error) {
      toast.error(error);
      return;
    }

    setNewBackupCodes(codes);
    setBackupCodeCount(codes.length);
    toast.success("New backup codes generated");
  };

  const handleCopyBackupCodes = () => {
    const text = newBackupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
    toast.success("Backup codes copied");
  };

  const handleDownloadBackupCodes = () => {
    const text = [
      "Smart Advisor - MFA Backup Codes",
      "================================",
      "Store these codes in a safe place.",
      "Each code can only be used once.",
      "",
      ...newBackupCodes,
      "",
      `Generated: ${new Date().toLocaleDateString()}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smart-advisor-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Two-Factor Authentication
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {mfaEnabled
              ? "Your account is protected with 2FA enabled"
              : "Protect your account with two-factor authentication"}
          </p>
        </div>
        {mfaEnabled && (
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              Enabled
            </span>
          </div>
        )}
      </div>

      {mfaEnabled && factors.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Active authenticators:
          </div>
          {factors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {factor.friendly_name || "Authenticator App"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Added {new Date(factor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnenroll(factor.id)}
                disabled={unenrollingId === factor.id}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              >
                {unenrollingId === factor.id ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}

          {/* Backup Codes Section */}
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Backup Codes
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {backupCodeCount !== null
                      ? `${backupCodeCount} unused codes remaining`
                      : "Loading..."}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (showRegeneratePanel) {
                    setShowRegeneratePanel(false);
                    setNewBackupCodes([]);
                  } else {
                    setShowRegeneratePanel(true);
                  }
                }}
                className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {showRegeneratePanel && (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                {newBackupCodes.length === 0 ? (
                  <div>
                    <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                      Regenerating will invalidate all existing backup codes.
                    </p>
                    <Button
                      onClick={handleRegenerateBackupCodes}
                      disabled={regenerating}
                      size="sm"
                      variant="outline"
                    >
                      {regenerating ? (
                        <Loader className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-3 w-3" />
                      )}
                      {regenerating ? "Generating..." : "Generate New Codes"}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Save these codes — they won't be shown again
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {newBackupCodes.map((code, i) => (
                        <code
                          key={i}
                          className="rounded bg-white px-2 py-1.5 text-center font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={handleCopyBackupCodes}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {backupCodesCopied ? (
                          <Check className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="mr-1 h-3 w-3" />
                        )}
                        {backupCodesCopied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        onClick={handleDownloadBackupCodes}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {backupCodeCount !== null && backupCodeCount <= 2 && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              You have {backupCodeCount} backup code
              {backupCodeCount !== 1 ? "s" : ""} remaining. Consider
              regenerating new codes.
            </p>
          )}
        </div>
      )}

      {!mfaEnabled && (
        <div className="mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Enable 2FA to add an extra layer of security to your account. You'll
            need to verify with your authenticator app.
          </p>
          <Button disabled>{loading ? "Loading..." : "Enable 2FA"}</Button>
        </div>
      )}

      {/* Verification modal for MFA disable */}
      {verifyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setVerifyModalOpen(false);
            setPendingUnenrollId(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
          >
            <button
              onClick={() => {
                setVerifyModalOpen(false);
                setPendingUnenrollId(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-bold">Confirm MFA Disable</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your authenticator code to confirm disabling 2FA.
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setVerifyError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerifyAndUnenroll();
              }}
              placeholder="000000"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              autoFocus
            />

            {verifyError && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                {verifyError}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setVerifyModalOpen(false);
                  setPendingUnenrollId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndUnenroll}
                disabled={verifyCode.length !== 6 || verifyLoading}
                className="flex-1 bg-red-600 text-white hover:bg-red-500"
              >
                {verifyLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
