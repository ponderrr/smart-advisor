'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LogOut, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { generateQuestionsWithRetry } from "@/features/recommendations/services/ai-service";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { v4 as uuidv4 } from "uuid";
import {
  EnhancedTextarea,
  LoadingScreen,
  EnhancedProgress,
} from "@/components/enhanced";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
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
    { name: "Start Quiz", link: "/content-selection" },
    { name: "History", link: "/history" },
  ];

  const loadQuestions = useCallback(async () => {
    if (!contentType || !user) return;
    try {
      setIsLoading(true);
      setError(null);

      const generatedQuestions = await generateQuestionsWithRetry(
        contentType,
        user.age,
        questionCount,
        user.name,
      );

      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("We could not generate your questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [contentType, user, questionCount]);

  useEffect(() => {
    if (!contentType || !user) {
      router.push("/content-selection");
      return;
    }

    loadQuestions();
  }, [contentType, user, router, loadQuestions]);

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
            className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            <LogOut size={14} />
            Sign Out
          </button>
          <HoverBorderGradient
            onClick={() => router.push('/history')}
            idleColor="17, 24, 39"
            darkIdleColor="255, 255, 255"
            highlightColor="139, 92, 246"
            darkHighlightColor="167, 139, 250"
            containerClassName="rounded-full"
            className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
          >
            History
          </HoverBorderGradient>
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
          <HoverBorderGradient
            onClick={() => {
              router.push('/history');
              setIsMobileMenuOpen(false);
            }}
            idleColor="17, 24, 39"
            darkIdleColor="255, 255, 255"
            highlightColor="139, 92, 246"
            darkHighlightColor="167, 139, 250"
            containerClassName="mt-2 w-full rounded-full"
            className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
          >
            History
          </HoverBorderGradient>
          <button
            type="button"
            onClick={async () => {
              await handleSignOut();
              setIsMobileMenuOpen(false);
            }}
            className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
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
        <LoadingScreen
          message={`Generating ${questionCount} personalized questions`}
          submessage="Tuning prompts to your selected content type and profile."
        />
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
            <h2 className="text-2xl font-black tracking-tight">Unable to load questions</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={loadQuestions}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => router.push('/question-count')}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
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

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Step 3 of 4
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Question {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            <EnhancedProgress value={progress} className="h-2.5" showGlow />
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            {currentQuestion && (
              <motion.section
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 md:p-8"
              >
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  {currentQuestion.text}
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Add a clear answer. More detail gives better recommendations.
                </p>

                <div className="mt-5">
                  <EnhancedTextarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-36 resize-none"
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mt-6 flex items-center justify-between"
          >
            <button
              type="button"
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors",
                !canProceed || isSubmitting
                  ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500",
              )}
            >
              {isSubmitting
                ? "Submitting..."
                : currentQuestionIndex === questions.length - 1
                  ? "Get Recommendations"
                  : "Next"}
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QuestionnairePage;
