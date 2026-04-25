"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  RefreshCw,
  Heart,
  Sparkles,
  Star,
  BookOpen,
  Film,
  ArrowRight,
  Share2,
  RotateCcw,
  Copy,
  Mail,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { enhancedRecommendationsService } from "@/features/recommendations/services/enhanced-recommendations-service";
import { databaseService } from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import {
  deriveMatchScore,
  MATCH_TONE_CLASSES,
} from "@/features/recommendations/utils/match-score";
import { SafeLocalStorage } from "@/utils/localStorage";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { PillButton } from "@/components/ui/pill-button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { SectionHeader } from "@/components/section-header";
import { LogToLibraryButton } from "@/features/library/components/log-to-library-button";
import { libraryService } from "@/features/library/services/library-service";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const safeStringify = (obj: unknown): string => {
  const seen = new WeakSet();

  try {
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }
      if (typeof value === "function") return "[Function]";
      if (typeof value === "symbol") return "[Symbol]";
      if (value === undefined) return "[Undefined]";
      return value;
    });
  } catch {
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

const GENERATED_SESSIONS_KEY = "smart_advisor_generated_sessions";

const getGeneratedSessions = (): Set<string> => {
  const stored = SafeLocalStorage.getJSON<string[]>(GENERATED_SESSIONS_KEY, []);
  return new Set(stored);
};

const saveGeneratedSession = (sessionId: string) => {
  const sessions = getGeneratedSessions();
  sessions.add(sessionId);

  const sessionsArray = Array.from(sessions);
  const sessionsToStore =
    sessionsArray.length > 10 ? sessionsArray.slice(-10) : sessionsArray;

  SafeLocalStorage.setJSON(GENERATED_SESSIONS_KEY, sessionsToStore);
};

/* ---------- Loading Animation ---------- */
const LOADING_MESSAGES = [
  "Flipping through your answers...",
  "Consulting the algorithm...",
  "Cross-referencing great taste...",
  "Digging through movie shelves...",
  "Searching the library stacks...",
  "Hunting for hidden gems...",
  "Matching moods and genres...",
  "Dusting off forgotten classics...",
  "Checking against your history...",
  "Weighing the shortlist...",
  "Narrowing down the picks...",
  "Running it by our AI once more...",
  "Polishing each recommendation...",
  "Adding the finishing touches...",
] as const;

const ResultsLoadingState = ({ step: _step }: { step: string }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
      <div
        className="mb-6 flex items-center justify-center gap-2"
        aria-hidden
      >
        <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-indigo-500" />
      </div>

      <div
        className="flex min-h-[1.75rem] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-base font-semibold text-slate-700 dark:text-slate-200"
          >
            {LOADING_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ---------- Recommendation Card ---------- */
const RecommendationCard = ({
  rec,
  index,
  alreadyLogged,
  onToggleFavorite,
}: {
  rec: Recommendation;
  index: number;
  alreadyLogged: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const explanation = rec.explanation ?? "";
  const description = rec.description ?? "";
  const showDescription = description.length > 0 && description !== explanation;
  const { score: matchScore, tone: matchTone } = deriveMatchScore(rec);

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
      transition={{ duration: 0.32, delay: index * 0.06 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/65"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[168px_1fr]">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
          {rec.poster_url ? (
            <Image
              src={rec.poster_url}
              alt={rec.title}
              fill
              sizes="(max-width: 640px) 100vw, 168px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              {rec.type === "movie" ? (
                <Film size={32} />
              ) : (
                <BookOpen size={32} />
              )}
            </div>
          )}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {rec.type === "movie" ? <Film size={10} /> : <BookOpen size={10} />}
            {rec.type}
          </div>
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
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                {rec.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {rec.author
                  ? `By ${rec.author}`
                  : rec.director
                    ? `Directed by ${rec.director}`
                    : ""}
                {rec.year ? ` · ${rec.year}` : ""}
              </p>
            </div>
            {/* Action group — favorite + log together */}
            <div className="flex shrink-0 items-center gap-2">
              <LogToLibraryButton
                medium={rec.type}
                title={rec.title}
                creator={rec.author ?? rec.director ?? null}
                year={rec.year ?? null}
                poster_url={rec.poster_url ?? null}
                source_recommendation_id={rec.id}
                initialLogged={alreadyLogged}
              />
              <button
                type="button"
                onClick={() => onToggleFavorite(rec.id)}
                aria-label={
                  rec.is_favorited
                    ? `Remove ${rec.title} from favorites`
                    : `Add ${rec.title} to favorites`
                }
                className={cn(
                  "rounded-full p-2 transition-all active:scale-[0.95]",
                  rec.is_favorited
                    ? "bg-rose-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                )}
              >
                <Heart
                  size={16}
                  fill={rec.is_favorited ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>

          {/* Metadata row — rating + genres only, log button is now up top */}
          {(typeof rec.rating === "number" || rec.genres?.length) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {typeof rec.rating === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Star size={12} className="fill-current" />
                  {rec.rating}
                </span>
              )}
              {rec.genres?.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* "Why this pick" — promoted: gradient accent border, larger leading,
              sparkles glyph to flag it as the AI's voice. */}
          {explanation && (
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
                  Why this pick
                </p>
              </div>
              <p className="mt-2 pl-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                {explanation}
              </p>
            </div>
          )}

          {showDescription && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                About
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
                  aria-label={expanded ? "Show less" : "Show more"}
                  aria-expanded={expanded}
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  {expanded ? "Show less" : "Show more"}
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
        </div>
      </div>
    </motion.article>
  );
};

/* ---------- Main Results Page ---------- */
const ResultsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const { contentType, answers, reset } = useQuizStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loggedTitleKeys, setLoggedTitleKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>(
    "Analyzing your answers...",
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const currentSessionRef = useRef<string | null>(null);
  const generatedRecommendationsRef = useRef<Recommendation[]>([]);
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate a unique session ID per quiz run using a stable ref
  const sessionTimestampRef = useRef<number>(Date.now());
  const sessionId = (() => {
    if (!answers || !contentType) return null;
    try {
      const serializedAnswers = safeStringify(answers);
      const userId = user?.id || "anonymous";
      return `${serializedAnswers}-${contentType}-${userId}-${sessionTimestampRef.current}`;
    } catch {
      return `fallback-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  })();

  const handleGenerateRecommendations = useCallback(async () => {
    if (!sessionId || !user) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      if (abortController.signal.aborted) return;

      setGenerationStep("Analyzing your answers...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (abortController.signal.aborted) return;

      setGenerationStep("Generating personalized recommendations...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (abortController.signal.aborted) return;

      setGenerationStep("Enhancing with movie and book data...");

      const questionnaireData = {
        answers,
        contentType: contentType ?? ("both" as const),
        userAge: user.age,
        userName: user.name,
      };

      const recs = await enhancedRecommendationsService.retryRecommendation(
        questionnaireData,
        user.id,
      );

      if (abortController.signal.aborted) return;

      setGenerationStep("Finalizing your recommendations...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (abortController.signal.aborted) return;

      generatedRecommendationsRef.current = recs;
      currentSessionRef.current = sessionId;
      saveGeneratedSession(sessionId);
      setRecommendations(recs);
    } catch (err) {
      if (abortController.signal.aborted) return;
      console.error("Error generating recommendations:", err);
      setError(
        "Failed to generate personalized recommendations. Please try again.",
      );
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [sessionId, user, answers, contentType]);

  const wasSessionGenerated = useCallback((id: string): boolean => {
    const generatedSessions = getGeneratedSessions();
    return generatedSessions.has(id);
  }, []);

  const handleConfirmGeneration = () => {
    setShowConfirmDialog(false);
    handleGenerateRecommendations();
  };

  const handleCancelGeneration = () => {
    setShowConfirmDialog(false);
    router.push("/history");
  };

  useEffect(() => {
    if (!contentType || !answers?.length || !user || !sessionId) {
      router.push("/content-selection");
      return;
    }

    const isSameSession = currentSessionRef.current === sessionId;
    const hasExistingRecommendations =
      generatedRecommendationsRef.current.length > 0;

    if (isSameSession && hasExistingRecommendations) {
      setRecommendations(generatedRecommendationsRef.current);
      setLoading(false);
      return;
    }

    const sessionWasGenerated = wasSessionGenerated(sessionId);

    if (sessionWasGenerated && isInitialLoadRef.current) {
      setShowConfirmDialog(true);
      setLoading(false);
      isInitialLoadRef.current = false;
      return;
    }

    if (!sessionWasGenerated) {
      handleGenerateRecommendations();
    } else {
      setLoading(false);
    }

    isInitialLoadRef.current = false;
  }, [
    contentType,
    answers,
    user,
    sessionId,
    router,
    wasSessionGenerated,
    handleGenerateRecommendations,
  ]);

  useEffect(() => {
    if (!ready) return;
    void libraryService.list().then(({ data }) => {
      setLoggedTitleKeys(
        new Set(data.map((i) => `${i.medium}::${i.title.toLowerCase()}`)),
      );
    });
  }, [ready]);

  const isAlreadyLogged = useCallback(
    (rec: Recommendation): boolean =>
      loggedTitleKeys.has(`${rec.type}::${rec.title.toLowerCase()}`),
    [loggedTitleKeys],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recommendations.length > 0 && !error) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved recommendations. Are you sure you want to leave?";
        return "You have unsaved recommendations. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [recommendations.length, error]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      currentSessionRef.current = null;
      generatedRecommendationsRef.current = [];
      isInitialLoadRef.current = true;
    };
  }, []);

  const handleGetAnother = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentSessionRef.current = null;
    generatedRecommendationsRef.current = [];
    isInitialLoadRef.current = true;
    reset();
    router.push("/content-selection");
  };

  const handleToggleFavorite = async (recommendationId: string) => {
    try {
      if (!recommendationId) return;

      const { error: toggleError } =
        await databaseService.toggleFavorite(recommendationId);
      if (toggleError) {
        toast.error("Couldn't update your favorite — please try again");
      } else {
        const rec = recommendations.find((r) => r.id === recommendationId);
        toast.success(
          rec?.is_favorited ? "Removed from favorites" : "Added to favorites",
        );
        const updatedRecs = recommendations.map((r) =>
          r.id === recommendationId
            ? { ...r, is_favorited: !r.is_favorited }
            : r,
        );
        setRecommendations(updatedRecs);
        generatedRecommendationsRef.current = updatedRecs;
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleRetry = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentSessionRef.current = null;
    generatedRecommendationsRef.current = [];
    isInitialLoadRef.current = true;
    handleGenerateRecommendations();
  };

  const [showShareMenu, setShowShareMenu] = useState(false);

  const buildShareText = () => {
    const mRecs = recommendations.filter((r) => r.type === "movie");
    const bRecs = recommendations.filter((r) => r.type === "book");
    const lines: string[] = ["My Smart Advisor Picks", ""];

    if (mRecs.length > 0) {
      lines.push("Movies:");
      mRecs.forEach((r) => {
        const detail = [r.director && `dir. ${r.director}`, r.year].filter(Boolean).join(", ");
        lines.push(`  ${r.title}${detail ? ` (${detail})` : ""}`);
        if (r.genres?.length) lines.push(`  Genres: ${r.genres.join(", ")}`);
      });
      lines.push("");
    }

    if (bRecs.length > 0) {
      lines.push("Books:");
      bRecs.forEach((r) => {
        const detail = [r.author && `by ${r.author}`, r.year].filter(Boolean).join(", ");
        lines.push(`  ${r.title}${detail ? ` (${detail})` : ""}`);
        if (r.genres?.length) lines.push(`  Genres: ${r.genres.join(", ")}`);
      });
      lines.push("");
    }

    lines.push("Get your own picks at smartadvisor.app");
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Smart Advisor Picks", text });
        return;
      } catch {
        // User cancelled — fall through to share menu
      }
    }

    setShowShareMenu((prev) => !prev);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Couldn't copy — try again");
    }
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const titles = recommendations.map((r) => r.title).join(", ");
    const text = encodeURIComponent(
      `Just got my Smart Advisor picks: ${titles}\n\nGet your own at smartadvisor.app`,
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("My Smart Advisor Picks");
    const body = encodeURIComponent(buildShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareMenu(false);
  };

  if (!ready) {
    return <PageLoader text="Loading..." />;
  }

  if (!contentType || !answers?.length || !user) {
    // Missing quiz state — redirect to start a new quiz
    router.replace("/content-selection");
    return <PageLoader text="Loading..." />;
  }

  const topBar = <AppNavbar />;

  if (showConfirmDialog) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <RefreshCw
                size={24}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Generate new recommendations?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You already generated recommendations for these answers. Generate
              new ones or view your history.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <PillButton
                onClick={handleCancelGeneration}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Go to History
              </PillButton>
              <PillButton
                onClick={handleConfirmGeneration}
                className="bg-white px-5 py-2.5 text-sm font-black text-black dark:bg-slate-900 dark:text-white"
              >
                Generate New
              </PillButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
          <ResultsLoadingState step={generationStep} />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden">
              <video
                src="/animations/error-animation.webm"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Unable to generate recommendations
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <PillButton
                onClick={handleRetry}
                className="bg-white px-5 py-2.5 text-sm font-black text-black dark:bg-slate-900 dark:text-white"
              >
                Try Again
              </PillButton>
              <PillButton
                onClick={() => router.push("/content-selection")}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Retake Quiz
              </PillButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const movieRecs = recommendations.filter((r) => r.type === "movie");
  const bookRecs = recommendations.filter((r) => r.type === "book");

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {topBar}

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Your picks
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              Hand-picked for you
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {recommendations.length} personalized{" "}
              {recommendations.length === 1 ? "pick" : "picks"} from the AI,
              with the reasoning behind each. Log one to your library to nudge
              future picks.
            </p>
          </motion.div>

          {/* Category sections */}
          {contentType === "both" ? (
            <>
              {movieRecs.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="mb-10"
                >
                  <SectionHeader
                    icon={<Film size={14} />}
                    eyebrow="Movie"
                    title="On screen"
                    count={movieRecs.length}
                    accent="violet"
                  />
                  <div className="grid gap-5">
                    {movieRecs.map((rec, i) => (
                      <RecommendationCard
                        key={rec.id}
                        rec={rec}
                        index={i}
                        alreadyLogged={isAlreadyLogged(rec)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {bookRecs.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mb-10"
                >
                  <SectionHeader
                    icon={<BookOpen size={14} />}
                    eyebrow="Book"
                    title="On the shelf"
                    count={bookRecs.length}
                    accent="emerald"
                  />
                  <div className="grid gap-5">
                    {bookRecs.map((rec, i) => (
                      <RecommendationCard
                        key={rec.id}
                        rec={rec}
                        index={i}
                        alreadyLogged={isAlreadyLogged(rec)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </motion.section>
              )}
            </>
          ) : (
            <div className="grid gap-5">
              {recommendations.map((rec, i) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  index={i}
                  alreadyLogged={isAlreadyLogged(rec)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <HoverBorderGradient
              onClick={handleGetAnother}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="99, 102, 241"
              darkHighlightColor="129, 140, 248"
              containerClassName="rounded-full w-full sm:w-auto"
              className="flex w-full items-center justify-center gap-2 whitespace-nowrap bg-white px-6 py-3 text-sm font-black leading-none tracking-tight text-black sm:w-auto dark:bg-black dark:text-white"
            >
              <RotateCcw size={16} />
              Retake Quiz
            </HoverBorderGradient>
            <PillButton
              onClick={() => router.push("/history")}
              className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              View History
              <ArrowRight size={16} />
            </PillButton>
            <div className="relative w-full sm:w-auto">
              <PillButton
                onClick={handleShare}
                className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <Share2 size={16} />
                Share Results
              </PillButton>

              <AnimatePresence>
                {showShareMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowShareMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-900"
                    >
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Copy size={14} />
                        Copy to clipboard
                      </button>
                      <button
                        onClick={handleShareTwitter}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        Share on X
                      </button>
                      <button
                        onClick={handleShareEmail}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Mail size={14} />
                        Share via email
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
