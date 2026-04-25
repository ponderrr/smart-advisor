"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { authService } from "../services/auth-service";
import { MFAFactor } from "../types/mfa";
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
  Plus,
  Pencil,
} from "lucide-react";
import { RenameDialog } from "./rename-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface MfaManagementProps {
  mfaEnabled: boolean;
  onMfaStatusChange?: () => void;
  onAddAuthenticator?: () => void;
}

// Legacy factors enrolled before we set friendly_name get Supabase's default
// "<Issuer> TOTP <timestamp>" label, which is useless to the user. Fall back
// to a generic label in that case; we can't recover the original device.
const prettifyFactorName = (name: string | undefined): string => {
  if (!name) return "Authenticator App";
  if (/\sTOTP\s\d{10,}$/.test(name)) return "Authenticator App";
  return name;
};

export const MfaManagement = ({
  mfaEnabled,
  onMfaStatusChange,
  onAddAuthenticator,
}: MfaManagementProps) => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
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
  const [pendingUnenrollId, setPendingUnenrollId] = useState<string | null>(
    null,
  );

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState<MFAFactor | null>(null);

  useEffect(() => {
    loadFactors();
    loadBackupCodeCount();
  }, []);

  // Auto-submit once six digits are in. Re-runs whenever verifyCode changes,
  // so a failed attempt followed by a correction triggers another verify.
  useEffect(() => {
    if (
      verifyModalOpen &&
      verifyCode.length === 6 &&
      !verifyLoading &&
      pendingUnenrollId
    ) {
      handleVerifyAndUnenroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyCode, verifyModalOpen]);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await authService.listMFAFactors();
    setLoading(false);

    if (error) {
      toast.error(
        "Couldn't load your security settings — please refresh the page",
      );
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
      toast.success("Two-factor authentication has been turned off");
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
    toast.success("Fresh backup codes are ready — save them somewhere safe");
  };

  const handleCopyBackupCodes = () => {
    const text = newBackupCodes.join("\n");
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
      ...newBackupCodes,
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
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {prettifyFactorName(factor.friendly_name)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Added {format(new Date(factor.created_at), "PP")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenameTarget(factor)}
                  aria-label={`Rename ${prettifyFactorName(factor.friendly_name)}`}
                  className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
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
            </div>
          ))}

          {onAddAuthenticator && (
            <button
              onClick={onAddAuthenticator}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/50 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/10 dark:hover:text-indigo-400"
            >
              <Plus className="h-4 w-4" />
              Add another authenticator
            </button>
          )}

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

      <RenameDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename authenticator"
        description="Pick a name that makes the device easy to spot in your list."
        fieldLabel="Authenticator name"
        initialName={prettifyFactorName(renameTarget?.friendly_name)}
        successMessage="Authenticator renamed"
        maxLength={64}
        placeholder="e.g., iPhone, Work phone"
        onSave={async (name) => {
          if (!renameTarget) return { error: "No authenticator selected" };
          const result = await authService.renameMFAFactor(
            renameTarget.id,
            name,
          );
          if (!result.error) await loadFactors();
          return result;
        }}
      />

      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
        {verifyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setVerifyModalOpen(false);
              setPendingUnenrollId(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm disabling two-factor authentication"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
            >
              <button
                onClick={() => {
                  setVerifyModalOpen(false);
                  setPendingUnenrollId(null);
                }}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center p-6 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
                >
                  <ShieldOff className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md"
                >
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Disable two-factor authentication
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Enter the 6-digit code from your authenticator app to turn
                    off 2FA on this account.
                  </p>

                  <div className="mt-6 w-full">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => {
                        setVerifyCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        setVerifyError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleVerifyAndUnenroll();
                      }}
                      placeholder="000000"
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-4 text-center text-4xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
                      autoFocus
                    />
                    {verifyError && (
                      <p className="mt-2 text-sm font-medium text-red-500">
                        {verifyError}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleVerifyAndUnenroll}
                    disabled={verifyCode.length !== 6 || verifyLoading}
                    size="lg"
                    className="mt-6 w-full bg-red-600 hover:bg-red-500"
                  >
                    {verifyLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>

                  <button
                    onClick={() => {
                      setVerifyModalOpen(false);
                      setPendingUnenrollId(null);
                    }}
                    className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body,
      )}
    </Card>
  );
};
