"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { cn } from "@/lib/utils";

type ContentType = "movie" | "book" | "both";
const PREF_QUESTION_COUNT_KEY = "smart_advisor_pref_question_count";

const QuestionCountPage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { contentType, setQuestionCount: setStoreQuestionCount } =
    useQuizStore();
  const t = useTranslations("Quiz");
  const tc = useTranslations("Common");
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!contentType) {
      router.push("/content-selection");
    }
  }, [contentType, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCount = Number(
      window.localStorage.getItem(PREF_QUESTION_COUNT_KEY) || "5",
    );
    if (Number.isFinite(storedCount) && storedCount >= 3 && storedCount <= 15) {
      setQuestionCount(storedCount);
    }
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      setStoreQuestionCount(questionCount);
      router.push("/questionnaire");
    } catch (error) {
      console.error("Error proceeding to questionnaire:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeDisplay = (type: ContentType) =>
    t(`questionCount.contentTypes.${type}`);

  if (!ready || !contentType) {
    return <PageLoader text={tc("loading")} />;
  }

  return (
    <QuizStepShell
      category={t("category")}
      stepLabel={t("stepOf", { current: 2, total: 4 })}
      progress={50}
      onBack={() => router.push("/content-selection")}
    >
      <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("questionCount.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {t("questionCount.subtitle", {
              contentType: getContentTypeDisplay(contentType as ContentType),
            })}
          </p>
        </motion.div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/60 px-4 py-6 sm:px-6 sm:py-8 dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
          <div className="mb-5 text-center">
            <motion.div
              key={questionCount}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-6xl font-black tracking-tighter text-transparent sm:text-7xl"
            >
              {questionCount}
            </motion.div>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("questionCount.questionsLabel", { count: questionCount })}
            </p>
          </div>

          <input
            type="range"
            min={3}
            max={15}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
            aria-label={t("questionCount.ariaCount")}
            className="w-full cursor-pointer accent-indigo-500"
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>3</span>
            <span>15</span>
          </div>

          <motion.p
            key={`label-${questionCount}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 text-center text-base font-bold tracking-tight text-slate-700 dark:text-slate-200 sm:text-lg"
          >
            {questionCount <= 5
              ? t("questionCount.tone.quick")
              : questionCount <= 10
                ? t("questionCount.tone.balanced")
                : t("questionCount.tone.comprehensive")}
          </motion.p>
        </div>

        <div className="mt-8 flex items-center justify-end">
          <PillButton
            onClick={handleContinue}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center gap-2 bg-white px-7 py-3 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white",
            )}
          >
            {isLoading
              ? t("questionCount.continuing")
              : t("questionCount.continue")}
            <ArrowRight size={16} />
          </PillButton>
        </div>
      </div>
    </QuizStepShell>
  );
};

export default QuestionCountPage;
