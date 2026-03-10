"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/brand-wordmark";
import React from "react";
import { CardStack } from "@/components/ui/card-stack";

interface AuthLayoutProps {
  children: React.ReactNode;
  onLogoClick: () => void;
}

export const AuthLayout = ({ children, onLogoClick }: AuthLayoutProps) => {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-slate-50 px-4 py-4 dark:bg-slate-950 md:px-8 md:py-8">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 md:grid-cols-2">
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

          <div className="flex flex-1 items-start md:items-center">
            {children}
          </div>
        </section>

        <section className="relative hidden overflow-hidden md:block md:min-h-[620px]">
          <AnimatedVisual />
        </section>
      </div>
    </main>
  );
};

const AnimatedVisual = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div className="flex h-full flex-col items-center justify-center px-8 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            User Reviews
          </p>
          <h3 className="mt-2 whitespace-nowrap text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            People use Smart Advisor to decide faster
          </h3>
        </div>
        <CardStack items={AUTH_REVIEW_CARDS} />
      </div>
    </div>
  );
};

const AUTH_REVIEW_CARDS = [
  {
    id: 0,
    name: "Ari",
    designation: "Movie + Book Fan",
    content: (
      <p>
        I stopped doom-scrolling review sites.{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          Smart Advisor
        </span>{" "}
        gave me a movie and book pair that matched my mood{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          in minutes
        </span>
        .
      </p>
    ),
  },
  {
    id: 1,
    name: "Mila",
    designation: "Weekend Reader",
    content: (
      <p>
        The{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          why this fits
        </span>{" "}
        explanation is the best part. It helps me trust the pick{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          right away
        </span>{" "}
        instead of second-guessing.
      </p>
    ),
  },
  {
    id: 2,
    name: "Noah",
    designation: "Casual Viewer",
    content: (
      <p>
        Setup is{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          quick
        </span>
        , and recommendations feel personal. It’s become my{" "}
        <span className="font-semibold text-violet-700 dark:text-violet-300">
          default
        </span>{" "}
        before I start any movie night.
      </p>
    ),
  },
];
