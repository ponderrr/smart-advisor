"use client";

import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { PillButton } from "@/components/ui/pill-button";
import {
  QuestionCard,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import type {
  QuizContentType,
  QuizSession,
} from "@/features/group-quiz/types/group-quiz";

type Question = NonNullable<QuizSession["questions"]>[number];

import { hasAnswer, type LocalAnswers } from "../_lib/answers";
import { PRIMARY_CTA, HERO_CTA } from "../_lib/styles";

interface GroupQuizQuizViewProps {
  tone: ReturnType<typeof getAccentTone>;
  stageKey: string;
  submitted: boolean;
  allSubmitted: boolean;
  isHost: boolean;
  synthesizing: boolean;
  submitting: boolean;
  questions: Question[];
  currentQuestion: Question | undefined;
  currentQ: number;
  localAnswers: LocalAnswers;
  contentType: QuizContentType;
  onSynthesize: () => void;
  onSubmitAnswers: () => void;
  setCurrentQ: Dispatch<SetStateAction<number>>;
  setLocalAnswers: Dispatch<SetStateAction<LocalAnswers>>;
}

/**
 * The in-progress quiz view (question card + nav, post-submit waiting /
 * reveal, and the rare questions-still-loading state). Extracted verbatim
 * from group-quiz/[code]/page.tsx's two contiguous
 * `session.status === "in_progress"` blocks; owns its own
 * GroupQuiz.session i18n. Renders nothing structurally new — it picks
 * the same sub-block the page's `questions.length` conditionals did.
 */
export const GroupQuizQuizView = ({
  tone,
  stageKey,
  submitted,
  allSubmitted,
  isHost,
  synthesizing,
  submitting,
  questions,
  currentQuestion,
  currentQ,
  localAnswers,
  contentType,
  onSynthesize,
  onSubmitAnswers,
  setCurrentQ,
  setLocalAnswers,
}: GroupQuizQuizViewProps) => {
  const t = useTranslations("GroupQuiz.session");

  if (questions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
        <Sparkles
          className={cn("mx-auto h-8 w-8 animate-pulse", tone.text)}
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-bold tracking-tight">
          {t("host.generatingQuestions")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }}
      className={cn(
        "rounded-3xl border bg-gradient-to-br p-5 shadow-sm backdrop-blur-md sm:p-6",
        tone.surfaceBorder,
        tone.surfaceGradient,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={stageKey}
          initial={{ opacity: 0, x: 30 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: {
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.15, ease: "easeIn" },
          }}
        >
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle2
                size={36}
                className="mx-auto text-emerald-500"
              />
              <h3 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
                {allSubmitted
                  ? t("submitted.lockedInAll")
                  : t("submitted.lockedIn")}
              </h3>
              {!allSubmitted && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("submitted.waitingOthers")}
                </p>
              )}
              {isHost && allSubmitted && (
                <button
                  type="button"
                  onClick={onSynthesize}
                  disabled={synthesizing}
                  className={cn(
                    HERO_CTA,
                    "mt-5 px-8 py-3.5 text-base",
                    tone.barGradient,
                  )}
                >
                  {synthesizing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {synthesizing
                    ? t("submitted.revealing")
                    : t("submitted.reveal")}
                </button>
              )}
              {!isHost && allSubmitted && (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {t("submitted.guestWaiting")}
                </p>
              )}
            </div>
          ) : currentQuestion ? (
            <>
              <QuestionCard
                title={currentQuestion.text}
                type={currentQuestion.type}
                options={currentQuestion.options}
                placeholder={currentQuestion.placeholder}
                value={localAnswers[currentQuestion.id]}
                onChange={(value: QuestionValue) =>
                  setLocalAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: value,
                  }))
                }
                contentType={contentType}
              />
              <div className="mt-5 flex items-center justify-between gap-3">
                <PillButton
                  onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
                  disabled={currentQ === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
                >
                  <ArrowLeft size={14} />
                  {t("quiz.back")}
                </PillButton>
                {currentQ === questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={onSubmitAnswers}
                    disabled={
                      submitting ||
                      !hasAnswer(localAnswers[currentQuestion.id])
                    }
                    className={cn(
                      PRIMARY_CTA,
                      "px-5 py-2.5 text-sm",
                      tone.barGradient,
                    )}
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    {submitting ? t("quiz.submitting") : t("quiz.submit")}
                    {!submitting ? <ArrowRight size={14} /> : null}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentQ((i) => i + 1)}
                    disabled={!hasAnswer(localAnswers[currentQuestion.id])}
                    className={cn(
                      PRIMARY_CTA,
                      "px-5 py-2.5 text-sm",
                      tone.barGradient,
                    )}
                  >
                    {t("quiz.next")}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
