"use client";

import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import React, { useState } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import Link from "next/link";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  scrolled?: boolean;
}

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  scrolled?: boolean;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  // Pages start transparent at the top and only blur once the user actively
  // scrolls past the threshold. Pages that can't scroll stay transparent
  // forever, matching the home-page hero look on every page.
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled((prev) => {
      if (latest > 8) return true;
      if (latest < 4) return false;
      return prev;
    });
  });

  return (
    <motion.nav
      aria-label="Main navigation"
      style={{ top: "var(--site-banner-height, 0px)" }}
      className={cn("fixed inset-x-0 z-50 w-full py-4", className)}
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ scrolled: boolean }>, { scrolled })
          : child,
      )}
    </motion.nav>
  );
};

export const NavBody = ({
  children,
  className,
  scrolled = false,
}: NavBodyProps) => {
  return (
    <motion.div
      data-main-navbar="true"
      initial={false}
      animate={{
        width: "min(1180px, calc(100% - 2rem))",
        borderRadius: scrolled ? 999 : 24,
        y: scrolled ? 6 : 0,
      }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto hidden md:flex items-center justify-between px-10 py-4",
        "border border-transparent",
        scrolled
          ? "bg-white/65 border-slate-200/50 shadow-[0_14px_40px_-22px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/60 dark:shadow-[0_14px_40px_-20px_rgba(2,6,23,0.7)]"
          : "bg-white/0 shadow-none dark:bg-transparent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({
  items,
  className,
  scrolled = false,
}: NavItemsProps) => {
  const handleAnchorClick = (
    event: React.MouseEvent<HTMLElement>,
    link: string,
  ) => {
    if (!link.startsWith("#")) return;
    event.preventDefault();
    const section = document.querySelector(link) as HTMLElement | null;
    if (!section) return;

    const navbar = document.querySelector(
      "[data-main-navbar='true']",
    ) as HTMLElement | null;
    const offset = (navbar?.offsetHeight ?? 96) + 16;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: scrolled ? 0.95 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.8 }}
      className={cn("hidden lg:flex items-center gap-10", className)}
    >
      {items.map((item, idx) => {
        const linkClassName = cn(
          "shrink-0 whitespace-nowrap font-bold tracking-tight text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400",
          "text-base",
        );
        const motionProps = {
          initial: false,
          animate: { opacity: scrolled ? 0.95 : 1 },
          transition: {
            duration: 0.25,
            delay: scrolled ? 0 : idx * 0.03,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
          className: linkClassName,
        };

        if (item.link.startsWith("#")) {
          return (
            <motion.button
              key={idx}
              type="button"
              onClick={(event) => handleAnchorClick(event, item.link)}
              {...motionProps}
            >
              {item.name}
            </motion.button>
          );
        }

        return (
          <Link key={idx} href={item.link} className={linkClassName}>
            {item.name}
          </Link>
        );
      })}
    </motion.div>
  );
};

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  scrolled?: boolean;
}

export const MobileNav = ({ children, className, scrolled = false }: MobileNavProps) => (
  <motion.div
    initial={false}
    animate={{
      width: "calc(100% - 1rem)",
      borderRadius: scrolled ? 999 : 16,
      y: scrolled ? 4 : 0,
    }}
    transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "mx-auto md:hidden px-5 py-3 border border-transparent",
      scrolled
        ? "bg-white/70 border-slate-200/60 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-slate-900/70 dark:border-slate-700/60"
        : "bg-white/0 shadow-none dark:bg-transparent",
      className,
    )}
  >
    {children}
  </motion.div>
);

export const MobileNavHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex w-full items-center justify-between", className)}>
    {children}
  </div>
);

export const MobileNavMenu = ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        id="mobile-nav-menu"
        role="menu"
        aria-label="Mobile navigation menu"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="absolute inset-x-2 top-[calc(100%+0.5rem)] rounded-3xl border border-slate-200/80 bg-white/90 px-6 py-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90"
      >
        <div className="flex flex-col gap-4">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const MobileNavToggle = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    aria-label={isOpen ? "Close menu" : "Open menu"}
    aria-expanded={isOpen}
    aria-controls="mobile-nav-menu"
  >
    {isOpen ? <IconX /> : <IconMenu2 />}
  </button>
);

export const NavbarLogo = () => (
  <Link
    href="/"
    aria-label="Smart Advisor home"
    onClick={(event) => {
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }}
    className="group inline-flex shrink-0 items-center pr-3 transition-opacity hover:opacity-85"
  >
    <BrandWordmark imageClassName="h-10 md:h-11" />
  </Link>
);

export const NavbarButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props}>{children}</button>
);
