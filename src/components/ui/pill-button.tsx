"use client";

import React from "react";

import { cn } from "@/lib/utils";

type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Highlights the button as the currently selected option (e.g. tabs/filters). */
  active?: boolean;
  /** Visual treatment for destructive actions (red). */
  variant?: "default" | "destructive";
};

/**
 * Plain pill-shaped button. No glow, no motion — just a clean rounded button
 * with a hover background tint and an optional active state. Use this for
 * tabs, filters, and inline secondary actions across the app.
 */
export const PillButton = ({
  className,
  active = false,
  variant = "default",
  children,
  type = "button",
  ...props
}: PillButtonProps) => {
  const isDestructive = variant === "destructive";

  return (
    <button
      type={type}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200",
        "active:scale-[0.98]",
        active
          ? isDestructive
            ? "border-red-500 bg-red-500 text-white"
            : "border-indigo-500 bg-indigo-500 text-white"
          : isDestructive
            ? "border-red-300 bg-white text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900/70 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-950/30"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
