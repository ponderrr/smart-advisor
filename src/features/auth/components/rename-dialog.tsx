"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resync the draft whenever the dialog (re)opens so a different row's
  // initialName replaces whatever was typed last time.
  useEffect(() => {
    if (open) {
      setDraft(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
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

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              disabled={saving}
              className="absolute right-4 top-4 z-10 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center p-6 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
              >
                <Pencil className="h-10 w-10 text-violet-600 dark:text-violet-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
              >
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
                    onChange={(e) =>
                      setDraft(e.target.value.slice(0, maxLength))
                    }
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
                  <p className="mt-3 text-sm font-medium text-red-500">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving || draft.trim() === initialName.trim()}
                  size="lg"
                  className="mt-6 w-full"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>

                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
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
  );
};
