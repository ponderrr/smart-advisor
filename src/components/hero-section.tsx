"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { FlipWords } from "@/components/ui/flip-words";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { useEffect, useMemo, useState } from "react";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "fallback";
    movies: "ok" | "fallback";
  };
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1489599735734-79b4eece7e5f?auto=format&fit=crop&w=900&q=80",
];

const shuffle = <T,>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const HeroSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [heroImages, setHeroImages] = useState<string[]>(FALLBACK_IMAGES);

  const words = useMemo(
    () => ["Movie", "Book", "Story", "Adventure", "Classic"],
    [],
  );

  useEffect(() => {
    let active = true;

    const loadHeroMedia = async () => {
      try {
        setIsLoadingImages(true);

        const response = await fetch("/api/hero-media", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load hero media: ${response.status}`);
        }

        const data: HeroMediaResponse = await response.json();
        const mixed = shuffle([...(data.books || []), ...(data.movies || [])]);

        if (active && mixed.length > 0) {
          setHeroImages(mixed.slice(0, 8));
        }
      } catch (error) {
        console.error("Hero media fetch failed:", error);
        if (active) {
          setHeroImages(FALLBACK_IMAGES);
        }
      } finally {
        if (active) {
          setIsLoadingImages(false);
        }
      }
    };

    loadHeroMedia();

    return () => {
      active = false;
    };
  }, []);

  const handleGetStarted = () =>
    user ? router.push("/content-selection") : router.push("/auth");

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <ParallaxHeroImages images={heroImages} isLoading={isLoadingImages} />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-slate-50"
        >
          Discover Your Next Favorite
          <br />
          <FlipWords words={words} className="text-indigo-600 dark:text-indigo-400" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xl text-xl text-slate-700 dark:text-slate-300"
        >
          AI-powered recommendations for movies and books tailored to your unique
          taste.
        </motion.p>

        <div className="mt-6">
          <HoverBorderGradient
            onClick={handleGetStarted}
            containerClassName="rounded-full shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)]"
            as="button"
            className="dark:bg-black bg-white text-black dark:text-white px-14 py-6 text-2xl font-black tracking-tighter"
          >
            <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Get Started
            </motion.span>
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
