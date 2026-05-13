"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  /** Big bold heading inside the dialog. */
  title: string;
  /** Subheading shown under the title. */
  description: string;
  /** Field label above the input. */
  fieldLabel: string;
  /** Pre-filled value when the dialog opens. */
  initialName: string;
  /** Toast text on success. */
  successMessage: string;
  /** Called when the user confirms; resolve with `{ error: null }` on success. */
  onSave: (name: string) => Promise<{ error: string | null }>;
  /** Called once after a successful save (after the toast). */
  onSuccess?: () => void;
  maxLength?: number;
  placeholder?: string;
}

export const RenameDialog = ({
  open,
  onClose,
  title,
  description,
  fieldLabel,
  initialName,
  successMessage,
  onSave,
  onSuccess,
  maxLength = 60,
  placeholder,
}: RenameDialogProps) => {
  const t = useTranslations("Auth.renameDialog");
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(t("emptyError"));
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onSave(trimmed);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(successMessage);
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel={title}
      size="sm"
      disableClose={saving}
    >
      <div className="flex flex-col items-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
        >
          <Pencil className="h-10 w-10 text-violet-600 dark:text-violet-400" />
        </motion.div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>

          <div className="mt-6 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {fieldLabel}
            </label>
            <input
              type="text"
              value={draft}
              maxLength={maxLength}
              onChange={(e) => setDraft(e.target.value.slice(0, maxLength))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) void handleSave();
              }}
              placeholder={placeholder}
              autoFocus
              disabled={saving}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || draft.trim() === initialName.trim()}
            size="lg"
            className="mt-6 w-full"
          >
            {saving ? t("saving") : t("save")}
          </Button>

          <button
            onClick={onClose}
            disabled={saving}
            className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
