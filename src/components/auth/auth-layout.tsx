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
            <div className="mb-4 flex items-center justify-between">
              <motion.div
                className="h-2.5 w-24 rounded-full bg-slate-300 dark:bg-slate-700"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.div
                className="h-2.5 w-14 rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.15 }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  className="aspect-[2/3] rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.9, repeat: Infinity, delay: idx * 0.12 }}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-slate-300/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/80"
            animate={{ y: [0, -3, 0], opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          >
            <motion.div
              className="mb-4 h-2.5 w-28 rounded-full bg-slate-300 dark:bg-slate-700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.9, repeat: Infinity }}
            />
            <div className="space-y-3">
              <motion.div
                className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.9, repeat: Infinity }}
              />
              <motion.div
                className="h-2.5 w-11/12 rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.9, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                className="h-2.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.9, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-slate-300/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/80"
            animate={{ y: [0, -3, 0], opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <motion.div
              className="mb-4 h-2.5 w-32 rounded-full bg-slate-300 dark:bg-slate-700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <div className="space-y-3">
              <motion.div
                className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.85, repeat: Infinity }}
              />
              <motion.div
                className="h-2.5 w-10/12 rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.85, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                className="h-2.5 w-4/5 rounded-full bg-slate-200 dark:bg-slate-800"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.85, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
