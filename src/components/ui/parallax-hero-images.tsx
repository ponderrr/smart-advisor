"use client";
import React, { useEffect, useMemo, memo } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

type ImagePosition = {
  src: string;
  position:
  | "top-left"
  | "top-right"
  | "top-center-left"
  | "top-center-right"
  | "mid-left"
  | "mid-right"
  | "center-left"
  | "center-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center-left"
  | "bottom-center-right"
  | "far-left"
  | "far-right";
  depth: number;
  delay: number;
};

const positionStyles: Record<
  ImagePosition["position"],
  { top: string; left?: string; right?: string }
> = {
  "top-left": { top: "8%", left: "4%" },
  "top-right": { top: "8%", right: "4%" },
  "top-center-left": { top: "10%", left: "28%" },
  "top-center-right": { top: "10%", right: "28%" },
  "mid-left": { top: "38%", left: "6%" },
  "mid-right": { top: "38%", right: "6%" },
  "center-left": { top: "48%", left: "24%" },
  "center-right": { top: "48%", right: "24%" },
  "bottom-left": { top: "68%", left: "4%" },
  "bottom-right": { top: "68%", right: "4%" },
  "bottom-center-left": { top: "72%", left: "30%" },
  "bottom-center-right": { top: "72%", right: "30%" },
  "far-left": { top: "52%", left: "2%" },
  "far-right": { top: "52%", right: "2%" },
};

const positionOrder: ImagePosition["position"][] = [
  "top-left",
  "top-right",
  "top-center-left",
  "top-center-right",
  "mid-left",
  "mid-right",
  "center-left",
  "center-right",
  "bottom-left",
  "bottom-right",
  "bottom-center-left",
  "bottom-center-right",
  "far-left",
  "far-right",
];

type DepthVariant = "default" | "edge-focus";

const depthValuesByVariant: Record<DepthVariant, number[]> = {
  default: [0.3, 0.35, 0.5, 0.55, 0.9, 0.85, 0.6, 0.65, 0.4, 0.45, 0.5, 0.45, 0.25, 0.2],
  "edge-focus": [0.85, 0.9, 0.55, 0.6, 0.3, 0.35, 0.45, 0.5, 0.8, 0.85, 0.5, 0.55, 0.4, 0.45],
};

const SPRING_CONFIG = { damping: 25, stiffness: 120 };

export interface ParallaxHeroImagesProps {
  images: string[];
  className?: string;
  imageClassName?: string;
  variant?: DepthVariant;
  isLoading?: boolean;
}

export const ParallaxHeroImages = ({
  images,
  className,
  imageClassName,
  variant = "default",
  isLoading = false,
}: ParallaxHeroImagesProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, SPRING_CONFIG);
  const smoothMouseY = useSpring(mouseY, SPRING_CONFIG);

  const positions = useMemo(() => {
    const limitedImages = images.slice(0, 14);
    const depthValues = depthValuesByVariant[variant];

    return positionOrder.map((position, index) => ({
      src: limitedImages[index] || limitedImages[index % Math.max(1, limitedImages.length)] || "",
      position,
      depth: depthValues[index],
      delay: index * 0.1,
    }));
  }, [images, variant]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {positions.map((pos, index) => (
        <ParallaxImage
          key={`${pos.position}-${index}`}
          src={pos.src}
          position={pos.position}
          depth={pos.depth}
          delay={pos.delay}
          imageClassName={imageClassName}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

interface ParallaxImageProps extends ImagePosition {
  imageClassName?: string;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  isLoading: boolean;
}

const ParallaxImage = memo(function ParallaxImage({
  src,
  position,
  depth,
  delay,
  imageClassName,
  smoothMouseX,
  smoothMouseY,
  isLoading,
}: ParallaxImageProps) {
  const maxOffset = 40;

  const translateX = useTransform(
    smoothMouseX,
    [-1, 1],
    [-maxOffset * depth, maxOffset * depth],
  );

  const translateY = useTransform(
    smoothMouseY,
    [-1, 1],
    [-maxOffset * depth, maxOffset * depth],
  );

  const posStyle = positionStyles[position];

  return (
    <motion.div
      className="absolute"
      style={{
        top: posStyle.top,
        left: posStyle.left,
        right: posStyle.right,
        x: translateX,
        y: translateY,
        zIndex: Math.round(depth * 10),
      }}
      initial={{ opacity: 0, filter: "blur(20px)", scale: 0.9 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {isLoading || !src ? (
        <div
          className={cn(
            "aspect-[2/3] h-28 w-20 rounded-lg bg-slate-200/60 shadow-sm ring-1 ring-black/5 animate-pulse sm:h-44 sm:w-32 md:h-56 md:w-40 dark:bg-slate-700/40 dark:ring-white/10",
            imageClassName,
          )}
        />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            "aspect-[2/3] h-28 w-20 rounded-lg object-cover shadow-sm ring-1 ring-black/10 sm:h-44 sm:w-32 md:h-56 md:w-40 dark:ring-white/10",
            imageClassName,
          )}
        />
      )}
    </motion.div>
  );
});
