"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  REACTION_EMOJI,
  type ReactionEmoji,
  type ReactionTargetKind,
} from "./feed-service";
import { useSetReaction } from "./use-feed";

/** Compact reaction strip rendered under a post body or a comment.
 *
 *  Existing reactions show as pills (emoji + count) — the user's own
 *  pick is tinted violet. A trailing `+` opens an inline picker of
 *  every emoji in [REACTION_EMOJI]. Tapping the same emoji twice
 *  clears it; tapping a different one replaces it (one reaction per
 *  user per target, enforced by the table's PK).
 *
 *  `counts` / `mine` are read from the parent's `useReactions(…)`
 *  cache so the row updates immediately after a mutation — the
 *  mutation's onSuccess invalidates the `feed.reactions` family. */
export function ReactionBar({
  targetKind,
  targetId,
  counts,
  mine,
}: {
  targetKind: ReactionTargetKind;
  targetId: string;
  counts: Partial<Record<ReactionEmoji, number>>;
  mine: ReactionEmoji | null;
}) {
  const { session } = useAuth();
  const setReaction = useSetReaction();
  const [pickerOpen, setPickerOpen] = useState(false);

  const pick = async (emoji: ReactionEmoji) => {
    setPickerOpen(false);
    try {
      await setReaction.mutateAsync({
        targetKind,
        targetId,
        // Tapping the emoji you already picked clears it.
        emoji: mine === emoji ? null : emoji,
      });
    } catch {
      toast.error("Couldn't save reaction.");
    }
  };

  // Stable display order: keep REACTION_EMOJI order, only show ones
  // that actually have a count. Anything else stays behind the `+`.
  const pills = REACTION_EMOJI.filter((e) => (counts[e] ?? 0) > 0);
  const canReact = !!session;

  if (pills.length === 0 && !canReact) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {pills.map((e) => {
        const isMine = mine === e;
        return (
          <button
            key={e}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              if (canReact) pick(e);
            }}
            disabled={!canReact}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold transition-colors",
              isMine
                ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-600",
            )}
          >
            <span className="text-[13px] leading-none">{e}</span>
            <span className="tabular-nums">{counts[e]}</span>
          </button>
        );
      })}
      {canReact && (
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            setPickerOpen((o) => !o);
          }}
          aria-label="Add reaction"
          aria-expanded={pickerOpen}
          className="inline-flex h-6 items-center justify-center rounded-full border border-dashed border-slate-300 px-2 text-slate-400 transition-colors hover:border-violet-300 hover:text-violet-500 dark:border-slate-600 dark:hover:border-violet-500/60 dark:hover:text-violet-300"
        >
          <Plus size={12} />
        </button>
      )}
      <AnimatePresence>
        {canReact && pickerOpen && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="basis-full"
          >
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {REACTION_EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    pick(e);
                  }}
                  className={cn(
                    "rounded-full px-2 py-1 text-[15px] leading-none transition-transform hover:scale-110",
                    mine === e &&
                      "bg-violet-100 dark:bg-violet-500/20",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
