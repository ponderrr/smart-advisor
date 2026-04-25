"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES: Record<NonNullable<DialogProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible label — used for `aria-label`. */
  ariaLabel?: string;
  /** Max width of the dialog body (default: md). */
  size?: "sm" | "md" | "lg";
  /** Disable backdrop-click to close. Useful while saving. */
  closeOnBackdrop?: boolean;
  /** Hide the built-in close button (when the body provides its own). */
  hideCloseButton?: boolean;
  /** Disable Escape + close button (e.g. while saving). */
  disableClose?: boolean;
  /** Optional className appended to the inner panel (for custom padding/etc). */
  className?: string;
  children: ReactNode;
}

/**
 * Shared modal primitive — handles portal rendering, backdrop, focus trap,
 * Escape-to-close, scroll lock, and entrance/exit animation.
 *
 * Used by every modal in the app: dashboard rec details, history rec details,
 * library log/edit dialogs. Body content is fully owned by callers.
 */
export const Dialog = ({
  open,
  onClose,
  ariaLabel,
  size = "md",
  closeOnBackdrop = true,
  hideCloseButton = false,
  disableClose = false,
  className,
  children,
}: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the panel on open and trap Tab cycling inside it.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (disableClose) return;
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable =
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, disableClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (disableClose || !closeOnBackdrop) return;
            onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-slate-200/70 bg-white shadow-2xl focus:outline-none dark:border-slate-700/60 dark:bg-slate-900",
              SIZE_CLASSES[size],
              className,
            )}
          >
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                disabled={disableClose}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/0 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
