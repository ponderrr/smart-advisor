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
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { cn } from "@/lib/utils";

type ContentType = "movie" | "book" | "music" | "both" | "mix";
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

  const tone = getAccentTone(contentType);
  return (
    <QuizStepShell
      category={t("category")}
      stepLabel={t("stepOf", { current: 2, total: 4 })}
      progress={50}
      initialProgress={25}
      onBack={() => router.push("/content-selection")}
      contentType={contentType}
    >
      <div
        className={cn(
          "rounded-3xl border bg-gradient-to-br p-6 shadow-sm backdrop-blur-md sm:p-8",
          tone.surfaceBorder,
          tone.surfaceGradient,
        )}
      >
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

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8 dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="mb-5 text-center">
            <motion.div
              key={questionCount}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-6xl",
                tone.barGradient,
              )}
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
            className={cn(
              "w-full cursor-pointer",
              contentType === "movie"
                ? "accent-amber-500"
                : contentType === "book"
                  ? "accent-emerald-500"
                  : contentType === "music"
                    ? "accent-rose-500"
                    : "accent-violet-500",
            )}
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>3</span>
            <span>15</span>
          </div>

          {(() => {
            // Bucket the 3–15 range into 5 named tiers. We key the animation
            // on the tier name (not the raw number) so the label only fades
            // in when the slider crosses into a new bucket, not on every tick.
            const tier =
              questionCount <= 4
                ? "quick"
                : questionCount <= 7
                  ? "focused"
                  : questionCount <= 10
                    ? "balanced"
                    : questionCount <= 13
                      ? "thorough"
                      : "comprehensive";
            // ~18s per question (read + answer) + ~30s for the AI to
            // generate, rounded up to the nearest whole minute. Caps at 1
            // so a 3-q quiz still reads "≈ 1 min" instead of disappearing.
            const estimateMin = Math.max(
              1,
              Math.ceil((questionCount * 18 + 30) / 60),
            );
            return (
              <>
                <motion.p
                  key={tier}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mt-4 text-center text-base font-bold tracking-tight text-slate-700 dark:text-slate-200 sm:text-lg"
                >
                  {t(`questionCount.tone.${tier}`)}
                </motion.p>
                <div className="mt-4 flex justify-center">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border bg-white/80 px-5 py-2 text-base font-black tracking-tight shadow-sm dark:bg-slate-900/60 sm:text-lg",
                      tone.surfaceBorder,
                      tone.text,
                    )}
                  >
                    {t("questionCount.estimate", { minutes: estimateMin })}
                  </span>
                </div>
              </>
            );
          })()}
        </div>

        <div className="mt-8 flex items-center justify-end">
          <PillButton
            onClick={handleContinue}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center gap-2 border-transparent bg-gradient-to-br px-7 py-3 text-sm font-black tracking-tight text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md",
              tone.barGradient,
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
