'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { RefreshCw, Heart, Star, BookOpen, Film, ArrowRight, Share2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { enhancedRecommendationsService } from "@/features/recommendations/services/enhanced-recommendations-service";
import { databaseService } from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { SafeLocalStorage } from "@/utils/localStorage";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
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
  const sessionsToStore = sessionsArray.length > 10 ? sessionsArray.slice(-10) : sessionsArray;

  SafeLocalStorage.setJSON(GENERATED_SESSIONS_KEY, sessionsToStore);
};

/* ---------- Loading Animation ---------- */
const LOADING_WORDS = ["Analyzing", "preferences", "and", "finding", "your", "perfect", "picks"];

const ResultsLoadingState = ({ step }: { step: string }) => (
  <div className="mx-auto flex min-h-[480px] w-full max-w-4xl flex-col justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      Step 4 of 4
    </p>
    <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-300/70 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10">
      <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" className="text-indigo-500/20" />
        <motion.path
          d="M4 8H20"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M12 12L12 12"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.svg>
    </div>

    <h1 className="mt-4 text-3xl font-black tracking-tighter md:text-4xl">
      Generating recommendations
    </h1>

    <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      {LOADING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        >
          {word}
        </motion.span>
      ))}
    </div>

    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{step}</p>

    <div className="relative mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <motion.div
        className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        animate={{ x: ["-120%", "340%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  </div>
);

/* ---------- Recommendation Card ---------- */
const RecommendationCard = ({
  rec,
  index,
  onToggleFavorite,
}: {
  rec: Recommendation;
  index: number;
  onToggleFavorite: (id: string) => void;
}) => {
  const matchScore = Math.max(78, 95 - index * 3);
  const matchLabel = matchScore >= 92 ? "Excellent" : matchScore >= 86 ? "Strong" : "Good";
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/65"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 sm:aspect-auto sm:min-h-[280px] dark:bg-slate-800">
          {rec.poster_url ? (
            <img
              src={rec.poster_url}
              alt={rec.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              {rec.type === "movie" ? <Film size={32} /> : <BookOpen size={32} />}
            </div>
          )}
          {/* Type badge */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {rec.type === "movie" ? <Film size={10} /> : <BookOpen size={10} />}
            {rec.type}
          </div>
          {/* Match badge */}
          <div className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
            {matchScore}% {matchLabel}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{rec.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {rec.author ? `By ${rec.author}` : rec.director ? `Directed by ${rec.director}` : ""}
                {rec.year ? ` · ${rec.year}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavorite(rec.id)}
              className={cn(
                "shrink-0 rounded-full p-2 transition-all",
                rec.is_favorited
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
              )}
            >
              <Heart size={16} fill={rec.is_favorited ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Rating + Genres row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {typeof rec.rating === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Star size={12} className="fill-current" />
                {rec.rating}
              </span>
            )}
            {rec.genres?.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Explanation */}
          {rec.explanation && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Why this pick
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {rec.explanation}
              </p>
            </div>
          )}

          {/* Description (expandable) */}
          {rec.description && (
            <div className="mt-3">
              <p
                className={cn(
                  "text-sm leading-relaxed text-slate-600 dark:text-slate-400",
                  !expanded && "line-clamp-3",
                )}
              >
                {rec.description}
              </p>
              {rec.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
                >
                  {expanded ? "Show less" : "Read more"}
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
  const { user, signOut } = useAuth();
  const { contentType, answers, reset } = useQuizStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("Analyzing your answers...");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentSessionRef = useRef<string | null>(null);
  const generatedRecommendationsRef = useRef<Recommendation[]>([]);
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  const sessionId = (() => {
    if (!answers || !contentType) return null;
    try {
      const serializedAnswers = safeStringify(answers);
      const userId = user?.id || "anonymous";
      return `${serializedAnswers}-${contentType}-${userId}`;
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
        contentType: contentType ?? "both" as const,
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
      setError("Failed to generate personalized recommendations. Please try again.");
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
    const hasExistingRecommendations = generatedRecommendationsRef.current.length > 0;

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recommendations.length > 0 && !error) {
        e.preventDefault();
        e.returnValue = "You have unsaved recommendations. Are you sure you want to leave?";
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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

      const { error: toggleError } = await databaseService.toggleFavorite(recommendationId);
      if (toggleError) {
        toast.error("Couldn't update your favorite — please try again");
      } else {
        const rec = recommendations.find((r) => r.id === recommendationId);
        toast.success(rec?.is_favorited ? "Removed from favorites" : "Added to favorites");
        const updatedRecs = recommendations.map((r) =>
          r.id === recommendationId ? { ...r, is_favorited: !r.is_favorited } : r,
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

  const handleShare = async () => {
    const titles = recommendations.map((r) => `${r.type === "movie" ? "Movie" : "Book"}: ${r.title}`).join("\n");
    const text = `My Smart Advisor picks:\n${titles}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Smart Advisor Picks", text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Your picks have been copied to your clipboard!");
    }
  };

  if (!contentType || !answers?.length || !user) {
    return null;
  }

  const topBar = (
    <Navbar>
      <NavBody>
        <div className="flex w-[320px] shrink-0 items-center">
          <NavbarLogo />
        </div>
        <div className="flex flex-1 justify-center">
          <NavItems items={navItems} className="justify-center px-2" />
        </div>
        <div className="flex w-[320px] shrink-0 items-center justify-end gap-4">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
          >
            Sign Out
          </button>
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
              onClick={() => { router.push(item.link); setIsMobileMenuOpen(false); }}
              className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
            >
              {item.name}
            </button>
          ))}
          <button
            type="button"
            onClick={async () => { await handleSignOut(); setIsMobileMenuOpen(false); }}
            className="text-left text-xl font-black tracking-tight text-rose-600 dark:text-rose-400"
          >
            Sign Out
          </button>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );

  if (showConfirmDialog) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <RefreshCw size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Generate new recommendations?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You already generated recommendations for these answers. Generate new ones or view your history.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <GlowPillButton
                onClick={handleCancelGeneration}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Go to History
              </GlowPillButton>
              <GlowPillButton
                onClick={handleConfirmGeneration}
                className="bg-white px-5 py-2.5 text-sm font-black text-black dark:bg-slate-900 dark:text-white"
              >
                Generate New
              </GlowPillButton>
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
            <h2 className="text-2xl font-black tracking-tight">Unable to generate recommendations</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <GlowPillButton
                onClick={handleRetry}
                className="bg-white px-5 py-2.5 text-sm font-black text-black dark:bg-slate-900 dark:text-white"
              >
                Try Again
              </GlowPillButton>
              <GlowPillButton
                onClick={() => router.push("/content-selection")}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Retake Quiz
              </GlowPillButton>
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
              Step 4 of 4
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">
              Your Recommendations
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {recommendations.length} personalized {recommendations.length === 1 ? "pick" : "picks"} based on your answers.
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
                  className="mb-8"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Film size={18} className="text-violet-500" />
                    <h2 className="text-lg font-bold tracking-tight">Movies</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {movieRecs.length}
                    </span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {movieRecs.map((rec, i) => (
                      <RecommendationCard key={rec.id} rec={rec} index={i} onToggleFavorite={handleToggleFavorite} />
                    ))}
                  </div>
                </motion.section>
              )}

              {bookRecs.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mb-8"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-500" />
                    <h2 className="text-lg font-bold tracking-tight">Books</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {bookRecs.length}
                    </span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {bookRecs.map((rec, i) => (
                      <RecommendationCard key={rec.id} rec={rec} index={i} onToggleFavorite={handleToggleFavorite} />
                    ))}
                  </div>
                </motion.section>
              )}
            </>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={rec.id} rec={rec} index={i} onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <GlowPillButton
              onClick={handleGetAnother}
              className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black sm:w-auto dark:bg-slate-900 dark:text-white"
            >
              <RotateCcw size={16} />
              Retake Quiz
            </GlowPillButton>
            <GlowPillButton
              onClick={() => router.push("/history")}
              className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              View History
              <ArrowRight size={16} />
            </GlowPillButton>
            <GlowPillButton
              onClick={handleShare}
              className="inline-flex w-full items-center justify-center gap-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <Share2 size={16} />
              Share Results
            </GlowPillButton>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
