"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

const VALIDATION_FLASH_MS = 650;
const VALIDATION_MESSAGE_MS = 3200;
import { Check, ArrowRight, Film, BookOpen, Sparkles } from "lucide-react";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { cn } from "@/lib/utils";

type ContentType = "movie" | "book" | "both" | null;
const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";

interface SelectionCardProps {
  id: ContentType;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  mediaSrc: string;
  secondaryMediaSrc?: string;
  isSelected: boolean;
  onClick: (type: ContentType) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  eyebrow,
  title,
  description,
  icon,
  mediaSrc,
  secondaryMediaSrc,
  isSelected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={isSelected}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border bg-white/85 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950",
        isSelected
          ? "border-transparent shadow-indigo-500/15"
          : "border-slate-200/70 hover:border-slate-300 dark:border-slate-700/60 dark:hover:border-slate-600/80",
      )}
    >
      {/* Gradient accent ring when selected — sits on top of the card border. */}
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
        <Check size={16} strokeWidth={3} />
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800/80">
        {secondaryMediaSrc ? (
          <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full rounded-2xl object-cover"
            />
            <video
              src={secondaryMediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full rounded-2xl object-cover"
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
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="relative p-5">
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
        <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </button>
  );
};

const ContentSelectionPage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { setContentType } = useQuizStore();
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationFlash, setShowValidationFlash] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const handleContinue = () => {
    if (!selectedType) {
      setShowValidationFlash(true);
      setValidationMessage("Please select an option before continuing.");
      window.setTimeout(() => setShowValidationFlash(false), VALIDATION_FLASH_MS);
      window.setTimeout(() => setValidationMessage(null), VALIDATION_MESSAGE_MS);
      return;
    }

    setIsLoading(true);
    setContentType(selectedType);
    router.push("/question-count");
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const cards = [
    {
      id: "movie" as ContentType,
      eyebrow: "On screen",
      title: "Movie",
      description:
        "A film tuned to your current mood and pace.",
      icon: <Film size={14} />,
      mediaSrc: "/animations/Popcorn.webm",
    },
    {
      id: "book" as ContentType,
      eyebrow: "On the shelf",
      title: "Book",
      description: "A read tailored to your style and interests.",
      icon: <BookOpen size={14} />,
      mediaSrc: "/animations/Books.webm",
    },
    {
      id: "both" as ContentType,
      eyebrow: "Both",
      title: "One of each",
      description: "A movie and a book picked together in one go.",
      icon: <Sparkles size={14} />,
      mediaSrc: "/animations/Popcorn.webm",
      secondaryMediaSrc: "/animations/Books.webm",
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = window.localStorage.getItem(PREF_CONTENT_KEY);
    if (storedContent && ["movie", "book", "both"].includes(storedContent)) {
      setSelectedType(storedContent as ContentType);
    }
  }, []);

  if (!ready) {
    return <PageLoader text="Loading..." />;
  }

  return (
    <QuizStepShell
      category="Quiz setup"
      stepLabel="Step 1 of 4"
      progress={25}
      onBack={handleBack}
      backLabel="Dashboard"
    >
      <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/65">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            What would you like a recommendation for?
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Pick one so we can tailor your recommendation flow.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <SelectionCard
                key={card.id}
                id={card.id}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                icon={card.icon}
                mediaSrc={card.mediaSrc}
                secondaryMediaSrc={card.secondaryMediaSrc}
                isSelected={selectedType === card.id}
                onClick={setSelectedType}
              />
            ))}
          </div>
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
              onClick={handleContinue}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white",
              )}
            >
              {isLoading ? "Continuing..." : "Continue"}
              <ArrowRight size={16} />
            </PillButton>
          </motion.div>
        </div>
        {validationMessage ? (
          <p className="mt-3 text-right text-xs font-semibold text-red-500 dark:text-red-400">
            {validationMessage}
          </p>
        ) : null}
      </div>
    </QuizStepShell>
  );
};

export default ContentSelectionPage;
