"use client";
import React, { SVGProps } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
  onClose?: () => void;
}) => {
  return (
    <motion.div
      className={cn(
        "relative flex min-h-10 w-full items-center justify-center px-4 py-2",
        className,
      )}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}

      {onClose && (
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-0.5 transition-opacity hover:opacity-80"
          onClick={onClose}
          aria-label="Dismiss banner"
        >
          <CloseIcon className="h-4 w-4 text-current opacity-70" />
        </button>
      )}
    </motion.div>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
