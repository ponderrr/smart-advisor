"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type StatefulStatus = "idle" | "loading" | "success" | "error";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  state?: StatefulStatus;
  resetDelayMs?: number;
}

const isErrorResult = (value: unknown): value is { error: string | null } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
};

export const Button = ({
  className,
  children,
  state,
  resetDelayMs = 1600,
  ...props
}: ButtonProps) => {
  const [internalState, setInternalState] =
    React.useState<StatefulStatus>("idle");
  const controlled = typeof state !== "undefined";
  const currentState = controlled ? state : internalState;

  React.useEffect(() => {
    if (controlled || currentState === "idle" || currentState === "loading") {
      return;
    }

    const timer = setTimeout(() => {
      setInternalState("idle");
    }, resetDelayMs);

    return () => clearTimeout(timer);
  }, [controlled, currentState, resetDelayMs]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (controlled) {
      await props.onClick?.(event);
      return;
    }

    if (!props.onClick) {
      return;
    }

    setInternalState("loading");

    try {
      const result = await props.onClick(event);

      if (isErrorResult(result) && result.error) {
        setInternalState("error");
      } else {
        setInternalState("success");
      }
    } catch (_error) {
      setInternalState("error");
    }
  };

  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      type={buttonProps.type ?? "button"}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70",
        currentState === "error"
          ? "border-rose-500 bg-rose-600 text-white"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70",
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        {currentState === "loading" && <Loader key="loader" />}
        {currentState === "success" && <CheckIcon key="check" />}
        {currentState === "error" && <ErrorIcon key="error" />}
      </AnimatePresence>
      <span>
        {currentState === "loading"
          ? "Please wait..."
          : currentState === "success"
            ? "Success"
            : currentState === "error"
              ? "Try again"
              : children}
      </span>
    </motion.button>
  );
};

const iconMotion = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.16 },
};

const Loader = () => {
  return (
    <motion.span {...iconMotion} className="inline-flex">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </motion.span>
  );
};

const CheckIcon = () => {
  return (
    <motion.span {...iconMotion} className="inline-flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </motion.span>
  );
};

const ErrorIcon = () => {
  return (
    <motion.span {...iconMotion} className="inline-flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </motion.span>
  );
};
