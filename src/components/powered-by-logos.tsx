"use client";

import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface TechItem {
  name: string;
  activeColor: string;
}

const PoweredByLogos = () => {
  const controls = useAnimation();

  const technologies: TechItem[] = [
    { name: "CLAUDE", activeColor: "#F59E0B" },
    { name: "GOOGLE BOOKS", activeColor: "#3B82F6" },
    { name: "TMDB", activeColor: "#22C55E" },
    { name: "SUPABASE", activeColor: "#10B981" },
  ];

  const animationSequence = async () => {
    while (true) {
      for (let i = 0; i < technologies.length; i++) {
        await controls.start((custom) =>
          custom === i
            ? {
              color: technologies[i].activeColor,
              opacity: 1,
              scale: 1.05,
              y: -2,
              transition: { duration: 0.5, ease: "circOut" },
            }
            : {
              color: technologies[custom].activeColor,
              opacity: 0.35,
              scale: 1,
              y: 0,
              transition: { duration: 0.8 },
            }
        );
      }
    }
  };

  useEffect(() => {
    animationSequence();
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto py-20 overflow-hidden">
      {/* HUD Background Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)]" />

      {/* Single Line Container */}
      <div className="relative z-10 flex flex-nowrap items-center justify-center gap-x-8 md:gap-x-16 px-4">
        {technologies.map((tech, index) => (
          <motion.div
            key={tech.name}
            custom={index}
            animate={controls}
            className="relative flex flex-col items-center whitespace-nowrap"
          >
            <span
              className={cn(
                "text-base md:text-2xl font-black tracking-[0.3em] uppercase transition-all duration-300",
                "font-mono italic"
              )}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: tech.activeColor,
                textShadow: `0 2px 10px ${tech.activeColor}22`
              }}
            >
              {tech.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PoweredByLogos;
