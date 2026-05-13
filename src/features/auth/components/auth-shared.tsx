"use client";

import * as Label from "@radix-ui/react-label";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue } from "motion/react";
import {
  IconCircle,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const FormField = ({
  label,
  htmlFor,
  error,
  invalid,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  invalid?: boolean;
  children: React.ReactNode;
}) => {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const isInvalid = invalid || !!error;
  return (
    <div className="space-y-1.5">
      <Label.Root
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium text-slate-700 dark:text-slate-300",
          isInvalid && "text-red-500",
        )}
      >
        {label}
      </Label.Root>
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword: boolean;
  onTogglePassword: () => void;
}

export const PasswordInput = ({
  showPassword,
  onTogglePassword,
  className,
  id,
  ...props
}: PasswordInputProps) => {
  const t = useTranslations("Auth.shared");
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
        id={id}
        type={showPassword ? "text" : "password"}
        aria-describedby={id ? `${id}-error` : undefined}
        className={cn(
          "shadow-input flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 pr-10 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-zinc-800 dark:text-white",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
        aria-pressed={showPassword}
        className="absolute inset-y-0 right-1 inline-flex items-center justify-center px-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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

export interface FieldRule {
  label: string;
  met: boolean;
}

interface FieldRequirementsProps {
  rules: FieldRule[];
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  title?: string;
}

const POPOVER_WIDTH_PX = 224;
const POPOVER_GAP_PX = 12;
const POPOVER_VIEWPORT_PAD_PX = 12;

export const FieldRequirements = ({
  rules,
  visible,
  anchorRef,
  title,
}: FieldRequirementsProps) => {
  const t = useTranslations("Auth.shared");
  const resolvedTitle = title ?? t("requirements");
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "left" | "right";
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    let raf = 0;
    const update = () => {
      const el = anchorRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const leftCandidate = rect.left - POPOVER_WIDTH_PX - POPOVER_GAP_PX;
        const placement: "left" | "right" =
          leftCandidate >= POPOVER_VIEWPORT_PAD_PX ? "left" : "right";
        const left =
          placement === "left"
            ? leftCandidate
            : rect.right + POPOVER_GAP_PX;
        setPos({ top: rect.top, left, placement });
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [visible, anchorRef]);

  const content = (
    <div className="rounded-lg border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/95">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {resolvedTitle}
      </p>
      <ul className="space-y-1">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs leading-tight">
            {rule.met ? (
              <IconCircleCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <IconCircle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            )}
            <span
              className={cn(
                rule.met
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400",
              )}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden xl:hidden"
          >
            <div className="pt-2">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {visible && pos && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: pos.placement === "left" ? 8 : -8,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: pos.placement === "left" ? 8 : -8,
                }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: POPOVER_WIDTH_PX,
                }}
                className="pointer-events-none fixed z-50 hidden xl:block"
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export const AuthHoverButton = ({ className, children, onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, onAnimationStart: _onAnimationStart, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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
