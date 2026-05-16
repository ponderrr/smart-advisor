"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

const VALIDATION_FLASH_MS = 650;
const VALIDATION_MESSAGE_MS = 3200;
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { BookOpen, Film, Music, Sparkles } from "lucide-react";

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
import {
  CARD_ACCENTS,
  type CardAccent,
} from "@/features/quiz/components/steps/content-selection-step";
import {
  getAccentName,
  getAccentTone,
} from "@/features/quiz/utils/content-accent";
import { useLeaveGuard } from "@/features/quiz/hooks/use-leave-guard";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { ResultsLoadingState } from "@/features/recommendations/components/results-loading-state";
import { AppNavbar } from "@/components/app-navbar";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import {
  DemoResultsContent,
  type DemoAnswerPayload,
  type DemoContentType,
  type DemoItem,
  type DemoResultsError,
} from "./_components/demo-results-content";

type DemoPhase = "quiz" | "generating" | "results" | "error";

const toDemoContentType = (value: string): DemoContentType => {
  if (value === "Movies") return "movie";
  if (value === "Books") return "book";
  if (value === "Music") return "music";
  return "mix";
};

interface DemoContentCardProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fallbackIcon: React.ReactNode;
  accent: CardAccent;
  isSelected: boolean;
  onClick: () => void;
}

// Mirrors the real quiz's SelectionCard (content-selection-step.tsx): same
// surface, accent ring/overlay, check chip, and fallback-icon media block —
// so the demo's content picker reads identically to the live flow.
const DemoContentCard = ({
  eyebrow,
  title,
  description,
  icon,
  fallbackIcon,
  accent,
  isSelected,
  onClick,
}: DemoContentCardProps) => {
  const tone = CARD_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border bg-white/85 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950",
        isSelected
          ? cn("border-transparent", tone.shadow)
          : "border-slate-200/70 hover:border-slate-300 dark:border-slate-700/60 dark:hover:border-slate-600/80",
      )}
    >
      {/* Gradient accent ring when selected. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300",
          isSelected ? cn("opacity-100 ring-2", tone.ring) : "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300",
          tone.overlay,
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Selected check chip */}
      <div
        className={cn(
          "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg transition-all duration-300",
          tone.chipGradient,
          tone.chipShadow,
          isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <IconCheck className="h-4 w-4" strokeWidth={3} />
      </div>

      {/* Mobile: horizontal layout (square thumb + content). md+: vertical. */}
      <div className="flex md:block">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-slate-100 sm:w-32 md:aspect-[16/10] md:w-full dark:bg-slate-800/80">
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
              tone.fallbackBg,
              tone.fallbackText,
            )}
          >
            {fallbackIcon}
          </div>
        </div>

        <div className="relative flex-1 p-4 md:p-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
                isSelected ? tone.iconActive : tone.iconRest,
              )}
            >
              {icon}
            </span>
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em] transition-colors duration-300",
                tone.eyebrowActive,
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

// Matches the real quiz's content options (content-selection-step.tsx):
// movie/book/music/mix, same accents and lucide icons.
const DEMO_CONTENT_CARDS = [
  {
    option: "Movies",
    cardKey: "movie",
    icon: <Film size={14} />,
    fallbackIcon: <Film size={72} strokeWidth={1.5} />,
    accent: "amber",
  },
  {
    option: "Books",
    cardKey: "book",
    icon: <BookOpen size={14} />,
    fallbackIcon: <BookOpen size={72} strokeWidth={1.5} />,
    accent: "emerald",
  },
  {
    option: "Music",
    cardKey: "music",
    icon: <Music size={14} />,
    fallbackIcon: <Music size={72} strokeWidth={1.5} />,
    accent: "rose",
  },
  {
    option: "Mix",
    cardKey: "mix",
    icon: <Sparkles size={14} />,
    fallbackIcon: <Sparkles size={72} strokeWidth={1.5} />,
    accent: "violet",
  },
] as const;

const mapContentType = (value: string): ContentType => {
  if (value === "Movies") return "movie";
  if (value === "Books") return "book";
  if (value === "Music") return "music";
  return "mix";
};

