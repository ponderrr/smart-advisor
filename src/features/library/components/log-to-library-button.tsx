"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookCheck,
  Bookmark,
  BookmarkCheck,
  Loader,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { libraryService } from "../services/library-service";
import {
  RATING_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type LibraryMedium,
  type LibraryRating,
  type LibraryStatus,
} from "../types/library";

interface LogToLibraryButtonProps {
  medium: LibraryMedium;
  title: string;
  creator?: string | null;
  year?: number | null;
  poster_url?: string | null;
  source_recommendation_id?: string | null;
  /** Outline style. Pass `compact` for icon-only on small surfaces. */
  variant?: "default" | "compact";
}

const RATING_VALUES: LibraryRating[] = [1, 2, 3];
const STATUS_VALUES: LibraryStatus[] = ["finished", "in_progress", "wishlist"];

export const LogToLibraryButton = ({
  medium,
  title,
  creator,
  year,
  poster_url,
  source_recommendation_id,
  variant = "default",
}: LogToLibraryButtonProps) => {
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState(false);
  const [status, setStatus] = useState<LibraryStatus>("finished");
  const [rating, setRating] = useState<LibraryRating | null>(null);
  const [reaction, setReaction] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset draft state whenever the dialog closes so reopening it on a
  // different card doesn't show last-card values.
  useEffect(() => {
    if (!open) {
      setStatus("finished");
      setRating(null);
      setReaction("");
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await libraryService.log({
      medium,
      title,
      creator: creator ?? null,
      year: year ?? null,
      poster_url: poster_url ?? null,
      status,
      rating,
      reaction: reaction.trim() || null,
      source_recommendation_id: source_recommendation_id ?? null,
    });
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(
      status === "wishlist" ? "Added to your wishlist" : "Logged to library",
    );
    setLogged(true);
    setOpen(false);
  };

  const verb = medium === "movie" ? "watched" : "read";
  const Icon = logged ? BookmarkCheck : Bookmark;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Log "${title}" as ${verb}`}
        className={cn(
          "shrink-0 rounded-full transition-all",
          variant === "compact" ? "p-2" : "px-3 py-2",
          logged
            ? "bg-emerald-500 text-white shadow-md"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
        )}
      >
        <span className="flex items-center gap-1.5">
          <Icon size={16} />
          {variant === "default" && (
            <span className="text-xs font-semibold">
              {logged ? "In library" : `I ${verb} this`}
            </span>
          )}
        </span>
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => {
                  if (saving) return;
                  setOpen(false);
                }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Log ${title}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
                >
                  <button
                    onClick={() => {
                      if (saving) return;
                      setOpen(false);
                    }}
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
                      className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-4 dark:from-emerald-900/30 dark:to-teal-900/30"
                    >
                      <BookCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-md"
                    >
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Log this {medium}
                      </h2>
                      <p
                        className="mt-2 truncate text-sm font-semibold text-slate-700 dark:text-slate-300"
                        title={title}
                      >
                        {title}
                      </p>

                      {/* Status */}
                      <div className="mt-6 text-left">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Status
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_VALUES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                status === s
                                  ? STATUS_TONE[s].active
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
                              )}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mt-5 text-left">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          How was it?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {RATING_VALUES.map((r) => {
                            const active = rating === r;
                            const RatingIcon =
                              r === 1
                                ? ThumbsDown
                                : r === 2
                                  ? Bookmark
                                  : ThumbsUp;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() =>
                                  setRating(active ? null : r)
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                  active
                                    ? r === 3
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300"
                                      : r === 1
                                        ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300"
                                        : "border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400",
                                )}
                              >
                                <RatingIcon size={14} />
                                {RATING_LABELS[r]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reaction */}
                      <div className="mt-5 text-left">
                        <label
                          htmlFor="library-reaction"
                          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          Reaction (optional)
                        </label>
                        <textarea
                          id="library-reaction"
                          value={reaction}
                          onChange={(e) =>
                            setReaction(e.target.value.slice(0, 280))
                          }
                          rows={3}
                          maxLength={280}
                          placeholder="One-line takeaway you'd want the AI to remember…"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                        />
                        <p className="mt-1 text-right text-[10px] font-semibold text-slate-400">
                          {reaction.length}/280
                        </p>
                      </div>

                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        className="mt-6 w-full"
                      >
                        {saving ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save to library"
                        )}
                      </Button>

                      <button
                        onClick={() => {
                          if (saving) return;
                          setOpen(false);
                        }}
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
        )}
    </>
  );
};
