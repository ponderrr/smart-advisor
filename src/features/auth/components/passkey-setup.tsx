"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { passkeyService } from "../services/passkey-service";

interface PasskeySetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const PasskeySetup = ({ onComplete, onSkip }: PasskeySetupProps) => {
  const t = useTranslations("Auth.passkeySetup");
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    const { error: registerError } = await passkeyService.register(
      deviceName.trim() || undefined,
    );
    setLoading(false);

    if (registerError) {
      setError(registerError);
      toast.error(registerError);
      return;
    }

    toast.success(t("successToast"));
    onComplete();
  };

  return (
    <div className="relative flex flex-col items-center text-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
      >
        <Fingerprint className="h-10 w-10 text-violet-600 dark:text-violet-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("body")}
        </p>

        <div className="mt-6 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("label")}
          </label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) void handleRegister();
            }}
            placeholder={t("placeholder")}
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("hint")}
          </p>
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        )}

        <Button
          onClick={handleRegister}
          disabled={loading}
          size="lg"
          className="mt-6 w-full"
        >
          {loading ? t("waiting") : t("continue")}
        </Button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("cancel")}
          </button>
        )}
      </motion.div>
    </div>
  );
};
