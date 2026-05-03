"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Film,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { PillButton } from "@/components/ui/pill-button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { LoaderFive } from "@/components/ui/loader";
import { SectionHeader } from "@/components/section-header";
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
const DemoLoadingState = () => {
  const t = useTranslations("Demo.results");
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
      <LoaderFive text={t("loadingText")} />
    </div>
  );
};

/* ---------- Demo Result Card ---------- */
const DemoResultCard = ({ item, index }: { item: DemoItem; index: number }) => {
  const t = useTranslations("Demo.results");
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
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/65"
    >
      <div className="grid grid-cols-[112px_1fr] sm:grid-cols-[140px_1fr] md:grid-cols-[168px_1fr]">
        {/* Image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 112px, (max-width: 768px) 140px, 168px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Type badge */}
          <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[10px]">
            {item.type === "movie" ? <Film size={9} /> : <BookOpen size={9} />}
            {item.type}
          </div>
          {/* Match badge */}
          <div
            className={cn(
              "absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]",
              MATCH_TONE_CLASSES[matchTone],
            )}
          >
            {matchScore}%<span className="hidden sm:inline">{t("matchSuffix")}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-3 sm:p-5 md:p-6">
          <h3 className="line-clamp-2 text-base font-black tracking-tight sm:text-xl md:text-2xl">
            {item.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500 sm:mt-1 sm:line-clamp-none sm:text-sm dark:text-slate-400">
            {item.subtitle}
          </p>

          {reason && (
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-4 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500"
              />
              <div className="flex items-center gap-2 pl-2">
                <Sparkles
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                  {t("whyThisPick")}
                </p>
              </div>
              <p className="mt-2 pl-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                {reason}
              </p>
            </div>
          )}

          {showDescription && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {t("about")}
              </p>
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
                  aria-label={expanded ? t("showLess") : t("showMore")}
                  aria-expanded={expanded}
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  {expanded ? t("showLess") : t("showMore")}
                  <ChevronDown
                    size={12}
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
            className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
          >
            {t("viewDetails")}
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
  const t = useTranslations("Demo.results");
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
                data?.message ?? t("errors.limitFallback"),
            });
            setItems([]);
          }
          return;
        }

        if (!response.ok) {
          if (active) {
            setError({
              kind: "generic",
              message: t("errors.genericFallback"),
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
            message: t("errors.genericFallback"),
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
  }, [router, t]);

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
                  ? t("errors.limitTitle")
                  : t("errors.genericTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
                {error.message}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {error.kind === "limit" ? (
                  <PillButton
                    onClick={() => router.push("/auth")}
                    className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
                  >
                    {t("errors.signUp")}
                    <ArrowRight size={16} />
                  </PillButton>
                ) : (
                  <PillButton
                    onClick={() => router.push("/demo")}
                    className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
                  >
                    <RotateCcw size={16} />
                    {t("errors.tryAgain")}
                  </PillButton>
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
                  {t("eyebrow")}
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                  {t("headline")}
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t("subhead", { count: items.length })}
                </p>
              </motion.div>

              {/* Results */}
              {items.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t("empty")}
                  </p>
                </div>
              ) : contentType === "both" ? (
                <>
                  {movieItems.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                      className="mb-10"
                    >
                      <SectionHeader
                        icon={<Film size={14} />}
                        eyebrow={t("sections.movie.eyebrow")}
                        title={t("sections.movie.title")}
                        count={movieItems.length}
                        accent="violet"
                      />
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
                      className="mb-10"
                    >
                      <SectionHeader
                        icon={<BookOpen size={14} />}
                        eyebrow={t("sections.book.eyebrow")}
                        title={t("sections.book.title")}
                        count={bookItems.length}
                        accent="emerald"
                      />
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
                className="relative mt-12 overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 text-center shadow-sm sm:p-10 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/20"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/20"
                />
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                    <Sparkles size={22} />
                  </span>
                  <h3 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    {t("cta.title")}
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-300">
                    {t("cta.body")}
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <HoverBorderGradient
                      onClick={() => router.push("/auth")}
                      idleColor="17, 24, 39"
                      darkIdleColor="255, 255, 255"
                      highlightColor="99, 102, 241"
                      darkHighlightColor="129, 140, 248"
                      containerClassName="rounded-full w-full sm:w-auto"
                      className="flex w-full items-center justify-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black sm:w-auto dark:bg-black dark:text-white"
                    >
                      {t("cta.signUp")}
                      <ArrowRight size={16} />
                    </HoverBorderGradient>
                    <PillButton
                      onClick={() => router.push("/demo")}
                      className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      <RotateCcw size={16} />
                      {t("cta.retake")}
                    </PillButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
