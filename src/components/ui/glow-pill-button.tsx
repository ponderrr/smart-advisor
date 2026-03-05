"use client";

import React, { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type GlowPillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const GlowPillButton = ({
  className,
  active = false,
  children,
  ...props
}: GlowPillButtonProps) => {
  const radius = 110;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onMouseMove?.(event);
    const { left, top } = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  };

  return (
    <motion.button
      type={props.type ?? "button"}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        setVisible(true);
      }}
      onMouseLeave={(event) => {
        props.onMouseLeave?.(event);
        setVisible(false);
      }}
      style={{
        ...(props.style ?? {}),
        background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
            rgba(139,92,246,0.5),
            transparent 80%
          )
        `,
      }}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-bold transition-all duration-300",
        active
          ? "border-indigo-500 bg-indigo-500 text-black dark:text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:bg-white hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-slate-900 dark:hover:text-violet-300",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
