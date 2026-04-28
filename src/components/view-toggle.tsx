"use client";

import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export const ViewToggle = ({ value, onChange, className }: ViewToggleProps) => {
  const options: { id: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: "grid", label: "Grid view", icon: LayoutGrid },
    { id: "list", label: "List view", icon: List },
  ];
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 p-0.5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65",
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              active
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
};
