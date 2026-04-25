"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Fingerprint, KeyRound, Loader, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import {
  passkeyService,
  type PasskeySummary,
} from "../services/passkey-service";
import { PasskeySetup } from "./passkey-setup";

const formatLastUsed = (iso: string | null) => {
  if (!iso) return "Never used";
  try {
    return `Last used ${formatDistanceToNowStrict(new Date(iso))} ago`;
  } catch {
    return "Last used recently";
  }
};

export const PasskeyManagement = () => {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

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

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const { error } = await passkeyService.remove(id);
    setRemovingId(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Passkey removed");
    setPasskeys((current) => current.filter((p) => p.id !== id));
  };

  const hasPasskeys = passkeys.length > 0;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight">Passkeys</h2>
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
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {passkey.device_name || "Passkey"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Added {format(new Date(passkey.created_at), "PP")} ·{" "}
                    {formatLastUsed(passkey.last_used_at)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(passkey.id)}
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

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {setupOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => setSetupOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Add a passkey"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
                >
                  <button
                    onClick={() => setSetupOpen(false)}
                    aria-label="Close passkey setup"
                    className="absolute right-4 top-4 z-10 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={18} />
                  </button>
                  <PasskeySetup
                    onComplete={() => {
                      setSetupOpen(false);
                      void load();
                    }}
                    onSkip={() => setSetupOpen(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
