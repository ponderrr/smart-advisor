"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ArrowRight } from "lucide-react";

import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { PillButton } from "@/components/ui/pill-button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { ContentSelectionStep } from "@/features/quiz/components/steps/content-selection-step";
import { QuestionCountStep } from "@/features/quiz/components/steps/question-count-step";
import {
  QuestionnaireStep,
  type QuestionnaireStepHandle,
} from "@/features/quiz/components/steps/questionnaire-step";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import {
  useQuizStore,
  type ContentType,
} from "@/features/quiz/store/quiz-store";
import type { Answer } from "@/features/quiz/types/answer";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { ResultsLoadingState } from "@/features/recommendations/components/results-loading-state";
import { ResultsView } from "@/features/recommendations/components/results-view";
import { enhancedRecommendationsService } from "@/features/recommendations/services/enhanced-recommendations-service";
import { isOverloadedError } from "@/features/recommendations/services/ai-service";
import { cn } from "@/lib/utils";

const STEPS = ["content", "count", "questions", "results"] as const;
type Step = (typeof STEPS)[number];

/** Local, ephemeral mode beyond the URL-tracked step. "navigating" is the
 *  normal stepwise flow; "generating" is the post-submit AI loader shown
 *  inside the same card; "gen-error" lets the user retry without leaving. */
type FlowMode = "navigating" | "generating" | "gen-error";

const QuizPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useRequireAuth();
  const tQuiz = useTranslations("Quiz");
  const tQuestionnaire = useTranslations("Quiz.questionnaire");
  const tCommon = useTranslations("Common");
  const tResults = useTranslations("Results.body");

  const {
    contentType,
    questionCount,
    setContentType,
    setQuestionCount: setStoreQuestionCount,
    setAnswers: setStoreAnswers,
    recommendations: storeRecommendations,
    setRecommendations: setStoreRecommendations,
    reset: resetStore,
  } = useQuizStore();

  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("content"),
  );

  // Local mirrors of the store so the user can change their selection / count
  // before the store is committed (on continue). Initialised from the store
  // so revisiting /quiz with an existing in-flight selection pre-fills the
  // controls.
  const [selectedType, setSelectedType] = useState<ContentType | null>(
    contentType,
  );
  const [localQuestionCount, setLocalQuestionCount] =
    useState<number>(questionCount);

  // 1 = moving forward (next step), -1 = moving back. Drives the slide
  // direction for the AnimatePresence between step bodies.
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  // Live state reported by the questionnaire step so the orchestrator can
  // drive the shell's step label + progress bar without owning the index.
  const [questionnaireLoading, setQuestionnaireLoading] = useState(true);
  const [questionPosition, setQuestionPosition] = useState({
    current: 1,
    total: 1,
  });

  const [flowMode, setFlowMode] = useState<FlowMode>("navigating");
  const [genError, setGenError] = useState<string | null>(null);
  const [genErrorIsOverloaded, setGenErrorIsOverloaded] = useState(false);
  // Buffer the last submitted answers so the user can retry on gen failure
  // without re-walking the questions.
  const lastAnswersRef = useRef<Answer[] | null>(null);
  const genAbortRef = useRef<AbortController | null>(null);

  const questionnaireRef = useRef<QuestionnaireStepHandle>(null);

  // Guards: if the URL points at a step the user can't reach yet (e.g. they
  // refreshed on ?step=results without recs in the store), bump them back.
  // Use replace so it doesn't pollute history.
  useEffect(() => {
    if (step === "count" && !contentType) {
      void setStep("content", { history: "replace" });
    } else if (step === "questions" && (!contentType || !questionCount)) {
      void setStep("content", { history: "replace" });
    } else if (step === "results" && storeRecommendations.length === 0) {
      // Empty recs means a hard reload of /quiz?step=results — the in-memory
      // store is gone, so there's nothing to render. Send them to the start.
      void setStep("content", { history: "replace" });
    }
  }, [step, contentType, questionCount, storeRecommendations.length, setStep]);

  // Abort any in-flight gen on unmount so navigating away cancels the
  // network request cleanly.
  useEffect(() => {
    return () => {
      genAbortRef.current?.abort();
      genAbortRef.current = null;
    };
  }, []);

  const goToStep = useCallback(
    (next: Step, direction: 1 | -1) => {
      setSlideDirection(direction);
      void setStep(next);
    },
    [setStep],
  );

  const handleContentContinue = () => {
    if (!selectedType) return;
    setContentType(selectedType);
    // Starting a new flow — clear any stale recs from a prior quiz so we
    // don't accidentally bounce into the results step on a guard check.
    setStoreRecommendations([]);
    goToStep("count", 1);
  };

  const handleCountContinue = () => {
    setStoreQuestionCount(localQuestionCount);
    goToStep("questions", 1);
  };

  const runGeneration = useCallback(
    async (formattedAnswers: Answer[]) => {
      if (!user || !contentType) return;

      // Cancel any prior in-flight gen.
      genAbortRef.current?.abort();
      const controller = new AbortController();
      genAbortRef.current = controller;

      try {
        const recs = await enhancedRecommendationsService.retryRecommendation(
          {
            answers: formattedAnswers,
            contentType,
            userAge: user.age,
            userName: user.name,
          },
          user.id,
        );

        if (controller.signal.aborted) return;

        setStoreRecommendations(recs);
        setFlowMode("navigating");
        setSlideDirection(1);
        void setStep("results");
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Quiz generation failed:", err);
        const overloaded = isOverloadedError(err);
        setGenErrorIsOverloaded(overloaded);
        setGenError(
          overloaded
            ? tResults("overloadedBody")
            : err instanceof Error
              ? err.message
              : tResults("generationError"),
        );
        setFlowMode("gen-error");
      }
    },
    [user, contentType, setStoreRecommendations, setStep, tResults],
  );

  const handleQuestionnaireComplete = useCallback(
    (formattedAnswers: Answer[]) => {
      setStoreAnswers(formattedAnswers);
      lastAnswersRef.current = formattedAnswers;
      setSlideDirection(1);
      setFlowMode("generating");
      setGenError(null);
      setGenErrorIsOverloaded(false);
      void runGeneration(formattedAnswers);
    },
    [setStoreAnswers, runGeneration],
  );

  const handleRetryGeneration = () => {
    const answers = lastAnswersRef.current;
    if (!answers) return;
    setGenError(null);
    setGenErrorIsOverloaded(false);
    setFlowMode("generating");
    void runGeneration(answers);
  };

  // "Get another" from the results view — wipe the quiz state and start
  // back at the content step. Stays inside /quiz so the user doesn't see a
  // route flash; the AnimatePresence handles the morph back to step 1.
  const handleRestart = useCallback(() => {
    resetStore();
    setSelectedType(null);
    setLocalQuestionCount(5);
    setQuestionPosition({ current: 1, total: 1 });
    setQuestionnaireLoading(true);
    setFlowMode("navigating");
    setGenError(null);
    lastAnswersRef.current = null;
    goToStep("content", -1);
  }, [goToStep, resetStore]);

  const handleBack = () => {
    // Back button is inert while we're generating — the answers are submitted
    // and the user is moments away from results.
    if (flowMode === "generating") return;
    if (flowMode === "gen-error") {
      router.push("/dashboard");
      return;
    }
    if (step === "content") {
      router.push("/dashboard");
      return;
    }
    if (step === "count") {
      goToStep("content", -1);
      return;
    }
    if (step === "results") {
      // From results, back acts like the explicit "Get another" CTA — go
      // home to the dashboard rather than re-entering the quiz mid-flow.
      router.push("/dashboard");
      return;
    }
    // step === "questions" — delegate so the step can handle intra-question
    // navigation and the leave-confirm dialog.
    const allowExit = questionnaireRef.current?.requestBack();
    if (allowExit) {
      goToStep("count", -1);
    }
  };

  // Used by the questionnaire step to keep the shell label / progress bar in
  // sync with its internal question index. Memoised so the child's effect
  // dependencies stay stable.
  const handlePositionChange = useCallback(
    (current: number, total: number) => {
      setQuestionPosition({ current, total });
    },
    [],
  );
  const handleLoadingChange = useCallback((loading: boolean) => {
    setQuestionnaireLoading(loading);
  }, []);

  if (!ready || !user) {
    return <PageLoader text={tCommon("loading")} />;
  }

  // Composite key for the AnimatePresence — covers both URL step changes and
  // the ephemeral generating / error states.
  const animKey =
    flowMode === "navigating" ? step : flowMode;

  // Resolve the shell props per step / flow mode.
  const shellContentType: ContentType | null =
    step === "content" && flowMode === "navigating" ? selectedType : contentType;

  let category = "";
  let stepLabel = "";
  let progress = 0;
  let backLabel = "";

  if (flowMode === "generating" || flowMode === "gen-error") {
    category = tQuestionnaire("category");
    stepLabel =
      flowMode === "gen-error"
        ? genErrorIsOverloaded
          ? tResults("overloadedTitle")
          : tResults("generationError")
        : tResults("generationStep.generating");
    progress = 100;
    backLabel = tQuiz("back.dashboard");
  } else if (step === "content") {
    category = tQuiz("category");
    stepLabel = tQuiz("stepOf", { current: 1, total: 4 });
    progress = 25;
    backLabel = tQuiz("back.dashboard");
  } else if (step === "count") {
    category = tQuiz("category");
    stepLabel = tQuiz("stepOf", { current: 2, total: 4 });
    progress = 50;
    backLabel = tQuiz("questionCount.back");
  } else if (step === "questions") {
    category = tQuestionnaire("category");
    stepLabel = questionnaireLoading
      ? tQuestionnaire("loadingStep")
      : tQuestionnaire("questionOf", {
          current: questionPosition.current,
          total: questionPosition.total,
        });
    progress =
      questionPosition.total > 0
        ? 50 + (questionPosition.current / questionPosition.total) * 50
        : 50;
    backLabel =
      questionPosition.current > 1
        ? tQuestionnaire("previous")
        : tQuestionnaire("back");
  } else {
    // step === "results"
    category = tResults("eyebrow");
    stepLabel = tQuiz("stepOf", { current: 4, total: 4 });
    progress = 100;
    backLabel = tQuiz("back.dashboard");
  }

  const tone = getAccentTone(shellContentType);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        {/* Every step — including results — renders inside the same
            QuizStepShell + card surface so the entire flow reads as a single
            morphing box. The shell handles the back-button row + progress
            bar; the inner motion.div with `layout` smoothly resizes the card
            as bodies swap. */}
        <QuizStepShell
          category={category}
          stepLabel={stepLabel}
          progress={progress}
          onBack={handleBack}
          backLabel={backLabel}
          contentType={shellContentType}
        >
            <motion.div
              layout
              transition={{
                layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              }}
              className={cn(
                "rounded-2xl border bg-gradient-to-br p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:p-6 md:p-8",
                tone.surfaceBorder,
                tone.surfaceGradient,
              )}
            >
              {/* mode="popLayout" keeps the exiting step in the layout
                  snapshot so the outer `layout` transition can smoothly
                  interpolate between old and new card heights. Exit is a
                  fast in-place fade (no slide) while the entrance keeps the
                  leftward slide — the new step visually replaces the old
                  one without two stacked UIs being visible at once. */}
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={slideDirection}
              >
                <motion.div
                  key={animKey}
                  custom={slideDirection}
                  variants={{
                    enter: (dir: number) => ({ opacity: 0, x: 30 * dir }),
                    center: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        duration: 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                    exit: {
                      opacity: 0,
                      transition: { duration: 0.15, ease: "easeIn" },
                    },
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {flowMode === "generating" ? (
                    <ResultsLoadingState contentType={contentType} />
                  ) : flowMode === "gen-error" ? (
                    <div className="text-center">
                      <h2 className="text-2xl font-black tracking-tight">
                        {genErrorIsOverloaded
                          ? tResults("overloadedTitle")
                          : tResults("generationError")}
                      </h2>
                      {genError ? (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {genError}
                        </p>
                      ) : null}
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <PillButton
                          onClick={handleRetryGeneration}
                          className={cn(
                            "inline-flex items-center justify-center gap-2 border-transparent bg-gradient-to-br px-6 py-2.5 text-sm font-black tracking-tight text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                            tone.barGradient,
                          )}
                        >
                          {tQuestionnaire("errors.tryAgain")}
                          <ArrowRight size={16} />
                        </PillButton>
                      </div>
                    </div>
                  ) : step === "content" ? (
                    <ContentSelectionStep
                      selectedType={selectedType}
                      onSelect={setSelectedType}
                      onContinue={handleContentContinue}
                      isContinuing={false}
                    />
                  ) : step === "count" && contentType ? (
                    <QuestionCountStep
                      contentType={contentType}
                      questionCount={localQuestionCount}
                      setQuestionCount={setLocalQuestionCount}
                      onContinue={handleCountContinue}
                      isContinuing={false}
                    />
                  ) : step === "questions" && contentType ? (
                    <QuestionnaireStep
                      ref={questionnaireRef}
                      contentType={contentType}
                      questionCount={questionCount}
                      userAge={user.age}
                      userName={user.name}
                      onComplete={handleQuestionnaireComplete}
                      onPositionChange={handlePositionChange}
                      onLoadingChange={handleLoadingChange}
                    />
                  ) : step === "results" && storeRecommendations.length > 0 ? (
                    <ResultsView
                      recommendations={storeRecommendations}
                      onRestart={handleRestart}
                    />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </QuizStepShell>
      </main>
    </div>
  );
};

export default QuizPage;
