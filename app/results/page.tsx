'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { RefreshCw, Heart, Star, BookOpen, Film } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { enhancedRecommendationsService } from "@/features/recommendations/services/enhanced-recommendations-service";
import { databaseService } from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { ExpandableText } from "@/components/ExpandableText";
import {
  EnhancedButton,
} from "@/components/enhanced";
import { SafeLocalStorage } from "@/utils/localStorage";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
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
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.warn("Failed to stringify object, using fallback:", error);
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

const ResultsShimmerLoader = ({ step }: { step: string }) => {
  return (
    <main className="px-6 pb-20 pt-32 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="shimmer-container h-4 w-28 rounded-full" />
          <div className="shimmer-container mt-4 h-12 w-72 rounded-full" />
          <div className="shimmer-container mt-3 h-4 w-96 max-w-full rounded-full" />
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65">
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="absolute inset-y-0 -left-1/3 w-1/3 animate-[shimmer_1.2s_infinite] rounded-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{step}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65"
            >
              <div className="grid grid-cols-[130px_1fr] gap-4">
                <div className="shimmer-container aspect-[2/3] rounded-2xl" />
                <div className="space-y-3">
                  <div className="shimmer-container h-7 w-3/4 rounded-full" />
                  <div className="shimmer-container h-4 w-1/2 rounded-full" />
                  <div className="shimmer-container h-20 rounded-2xl" />
                  <div className="shimmer-container h-20 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

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

  const getMatchScore = (index: number) => Math.max(78, 95 - index * 4);
  const getMatchLabel = (score: number) => {
    if (score >= 92) return "Excellent Match";
    if (score >= 86) return "Strong Match";
    return "Good Match";
  };

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
    if (!answers || !contentType) {
      return null;
    }

    try {
      const serializedAnswers = safeStringify(answers);
      const userId = user?.id || "anonymous";
      return `${serializedAnswers}-${contentType}-${userId}`;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.warn("Failed to create session ID, using fallback:", error);
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
        contentType,
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
      if (!recommendationId) {
        return;
      }

      const { error: toggleError } = await databaseService.toggleFavorite(recommendationId);
      if (!toggleError) {
        const updatedRecs = recommendations.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, is_favorited: !rec.is_favorited }
            : rec,
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
              onClick={() => {
                router.push(item.link);
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
            >
              {item.name}
            </button>
          ))}
          <button
            type="button"
            onClick={async () => {
              await handleSignOut();
              setIsMobileMenuOpen(false);
            }}
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
        <main className="px-6 pb-20 pt-32 md:pt-36">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Generate new recommendations?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You already generated recommendations for these answers. Generate new ones or view your history.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Go to History
              </button>
              <button
                type="button"
                onClick={handleConfirmGeneration}
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Generate New
              </button>
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
        <ResultsShimmerLoader step={generationStep} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-6 pb-20 pt-32 md:pt-36">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Recommendation generation failed</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-indigo-500 dark:text-white"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => router.push('/questionnaire')}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {topBar}

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 4 of 4</p>
            <h1 className="mt-4 text-4xl font-black tracking-tighter md:text-5xl">Your Recommendations</h1>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Ranked picks based on your answers.
            </p>
          </motion.div>

          <div className="space-y-6">
            {recommendations.map((rec, index) => {
              const matchScore = getMatchScore(index);
              const matchLabel = getMatchLabel(matchScore);
              const whyText = rec.explanation || `This ${rec.type} aligns with your preferences and pacing choices.`;

              return (
                <motion.article
                  key={rec.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: index * 0.06 }}
                  className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 md:p-6"
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                      {rec.poster_url ? (
                        <img
                          src={rec.poster_url}
                          alt={rec.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
                          {rec.type === 'movie' ? <Film size={28} /> : <BookOpen size={28} />}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{rec.title}</h2>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {rec.author ? `By ${rec.author}` : rec.director ? `Directed by ${rec.director}` : ""}
                            {rec.year ? ` · ${rec.year}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(rec.id)}
                          className={cn(
                            "rounded-full p-2 transition-colors",
                            rec.is_favorited
                              ? "bg-rose-500 text-white"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                          )}
                        >
                          <Heart size={18} fill={rec.is_favorited ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {typeof rec.rating === 'number' && (
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                          <Star size={14} className="fill-current text-amber-500" />
                          {rec.rating}
                        </div>
                      )}

                      {rec.genres?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {rec.genres.map((g) => (
                            <span
                              key={g}
                              className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white dark:bg-indigo-500"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Match</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{matchLabel}</p>
                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">{matchScore}%</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Why</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{whyText}</p>
                        </div>
                      </div>

                      {rec.description && (
                        <ExpandableText
                          text={rec.description}
                          title={rec.type === "movie" ? "Plot Summary:" : "Book Description:"}
                          maxLines={4}
                          className="bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300"
                        />
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <EnhancedButton
              onClick={handleGetAnother}
              variant="primary"
              size="lg"
              glow
              className="w-full rounded-full sm:w-auto"
            >
              Get Another Recommendation
            </EnhancedButton>
            <EnhancedButton
              onClick={() => router.push('/history')}
              variant="secondary"
              size="lg"
              className="w-full rounded-full sm:w-auto"
            >
              View My History
            </EnhancedButton>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
