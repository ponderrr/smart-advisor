"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react";

import { useQuizStore, type ContentType } from "@/features/quiz/store/quiz-store";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type DemoQuestion = {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
};

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "contentType",
    title: "What are you looking for today?",
    subtitle: "Pick one so we can tailor your recommendation flow.",
    options: ["Movies", "Books", "Both"],
  },
  {
    id: "mood",
    title: "What mood are you in?",
    subtitle: "We use this to shape tone and pacing.",
    options: ["Comforting", "Suspenseful", "Inspiring", "Mind-bending"],
  },
  {
    id: "pace",
    title: "How fast should it move?",
    subtitle: "Choose your ideal pace for tonight.",
    options: ["Slow burn", "Balanced", "Fast and intense"],
  },
  {
    id: "time",
    title: "How much time do you have?",
    subtitle: "This helps us avoid overlong picks.",
    options: ["Under 2 hours", "2 to 4 hours", "Weekend binge"],
  },
];

const mapContentType = (value: string): ContentType => {
  if (value === "Movies") return "movie";
  if (value === "Books") return "book";
  return "both";
};

export default function DemoPage() {
  const router = useRouter();
  const { setContentType, setQuestionCount, setFilters } = useQuizStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const current = DEMO_QUESTIONS[step];
  const progress = ((step + 1) / DEMO_QUESTIONS.length) * 100;
  const hasAnswer = Boolean(answers[current.id]);

  const summary = useMemo(
    () => ({
      contentType: answers.contentType || "Both",
      moods: answers.mood ? [answers.mood] : [],
      genres: answers.pace ? [answers.pace] : [],
    }),
    [answers],
  );

  const handleChoose = (option: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  };

  const handleNext = () => {
    if (!hasAnswer) {
      setShowValidationFlash(true);
      setValidationMessage("Please select an option before continuing.");
      window.setTimeout(() => setShowValidationFlash(false), 650);
      window.setTimeout(() => setValidationMessage(null), 3200);
      return;
    }
    if (step < DEMO_QUESTIONS.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setContentType(mapContentType(summary.contentType));
    setQuestionCount(5);
    setFilters({ genres: summary.genres, moods: summary.moods });
    sessionStorage.setItem(
      "smart_advisor_demo_answers",
      JSON.stringify({
        ...answers,
        contentType: summary.contentType,
      }),
    );
    router.push("/demo/results");
  };

  const handleBack = () => {
    if (step === 0) {
      const confirmed = window.confirm("Are you sure you want to go back to the home page?");
      if (!confirmed) return;
      router.push("/");
      return;
    }
    setStep((prev) => prev - 1);
  };
  const [showValidationFlash, setShowValidationFlash] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
            {step + 1} out of {DEMO_QUESTIONS.length} questions
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Demo Survey
            </p>
            <ThemeToggle />
          </div>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {current.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                {current.subtitle}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {current.options.map((option) => {
                  const selected = answers[current.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleChoose(option)}
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
              <HoverBorderGradient
                as="button"
                onClick={handleNext}
                containerClassName="rounded-full"
                className={cn(
                  "inline-flex items-center justify-center gap-2 bg-black px-6 py-2.5 text-sm font-black tracking-tight text-white dark:bg-black",
                )}
              >
                {step === DEMO_QUESTIONS.length - 1 ? "Continue" : "Next"}
                <IconArrowRight className="h-4 w-4" />
              </HoverBorderGradient>
            </motion.div>
          </div>
          {validationMessage ? (
            <p className="mt-3 text-right text-xs font-semibold text-red-500 dark:text-red-400">
              {validationMessage}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
