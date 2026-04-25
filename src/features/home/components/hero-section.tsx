"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { motion } from "motion/react";
import { IconChevronsDown } from "@tabler/icons-react";
import { FlipWords } from "@/components/ui/flip-words";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { PillButton } from "@/components/ui/pill-button";
import { useEffect, useMemo, useRef, useState } from "react";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "error";
    movies: "ok" | "error";
  };
};

const shuffle = <T,>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const uniqueUrls = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean)));

const pickFrame = (pool: string[], current: string[], size: number) => {
  const shuffled = shuffle(pool);
  const fresh = shuffled.filter((item) => !current.includes(item));
  const blended = [...fresh, ...shuffled];
  return uniqueUrls(blended).slice(0, size);
};

const HeroSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [mediaPool, setMediaPool] = useState<string[]>([]);
  const recentRef = useRef<string[]>([]);

  const words = useMemo(
    () => [
      "Movie",
      "Book",
      "Story",
      "Adventure",
      "Classic",
      "Masterpiece",
      "Cult Favorite",
    ],
    [],
  );

  useEffect(() => {
    let active = true;

    const loadHeroMedia = async () => {
      try {
        const response = await fetch("/api/hero-media", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load hero media: ${response.status}`);
        }

        const data: HeroMediaResponse = await response.json();
        const mixed = uniqueUrls(
          shuffle([...(data.books || []), ...(data.movies || [])]),
        );

        if (active && mixed.length > 0) {
          const unseen = mixed.filter(
            (item) => !recentRef.current.includes(item),
          );
          const prioritized = unseen.length > 0 ? [...unseen, ...mixed] : mixed;
          const nextImages = uniqueUrls(prioritized).slice(0, 14);
          await Promise.allSettled(
            nextImages.map(
              (src) =>
                new Promise<void>((resolve) => {
                  const img = new Image();
                  img.src = src;
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
            ),
          );
          if (active) {
            recentRef.current = uniqueUrls([
              ...recentRef.current,
              ...nextImages,
            ]).slice(-120);
            setMediaPool((prev) =>
              uniqueUrls([...prev, ...mixed]).slice(0, 60),
            );
            setHeroImages(nextImages);
          }
        }
      } catch (error) {
        console.error("Hero media fetch failed:", error);
      }
    };

    loadHeroMedia();
    const refreshTimer = setInterval(loadHeroMedia, 75000);

    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (mediaPool.length < 2) return;
    const timer = setInterval(async () => {
      const nextImages = pickFrame(mediaPool, heroImages, 14);
      if (nextImages.length === 0) return;
      await Promise.allSettled(
        nextImages.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
        ),
      );
      recentRef.current = uniqueUrls([
        ...recentRef.current,
        ...nextImages,
      ]).slice(-120);
      setHeroImages(nextImages);
    }, 9000);

    return () => clearInterval(timer);
  }, [mediaPool, heroImages]);

  const handlePrimaryCta = () =>
    user ? router.push("/dashboard") : router.push("/auth");
  const handleSecondaryCta = () =>
    user ? router.push("/history") : router.push("/demo");

  return (
    <section className="relative flex min-h-screen min-h-[100svh] w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-24 transition-colors duration-300 sm:px-6 sm:py-28 dark:bg-slate-950">
      <ParallaxHeroImages
        images={heroImages}
        className="hidden lg:block"
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 text-center sm:gap-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[1.75rem] font-black leading-[1.05] tracking-tighter text-slate-900 sm:text-5xl sm:tracking-tight md:text-6xl lg:text-7xl dark:text-slate-50"
        >
          <span className="block">Discover Your Next Favorite</span>
          <span className="block">Obsession Across Every</span>
          <span className="flex justify-center">
            <FlipWords
              words={words}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md text-base text-slate-700 sm:max-w-xl sm:text-xl dark:text-slate-300"
        >
          AI-powered recommendations for movies and books tailored to your
          unique taste.
        </motion.p>

        <div className="mt-2 flex w-full flex-col items-center gap-3 sm:mt-6">
          <HoverBorderGradient
            onClick={handlePrimaryCta}
            idleColor="17, 24, 39"
            darkIdleColor="255, 255, 255"
            highlightColor="139, 92, 246"
            darkHighlightColor="167, 139, 250"
            containerClassName="rounded-full"
            as="button"
            className="bg-white px-10 py-4 text-lg font-black tracking-tighter text-black sm:px-14 sm:py-6 sm:text-2xl dark:bg-black dark:text-white"
          >
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {user ? "Go to Dashboard" : "Get Started"}
            </motion.span>
          </HoverBorderGradient>
          <PillButton
            onClick={handleSecondaryCta}
            className="border-slate-300/80 bg-white/70 px-6 py-2.5 text-sm font-bold tracking-wide text-slate-700 sm:px-7 sm:py-3 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {user ? "View History" : "Try a Demo"}
          </PillButton>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute inset-x-0 bottom-6 z-20 hidden justify-center sm:bottom-8 sm:flex"
      >
        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="text-xs uppercase tracking-[0.2em]">
            Scroll to Explore
          </span>
          <motion.div
            animate={{ y: [0, 6, 0], opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
          >
            <IconChevronsDown className="h-5 w-5" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
