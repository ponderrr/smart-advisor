"use client";

import React, { useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoItem {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PoweredByLogos = () => {
  const controls = useAnimation();

  const logos: LogoItem[] = [
    {
      name: "Claude",
      icon: <span className="text-2xl">🧠</span>,
      color: "from-amber-500/20 to-amber-600/20",
    },
    {
      name: "Google Books",
      icon: <span className="text-2xl">📚</span>,
      color: "from-blue-500/20 to-blue-600/20",
    },
    {
      name: "TMDB",
      icon: <span className="text-2xl">🎬</span>,
      color: "from-green-500/20 to-green-600/20",
    },
    {
      name: "Supabase",
      icon: <span className="text-2xl">⚡</span>,
      color: "from-emerald-500/20 to-emerald-600/20",
    },
  ];

  const logoSequence = async () => {
    while (true) {
      for (let i = 0; i < logos.length; i++) {
        await controls.start((custom) =>
          custom === i
            ? {
              scale: [1, 1.2, 1],
              y: [0, -10, 0],
              transition: { duration: 0.5, ease: "easeInOut" },
            }
            : {}
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  useEffect(() => {
    logoSequence();
  }, []);

  const sparkles = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    })), []);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-20 overflow-hidden rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors duration-300">
      {/* Radial Mask for edges */}
      <div className="absolute inset-0 z-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]" />

      {/* Vertical Glowing Beam */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full overflow-hidden z-0">
        <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-indigo-500 to-transparent animate-beam" />
      </div>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 0, x: sparkle.x, y: sparkle.y }}
            animate={{
              opacity: [0, 1, 0],
              x: sparkle.x + (Math.random() * 20 - 10),
              y: sparkle.y + (Math.random() * 20 - 10),
            }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: "linear",
            }}
            className="absolute left-1/2 top-1/2 w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-8 md:gap-16 px-4">
        {logos.map((logo, index) => (
          <div key={logo.name} className="flex flex-col items-center gap-4">
            <motion.div
              custom={index}
              animate={controls}
              className={cn(
                "relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl",
                "after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:opacity-50",
                logo.color
              )}
            >
              <div className="relative z-10">{logo.icon}</div>

              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(99,102,241,0.1)] dark:shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]" />
            </motion.div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
              {logo.name}
            </span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes beam {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        .animate-beam {
          animation: beam 3s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default PoweredByLogos;
