"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations, useMessages } from "next-intl";
import { v4 as uuidv4 } from "uuid";

import { PillButton } from "@/components/ui/pill-button";
import {
  QuestionCard,
  hasQuestionAnswer,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import { useLeaveGuard } from "@/features/quiz/hooks/use-leave-guard";
import type { ContentType } from "@/features/quiz/store/quiz-store";
import type { Answer } from "@/features/quiz/types/answer";
import type { Question } from "@/features/quiz/types/question";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import {
  generateQuestionsWithRetry,
  isOverloadedError,
} from "@/features/recommendations/services/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Imperative API the orchestrator can call from the shared back button. */
export interface QuestionnaireStepHandle {
  /** Returns true if the orchestrator should proceed with the underlying
   *  "back to count step" navigation; returns false if the step handled the
   *  back internally (decremented question index) or cancelled it. */
  requestBack: () => boolean;
}

/** Sits inside the question card shell while the AI generates questions. */
const QuestionSkeleton = ({
  contentType,
}: {
  contentType: ContentType | null;
}) => {
  const messages = useMessages() as {
    Quiz?: {
      questionnaire?: {
        loadingMessages?: Record<string, string[]>;
      };
    };
  };
  const loadingMessages = useMemo(() => {
    const bank = messages.Quiz?.questionnaire?.loadingMessages;
    if (!bank) return [] as string[];
    const key = contentType === "both" ? "mix" : (contentType ?? "default");
    return bank[key] ?? bank.default ?? [];
  }, [messages, contentType]);
  const [messageIndex, setMessageIndex] = useState(0);
  const tone = getAccentTone(contentType);

  useEffect(() => {
    if (loadingMessages.length === 0) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 3800);
    return () => clearInterval(id);
  }, [loadingMessages.length]);

  return (
    <div className="relative" role="status" aria-live="polite">
      <div className="space-y-3">
        <div className="h-7 w-3/4 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 sm:h-8" />
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
      </div>
      <div className="mt-7 grid gap-2 sm:gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[3.25rem] animate-pulse rounded-2xl border border-slate-200/80 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/40"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span
          aria-hidden
          className={cn("h-2 w-2 animate-pulse rounded-full", tone.dot)}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "text-xs font-bold tracking-tight sm:text-sm",
              tone.text,
            )}
          >
            {loadingMessages[messageIndex] ?? ""}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface QuestionnaireStepProps {
  contentType: ContentType;
  questionCount: number;
  userAge: number;
  userName: string;
  /** Called when the quiz is fully answered + submitted. Receives the answers
   *  in the persistence shape so the orchestrator can write them to the store
   *  and navigate to /results. */
  onComplete: (answers: Answer[]) => void;
  /** Reports the current question position (1-based, plus total) so the
   *  orchestrator can drive the shell's stepLabel + progress bar. */
  onPositionChange: (current: number, total: number) => void;
  /** Reports loading-of-AI-questions state so the orchestrator can render
   *  "Preparing your quiz" in the step label. */
  onLoadingChange: (isLoading: boolean) => void;
}

export const QuestionnaireStep = forwardRef<
  QuestionnaireStepHandle,
  QuestionnaireStepProps
