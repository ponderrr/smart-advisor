"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IconCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { generateQuestionsWithRetry } from "@/features/recommendations/services/ai-service";
import { generateFallbackQuestions } from "@/features/quiz/utils/fallback-questions";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { v4 as uuidv4 } from "uuid";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
import { supabase } from "@/integrations/supabase/client";
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

const QUESTION_OPTION_SETS: Record<"movie" | "book" | "both", string[][]> = {
  movie: [
    ["Action-packed", "Emotional", "Mind-bending", "Comfort watch"],
    ["Fast and intense", "Balanced pace", "Slow burn", "Short and snappy"],
    ["Popular hits", "Underrated gems", "Classics", "Something new"],
    ["Solo watch", "Date night", "Family-friendly", "Late-night vibe"],
  ],
  book: [
    ["Character-driven", "Plot-driven", "Reflective", "Escapist"],
    ["Quick read", "Medium depth", "Deep and layered", "Series starter"],
    ["Bestseller", "Hidden gem", "Classic", "Fresh release"],
    ["Light and fun", "Thought-provoking", "Emotional", "Dark and tense"],
  ],
  both: [
    ["Movie first", "Book first", "Either works", "Match both formats"],
    ["Fast and intense", "Balanced pace", "Slow burn", "Quick and easy"],
    ["Popular picks", "Underrated picks", "Classics", "Something new"],
    ["Comforting", "Suspenseful", "Inspiring", "Mind-bending"],
  ],
};

const SELECT_ALL_OPTIONS: Record<"movie" | "book" | "both", string[][]> = {
  movie: [
    [
      "Action",
      "Comedy",
      "Drama",
      "Horror",
      "Sci-Fi",
      "Romance",
      "Thriller",
      "Documentary",
    ],
    [
      "Great acting",
      "Stunning visuals",
      "Strong plot",
      "Unique concept",
      "Emotional depth",
      "Humor",
    ],
  ],
  book: [
    [
      "Fantasy",
      "Mystery",
      "Sci-Fi",
      "Romance",
      "Literary Fiction",
      "Thriller",
      "Non-Fiction",
      "Historical",
    ],
    [
      "Rich characters",
      "Beautiful prose",
      "Fast plot",
      "World-building",
      "Emotional depth",
      "Humor",
    ],
  ],
  both: [
    [
      "Action",
      "Fantasy",
      "Drama",
      "Mystery",
      "Sci-Fi",
      "Romance",
      "Thriller",
      "Comedy",
    ],
    [
      "Great characters",
      "Strong plot",
      "Unique concept",
      "Emotional depth",
      "World-building",
      "Humor",
    ],
  ],
};

const getQuestionOptions = (type: "movie" | "book" | "both", index: number) => {
  const sets = QUESTION_OPTION_SETS[type];
  return sets[index % sets.length];
};

const getSelectAllOptions = (
  type: "movie" | "book" | "both",
  index: number,
) => {
  const sets = SELECT_ALL_OPTIONS[type];
  return sets[index % sets.length];
};

/* ---------- Loading Animation ---------- */
const QUESTION_LOADING_PHRASES = [
  "Analyzing your personality profile",
  "Crafting personalized questions",
  "Tailoring prompts to your taste",
  "Building your unique quiz flow",
  "Matching question styles to you",
  "Fine-tuning difficulty and tone",
  "Almost ready — finalizing questions",
];

const BouncingWordsLoader = ({
  questionCount,
  contentType,
}: {
  questionCount: number;
  contentType: string | null;
}) => (
  <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      Step 3 of 4
    </p>

    <h1 className="mt-6 text-3xl font-black tracking-tighter md:text-4xl">
      Generating your questions
    </h1>

    <div className="mx-auto mt-5 h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {QUESTION_LOADING_PHRASES.map((phrase, i) => (
          <motion.p
            key={phrase}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: [0, 1, 1, 0], y: [16, 0, 0, -16] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 3,
              repeatDelay: (QUESTION_LOADING_PHRASES.length - 1) * 3,
              ease: "easeInOut",
            }}
            style={{
              position: i === 0 ? "relative" : "absolute",
              left: 0,
              right: 0,
            }}
          >
            {phrase}
          </motion.p>
        ))}
      </AnimatePresence>
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

