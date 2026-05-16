"use client";
import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Detect album covers vs movie/book posters by hostname so each tile can
 *  render at its natural aspect ratio. Deezer's cover CDN shards over
 *  *.dzcdn.net; anything else (TMDB, OpenLibrary) is a 2:3 portrait. */
const isSquareCoverUrl = (url: string | null | undefined) =>
  typeof url === "string" && url.includes("dzcdn.net");

interface MarqueeRowProps {
  images: string[];
  reverse?: boolean;
  duration: number;
  className?: string;
}

const fadeMask =
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";

interface MarqueeTileProps {
  src: string;
  delay: number;
}

const MarqueeTile = memo(function MarqueeTile({
  src,
  delay,
}: MarqueeTileProps) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!src || src === displaySrc || src === incomingSrc) return;
    const loader = new Image();
    loader.src = src;
    loader.onload = () => setIncomingSrc(src);
    loader.onerror = () => setIncomingSrc(src);
  }, [src, displaySrc, incomingSrc]);

  // Drive the tile's aspect off the CURRENTLY VISIBLE image, not the
  // incoming src, so the container doesn't reshape under a stale image
  // during the crossfade. `layout` lets the dimension change tween
  // smoothly once the swap commits — the marquee row absorbs the resize
  // naturally because every tile is `shrink-0`.
  const aspectSrc = displaySrc ?? src;
  return (
    <motion.div
      layout
      className="shrink-0 pr-3 sm:pr-4"
      initial={mounted ? false : { opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
        layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
        className={cn(
          "relative h-28 overflow-hidden rounded-lg opacity-70 ring-1 ring-black/10 sm:h-36 md:h-44 dark:opacity-55 dark:ring-white/10",
          // Album covers (Deezer) are square; TMDB posters and OpenLibrary
          // book covers are 2:3 portrait. Detect by hostname so each tile
          // renders at its natural aspect — no center-cropping titles off
          // movie posters or letterboxing albums.
          isSquareCoverUrl(aspectSrc) ? "aspect-square" : "aspect-[2/3]",
        )}
      >
        {!!displaySrc && (
          <img
            src={displaySrc}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {incomingSrc && (
          <motion.img
            src={incomingSrc}
            alt=""
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            onAnimationComplete={() => {
              setDisplaySrc(incomingSrc);
              setIncomingSrc(null);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </motion.div>
    </motion.div>
  );
});

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
          <MarqueeTile
            key={i}
            src={src}
            delay={(i % images.length) * 0.06}
          />
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
  if (images.length === 0) return null;

  const half = Math.max(3, Math.ceil(images.length / 2));
  const topRow = images.slice(0, half);
  const remainder = images.slice(half);
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
