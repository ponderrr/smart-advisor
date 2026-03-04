"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/brand-wordmark";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

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
  const copy = [
    {
      title: "Personalized picks in seconds",
      description: "Answer a few questions and get recommendations tailored to your taste.",
    },
    {
      title: "Discover books and movies you will actually finish",
      description: "Smart Advisor maps your taste profile and surfaces high-confidence matches.",
    },
    {
      title: "Less scrolling, better recommendations",
      description: "Skip decision fatigue with clear, context-aware suggestions every time.",
    },
    {
      title: "Private by design",
      description: "Your account preferences stay personal and focused on improving your picks.",
    },
    {
      title: "Fast and easy to use",
      description: "Get to your next movie or book choice quickly without overthinking.",
    },
    {
      title: "Recommendations you can trust",
      description: "See clear reasons behind each suggestion so choosing feels simple.",
    },
  ];
  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCopyIndex((prev) => (prev + 1) % copy.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [copy.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)]" />
      <div className="relative z-10 flex h-full items-center justify-center p-10">
        <div className="w-full max-w-md space-y-5">
          <div className="relative min-h-[152px] rounded-3xl border border-slate-300/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/85">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={copyIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-6"
              >
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {copy[copyIndex].title}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {copy[copyIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            className="rounded-3xl border border-slate-300/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/80"
            animate={{ y: [0, -3, 0], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="space-y-4">
              <AuthSignalArc />
              <AuthRoutePulse />
              <AuthTrustRadar />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AuthSignalArc = () => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <svg viewBox="0 0 320 72" className="h-14 w-full">
        <motion.path
          d="M16 54 C78 12, 140 62, 202 24 C238 4, 278 24, 304 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-cyan-500"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        />
        {[56, 116, 176, 244, 292].map((x, idx) => (
          <motion.circle
            key={x}
            cx={x}
            cy={idx % 2 === 0 ? 40 : 28}
            r="4"
            className="fill-indigo-500"
            animate={{ scale: [0.8, 1.35, 0.8], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: idx * 0.15, ease: "easeInOut" }}
          />
        ))}
      </svg>
    </div>
  );
};

const AuthRoutePulse = () => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="relative h-12 overflow-hidden rounded-xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/85">
        <div className="absolute inset-0 grid grid-cols-8">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="border-r border-slate-100 dark:border-slate-800" />
          ))}
        </div>
        <motion.div
          className="absolute top-1/2 h-3 w-10 -translate-y-1/2 rounded-full bg-emerald-500/85"
          animate={{ x: [0, 208, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

const AuthTrustRadar = () => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex items-center justify-between">
        {[0, 1, 2, 3].map((idx) => (
          <motion.div
            key={idx}
            className="h-8 w-8 rounded-full border-2 border-violet-500/70"
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.7, repeat: Infinity, delay: idx * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
};
