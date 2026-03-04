"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { AnimatePresence, motion } from "motion/react";

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
  const [internalState, setInternalState] = React.useState<StatefulStatus>("idle");
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
      layout
      layoutId="stateful-button"
      type={buttonProps.type ?? "button"}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70",
        currentState === "error"
          ? "bg-rose-600 text-white"
          : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
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
    <motion.svg
      {...iconMotion}
      animate={{ rotate: 360, opacity: 1, scale: 1 }}
      transition={{ rotate: { duration: 0.6, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.16 }, scale: { duration: 0.16 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white dark:text-slate-900"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      {...iconMotion}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white dark:text-slate-900"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 12l2 2l4 -4" />
      <path d="M12 3a9 9 0 1 1 -9 9" />
    </motion.svg>
  );
};

const ErrorIcon = () => {
  return (
    <motion.svg
      {...iconMotion}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <path d="M12 3a9 9 0 1 1 -9 9" />
    </motion.svg>
  );
};
