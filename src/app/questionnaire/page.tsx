"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations, useMessages } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLeaveGuard } from "@/features/quiz/hooks/use-leave-guard";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { generateQuestionsWithRetry } from "@/features/recommendations/services/ai-service";
import { Question } from "@/features/quiz/types/question";
import { Answer } from "@/features/quiz/types/answer";
import { v4 as uuidv4 } from "uuid";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import {
  QuestionCard,
  hasQuestionAnswer,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { supabase } from "@/integrations/supabase/client";
import { AppNavbar } from "@/components/app-navbar";

/* ---------- Loading Animation ---------- */
const QuestionLoader = () => {
  const messages = useMessages() as {
    Quiz?: { questionnaire?: { loadingMessages?: string[] } };
  };
  const loadingMessages = useMemo(
    () => messages.Quiz?.questionnaire?.loadingMessages ?? [],
    [messages],
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (loadingMessages.length === 0) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 3800);
    return () => clearInterval(id);
  }, [loadingMessages.length]);

  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
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
            {loadingMessages[messageIndex] ?? ""}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

const QuestionnairePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const t = useTranslations("Quiz.questionnaire");
  const tq = useTranslations("Quiz");
  const tc = useTranslations("Common");
  const {
    contentType,
    questionCount,
    setAnswers: setStoreAnswers,
  } = useQuizStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Warn before leaving once the quiz is loaded and not yet submitted.
  useLeaveGuard(!isLoading && !isSubmitting && questions.length > 0);
  // Guard so React StrictMode + changing useAuth references can't double-fire
  // the AI question request and replace the user's first question mid-quiz.
  const hasLoadedRef = useRef(false);

  const loadQuestions = useCallback(async () => {
    if (!contentType || !user) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user: sessionUser },
        error: sessionError,
      } = await supabase.auth.getUser();
      if (sessionError || !sessionUser) {
        setError(t("errors.session"));
        hasLoadedRef.current = false;
        return;
      }

      const generatedQuestions = await generateQuestionsWithRetry(
        contentType,
        user.age,
        questionCount,
        user.name,
        3,
      );

      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to load questions:", err);
      hasLoadedRef.current = false;
      const errMsg = err instanceof Error ? err.message : "";
      if (errMsg.toLowerCase().includes("not authenticated")) {
        setError(t("errors.session"));
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentType, questionCount, user, t]);

  useEffect(() => {
    if (!contentType || !user) {
      router.push("/content-selection");
      return;
    }

    loadQuestions();
  }, [contentType, user, router, loadQuestions]);

  useEffect(() => {
    const hasInProgressAnswers = Object.values(answers).some((v) =>
      Array.isArray(v) ? v.length > 0 : v.trim().length > 0,
    );
    if (!hasInProgressAnswers || isSubmitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, isSubmitting]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const handleAnswer = useCallback(
    (value: QuestionValue) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion],
  );

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      return;
    }
    if (!window.confirm(t("leaveConfirm"))) {
      return;
    }
    router.push("/question-count");
  };

  const handleComplete = async () => {
    if (!user) return;

    // Validate all questions have answers
    const unansweredIndex = questions.findIndex(
      (q) => !hasQuestionAnswer(answers[q.id]),
    );
    if (unansweredIndex !== -1) {
      setCurrentQuestionIndex(unansweredIndex);
      return;
    }

    setIsSubmitting(true);

    const formattedAnswers: Answer[] = questions.map((q) => {
      const value = answers[q.id];
      if (q.type === "select_all") {
        const selected = Array.isArray(value) ? value : [];
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
        answer_text: typeof value === "string" ? value : "",
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

  const canProceed = currentQuestion
    ? hasQuestionAnswer(answers[currentQuestion.id])
    : false;

  const currentOptions = currentQuestion?.options;

  const topBar = <AppNavbar />;

  if (!ready) {
    return <PageLoader text={tc("loading")} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {topBar}
        <main className="px-3 pb-20 pt-28 sm:px-6 md:pt-36">
          <QuestionLoader />
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
              {t("errors.title")}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <PillButton
                onClick={loadQuestions}
                className="bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-black dark:text-white"
              >
                {t("errors.tryAgain")}
              </PillButton>
              <PillButton
                onClick={() => router.push("/question-count")}
                className="border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                {t("errors.back")}
              </PillButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getSubtitle = () => {
    if (!currentQuestion) return "";
    const qType = currentQuestion.type ?? "single_select";
    if (qType === "fill_in_blank") return t("subtitle.fillInBlank");
    if (qType === "select_all") return t("subtitle.selectAll");
    return t("subtitle.singleSelect");
  };

  return (
    <QuizStepShell
      category={t("category")}
      stepLabel={tq("stepOf", {
        current: currentQuestionIndex + 1,
        total: questions.length,
      })}
      progress={progress}
      onBack={handlePrevious}
      backLabel={
        currentQuestionIndex > 0 ? t("previous") : t("back")
      }
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
        className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65"
      >
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.section
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <QuestionCard
                title={currentQuestion.text}
                subtitle={getSubtitle()}
                type={currentQuestion.type ?? "single_select"}
                options={currentOptions}
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id]}
                onChange={handleAnswer}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-end sm:mt-8">
          <PillButton
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white"
          >
            {currentQuestionIndex === questions.length - 1
              ? t("submit")
              : t("next")}
            <ArrowRight size={16} />
          </PillButton>
        </div>
      </motion.div>
    </QuizStepShell>
  );
};

export default QuestionnairePage;
