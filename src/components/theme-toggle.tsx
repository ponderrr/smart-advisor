"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleThemeToggle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const config = {
    light: {
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
      icon: <Sun className="h-5 w-5" />,
    },
    dark: {
      bg: "bg-indigo-950",
      iconColor: "text-indigo-400",
      icon: <Moon className="h-5 w-5" />,
    },
    system: {
      // Background fill is a soft blue, icon is a sharp blue
      bg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-500",
      icon: <Monitor className="h-5 w-5" />,
    },
  };

  const current = config[theme as keyof typeof config] || config.system;

  return (
    <button
      onClick={handleThemeToggle}
      className={cn(
        "relative group flex items-center justify-center w-10 h-10 rounded-full",
        "border border-slate-200 dark:border-slate-800",
        "bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-500",
        "hover:border-slate-300 dark:hover:border-slate-700",
      )}
    >
      {/* Liquid Background Fill - Fades and Slides Up */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`bg-${theme}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn("absolute inset-0 z-0", current.bg)}
        />
      </AnimatePresence>

      {/* Icon Fade Up & Materialize */}
      <div className="relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -12, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={current.iconColor}
          >
            {current.icon}
          </motion.div>
        </AnimatePresence>
      </div>

      <span className="sr-only">
        Toggle theme to{" "}
        {theme === "light" ? "dark" : theme === "dark" ? "system" : "light"}
      </span>
    </button>
  );
}
