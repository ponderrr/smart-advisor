"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

const VALIDATION_FLASH_MS = 650;
const VALIDATION_MESSAGE_MS = 3200;
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { BookOpen, Film, Sparkles } from "lucide-react";

import {
  useQuizStore,
  type ContentType,
} from "@/features/quiz/store/quiz-store";
import {
  QuestionCard,
  hasQuestionAnswer,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import {
  buildDemoQuiz,
  type DemoQuestion,
} from "@/features/quiz/utils/demo-questions";
import { useLeaveGuard } from "@/features/quiz/hooks/use-leave-guard";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

interface DemoContentCardProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  mediaSrc: string;
  secondaryMediaSrc?: string;
  isSelected: boolean;
  onClick: () => void;
}

const DemoContentCard = ({
  eyebrow,
  title,
  description,
  icon,
  mediaSrc,
  secondaryMediaSrc,
  isSelected,
  onClick,
}: DemoContentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border bg-white/85 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950",
        isSelected
          ? "border-transparent shadow-indigo-500/15"
          : "border-slate-200/70 hover:border-slate-300 dark:border-slate-700/60 dark:hover:border-slate-600/80",
      )}
    >
      {/* Gradient accent ring when selected. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300",
          isSelected
            ? "opacity-100 ring-2 ring-indigo-500/70 dark:ring-indigo-400/70"
            : "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.06] transition-opacity duration-300 dark:from-indigo-400/[0.08] dark:to-violet-400/[0.08]",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Selected check chip */}
      <div
        className={cn(
          "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300",
          isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <IconCheck className="h-4 w-4" strokeWidth={3} />
      </div>

      {/* Mobile: horizontal layout (square thumb + content). md+: vertical. */}
      <div className="flex md:block">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-slate-100 sm:w-32 md:aspect-[16/10] md:w-full dark:bg-slate-800/80">
          {secondaryMediaSrc ? (
            <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
              <video
                src={mediaSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="h-full w-full rounded-xl object-cover md:rounded-2xl"
              />
              <video
                src={secondaryMediaSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="h-full w-full rounded-xl object-cover md:rounded-2xl"
              />
            </div>
          ) : (
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 md:p-3"
            />
          )}
        </div>

        <div className="relative flex-1 p-4 md:p-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
                isSelected
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700",
              )}
            >
              {icon}
            </span>
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em] transition-colors duration-300",
                isSelected
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {eyebrow}
            </p>
          </div>
          <h3 className="mt-2 text-lg font-black tracking-tight sm:text-xl md:text-2xl">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:mt-1.5">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

const DEMO_CONTENT_CARDS = [
  {
    option: "Movies",
    cardKey: "movie",
    icon: <Film size={14} />,
    mediaSrc: "/animations/Popcorn.webm",
  },
  {
    option: "Books",
    cardKey: "book",
    icon: <BookOpen size={14} />,
    mediaSrc: "/animations/Books.webm",
  },
  {
    option: "Both",
    cardKey: "both",
    icon: <Sparkles size={14} />,
    mediaSrc: "/animations/Popcorn.webm",
    secondaryMediaSrc: "/animations/Books.webm",
  },
] as const;

const mapContentType = (value: string): ContentType => {
  if (value === "Movies") return "movie";
  if (value === "Books") return "book";
  return "both";
};

export default function DemoPage() {
  const router = useRouter();
  const t = useTranslations("Demo.quiz");
  const { setContentType, setQuestionCount, setFilters } = useQuizStore();

  const [questions] = useState<DemoQuestion[]>(() => buildDemoQuiz());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({});

  // Once the user has answered anything, prompt before leaving the demo.
  useLeaveGuard(Object.keys(answers).length > 0);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const hasAnswer = hasQuestionAnswer(answers[current.id]);

  const setAnswer = (value: QuestionValue) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const summary = useMemo(() => {
    const contentType = answers.contentType;
    const allGenreValues = questions
      .filter((q) => q.type === "select_all")
      .flatMap((q) => {
        const v = answers[q.id];
        return Array.isArray(v) ? v : [];
      });
    const allMoodValues = questions
      .filter(
        (q) => q.type === "single_select" && q.id !== "contentType",
      )
      .map((q) => answers[q.id])
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    return {
      contentType: typeof contentType === "string" ? contentType : "Both",
      moods: allMoodValues,
      genres: allGenreValues,
    };
  }, [answers, questions]);

  const handleNext = () => {
    if (!hasAnswer) {
      setShowValidationFlash(true);
      setValidationMessage(
        current.type === "fill_in_blank"
          ? t("validation.fillInBlank")
          : current.type === "select_all"
            ? t("validation.selectAll")
            : t("validation.singleSelect"),
      );
      window.setTimeout(() => setShowValidationFlash(false), VALIDATION_FLASH_MS);
      window.setTimeout(() => setValidationMessage(null), VALIDATION_MESSAGE_MS);
      return;
    }
    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setContentType(mapContentType(summary.contentType));
    setQuestionCount(5);
    setFilters({ genres: summary.genres, moods: summary.moods });

    // Build a payload that includes the actual question text for each
    // answer so the demo recommendations API has full context.
    const answerPayload = questions
      .filter((q) => q.id !== "contentType")
      .map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        value: answers[q.id] ?? (q.type === "select_all" ? [] : ""),
      }));

    sessionStorage.setItem(
      "smart_advisor_demo_answers",
      JSON.stringify({
        contentType: summary.contentType,
        answers: answerPayload,
      }),
    );
    router.push("/demo/results");
  };

  const handleBack = () => {
    if (step === 0) {
      if (
        Object.keys(answers).length > 0 &&
        !window.confirm(t("leaveConfirm"))
      ) {
        return;
      }
      router.push("/");
      return;
    }
    setStep((prev) => prev - 1);
  };
  const [showValidationFlash, setShowValidationFlash] = useState(false);

  return (
    <>
      <link
        rel="preload"
        href="/animations/Popcorn.webm"
        as="fetch"
        type="video/webm"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/animations/Books.webm"
        as="fetch"
        type="video/webm"
        crossOrigin="anonymous"
      />
      <QuizStepShell
        category={t("category")}
        stepLabel={t("stepLabel", {
          current: step + 1,
          total: questions.length,
        })}
        progress={progress}
        onBack={handleBack}
        backLabel={step === 0 ? t("back.home") : t("back.previous")}
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
          className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65"
        >
          <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            <QuestionCard
              title={current.title}
              subtitle={current.subtitle}
              type={current.type}
              options={current.options}
              placeholder={current.placeholder}
              value={answers[current.id]}
              onChange={setAnswer}
              bodyOverride={
                current.id === "contentType" ? (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-7 sm:gap-4 md:grid-cols-3">
                    {DEMO_CONTENT_CARDS.map((card) => (
                      <DemoContentCard
                        key={card.option}
                        eyebrow={t(`cards.${card.cardKey}.eyebrow`)}
                        title={t(`cards.${card.cardKey}.title`)}
                        description={t(`cards.${card.cardKey}.description`)}
                        icon={card.icon}
                        mediaSrc={card.mediaSrc}
                        secondaryMediaSrc={
                          "secondaryMediaSrc" in card
                            ? card.secondaryMediaSrc
                            : undefined
                        }
                        isSelected={answers[current.id] === card.option}
                        onClick={() => setAnswer(card.option)}
                      />
                    ))}
                  </div>
                ) : undefined
              }
            />
          </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-end">
            <motion.div
              animate={
                showValidationFlash
                  ? { scale: [1, 1.03, 0.99, 1], x: [0, -4, 4, 0] }
                  : { scale: 1, x: 0 }
              }
              transition={{ duration: 0.45 }}
            >
              <PillButton
                onClick={handleNext}
                className={cn(
                  "inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black dark:bg-slate-900 dark:text-white",
                )}
              >
                {step === questions.length - 1 ? t("continue") : t("next")}
                <IconArrowRight className="h-4 w-4" />
              </PillButton>
            </motion.div>
          </div>
          {validationMessage ? (
            <p className="mt-3 text-right text-xs font-semibold text-red-500 dark:text-red-400">
              {validationMessage}
            </p>
          ) : null}
        </motion.div>
      </QuizStepShell>
    </>
  );
}
