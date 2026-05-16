"use client";

import React, { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared presentational primitives for the settings page. Module-scoped
 * and stateless — extracted verbatim from settings/page.tsx (no closure
 * over page state).
 */

export const SectionCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60 sm:p-6",
      className,
    )}
  >
    {children}
  </div>
);

export const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mb-5">
    <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
);

export const SettingsInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    readOnly?: boolean;
    icon?: React.ReactNode;
    error?: string;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      label,
      placeholder,
      type = "text",
      disabled = false,
      readOnly = false,
      icon,
      error,
      ...props
    },
    ref,
  ) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="relative">
        <input
          ref={ref}
          placeholder={placeholder}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500",
            (disabled || readOnly) &&
              "cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400",
            error &&
              "border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-700",
          )}
          {...props}
        />
        {icon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </label>
  ),
);
SettingsInput.displayName = "SettingsInput";
