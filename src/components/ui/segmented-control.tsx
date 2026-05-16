"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  /** Optional leading icon. Rendered before the label, or alone when
   *  `iconOnly` is set on the parent. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Tailwind class for the active pill background. Defaults to violet.
   *  Pair with a high-contrast `activeTextClassName` if you change this
   *  away from a 500-weight saturated color. */
  pillClassName?: string;
  /** Tailwind class for the active label text. Defaults to `text-white`. */
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
                className={cn(
                  "absolute inset-0 rounded-md shadow-sm",
                  opt.pillClassName ?? "bg-violet-500",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center justify-center gap-1 transition-colors duration-200",
                active
                  ? (opt.activeTextClassName ?? "text-white")
                  : "text-slate-600 dark:text-slate-300",
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
