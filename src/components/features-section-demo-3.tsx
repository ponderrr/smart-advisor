"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconLock,
  IconBolt,
  IconCheck,
  IconBookFilled,
  IconDeviceTv,
  IconStarFilled,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  Skeleton: React.ComponentType;
  wide?: boolean;
};

const PrivateProfileSkeleton = () => (
  <div className="relative flex h-full w-full items-center justify-center px-6">
    <div className="relative w-full max-w-[18rem] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
        <IconLock size={14} strokeWidth={2.6} />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-2 w-16 rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((i) => {
          const widths = ["w-full", "w-[78%]", "w-[58%]"];
          return (
            <div
              key={i}
              className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-slate-300 dark:bg-slate-700",
                  widths[i],
                )}
              />
              <motion.div
                className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-indigo-400/40"
                initial={{ x: "0%" }}
                animate={{ x: "300%" }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: "linear",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const WarpSpeedSkeleton = () => (
  <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-6">
    <div className="flex w-full max-w-[18rem] items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
        <IconBolt size={15} strokeWidth={2.6} />
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500"
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "100%", "100%"] }}
          transition={{
            duration: 2,
            times: [0, 0.7, 1],
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: "easeOut",
          }}
        />
        <motion.div
          className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/80 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "1800%" }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
    <div className="flex w-full max-w-[18rem] flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 dark:border-slate-700/60 dark:bg-slate-900/80"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: [0, 1, 1, 0], x: [-16, 0, 0, 8] }}
          transition={{
            duration: 2.4,
            delay: 0.6 + i * 0.2,
            repeat: Infinity,
            repeatDelay: 0.2,
            times: [0, 0.15, 0.85, 1],
          }}
        >
          <div className="h-6 w-4 rounded-sm bg-gradient-to-br from-indigo-400 to-violet-500" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-20 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const TrustSkeleton = () => {
  const reasons = [
    "Matches your age rating",
    "Pace you said you prefer",
    "Tone you've picked before",
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      <div className="flex w-full max-w-[18rem] items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="3"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="url(#trust-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="97.4"
              initial={{ strokeDashoffset: 97.4 }}
              animate={{ strokeDashoffset: [97.4, 6, 6, 97.4] }}
              transition={{
                duration: 3.4,
                times: [0, 0.35, 0.85, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <defs>
              <linearGradient id="trust-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <IconStarFilled
              className="text-indigo-500 dark:text-indigo-400"
              size={14}
            />
            <span className="mt-0.5 text-[11px] font-black tracking-tight text-slate-900 dark:text-slate-100">
              94%
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason}
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: [0, 1, 1, 0], x: [-8, 0, 0, 0] }}
              transition={{
                duration: 3.4,
                times: [0, 0.15, 0.85, 1],
                delay: 0.6 + i * 0.25,
                repeat: Infinity,
              }}
            >
              <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <IconCheck size={9} strokeWidth={3.5} />
              </div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {reason}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AcrossBothSkeleton = () => {
  const [mode, setMode] = useState<"book" | "movie">("book");
  useEffect(() => {
    const id = setInterval(() => {
      setMode((m) => (m === "book" ? "movie" : "book"));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const variants = {
    book: {
      label: "Book",
      Icon: IconBookFilled,
      gradient: "from-indigo-500 to-violet-500",
      meta: "312 pages",
    },
    movie: {
      label: "Movie",
      Icon: IconDeviceTv,
      gradient: "from-fuchsia-500 to-rose-500",
      meta: "1h 48m",
    },
  } as const;

  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      <div className="relative h-[9.5rem] w-[10rem]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={mode}
            initial={{ opacity: 0, rotateY: -90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 90, scale: 0.9 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80"
            style={{ transformPerspective: 800 }}
          >
            <div
              className={cn(
                "flex h-20 w-full items-center justify-center rounded-xl bg-gradient-to-br text-white",
                variants[mode].gradient,
              )}
            >
              {(() => {
                const Icon = variants[mode].Icon;
                return <Icon size={34} />;
              })()}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                {variants[mode].label}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {variants[mode].meta}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="mt-1 h-1.5 w-3/4 rounded-full bg-slate-200/80 dark:bg-slate-800/70" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const FEATURES: Feature[] = [
  {
    title: "Private Profile",
    description:
      "Your preferences stay tied to your account and are used only to improve your picks.",
    Skeleton: PrivateProfileSkeleton,
    wide: true,
  },
  {
    title: "Warp Speed Results",
    description:
      "Quick results and smooth updates help you decide without waiting around.",
    Skeleton: WarpSpeedSkeleton,
  },
  {
    title: "Easy-To-Trust Picks",
    description:
      "Clear reasons make each suggestion easier to trust and choose, with open-source transparency.",
    Skeleton: TrustSkeleton,
  },
  {
    title: "Choose Across Both",
    description:
      "See book and movie results in one place so choosing feels faster and easier.",
    Skeleton: AcrossBothSkeleton,
    wide: true,
  },
];

export default function FeaturesSectionDemo() {
  return (
    <section
      id="why-smart-advisor"
      className="scroll-mt-32 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
            Why Smart Advisor
          </p>
          <h2 className="mx-auto mt-3 max-w-5xl text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
            Built for picks you can trust
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base dark:text-slate-300">
            Private by design, fast by default, and open source so you can see
            how it works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Skeleton = feature.Skeleton;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/40",
                  feature.wide
                    ? "md:col-span-2 md:flex-row md:items-stretch md:gap-6"
                    : "md:col-span-1",
                )}
              >
                <div
                  className={cn(
                    "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/80 dark:to-slate-800/40 [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]",
                    feature.wide ? "h-52 md:h-auto md:w-1/2" : "h-52",
                  )}
                >
                  <Skeleton />
                </div>
                <div
                  className={cn(
                    "mt-5",
                    feature.wide &&
                      "md:mt-0 md:flex md:w-1/2 md:flex-col md:justify-center",
                  )}
                >
                  <p className="font-mono text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="mt-2 h-px w-10 bg-gradient-to-r from-indigo-400 to-violet-400" />
                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
