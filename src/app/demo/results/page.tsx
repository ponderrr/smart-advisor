"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Film,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
import { LoaderFive } from "@/components/ui/loader";
import {
  deriveMatchScore,
  MATCH_TONE_CLASSES,
} from "@/features/recommendations/utils/match-score";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";

type DemoItem = {
  id: string;
  type: "book" | "movie";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
  reason?: string;
  match_score?: number;
};

type DemoAnswerPayload = {
  id: string;
  title: string;
  type: "single_select" | "select_all" | "fill_in_blank";
  value: string | string[];
};

/* ---------- Loading Animation ---------- */
const DemoLoadingState = () => (
  <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
    <LoaderFive text="Finding your perfect picks..." />
  </div>
);

/* ---------- Demo Result Card ---------- */
const DemoResultCard = ({ item, index }: { item: DemoItem; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const reason = item.reason ?? "";
  const description = item.description ?? "";
  const showDescription = description.length > 0 && description !== reason;
  const { score: matchScore, tone: matchTone } = deriveMatchScore(item);

  useEffect(() => {
    if (expanded || !showDescription) return;
    const el = descRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, showDescription, description]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/65"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
        {/* Image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 sm:aspect-[2/3] dark:bg-slate-800">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, 180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Type badge */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {item.type === "movie" ? <Film size={10} /> : <BookOpen size={10} />}
            {item.type}
          </div>
          {/* Match badge */}
          <div
            className={cn(
              "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm",
              MATCH_TONE_CLASSES[matchTone],
            )}
          >
            {matchScore}% match
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-5">
          <h3 className="text-xl font-black tracking-tight line-clamp-2 sm:text-2xl">
            {item.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {item.subtitle}
          </p>

          {reason && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Why this pick
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {reason}
              </p>
            </div>
          )}

          {showDescription && (
            <div className="mt-3">
              <p
                ref={descRef}
                className="overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                style={
                  expanded
                    ? undefined
                    : {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }
                }
              >
                {description}
              </p>
              {isClamped && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-label={expanded ? "Show less" : "Show more"}
                  aria-expanded={expanded}
                  className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>
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
  const [contentType, setContentType] = useState<"book" | "movie" | "both">(
    "both",
  );
  const [error, setError] = useState<{ kind: "limit" | "generic"; message: string } | null>(
    null,
  );
  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      const raw = sessionStorage.getItem("smart_advisor_demo_answers");
      if (!raw) {
        router.replace("/demo");
        return;
      }

      let parsed: { contentType?: string; answers?: DemoAnswerPayload[] };
      try {
        parsed = JSON.parse(raw);
      } catch {
        router.replace("/demo");
        return;
      }

      const normalizedType: "movie" | "book" | "both" =
        parsed.contentType === "Movies"
          ? "movie"
          : parsed.contentType === "Books"
            ? "book"
            : "both";
      if (active) setContentType(normalizedType);

      const start = Date.now();
      try {
        const response = await fetch("/api/demo-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: normalizedType,
            answers: parsed.answers ?? [],
          }),
          cache: "no-store",
        });

        if (response.status === 429) {
          const data = await response.json().catch(() => ({}));
          if (active) {
            setError({
              kind: "limit",
              message:
                data?.message ??
                "You have used your free demo runs for today. Sign up to keep going.",
            });
            setItems([]);
          }
          return;
        }

        if (!response.ok) {
          if (active) {
            setError({
              kind: "generic",
              message: "We could not generate your demo recommendations. Please try again.",
            });
            setItems([]);
          }
          return;
        }

        const data = await response.json();
        if (active) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setError(null);
        }
      } catch (e) {
        console.error("Failed to load demo results:", e);
        if (active) {
          setError({
            kind: "generic",
            message: "We could not generate your demo recommendations. Please try again.",
          });
          setItems([]);
        }
      } finally {
        const elapsed = Date.now() - start;
        const minDelay = 1400;
        const wait = Math.max(0, minDelay - elapsed);
        window.setTimeout(() => {
          if (active) setLoading(false);
        }, wait);
      }
    };

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [router]);

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
      <AppNavbar />

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          {loading ? (
            <DemoLoadingState />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-2xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65"
            >
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {error.kind === "limit"
                  ? "You hit the demo limit"
                  : "Something went wrong"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
                {error.message}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {error.kind === "limit" ? (
                  <GlowPillButton
                    onClick={() => router.push("/auth")}
                    className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
                  >
                    Sign up to continue
                    <ArrowRight size={16} />
                  </GlowPillButton>
                ) : (
                  <GlowPillButton
                    onClick={() => router.push("/demo")}
                    className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
                  >
                    <RotateCcw size={16} />
                    Try again
                  </GlowPillButton>
                )}
              </div>
            </motion.div>
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
                        <h2 className="text-lg font-bold tracking-tight">
                          Movies
                        </h2>
                      </div>
                      <div className="grid gap-5">
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
                      </div>
                      <div className="grid gap-5">
                        {bookItems.map((item, i) => (
                          <DemoResultCard key={item.id} item={item} index={i} />
                        ))}
                      </div>
                    </motion.section>
                  )}
                </>
              ) : (
                <div className="grid gap-5">
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
