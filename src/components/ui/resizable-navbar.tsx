"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import React, { useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 50);
  });

  return (
    <motion.div
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
        visible ? "py-0" : "py-4",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { visible })
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backgroundColor: visible ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0)",
        backdropFilter: visible ? "blur(16px)" : "blur(0px)",
        borderBottom: visible ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0)",
      }}
      className={cn(
        "mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4 dark:bg-neutral-950/80",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className }: NavItemsProps) => {
  return (
    <div className={cn("hidden lg:flex items-center gap-10", className)}>
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.link}
          className="text-lg font-bold tracking-tight text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
        >
          {item.name}
        </a>
      ))}
    </div>
  );
};

export const MobileNav = ({ children, className, visible }: any) => (
  <div className={cn("lg:hidden w-full px-6 py-4", visible && "bg-white/90 dark:bg-neutral-950/90", className)}>
    {children}
  </div>
);

export const MobileNavHeader = ({ children, className }: any) => (
  <div className={cn("flex w-full items-center justify-between", className)}>{children}</div>
);

export const MobileNavMenu = ({ children, isOpen }: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute inset-x-0 top-full bg-white dark:bg-neutral-950 px-6 py-8 border-b dark:border-neutral-800 flex flex-col gap-4"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const MobileNavToggle = ({ isOpen, onClick }: any) => (
  <button onClick={onClick} className="p-2">
    {isOpen ? <IconX /> : <IconMenu2 />}
  </button>
);

export const NavbarLogo = () => (
  <a href="/" className="flex items-center gap-2 group">
    <div className="w-8 h-8 bg-indigo-600 rounded-lg group-hover:rotate-12 transition-transform" />
    <span className="text-xl font-black tracking-tighter dark:text-white uppercase">Advisor</span>
  </a>
);

export const NavbarButton = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);