const QuestionnairePage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    contentType,
    questionCount,
    setAnswers: setStoreAnswers,
  } = useQuizStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ], []);

  const loadQuestions = useCallback(async () => {
    if (!contentType || !user) return;
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user: sessionUser },
        error: sessionError,
      } = await supabase.auth.getUser();
      if (sessionError || !sessionUser) {
        setError("Your session expired. Please sign in again to continue.");
        return;
      }

      let generatedQuestions: Question[];
      try {
        generatedQuestions = await generateQuestionsWithRetry(
          contentType,
          user.age,
          questionCount,
          user.name,
          3,
        );
      } catch (aiErr) {
        console.warn(
          "AI question generation failed, using fallback questions:",
          aiErr,
        );
        generatedQuestions = generateFallbackQuestions(
          contentType,
          user.age,
          questionCount,
        );
      }

      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to load questions:", err);
      const errMsg = err instanceof Error ? err.message : "";
      if (errMsg.toLowerCase().includes("not authenticated")) {
        setError("Your session expired. Please sign in again to continue.");
      } else {
        setError("We could not generate your questions. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentType, questionCount, user]);

  useEffect(() => {
    if (!contentType || !user) {
      router.push("/content-selection");
      return;
    }

    loadQuestions();
  }, [contentType, user, router, loadQuestions]);

  useEffect(() => {
    const hasInProgressAnswers =
      Object.values(answers).some((v) => v.trim().length > 0) ||
      Object.values(multiAnswers).some((arr) => arr.length > 0);
    if (!hasInProgressAnswers || isSubmitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, multiAnswers, isSubmitting]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [signOut, router]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  }, [currentQuestion]);

  const handleToggleMulti = useCallback((questionId: string, option: string) => {
    setMultiAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }, []);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      return;
    }
    router.push("/question-count");
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);

    const formattedAnswers: Answer[] = questions.map((q) => {
      if (q.type === "select_all") {
        const selected = multiAnswers[q.id] ?? [];
        return {
          id: uuidv4(),
          question_id: q.id,
          question_text: q.text,
          answer_text: selected.join(", "),
          selected_options: selected,
          created_at: new Date().toISOString(),
        };
      }
      return {
        id: uuidv4(),
        question_id: q.id,
        question_text: q.text,
        answer_text: answers[q.id] || "",
        created_at: new Date().toISOString(),
      };
    });

    setStoreAnswers(formattedAnswers);
    router.push("/results");
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }
    handleComplete();
  };

  const canProceed = (() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "select_all") {
      return (multiAnswers[currentQuestion.id]?.length ?? 0) > 0;
    }
    return (answers[currentQuestion.id]?.trim().length ?? 0) > 0;
  })();

  // Track select_all option index for cycling through option sets
  const selectAllIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentQuestionIndex; i++) {
      if (questions[i]?.type === "select_all") count++;
    }
    return count;
  }, [questions, currentQuestionIndex]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-3 pb-20 pt-28 sm:px-6 md:pt-36">
          <BouncingWordsLoader
            questionCount={questionCount}
            contentType={contentType}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-3 pb-20 pt-28 sm:px-6 md:pt-36">
          <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
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
              Unable to load questions
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <GlowPillButton
                onClick={loadQuestions}
                className="bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-black dark:text-white"
              >
                Try Again
              </GlowPillButton>
              <GlowPillButton
                onClick={() => router.push("/question-count")}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Back
              </GlowPillButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderQuestionBody = () => {
    if (!currentQuestion) return null;
    const qType = currentQuestion.type ?? "single_select";

    if (qType === "fill_in_blank") {
      return (
        <div className="mt-7">
          <textarea
            value={answers[currentQuestion.id] ?? ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={
              currentQuestion.placeholder ?? "Type your answer here..."
            }
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-500/70"
          />
        </div>
      );
    }

    if (qType === "select_all") {
      const options = getSelectAllOptions(
        contentType ?? "both",
        selectAllIndex,
      );
      const selected = multiAnswers[currentQuestion.id] ?? [];
      return (
        <>
          <p className="mt-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
            Select all that apply
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <GlowPillButton
                  key={option}
                  onClick={() => handleToggleMulti(currentQuestion.id, option)}
                  active={isSelected}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    isSelected
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "border-slate-200/80 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500/50",
                  )}
                >
                  {isSelected && <IconCheck className="h-4 w-4" />}
                  {option}
                </GlowPillButton>
              );
            })}
          </div>
        </>
      );
    }

    // single_select (default)
    const options = getQuestionOptions(
      contentType ?? "both",
      currentQuestionIndex,
    );
    return (
      <div className="mt-5 grid gap-2 sm:mt-7 sm:gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = answers[currentQuestion.id] === option;
          return (
            <GlowPillButton
              key={option}
              onClick={() => handleAnswer(option)}
              active={selected}
              className={cn(
                "group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                selected
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
              )}
            >
              <span className="text-sm font-semibold sm:text-base">
                {option}
              </span>
              {selected ? (
                <IconCheck className="h-5 w-5" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-slate-300 transition group-hover:border-indigo-300 dark:border-slate-600" />
              )}
            </GlowPillButton>
          );
        })}
      </div>
    );
  };

  const getSubtitle = () => {
    if (!currentQuestion) return "";
    const qType = currentQuestion.type ?? "single_select";
    if (qType === "fill_in_blank")
      return "Share your thoughts in your own words.";
    if (qType === "select_all") return "Choose as many as you like.";
    return "Pick one so we can tune your recommendations.";
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {topBar}

      <main className="px-3 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 sm:mb-8 sm:gap-3">
            <GlowPillButton
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70"
            >
              <ArrowLeft size={16} />
              Back
            </GlowPillButton>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              {currentQuestionIndex + 1} out of {questions.length} questions
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Live Quiz
            </p>
          </div>

          <div className="mb-6 h-2 w-full sm:mb-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:rounded-3xl sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {currentQuestion && (
                <motion.section
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {currentQuestion.text}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    {getSubtitle()}
                  </p>

                  {renderQuestionBody()}
                </motion.section>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-end sm:mt-8">
              <GlowPillButton
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white"
              >
                {currentQuestionIndex === questions.length - 1
                  ? "Get Recommendations"
                  : "Next"}
                <ArrowRight size={16} />
              </GlowPillButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionnairePage;