>(function QuestionnaireStep(
  {
    contentType,
    questionCount,
    userAge,
    userName,
    onComplete,
    onPositionChange,
    onLoadingChange,
  },
  ref,
) {
  const t = useTranslations("Quiz.questionnaire");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // 1 = moving forward (next), -1 = moving back (previous). Drives the
  // direction of the slide-transition between questions so backward moves
  // visually reverse the forward motion.
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorIsOverloaded, setErrorIsOverloaded] = useState(false);

  useLeaveGuard(!isLoading && !isSubmitting && questions.length > 0);

  // Guard so React StrictMode + changing useAuth references can't double-fire
  // the AI question request and replace the user's first question mid-quiz.
  const hasLoadedRef = useRef(false);

  const loadQuestions = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      setErrorIsOverloaded(false);

      const {
        data: { user: sessionUser },
        error: sessionError,
      } = await supabase.auth.getUser();
      if (sessionError || !sessionUser) {
        setError(t("errors.session"));
        hasLoadedRef.current = false;
        return;
      }

      const generated = await generateQuestionsWithRetry(
        contentType,
        userAge,
        questionCount,
        userName,
        3,
      );

      setQuestions(generated);
    } catch (err) {
      console.error("Failed to load questions:", err);
      hasLoadedRef.current = false;
      const msg = err instanceof Error ? err.message : "";
      if (isOverloadedError(err)) {
        setError(t("errors.overloaded"));
        setErrorIsOverloaded(true);
      } else if (msg.toLowerCase().includes("not authenticated")) {
        setError(t("errors.session"));
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentType, questionCount, userAge, userName, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Keep the orchestrator's shell label / progress bar in sync.
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    onPositionChange(currentQuestionIndex + 1, questions.length);
  }, [currentQuestionIndex, questions.length, onPositionChange]);

  // Native beforeunload prompt when the user has any in-progress answer and
  // tries to close the tab.
  useEffect(() => {
    const hasInProgress = Object.values(answers).some((v) =>
      Array.isArray(v) ? v.length > 0 : v.trim().length > 0,
    );
    if (!hasInProgress || isSubmitting) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [answers, isSubmitting]);

  const currentQuestion = questions[currentQuestionIndex];
  const canProceed = currentQuestion
    ? hasQuestionAnswer(answers[currentQuestion.id])
    : false;

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

  const handleSubmit = async () => {
    const unansweredIndex = questions.findIndex(
      (q) => !hasQuestionAnswer(answers[q.id]),
    );
    if (unansweredIndex !== -1) {
      setSlideDirection(unansweredIndex < currentQuestionIndex ? -1 : 1);
      setCurrentQuestionIndex(unansweredIndex);
      return;
    }

    setIsSubmitting(true);
    const formatted: Answer[] = questions.map((q) => {
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
    onComplete(formatted);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setSlideDirection(1);
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }
    void handleSubmit();
  };

  useImperativeHandle(ref, () => ({
    requestBack: () => {
      // Intra-questionnaire back — just decrement the question index.
      if (currentQuestionIndex > 0) {
        setSlideDirection(-1);
        setCurrentQuestionIndex((prev) => prev - 1);
        return false;
      }
      // Loading questions, nothing to lose — let the orchestrator navigate.
      if (isLoading) return true;
      // Confirm before discarding any in-flight answers.
      if (!window.confirm(t("leaveConfirm"))) return false;
      return true;
    },
  }));

  const tone = getAccentTone(contentType);

  const getSubtitle = () => {
    if (!currentQuestion) return "";
    const qType = currentQuestion.type ?? "single_select";
    if (qType === "fill_in_blank") return t("subtitle.fillInBlank");
    if (qType === "select_all") return t("subtitle.selectAll");
    return t("subtitle.singleSelect");
  };

  if (error) {
    return (
      <div className="text-center">
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
          {errorIsOverloaded ? t("errors.overloadedTitle") : t("errors.title")}
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
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <QuestionSkeleton contentType={contentType} />
          </motion.div>
        ) : currentQuestion ? (
          <motion.section
            key={currentQuestion.id}
            custom={slideDirection}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: 20 * dir }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: -20 * dir }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <QuestionCard
              title={currentQuestion.text}
              subtitle={getSubtitle()}
              type={currentQuestion.type ?? "single_select"}
              options={currentQuestion.options}
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id]}
              onChange={handleAnswer}
              contentType={contentType}
            />
          </motion.section>
        ) : null}
      </AnimatePresence>

      {!isLoading && (
        <div className="mt-6 flex items-center justify-end sm:mt-8">
          {(() => {
            const isLast = currentQuestionIndex === questions.length - 1;
            const label = isLast
              ? isSubmitting
                ? t("submitting")
                : t("submit")
              : t("next");
            return (
              <motion.button
                type="button"
                layout
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                transition={{
                  layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent bg-gradient-to-br px-6 py-2.5 text-sm font-black tracking-tight text-white shadow-md transition-shadow duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-md disabled:hover:shadow-md",
                  tone.barGradient,
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={label}
                    layout="position"
                    initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                </AnimatePresence>
                <ArrowRight
                  size={16}
                  className={cn(isSubmitting && "animate-pulse")}
                />
              </motion.button>
            );
          })()}
        </div>
      )}
    </>
  );
});
