"use client";

import React, { useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface TechItem {
  name: string;
  glowColor: string;
}

const PoweredByLogos = () => {
  const controls = useAnimation();

  const technologies: TechItem[] = [
    {
      name: "CLAUDE",
      glowColor: "rgba(245, 158, 11, 0.5)", // Amber
    },
    {
      name: "GOOGLE BOOKS",
      glowColor: "rgba(59, 130, 246, 0.5)", // Blue
    },
    {
      name: "TMDB",
      glowColor: "rgba(34, 197, 94, 0.5)", // Green
    },
    {
      name: "SUPABASE",
      glowColor: "rgba(16, 185, 129, 0.5)", // Emerald
    },
  ];

  const animationSequence = async () => {
    while (true) {
      for (let i = 0; i < technologies.length; i++) {
        await controls.start((custom) =>
          custom === i
            ? {
              opacity: [0.4, 1, 0.4],
              filter: [
                "drop-shadow(0 0 0px transparent)",
                `drop-shadow(0 0 8px ${technologies[i].glowColor})`,
                "drop-shadow(0 0 0px transparent)",
              ],
              transition: { duration: 0.8, ease: "easeInOut" },
            }
            : {}
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  useEffect(() => {
    animationSequence();
  }, []);

  const sparkles = useMemo(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 2 + 1,
      delay: Math.random() * 5,
    })), []);

  return (
    <div className="relative w-full max-w-5xl mx-auto py-24 overflow-hidden transition-colors duration-300">
      {/* Background Grid for futuristic feel */}
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Scanning Beam */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-[1px] bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-scan" />
      </div>

      {/* Data Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 0, x: `${sparkle.x}%`, y: `${sparkle.y}%` }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
            }}
            className="absolute left-1/2 top-1/2 w-[1px] h-[1px] bg-white rounded-full"
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 px-6">
        {technologies.map((tech, index) => (
          <motion.div
            key={tech.name}
            custom={index}
            animate={controls}
            className="relative"
          >
            <span
              className={cn(
                "text-lg md:text-2xl font-black tracking-[0.2em] transition-colors duration-300",
                "text-slate-400/40 dark:text-slate-600/40", // Dimmed state
                "font-mono" // Use monospace for the 'tech' look
              )}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            >
              {tech.name}
            </span>
          </motion.div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0vh); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(20vh); opacity: 0; }
        }
        .animate-scan {
          animation: scan 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PoweredByLogos;