export default function DemoPage() {
  const router = useRouter();
  const t = useTranslations("Demo.quiz");
  const { setContentType, setQuestionCount, setFilters } = useQuizStore();

  const tResults = useTranslations("Demo.results");

  const [questions, setQuestions] = useState<DemoQuestion[]>(() =>
    buildDemoQuiz(),
  );
  const [step, setStep] = useState(0);
  // 1 = forward (next), -1 = back. Drives the AnimatePresence slide
  // direction so the demo morphs between steps like the real quiz.
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({});

  // The whole demo lives on one route: the card morphs quiz → generating
  // (loading skeleton in the card) → results/error, exactly like /quiz.
  const [phase, setPhase] = useState<DemoPhase>("quiz");
  const [items, setItems] = useState<DemoItem[]>([]);
  const [genError, setGenError] = useState<DemoResultsError | null>(null);
  const [resultType, setResultType] = useState<DemoContentType>("mix");
  // Invalidates an in-flight generation if the user retakes mid-request.
  const genRef = useRef(0);

  // Match the real quiz: only guard once the user is actually answering
  // questions (step > 0). The content-selection step never prompts —
  // leaving from there just exits, and finishing morphs in place (no
  // navigation), so completion never prompts either.
  useLeaveGuard(
    phase === "quiz" && step > 0 && Object.keys(answers).length > 0,
    t("leaveConfirm"),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const hasAnswer = hasQuestionAnswer(answers[current.id]);

  // Mirror the real quiz: once a content type is picked, the shell chrome
  // (eyebrow + progress bar) and the card surface morph to its accent.
  // Stays null (violet) until the user picks on step 0.
  const contentAnswer = answers.contentType;
  const shellContentType: ContentType | null =
    typeof contentAnswer === "string" ? mapContentType(contentAnswer) : null;
  const shellTone = getAccentTone(shellContentType);

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
      contentType: typeof contentType === "string" ? contentType : "Mix",
      moods: allMoodValues,
      genres: allGenreValues,
    };
  }, [answers, questions]);

  // Fetch demo recommendations while the loading skeleton shows in the
  // card. Holds the loader for >=1.4s so the morph doesn't flash, and
  // ignores its result if the user retook the quiz mid-request.
  const runGeneration = async (
    contentType: DemoContentType,
    answerPayload: DemoAnswerPayload[],
  ) => {
    const id = ++genRef.current;
    const start = Date.now();
    let nextItems: DemoItem[] = [];
    let nextError: DemoResultsError | null = null;

    try {
      const response = await fetch("/api/demo-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, answers: answerPayload }),
        cache: "no-store",
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const limit = typeof data?.limit === "number" ? data.limit : 3;
        nextError = {
          kind: "limit",
          message: tResults("errors.limitFallback", { limit }),
        };
      } else if (!response.ok) {
        nextError = {
          kind: "generic",
          message: tResults("errors.genericFallback"),
        };
      } else {
        const data = await response.json();
        nextItems = Array.isArray(data.items) ? data.items : [];
      }
    } catch (e) {
      console.error("Failed to load demo results:", e);
      nextError = {
        kind: "generic",
        message: tResults("errors.genericFallback"),
      };
    }

    const wait = Math.max(0, 1400 - (Date.now() - start));
    window.setTimeout(() => {
      if (genRef.current !== id) return; // superseded by a retake
      if (nextError) {
        setGenError(nextError);
        setPhase("error");
      } else {
        setItems(nextItems);
        setGenError(null);
        setPhase("results");
      }
    }, wait);
  };

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
      setSlideDirection(1);
      setStep((prev) => prev + 1);
      return;
    }

    setContentType(mapContentType(summary.contentType));
    setQuestionCount(5);
    setFilters({ genres: summary.genres, moods: summary.moods });

    // Build a payload that includes the actual question text for each
    // answer so the demo recommendations API has full context.
    const answerPayload: DemoAnswerPayload[] = questions
      .filter((q) => q.id !== "contentType")
      .map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        value: answers[q.id] ?? (q.type === "select_all" ? [] : ""),
      }));

    const contentType = toDemoContentType(summary.contentType);
    setResultType(contentType);
    // Morph the card to the loading skeleton, then results — no route
    // change, so no leave-guard prompt fires on completion.
    setSlideDirection(1);
    setPhase("generating");
    void runGeneration(contentType, answerPayload);
  };

  // Restart from a fresh (re-randomized) quiz, in place.
  const handleRetake = () => {
    genRef.current += 1; // drop any in-flight generation
    setItems([]);
    setGenError(null);
    setQuestions(buildDemoQuiz());
    setAnswers({});
    setStep(0);
    setSlideDirection(-1);
    setPhase("quiz");
  };

  const handleSignUp = () => router.push("/auth");

  const handleBack = () => {
    // Generating is a committed step — back is inert, like the real quiz.
    if (phase === "generating") return;
    if (phase === "results" || phase === "error") {
      router.push("/");
      return;
    }
    if (step === 0) {
      // useLeaveGuard (armed while answers exist) shows the localized
      // leave prompt for this router.push — exactly once.
      router.push("/");
      return;
    }
    setSlideDirection(-1);
    setStep((prev) => prev - 1);
  };
  const [showValidationFlash, setShowValidationFlash] = useState(false);

  const isQuiz = phase === "quiz";
  let shellStepLabel: string;
  let shellProgress: number;
  let backLabel: string;
  // The content pick isn't a question (mirrors the real quiz, which labels
  // its content-selection step separately) — so questions are counted from
  // the first real question, with the picker shown as "Pick a format".
  const questionTotal = questions.length - 1;
  if (phase === "quiz") {
    shellStepLabel =
      step === 0
        ? t("pickLabel")
        : t("stepLabel", { current: step, total: questionTotal });
    shellProgress = progress;
    backLabel = step === 0 ? t("back.home") : t("back.previous");
  } else if (phase === "generating") {
    shellStepLabel = tResults("loadingText");
    shellProgress = 100;
    backLabel = t("back.home");
  } else {
    // Results/error: mirror the real quiz, which shows the final
    // "question N of N" on its results screen (the payoff card carries its
    // own "Demo · Your picks" header, so the chrome stays a progress cue).
    shellStepLabel = t("stepLabel", {
      current: questionTotal,
      total: questionTotal,
    });
    shellProgress = 100;
    backLabel = t("back.home");
  }
  const animKey = isQuiz ? `q-${current.id}` : phase;

  return (
    <>
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
      <QuizStepShell
        category={t("category")}
        stepLabel={shellStepLabel}
        progress={shellProgress}
        onBack={handleBack}
        backLabel={backLabel}
        contentType={shellContentType}
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
          className={cn(
            "rounded-3xl border bg-gradient-to-br p-6 shadow-sm backdrop-blur-md transition-colors duration-300 sm:p-8",
            shellTone.surfaceBorder,
            shellTone.surfaceGradient,
          )}
        >
          {/* One AnimatePresence drives the whole flow — question steps,
              the in-card loading skeleton, then results/error — so the
              card morphs end to end like the real /quiz route. */}
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
                transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
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
            {phase === "quiz" ? (
              <QuestionCard
                title={current.title}
                subtitle={current.subtitle}
                type={current.type}
                options={current.options}
                placeholder={current.placeholder}
                value={answers[current.id]}
                onChange={setAnswer}
                contentType={shellContentType}
                bodyOverride={
                  current.id === "contentType" ? (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                      {DEMO_CONTENT_CARDS.map((card) => (
                        <DemoContentCard
                          key={card.option}
                          eyebrow={t(`cards.${card.cardKey}.eyebrow`)}
                          title={t(`cards.${card.cardKey}.title`)}
                          description={t(`cards.${card.cardKey}.description`)}
                          icon={card.icon}
                          fallbackIcon={card.fallbackIcon}
                          accent={card.accent}
                          isSelected={answers[current.id] === card.option}
                          onClick={() => setAnswer(card.option)}
                        />
                      ))}
                    </div>
                  ) : undefined
                }
              />
            ) : phase === "generating" ? (
              <ResultsLoadingState contentType={shellContentType} />
            ) : (
              <DemoResultsContent
                items={items}
                contentType={resultType}
                error={genError}
                onRetake={handleRetake}
                onSignUp={handleSignUp}
              />
            )}
          </motion.div>
          </AnimatePresence>

          {isQuiz ? (
            <>
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
                      "inline-flex items-center justify-center gap-2 border-transparent bg-gradient-to-br px-6 py-2.5 text-sm font-black tracking-tight text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                      // Always color-coded: violet (the mix accent) before a
                      // content type is picked, then the picked accent.
                      CARD_ACCENTS[getAccentName(shellContentType)]
                        .chipGradient,
                    )}
                  >
                    {step === questions.length - 1
                      ? t("continue")
                      : t("next")}
                    <IconArrowRight className="h-4 w-4" />
                  </PillButton>
                </motion.div>
              </div>
              {validationMessage ? (
                <p className="mt-3 text-right text-xs font-semibold text-red-500 dark:text-red-400">
                  {validationMessage}
                </p>
              ) : null}
            </>
          ) : null}
        </motion.div>
      </QuizStepShell>
      </main>
      </div>
    </>
  );
}
