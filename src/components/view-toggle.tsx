"use client";

import { LayoutGrid, List } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export const ViewToggle = ({ value, onChange, className }: ViewToggleProps) => (
  <SegmentedControl<ViewMode>
    layoutId="view-toggle"
    value={value}
    onChange={onChange}
    size="sm"
    iconOnly
    ariaLabel="View mode"
    className={className}
    options={[
      {
        value: "grid",
        label: "Grid view",
        icon: <LayoutGrid size={14} />,
        pillClassName: "bg-slate-900 dark:bg-slate-100",
        activeTextClassName: "text-white dark:text-slate-900",
      },
      {
        value: "list",
        label: "List view",
        icon: <List size={14} />,
        pillClassName: "bg-slate-900 dark:bg-slate-100",
        activeTextClassName: "text-white dark:text-slate-900",
      },
    ]}
  />
);
