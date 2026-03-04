"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/brand-wordmark";
import { motion } from "framer-motion";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  onLogoClick: () => void;
}

export const AuthLayout = ({ children, onLogoClick }: AuthLayoutProps) => {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-slate-50 px-4 py-4 dark:bg-slate-950 md:px-8 md:py-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 md:grid-cols-2">
        <section className="relative flex min-h-[540px] flex-col p-5 sm:p-7 md:min-h-[620px] md:p-8">
          <div className="mb-7 flex items-center justify-between">
            <button
              onClick={onLogoClick}
              className="inline-flex items-center rounded-full px-1 py-1 transition-opacity hover:opacity-80"
              aria-label="Go to home"
            >
              <BrandWordmark imageClassName="h-8 md:h-9" />
            </button>
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-start md:items-center">{children}</div>
        </section>

        <section className="relative hidden overflow-hidden md:block">
          <AnimatedVisual />
        </section>
      </div>
    </main>
  );
};

const AnimatedVisual = () => {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-teal-400/25 blur-3xl" />
      <div className="absolute bottom-4 right-0 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />

      <svg
        viewBox="0 0 700 820"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Abstract gradient illustration"
      >
        <defs>
          <linearGradient id="auth-line-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="auth-line-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
          </linearGradient>
          <filter id="auth-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M70 760C155 600 250 540 370 470C508 388 578 290 635 105"
          stroke="url(#auth-line-1)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          filter="url(#auth-glow)"
          initial={{ pathLength: 0.2, opacity: 0.45 }}
          animate={{ pathLength: 1, opacity: 0.95 }}
          transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />

        <motion.path
          d="M40 120C165 215 260 310 340 380C445 475 560 540 688 610"
          stroke="url(#auth-line-2)"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
          filter="url(#auth-glow)"
          initial={{ pathLength: 0.15, opacity: 0.35 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 2.8, delay: 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </svg>

      <div className="absolute bottom-12 left-12 right-12 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-2xl font-bold tracking-tight text-slate-100">Find your next perfect watch or read.</p>
        <p className="mt-2 text-sm text-slate-300">
          Smart Advisor blends AI reasoning and trusted media metadata to deliver tailored picks instantly.
        </p>
      </div>
    </div>
  );
};
