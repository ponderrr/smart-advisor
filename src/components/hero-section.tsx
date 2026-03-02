"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  onMovieClick?: () => void;
  onBookClick?: () => void;
  userLoggedIn?: boolean;
}

export function HeroSection({
  onMovieClick,
  onBookClick,
  userLoggedIn = false,
}: HeroSectionProps) {
  const router = useRouter();

  const handleMovieClick = () => {
    onMovieClick?.();
    router.push("/questionnaire?type=movie");
  };

  const handleBookClick = () => {
    onBookClick?.();
    router.push("/questionnaire?type=book");
  };

  const movieImages = [
    "https://images.unsplash.com/photo-1489599849228-13632ca16442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507842298343-583f20981122?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  ];

  const bookImages = [
    "https://images.unsplash.com/photo-1495446815901-a7297e01a5ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507842298343-583f20981122?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const imageColumnVariants = {
    hidden: { opacity: 0, x: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
    float: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <section
      className={cn(
        "relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
      )}
    >
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]">
        <svg className="w-full h-full">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              seed="2"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" opacity="0.5" />
        </svg>
      </div>

      {/* Gradient orbs for depth */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      <div className="relative z-10 w-full">
        <motion.div
          className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 px-4 md:px-6 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left side - Movie Images */}
          <motion.div
            className="hidden lg:flex flex-col gap-6 w-full max-w-xs"
            variants={imageColumnVariants}
            initial="hidden"
            animate="visible"
          >
            {movieImages.map((image, index) => (
              <motion.div
                key={index}
                className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50"
                variants={imageVariants}
                animate={["visible", "float"]}
                transition={{
                  initial: { duration: 0.6 },
                  float: {
                    duration: 6,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  },
                }}
              >
                <img
                  src={image}
                  alt={`Movie ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              </motion.div>
            ))}
          </motion.div>

          {/* Center - Main Content */}
          <motion.div
            className="flex-1 flex flex-col items-center justify-center text-center"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-4"
            >
              <span className="bg-gradient-to-r from-white via-slate-100 to-white dark:from-white dark:via-slate-200 dark:to-white light:from-slate-900 light:via-slate-800 light:to-slate-900 bg-clip-text text-transparent">
                Discover Your Next
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 light:from-blue-600 light:via-purple-600 light:to-cyan-600 bg-clip-text text-transparent">
                Favorite Story
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-slate-400 dark:text-slate-300 light:text-slate-600 max-w-2xl mb-10"
            >
              Smart Advisor uses advanced AI to understand your taste and
              recommend the perfect movie or book just for you. Answer a quick
              survey and get personalized picks.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <motion.button
                onClick={handleMovieClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 overflow-hidden min-w-fit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  🎬 Start Movie Survey
                </span>
              </motion.button>

              <motion.button
                onClick={handleBookClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/50 overflow-hidden min-w-fit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  📚 Start Book Survey
                </span>
              </motion.button>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm text-slate-500 dark:text-slate-400 light:text-slate-600 mt-8"
            >
              Takes about 2 minutes • No account needed
            </motion.p>
          </motion.div>

          {/* Right side - Book Images */}
          <motion.div
            className="hidden lg:flex flex-col gap-6 w-full max-w-xs"
            variants={imageColumnVariants}
            initial="hidden"
            animate="visible"
          >
            {bookImages.map((image, index) => (
              <motion.div
                key={index}
                className="relative h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50"
                variants={imageVariants}
                animate={["visible", "float"]}
                transition={{
                  initial: { duration: 0.6 },
                  float: {
                    duration: 6,
                    repeat: Infinity,
                    delay: (2 - index) * 0.2,
                    ease: "easeInOut",
                  },
                }}
              >
                <img
                  src={image}
                  alt={`Book ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 light:text-slate-600">
            Scroll to explore
          </p>
          <svg
            className="w-5 h-5 text-slate-400 dark:text-slate-500 light:text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
