"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) => {
  return (
    <motion.div
      className={cn(
        "flex w-full items-center justify-center px-4 py-2 text-xs font-medium",
        className,
      )}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-2">
        {children}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Dismiss banner"
            className="ml-2 rounded-full border px-2.5 py-0.5 text-[10px] font-medium opacity-60 transition-opacity hover:opacity-100"
          >
            Dismiss
          </button>
        )}
      </div>
    </motion.div>
  );
};
