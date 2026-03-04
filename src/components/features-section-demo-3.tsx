"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { motion } from "motion/react";
import { IconSparkles, IconTargetArrow, IconBookmark, IconMoodHappy } from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Skip endless scrolling",
      description:
        "Use a short guided flow to narrow thousands of options into a focused list that actually matches your mood.",
      skeleton: <SkeletonFlow />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Understand why each pick fits",
      description:
        "Every recommendation includes clear reasoning, so you can decide quickly without guessing.",
      skeleton: <SkeletonReasons />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Discover books and movies together",
      description:
        "Find both formats in one place with the same intent-driven ranking logic.",
      skeleton: <SkeletonDiscover />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r dark:border-neutral-800",
    },
    {
      title: "Keep your favorites organized",
      description:
        "Save strong options and come back later without losing your best picks.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];

  return (
    <section id="why-smart-advisor" className="scroll-mt-32 relative z-20 mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="px-2">
        <h2 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
          Why Use Smart Advisor
        </h2>

        <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-slate-600 md:text-base dark:text-slate-300">
          Built to help you decide faster with less noise, stronger matches, and clear recommendation quality.
        </p>
      </div>

      <div className="relative">
        <div className="mt-12 grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("relative overflow-hidden p-4 sm:p-8", className)}>{children}</div>;
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="mx-auto max-w-5xl text-left text-xl tracking-tight text-slate-900 md:text-2xl md:leading-snug dark:text-white">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "mx-auto max-w-4xl text-left text-sm md:text-base",
        "text-slate-600 dark:text-neutral-300",
        "mx-0 my-2 max-w-sm text-left md:text-sm",
      )}
    >
      {children}
    </p>
  );
};

const SkeletonFlow = () => {
  const items = [
    "Pick a vibe",
    "Choose books, movies, or both",
    "Get ranked recommendations",
  ];

  return (
    <div className="relative flex h-full flex-col gap-3 px-2 py-8">
      {items.map((item, idx) => (
        <motion.div
          key={item}
          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/80"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1, duration: 0.35 }}
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white dark:bg-slate-100 dark:text-slate-900">
            {idx + 1}
          </span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item}</p>
        </motion.div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-24 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black" />
    </div>
  );
};

const SkeletonReasons = () => {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xs rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <IconSparkles className="h-4 w-4 text-indigo-500" />
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Why this matches</p>
        </div>
        <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-2"><IconTargetArrow className="h-4 w-4 text-cyan-500" />Strong genre fit</li>
          <li className="flex items-center gap-2"><IconMoodHappy className="h-4 w-4 text-emerald-500" />Mood alignment</li>
          <li className="flex items-center gap-2"><IconBookmark className="h-4 w-4 text-amber-500" />Popular with similar users</li>
        </ul>
      </div>
    </div>
  );
};

const SkeletonDiscover = () => {
  return (
    <div className="relative flex h-full items-center justify-center gap-4 p-8">
      <motion.div
        className="flex h-24 w-20 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        BOOK
      </motion.div>
      <motion.div
        className="flex h-28 w-20 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        MOVIE
      </motion.div>
      <motion.div
        className="absolute -bottom-4 text-xs font-semibold text-slate-500 dark:text-slate-400"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        Unified ranking engine
      </motion.div>
    </div>
  );
};

const SkeletonFour = () => {
  return (
    <div className="relative mt-10 flex h-60 flex-col items-center bg-transparent md:h-60 dark:bg-transparent">
      <Globe className="absolute -right-10 -bottom-80 md:-right-10 md:-bottom-72" />
    </div>
  );
};

const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 4000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
};
