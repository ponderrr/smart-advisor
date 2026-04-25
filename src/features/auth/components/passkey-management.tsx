"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Fingerprint, KeyRound, Loader, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import {
  passkeyService,
  type PasskeySummary,
} from "../services/passkey-service";
import { authService } from "../services/auth-service";
import { useAuth } from "../hooks/use-auth";
import { MFAFactor } from "../types/mfa";
import { PasskeySetup } from "./passkey-setup";
import { RenameDialog } from "./rename-dialog";

const formatLastUsed = (iso: string | null) => {
  if (!iso) return "Never used";
  try {
    return `Last used ${formatDistanceToNowStrict(new Date(iso))} ago`;
  } catch {
    return "Last used recently";
  }
};

export const PasskeyManagement = () => {
  const { user } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PasskeySummary | null>(null);

  // Step-up verify before deleting the *last* passkey when MFA is enabled.
  // Removing one of many is low-stakes (still have other passkeys + password
  // + TOTP), but giving up passwordless sign-in entirely is worth a TOTP
  // confirmation.
  const [verifyTarget, setVerifyTarget] = useState<PasskeySummary | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    setSupported(passkeyService.browserSupported());
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await passkeyService.list();
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setPasskeys(data);
  };

  const performRemove = async (passkey: PasskeySummary) => {
    setRemovingId(passkey.id);
    const { error } = await passkeyService.remove(passkey.id);
    setRemovingId(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Passkey removed");
    setPasskeys((current) => current.filter((p) => p.id !== passkey.id));
  };

  const handleRemove = async (passkey: PasskeySummary) => {
    const isLast = passkeys.length === 1;

    // user.mfa_enabled is loaded once and not refetched after the user
    // disables MFA in the same session, so check live before gating on it.
    if (isLast && user?.mfa_enabled) {
      const { data } = await authService.listMFAFactors();
      const stillEnrolled = data?.totp?.some(
        (f: MFAFactor) => f.status === "verified",
      );
      if (stillEnrolled) {
        setVerifyCode("");
        setVerifyError("");
        setVerifyTarget(passkey);
        return;
      }
    }

    const label = passkey.device_name || "this passkey";
    const confirmed = window.confirm(
      `Remove ${label}? You won't be able to sign in with it again.`,
    );
    if (!confirmed) return;
    void performRemove(passkey);
  };

  const handleVerifyAndRemove = async () => {
    if (!verifyTarget) return;
    if (verifyCode.length !== 6) {
      setVerifyError("Enter a 6-digit code");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");

    const { data: factorsData, error: factorsError } =
      await authService.listMFAFactors();
    if (factorsError) {
      setVerifyLoading(false);
      setVerifyError(factorsError);
      return;
    }
    const verifiedFactor = factorsData?.totp?.find(
      (f: MFAFactor) => f.status === "verified",
    );
    if (!verifiedFactor) {
      setVerifyLoading(false);
      setVerifyError("No verified authenticator found.");
      return;
    }

    const { error: codeError } = await authService.verifyMFA(
      verifiedFactor.id,
      verifyCode,
    );
    if (codeError) {
      setVerifyLoading(false);
      setVerifyError(codeError);
      return;
    }

    const passkeyToRemove = verifyTarget;
    setVerifyLoading(false);
    setVerifyTarget(null);
    setVerifyCode("");
    await performRemove(passkeyToRemove);
  };

  // Auto-submit once 6 digits are entered.
  useEffect(() => {
    if (
      verifyTarget &&
      verifyCode.length === 6 &&
      !verifyLoading
    ) {
      void handleVerifyAndRemove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyCode, verifyTarget]);

  const hasPasskeys = passkeys.length > 0;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          Passkeys
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in with your fingerprint, face, or device PIN — no password
          needed.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <Fingerprint
            size={16}
            className={
              hasPasskeys
                ? "shrink-0 text-violet-500 dark:text-violet-400"
                : "shrink-0 text-slate-400 dark:text-slate-500"
            }
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {loading
              ? "Checking…"
              : hasPasskeys
                ? `${passkeys.length} passkey${passkeys.length === 1 ? "" : "s"} active`
                : "No passkeys yet"}
          </span>
        </div>
        {!loading && (
          <span
            className={
              hasPasskeys
                ? "shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }
          >
            {hasPasskeys ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {supported === false && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Your current browser doesn't support passkeys. Try Chrome, Safari,
          Edge, or Firefox on a recent device.
        </p>
      )}

      {hasPasskeys && (
        <div className="mt-4 space-y-3">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <KeyRound className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {passkey.device_name || "Passkey"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Added {format(new Date(passkey.created_at), "PP")} ·{" "}
                    {formatLastUsed(passkey.last_used_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenameTarget(passkey)}
                  aria-label={`Rename ${passkey.device_name ?? "passkey"}`}
                  className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRemove(passkey)}
                  disabled={removingId === passkey.id}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                  aria-label={`Remove ${passkey.device_name ?? "passkey"}`}
                >
                  {removingId === passkey.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <StatefulButton
          onClick={() => setSetupOpen(true)}
          disabled={supported === false || loading}
          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
        >
          {hasPasskeys ? "Add another passkey" : "Add a passkey"}
        </StatefulButton>
      </div>

      <Dialog
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        ariaLabel="Verify to remove passkey"
        size="sm"
        disableClose={verifyLoading}
      >
        <div className="flex flex-col items-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
          >
            <ShieldCheck className="h-10 w-10 text-violet-600 dark:text-violet-400" />
          </motion.div>

          <div className="w-full max-w-md">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Confirm with your authenticator
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This is your last passkey. Enter your 6-digit authenticator
              code to remove it.
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
                  if (e.key === "Enter") void handleVerifyAndRemove();
                }}
                placeholder="000000"
                autoFocus
                disabled={verifyLoading}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-4 text-center text-4xl font-bold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
              />
              {verifyError && (
                <p className="mt-2 text-sm font-medium text-red-500">
                  {verifyError}
                </p>
              )}
            </div>

            <Button
              onClick={() => void handleVerifyAndRemove()}
              disabled={verifyCode.length !== 6 || verifyLoading}
              size="lg"
              className="mt-6 w-full bg-red-600 hover:bg-red-500"
            >
              {verifyLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & remove passkey"
              )}
            </Button>

            <button
              onClick={() => setVerifyTarget(null)}
              disabled={verifyLoading}
              className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Dialog>

      <RenameDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename passkey"
        description="Pick a name you'll recognize later, like &quot;MacBook&quot; or &quot;Phone&quot;."
        fieldLabel="Passkey name"
        initialName={renameTarget?.device_name ?? ""}
        successMessage="Passkey renamed"
        maxLength={60}
        placeholder="e.g., MacBook, iPhone"
        onSave={async (name) => {
          if (!renameTarget) return { error: "No passkey selected" };
          const result = await passkeyService.rename(renameTarget.id, name);
          if (!result.error) {
            setPasskeys((current) =>
              current.map((p) =>
                p.id === renameTarget.id ? { ...p, device_name: name } : p,
              ),
            );
          }
          return result;
        }}
      />

      <Dialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        ariaLabel="Add a passkey"
        size="sm"
      >
        <PasskeySetup
          onComplete={() => {
            setSetupOpen(false);
            void load();
          }}
          onSkip={() => setSetupOpen(false)}
        />
      </Dialog>
    </>
  );
};
