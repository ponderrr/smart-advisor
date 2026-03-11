"use client";

import * as Label from "@radix-ui/react-label";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const FormField = ({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label.Root
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium text-slate-700 dark:text-slate-300",
        error && "text-red-500",
      )}
    >
      {label}
    </Label.Root>
    {children}
    {error && (
      <p role="alert" className="text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

export const PasswordInput = ({
  showPassword,
  onTogglePassword,
  className,
  ...props
}: any) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  return (
    <motion.div
      style={{
        background: useMotionTemplate`radial-gradient(${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px, #8b5cf6, transparent 80%)`,
      }}
      onMouseMove={({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input relative rounded-lg p-[2px] transition duration-300"
    >
      <input
        type={showPassword ? "text" : "password"}
        className={cn(
          "shadow-input flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 pr-10 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-zinc-800 dark:text-white",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute inset-y-0 right-1 inline-flex items-center justify-center px-2 text-slate-500 hover:text-slate-900"
      >
        {showPassword ? (
          <IconEyeOff className="h-4 w-4" />
        ) : (
          <IconEye className="h-4 w-4" />
        )}
      </button>
    </motion.div>
  );
};

export const AuthHoverButton = ({ className, children, ...props }: any) => {
  const radius = 110;
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px, rgba(139,92,246,0.5), transparent 80%)`;

  return (
    <motion.button
      {...props}
      onMouseMove={(e: React.MouseEvent) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ ...props.style, backgroundImage: background }}
      className={className}
    >
      {children}
    </motion.button>
  );
};
