"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface MarqueeRowProps {
  images: string[];
  reverse?: boolean;
  duration: number;
  className?: string;
}

const fadeMask =
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";

const MarqueeRow = ({
  images,
  reverse = false,
  duration,
  className,
}: MarqueeRowProps) => {
  if (images.length === 0) return null;
  const loop = [...images, ...images];

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
    >
      <motion.div
        className="flex w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {loop.map((src, i) => (
          <div key={`${src}-${i}`} className="shrink-0 pr-3 sm:pr-4">
            <div className="relative aspect-[2/3] h-28 overflow-hidden rounded-lg opacity-70 ring-1 ring-black/10 sm:h-36 md:h-44 dark:opacity-55 dark:ring-white/10">
              <img
                src={src}
                alt=""
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export interface MarqueeHeroImagesProps {
  images: string[];
  className?: string;
}

export const MarqueeHeroImages = ({
  images,
  className,
}: MarqueeHeroImagesProps) => {
  const [snapshot, setSnapshot] = useState<string[]>([]);

  useEffect(() => {
    if (snapshot.length === 0 && images.length > 0) {
      setSnapshot(images);
    }
  }, [images, snapshot.length]);

  if (snapshot.length === 0) return null;

  const half = Math.max(3, Math.ceil(snapshot.length / 2));
  const topRow = snapshot.slice(0, half);
  const remainder = snapshot.slice(half);
  const bottomRow =
    remainder.length >= 3 ? remainder : [...topRow].reverse();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <MarqueeRow
        images={topRow}
        duration={28}
        className="absolute inset-x-0 top-14 sm:top-16"
      />
      <MarqueeRow
        images={bottomRow}
        reverse
        duration={36}
        className="absolute inset-x-0 bottom-20 sm:bottom-32"
      />
    </div>
  );
};
