"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react";

import {
  useQuizStore,
  type ContentType,
} from "@/features/quiz/store/quiz-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

type DemoQuestion = {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
};

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
    <GlowPillButton
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
    </GlowPillButton>
  );
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
  {
    id: "vibe",
    title: "Which vibe sounds best tonight?",
    subtitle: "We use this to fine-tune the final recommendation mix.",
    options: ["Easy and fun", "Thought-provoking", "Emotional", "High energy"],
  },
];

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

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "How It Works", link: "/#how-it-works" },
    { name: "FAQ", link: "/#faq" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex min-w-0 flex-1 items-center">
            <NavbarLogo />
          </div>
          <div className="flex shrink-0 justify-center px-6">
            <NavItems items={navItems} className="justify-center px-2" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            <ThemeToggle />
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen}>
            {navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  router.push(item.link);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <GlowPillButton
              onClick={handleBack}
              className="inline-flex items-center gap-2 border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70"
            >
              <IconArrowLeft className="h-4 w-4" />
              Back
            </GlowPillButton>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              {step + 1} out of {DEMO_QUESTIONS.length} questions
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Demo Survey
            </p>
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

                {current.id === "contentType" ? (
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
                        onClick={() => handleChoose(card.option)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {current.options.map((option) => {
                      const selected = answers[current.id] === option;
                      return (
                        <GlowPillButton
                          key={option}
                          onClick={() => handleChoose(option)}
                          active={selected}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                            selected
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                              : "border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
                          )}
                        >
                          <span className="text-sm font-semibold sm:text-base">
                            {option}
                          </span>
                          {selected ? (
                            <IconCheck className="h-5 w-5" />
                          ) : (
                            <span className="h-5 w-5 rounded-full border border-slate-300 transition group-hover:border-indigo-300 dark:border-slate-600" />
                          )}
                        </GlowPillButton>
                      );
                    })}
                  </div>
                )}
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
                <GlowPillButton
                  onClick={handleNext}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black dark:bg-slate-900 dark:text-white",
                  )}
                >
                  {step === DEMO_QUESTIONS.length - 1 ? "Continue" : "Next"}
                  <IconArrowRight className="h-4 w-4" />
                </GlowPillButton>
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
    </div>
  );
}
