"use client";

import { useEffect, useState } from "react";
import {
  BookCheck,
  Bookmark,
  BookmarkCheck,
  Loader,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { libraryService } from "../services/library-service";
import {
  RATING_LABELS,
  STATUS_LABELS,
  STATUS_PILL_CLASSES,
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
  /** Pre-render in the "already logged" state when the parent has loaded
   *  the library and knows this title is in it. */
  initialLogged?: boolean;
  /** Outline style. Pass `compact` for icon-only on small surfaces. */
  variant?: "default" | "compact";
}

const STATUS_VALUES: LibraryStatus[] = [
  "wishlist",
  "in_progress",
  "finished",
  "dropped",
];

export const LogToLibraryButton = ({
  medium,
  title,
  creator,
  year,
  poster_url,
  source_recommendation_id,
  initialLogged = false,
  variant = "default",
}: LogToLibraryButtonProps) => {
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState(initialLogged);

  useEffect(() => {
    setLogged(initialLogged);
  }, [initialLogged]);
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={`Log ${title}`}
        size="sm"
        disableClose={saving}
      >
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
                        <SegmentedControl<LibraryStatus>
                          layoutId="log-dialog-status"
                          value={status}
                          onChange={setStatus}
                          size="sm"
                          ariaLabel="Status"
                          options={STATUS_VALUES.map((s) => ({
                            value: s,
                            label: STATUS_LABELS[s],
                            pillClassName: STATUS_PILL_CLASSES[s],
                          }))}
                        />
                      </div>

                      {/* Rating */}
                      <div className="mt-5 text-left">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          How was it?
                        </p>
                        <SegmentedControl<LibraryRating>
                          layoutId="log-dialog-rating"
                          value={rating}
                          onChange={setRating}
                          onClear={() => setRating(null)}
                          size="sm"
                          ariaLabel="Rating"
                          options={[
                            {
                              value: 1,
                              label: RATING_LABELS[1],
                              icon: <ThumbsDown size={14} />,
                              pillClassName: "bg-rose-500",
                            },
                            {
                              value: 2,
                              label: RATING_LABELS[2],
                              icon: <Bookmark size={14} />,
                              pillClassName: "bg-slate-500",
                            },
                            {
                              value: 3,
                              label: RATING_LABELS[3],
                              icon: <ThumbsUp size={14} />,
                              pillClassName: "bg-emerald-500",
                            },
                          ]}
                        />
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
      </Dialog>
    </>
  );
};
