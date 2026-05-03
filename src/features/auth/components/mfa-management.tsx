"use client";

import React, { useState, useEffect } from "react";
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
  Pencil,
} from "lucide-react";
import { RenameDialog } from "./rename-dialog";
import { Button } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";

interface MfaManagementProps {
  mfaEnabled: boolean;
  onMfaStatusChange?: () => void;
  onAddAuthenticator?: () => void;
}

export const MfaManagement = ({
  mfaEnabled,
  onMfaStatusChange,
  onAddAuthenticator,
}: MfaManagementProps) => {
  const t = useTranslations("Auth.mfaManagement");

  // Legacy factors enrolled before we set friendly_name get Supabase's default
  // "<Issuer> TOTP <timestamp>" label, which is useless to the user. Fall back
  // to a generic label in that case; we can't recover the original device.
  const prettifyFactorName = (name: string | undefined): string => {
    if (!name) return t("fallbackFactorName");
    if (/\sTOTP\s\d{10,}$/.test(name)) return t("fallbackFactorName");
    return name;
  };

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
      toast.error(t("loadError"));
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
      setVerifyError(t("verifyDialogError"));
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
      toast.success(t("disabledToast"));
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
    toast.success(t("regeneratedToast"));
  };

  const handleCopyBackupCodes = () => {
    const text = newBackupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
    toast.success(t("copiedToast"));
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

  const hasFactors = mfaEnabled && factors.length > 0;
  const lowBackupCodes =
    backupCodeCount !== null && backupCodeCount <= 2 && backupCodeCount > 0;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            size={16}
            className={
              mfaEnabled
                ? "shrink-0 text-emerald-500 dark:text-emerald-400"
                : "shrink-0 text-slate-400 dark:text-slate-500"
            }
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {mfaEnabled
              ? t("activeCount", { count: factors.length })
              : t("notEnabled")}
          </span>
        </div>
        <span
          className={
            mfaEnabled
              ? "shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }
        >
          {mfaEnabled ? t("statusEnabled") : t("statusInactive")}
        </span>
      </div>

      {hasFactors && (
        <div className="mt-4 space-y-3">
          {factors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {prettifyFactorName(factor.friendly_name)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("addedOn", { date: format(new Date(factor.created_at), "PP") })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenameTarget(factor)}
                  aria-label={t("renameAria", { name: prettifyFactorName(factor.friendly_name) })}
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

          {/* Backup Codes Section */}
          <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <KeyRound className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("backupCodesHeading")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {backupCodeCount !== null
                      ? t("backupCodesRemaining", { count: backupCodeCount })
                      : t("loadingBackupCodes")}
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
                aria-label={
                  showRegeneratePanel
                    ? t("togglePanelHide")
                    : t("togglePanelShow")
                }
                className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {showRegeneratePanel && (
              <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-700/60">
                {newBackupCodes.length === 0 ? (
                  <div>
                    <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                      {t("regenerateWarning")}
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
                      {regenerating ? t("generating") : t("generateButton")}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {t("saveCodesWarning")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {newBackupCodes.map((code, i) => (
                        <code
                          key={i}
                          className="rounded bg-slate-50 px-2 py-1.5 text-center font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
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
                          <Check className="mr-1 h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="mr-1 h-3 w-3" />
                        )}
                        {backupCodesCopied ? t("copied") : t("copy")}
                      </Button>
                      <Button
                        onClick={handleDownloadBackupCodes}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t("download")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {lowBackupCodes && backupCodeCount !== null && (
            <p className="rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {t("lowBackupCodes", { count: backupCodeCount })}
            </p>
          )}
        </div>
      )}

      {!mfaEnabled && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {t("enableHint")}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        {mfaEnabled && onAddAuthenticator ? (
          <StatefulButton
            onClick={onAddAuthenticator}
            className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
          >
            {t("addAuthenticator")}
          </StatefulButton>
        ) : !mfaEnabled ? (
          <StatefulButton
            disabled
            className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
          >
            {loading ? t("loading") : t("enable2fa")}
          </StatefulButton>
        ) : null}
      </div>

      <RenameDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title={t("renameDialogTitle")}
        description={t("renameDialogDescription")}
        fieldLabel={t("renameDialogFieldLabel")}
        initialName={prettifyFactorName(renameTarget?.friendly_name)}
        successMessage={t("renameDialogSuccess")}
        maxLength={64}
        placeholder={t("renameDialogPlaceholder")}
        onSave={async (name) => {
          if (!renameTarget) return { error: t("renameDialogNoTarget") };
          const result = await authService.renameMFAFactor(
            renameTarget.id,
            name,
          );
          if (!result.error) await loadFactors();
          return result;
        }}
      />

      <Dialog
        open={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setPendingUnenrollId(null);
        }}
        ariaLabel={t("verifyDialogAria")}
        size="sm"
        disableClose={verifyLoading}
      >
        <div className="flex flex-col items-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
          >
            <ShieldOff className="h-10 w-10 text-violet-600 dark:text-violet-400" />
          </motion.div>

          <div className="w-full max-w-md">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t("verifyDialogTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("verifyDialogBody")}
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
                placeholder={t("verifyDialogPlaceholder")}
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
                t("verifyDialogConfirm")
              )}
            </Button>

            <button
              onClick={() => {
                setVerifyModalOpen(false);
                setPendingUnenrollId(null);
              }}
              disabled={verifyLoading}
              className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("verifyDialogCancel")}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
