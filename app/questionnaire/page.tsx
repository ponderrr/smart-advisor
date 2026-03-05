'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LogOut, RefreshCw } from "lucide-react";
import { IconCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { generateQuestionsWithRetry } from "@/features/recommendations/services/ai-service";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { v4 as uuidv4 } from "uuid";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
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

const getQuestionOptions = (
  type: "movie" | "book" | "both",
  index: number,
) => {
  const sets = QUESTION_OPTION_SETS[type];
  return sets[index % sets.length];
};

const QuestionnairePage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { contentType, questionCount, setAnswers: setStoreAnswers } = useQuizStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  const loadQuestions = useCallback(async () => {
    if (!contentType || !user) return;
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Your session expired. Please sign in again to continue.");
        return;
      }

      const generatedQuestions = await generateQuestionsWithRetry(
        contentType,
        user.age,
        questionCount,
        user.name,
        1,
      );

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
    const hasInProgressAnswers = Object.values(answers).some((v) => v.trim().length > 0);
    if (!hasInProgressAnswers || isSubmitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, isSubmitting]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

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

    const formattedAnswers: Answer[] = questions.map((q) => ({
      id: uuidv4(),
      question_id: q.id,
      answer_text: answers[q.id] || "",
      created_at: new Date().toISOString(),
    }));

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

  const canProceed = Boolean(currentQuestion && answers[currentQuestion.id]?.trim().length > 0);

  if (!contentType || !user) return null;

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
            className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
          >
            <LogOut size={14} />
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
        <main className="px-6 pb-20 pt-32 md:pt-36">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Step 3 of 4
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tighter md:text-4xl">
              Generating your questions
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Building {questionCount} personalized prompts for your profile.
            </p>

            <div className="relative mx-auto mt-8 h-12 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40">
              <motion.div
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"
                animate={{ x: ["-120%", "340%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative z-10 flex h-full items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                {contentType?.toUpperCase()} QUESTIONNAIRE
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-6 pb-20 pt-32 md:pt-36">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Unable to load questions</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={loadQuestions}
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => router.push('/question-count')}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
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

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-4xl flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              {currentQuestionIndex + 1} out of {questions.length} questions
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Live Quiz
            </p>
          </div>

          <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
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
                    Pick one so we can tune your recommendations.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {getQuestionOptions(contentType, currentQuestionIndex).map((option) => {
                      const selected = answers[currentQuestion.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAnswer(option)}
                          className={cn(
                            "group flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                            selected
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                              : "border-slate-200/80 bg-white text-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900",
                          )}
                        >
                          <span className="text-sm font-semibold sm:text-base">{option}</span>
                          {selected ? (
                            <IconCheck className="h-5 w-5" />
                          ) : (
                            <span className="h-5 w-5 rounded-full border border-slate-300 transition group-hover:border-indigo-300 dark:border-slate-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-end">
              <button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {currentQuestionIndex === questions.length - 1 ? "Get Recommendations" : "Next"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionnairePage;
