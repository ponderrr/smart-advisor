"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface AnimatedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function AnimatedTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: AnimatedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const tabRect = el.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - containerRect.left + container.scrollLeft,
      width: tabRect.width,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60",
        className,
      )}
    >
      {indicator.width > 0 && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50"
          initial={false}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.id, el);
          }}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative z-10 flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
            activeTab === tab.id
              ? "text-indigo-700 dark:text-indigo-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
