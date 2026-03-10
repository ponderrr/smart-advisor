"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Film, BookOpen, RotateCcw, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

type DemoItem = {
  id: string;
  type: "book" | "movie";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
};

/* ---------- Loading Animation ---------- */
const LOADING_WORDS = ["Finding", "your", "perfect", "recommendations"];

const DemoLoadingState = () => (
  <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-indigo-300/70 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles size={28} className="text-indigo-500" />
      </motion.div>
    </div>

    <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
      Generating your results
    </h2>

    <div className="mx-auto mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      {LOADING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>

    <div className="relative mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <motion.div
        className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        animate={{ x: ["-120%", "340%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  </div>
);

/* ---------- Demo Result Card ---------- */
const DemoResultCard = ({ item, index }: { item: DemoItem; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const matchScore = Math.max(78, 95 - index * 3);
  const matchLabel =
    matchScore >= 92 ? "Excellent" : matchScore >= 86 ? "Strong" : "Good";

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/65"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
        {/* Image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 sm:aspect-auto sm:min-h-[240px] dark:bg-slate-800">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {item.type === "movie" ? (
              <Film size={10} />
            ) : (
              <BookOpen size={10} />
            )}
            {item.type}
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
            {matchScore}% {matchLabel}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-4 sm:p-5">
          <h3 className="text-lg font-black tracking-tight line-clamp-2 sm:text-xl">
            {item.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {item.subtitle}
          </p>

          {item.description && (
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400",
                !expanded && "line-clamp-3",
              )}
            >
              {item.description}
            </p>
          )}
          {item.description && item.description.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 self-start text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}

          <a
            href={item.infoLink}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
          >
            View details
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </motion.article>
  );
};

/* ---------- Demo Results Page ---------- */
export default function DemoResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DemoItem[]>([]);
  const [query, setQuery] = useState("best fiction books");
  const [contentType, setContentType] = useState<"book" | "movie" | "both">(
    "both",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "How It Works", link: "/#how-it-works" },
    { name: "FAQ", link: "/#faq" },
  ];

  useEffect(() => {
    const raw = sessionStorage.getItem("smart_advisor_demo_answers");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const mappedType =
        parsed.contentType === "Movies"
          ? "movie"
          : parsed.contentType === "Books"
            ? "book"
            : "both";
      setContentType(mappedType);
      setQuery(
        `${parsed.contentType || "media"} ${parsed.mood || ""} ${parsed.pace || ""} recommendations`,
      );
    } catch {
      setQuery("best fiction books");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadMedia = async () => {
      const start = Date.now();
      if (active) setLoading(true);
      try {
        const response = await fetch(
          `/api/demo-media?type=${contentType}&q=${encodeURIComponent(query)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (active) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Failed to load demo results:", error);
      } finally {
        const elapsed = Date.now() - start;
        const minDelay = 1400;
        const wait = Math.max(0, minDelay - elapsed);
        window.setTimeout(() => {
          if (active) setLoading(false);
        }, wait);
      }
    };

    loadMedia();
    return () => {
      active = false;
    };
  }, [query, contentType]);

  const movieItems = items.filter((i) => i.type === "movie");
  const bookItems = items.filter((i) => i.type === "book");

  const contentLabel =
    contentType === "movie"
      ? "Movie"
      : contentType === "book"
        ? "Book"
        : "Movie & Book";

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex min-w-0 flex-1 items-center">
            <NavbarLogo />
          </div>
          <div className="flex shrink-0 justify-center px-6">
            <NavItems items={navItems} className="justify-center px-2" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            <ThemeToggle />
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen}>
            {navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  router.push(item.link);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          {loading ? (
            <DemoLoadingState />
          ) : (
            <>
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                  Results
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">
                  Your {contentLabel} Picks Are Ready
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {items.length} personalized{" "}
                  {items.length === 1 ? "pick" : "picks"} generated from your
                  demo answers.
                </p>
              </motion.div>

              {/* Results */}
              {items.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No results found. Try the demo again for a new set.
                  </p>
                </div>
              ) : contentType === "both" ? (
                <>
                  {movieItems.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                      className="mb-8"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <Film size={18} className="text-violet-500" />
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {movieItems.length}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {movieItems.map((item, i) => (
                          <DemoResultCard key={item.id} item={item} index={i} />
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {bookItems.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mb-8"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-emerald-500" />
                        <h2 className="text-lg font-bold tracking-tight">
                          Books
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {bookItems.length}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {bookItems.map((item, i) => (
                          <DemoResultCard key={item.id} item={item} index={i} />
                        ))}
                      </div>
                    </motion.section>
                  )}
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => (
                    <DemoResultCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-10 rounded-3xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 text-center shadow-sm dark:border-indigo-700/40 dark:from-slate-900 dark:to-slate-900 sm:p-8"
              >
                <Sparkles
                  size={28}
                  className="mx-auto text-indigo-500 dark:text-indigo-400"
                />
                <h3 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
                  Save your picks and get better recommendations
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-300">
                  Create a free account to keep your history, refine results
                  over time, and unlock AI-powered personalized recommendations.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <GlowPillButton
                    onClick={() => router.push("/auth")}
                    className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
                  >
                    Sign up to continue
                    <ArrowRight size={16} />
                  </GlowPillButton>
                  <GlowPillButton
                    onClick={() => router.push("/demo")}
                    className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    <RotateCcw size={16} />
                    Retake Demo
                  </GlowPillButton>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
