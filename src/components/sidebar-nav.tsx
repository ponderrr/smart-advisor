"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Static sidebar nav primitives — used by Settings, Dashboard, and History
 * for a consistent left-rail experience. Each <SidebarNavItem> is a button
 * (not an anchor) so it toggles client-side state.
 */

type SidebarNavItemProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

export function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
        active
          ? "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-50"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
          active
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function SidebarNavGroup({ label }: { label: string }) {
  return (
    <p className="mb-2 mt-4 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 first:mt-0 dark:text-slate-500">
      {label}
    </p>
  );
}

type SidebarUserProps = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export function SidebarUser({ name, email, avatarUrl }: SidebarUserProps) {
  const initial = (name || email || "?").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 border-t border-slate-200/70 px-3 pt-4 dark:border-slate-700/60">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "Avatar"}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-black text-white">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
          {name || "User"}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {email}
        </p>
      </div>
    </div>
  );
}

/**
 * Wrapper aside that gives the sidebar its card styling. Sticky on md+ so
 * it stays in view as you scroll the section content.
 */
export function SidebarNavShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur-md md:sticky md:top-32 md:w-64 md:shrink-0 dark:border-slate-700/60 dark:bg-slate-900/65",
        className,
      )}
    >
      {children}
    </aside>
  );
}
