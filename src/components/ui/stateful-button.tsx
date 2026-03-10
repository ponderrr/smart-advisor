"use client";
import { cn } from "@/lib/utils";
import React from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

export type StatefulStatus = "idle" | "loading" | "success" | "error";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  state?: StatefulStatus;
  resetDelayMs?: number;
  hoverGlow?: boolean;
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
  hoverGlow = true,
  ...props
}: ButtonProps) => {
  const [internalState, setInternalState] =
    React.useState<StatefulStatus>("idle");
  const [hoverVisible, setHoverVisible] = React.useState(false);
  const controlled = typeof state !== "undefined";
  const currentState = controlled ? state : internalState;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hoverGlowBackground = useMotionTemplate`
    radial-gradient(
      ${hoverVisible ? "110px" : "0px"} circle at ${mouseX}px ${mouseY}px,
      rgba(139,92,246,0.48),
      transparent 80%
    )
  `;

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
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
    style,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(event);
    if (!hoverGlow) return;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  };

  return (
    <motion.button
      type={buttonProps.type ?? "button"}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (hoverGlow) setHoverVisible(true);
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (hoverGlow) setHoverVisible(false);
      }}
      style={{
        ...(style ?? {}),
        ...(hoverGlow ? { backgroundImage: hoverGlowBackground } : {}),
      }}
      className={cn(
        "group flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70",
        currentState === "error"
          ? "border-rose-500 bg-rose-600 text-white"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-violet-500/20 dark:hover:text-violet-200",
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
