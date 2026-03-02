"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { FlipWords } from "@/components/ui/flip-words";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const router = useRouter();
  const { user } = useAuth();

  const words = ["Movie", "Book", "Story", "Adventure", "Classic"];
  const heroImages = [
    "https://images.unsplash.com/photo-1489599849228-13632ca16442?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e01a5ad?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507842298343-583f20981122?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80",
  ];

  const handleGetStarted = () => {
    user ? router.push("/content-selection") : router.push("/auth");
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      <ParallaxHeroImages images={heroImages} />

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
          AI-powered recommendations for movies and books tailored to your unique taste.
        </motion.p>

        {/* THE BIG CTA BUTTON - WITHOUT ARROW */}
        <div className="mt-6">
          <HoverBorderGradient
            onClick={handleGetStarted}
            containerClassName="rounded-full shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)]"
            as="button"
            className={cn(
              "dark:bg-black bg-white text-black dark:text-white",
              "px-14 py-6 text-2xl font-black tracking-tighter" // Slightly wider padding (px-14) since arrow is gone
            )}
          >
            <motion.span
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.span>
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
