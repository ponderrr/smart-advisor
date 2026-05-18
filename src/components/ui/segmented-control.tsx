"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Mobile-app style: the active segment is a *soft tint* of its hue with
 * the label rendered in that same hue ("the word is the colour"). Call
 * sites keep encoding their hue via `pillClassName` (e.g. `bg-amber-500`);
 * we read the hue from it and map to the muted pair below. Literal class
 * strings so Tailwind's scanner keeps them in the bundle.
 */
const ACCENT_BY_HUE: Record<string, { tint: string; text: string }> = {
  violet: {
    tint: "bg-violet-500/10 dark:bg-violet-400/15",
    text: "text-violet-600 dark:text-violet-300",
  },
  indigo: {
    tint: "bg-indigo-500/10 dark:bg-indigo-400/15",
    text: "text-indigo-600 dark:text-indigo-300",
  },
  rose: {
    tint: "bg-rose-500/10 dark:bg-rose-400/15",
    text: "text-rose-600 dark:text-rose-300",
  },
  pink: {
    tint: "bg-pink-500/10 dark:bg-pink-400/15",
    text: "text-pink-600 dark:text-pink-300",
  },
  amber: {
    tint: "bg-amber-500/15 dark:bg-amber-400/15",
    text: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    tint: "bg-emerald-500/12 dark:bg-emerald-400/15",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  slate: {
    tint: "bg-slate-500/10 dark:bg-slate-400/15",
    text: "text-slate-700 dark:text-slate-200",
  },
};

/** Pull the Tailwind hue out of a `bg-<hue>-<weight>` class, defaulting
 *  to violet. Tinted inputs like `bg-amber-500/15` match too. */
function accentFor(pillClassName?: string) {
  const hue = pillClassName?.match(/bg-([a-z]+)-\d/)?.[1];
  return (hue && ACCENT_BY_HUE[hue]) || ACCENT_BY_HUE.violet;
}

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  /** Optional leading icon. Rendered before the label, or alone when
   *  `iconOnly` is set on the parent. */
  icon?: ReactNode;
  disabled?: boolean;
  /** The segment's hue, as any `bg-<hue>-<weight>` class (e.g.
   *  `bg-amber-500`). The active segment renders as a soft tint of this
   *  hue with a same-hue label — solid fills are auto-converted. Hue
   *  defaults to violet. */
  pillClassName?: string;
  /** @deprecated Ignored — the active label colour is now derived from
   *  the `pillClassName` hue so it always matches the tint. */
  activeTextClassName?: string;
}

interface SegmentedControlProps<T extends string | number> {
  /** Null is allowed for "nothing selected yet" surfaces (e.g. an optional
   *  rating). When null, no pill is drawn. */
  value: T | null;
  onChange: (next: T) => void;
  /** Optional: clicking the active segment clears the selection by
   *  invoking this callback. Without it, clicks on the active segment
   *  are no-ops. */
  onClear?: () => void;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  /** Distinct id so multiple instances animate independently. */
  layoutId: string;
  ariaLabel?: string;
  size?: "sm" | "md";
  /** When true, only the icon renders; the label becomes the aria/title
   *  text. Requires every option to specify `icon`. */
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Two-to-five-option segmented control. The active background animates
 * between segments via motion's shared-layout animation; text colour
 * crossfades. Use for mutually exclusive filters / mode toggles.
 */
export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  onClear,
  options,
  layoutId,
  ariaLabel,
  size = "md",
  iconOnly = false,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const padding = size === "sm" ? "p-1" : "p-1.5";
  // Roomier per-segment padding so labels like "Favorites" / "Milestones"
  // have visual breathing room from the segment edges. iconOnly stays
  // square; sm grows from 7→8 to match.
  const segment = iconOnly
    ? size === "sm"
      ? "h-8 w-8 p-0"
      : "h-9 w-9 p-0"
    : size === "sm"
      ? "min-w-0 px-3.5 py-2 text-xs"
      : "min-w-0 px-5 py-2.5 text-sm";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      // contain:layout isolates the layout effects of the pill's shared-
      // layout animation from the rest of the page — without it Framer's
      // layoutId measurement pass touches sibling fixed elements (top nav
      // avatar, bottom nav) and they wobble for a frame on tap.
      style={{ contain: "layout style" }}
      className={cn(
        "relative flex rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60",
        padding,
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        const isDisabled = disabled || opt.disabled;
        const accent = accentFor(opt.pillClassName);
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? opt.label : undefined}
            title={iconOnly ? opt.label : undefined}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              if (active) {
                onClear?.();
                return;
              }
              onChange(opt.value);
            }}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-bold tracking-tight transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50",
              iconOnly ? "" : "flex-1",
              segment,
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.6,
                }}
                // Mobile-app style: a soft accent tint instead of a solid
                // saturated fill — the active *word* carries the colour.
                className={cn("absolute inset-0 rounded-md", accent.tint)}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center justify-center gap-1 transition-colors duration-200",
                active
                  ? accent.text
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {opt.icon}
              {!iconOnly && <span>{opt.label}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
