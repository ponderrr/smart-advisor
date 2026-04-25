"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

const VALIDATION_FLASH_MS = 650;
const VALIDATION_MESSAGE_MS = 3200;
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

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
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

interface DemoContentCardProps {
  title: string;
  description: string;
  mediaSrc: string;
  secondaryMediaSrc?: string;
  isSelected: boolean;
  onClick: () => void;
}

const DemoContentCard = ({
  title,
  description,
  mediaSrc,
  secondaryMediaSrc,
  isSelected,
  onClick,
}: DemoContentCardProps) => {
  return (
    <PillButton
      onClick={onClick}
      active={isSelected}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border p-0 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1",
        isSelected
          ? "border-indigo-500 bg-white shadow-lg dark:border-indigo-400 dark:bg-slate-900/70"
          : "border-slate-200/80 bg-white/80 hover:border-indigo-300 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
      )}
    >
      {isSelected && (
        <div className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
          <IconCheck className="h-4 w-4" />
        </div>
      )}

      <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {secondaryMediaSrc ? (
          <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full rounded-lg object-cover"
            />
            <video
              src={secondaryMediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full rounded-lg object-cover"
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
            className="h-full w-full object-contain p-2"
          />
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-xl font-black tracking-tight sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </PillButton>
  );
};

const DEMO_CONTENT_CARDS = [
  {
    option: "Movies",
    title: "Movie",
    description:
      "Find a movie recommendation that fits your current mood and pace.",
    mediaSrc: "/animations/Popcorn.webm",
  },
  {
    option: "Books",
    title: "Book",
    description:
      "Get a reading recommendation tailored to your style and interests.",
    mediaSrc: "/animations/Books.webm",
  },
  {
    option: "Both",
    title: "Both",
    description: "Get one movie and one book recommendation in the same flow.",
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
  const { setContentType, setQuestionCount, setFilters } = useQuizStore();

  const [questions] = useState<DemoQuestion[]>(() => buildDemoQuiz());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({});
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
          ? "Please type an answer before continuing."
          : current.type === "select_all"
            ? "Please select at least one option before continuing."
            : "Please select an option before continuing.",
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
      const confirmed = window.confirm(
        "Are you sure you want to go back to the home page?",
      );
      if (!confirmed) return;
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
        category="Demo quiz"
        stepLabel={`Question ${step + 1} of ${questions.length}`}
        progress={progress}
        onBack={handleBack}
        backLabel={step === 0 ? "Home" : "Previous"}
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
          className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65"
        >
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
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
                  <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {DEMO_CONTENT_CARDS.map((card) => (
                      <DemoContentCard
                        key={card.option}
                        title={card.title}
                        description={card.description}
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
                {step === questions.length - 1 ? "Continue" : "Next"}
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
