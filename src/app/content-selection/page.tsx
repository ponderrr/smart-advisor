"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const VALIDATION_FLASH_MS = 650;
const VALIDATION_MESSAGE_MS = 3200;
import { Check, ArrowRight, Film, BookOpen, Music, Sparkles } from "lucide-react";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { cn } from "@/lib/utils";

type ContentType = "movie" | "book" | "music" | "mix" | null;
const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";

type CardAccent = "amber" | "emerald" | "rose" | "violet";

const CARD_ACCENTS: Record<
  CardAccent,
  {
    ring: string;
    shadow: string;
    overlay: string;
    chipGradient: string;
    chipShadow: string;
    iconActive: string;
    eyebrowActive: string;
    fallbackBg: string;
    fallbackText: string;
  }
> = {
  amber: {
    ring: "ring-amber-500/70 dark:ring-amber-400/70",
    shadow: "shadow-amber-500/15",
    overlay:
      "bg-gradient-to-br from-amber-500/[0.08] via-transparent to-orange-500/[0.08] dark:from-amber-400/[0.10] dark:to-orange-400/[0.10]",
    chipGradient: "from-amber-500 to-orange-500",
    chipShadow: "shadow-amber-500/30",
    iconActive: "bg-amber-500 text-white",
    eyebrowActive: "text-amber-600 dark:text-amber-400",
    fallbackBg:
      "from-amber-100 via-white to-orange-100 dark:from-amber-500/10 dark:via-slate-800/40 dark:to-orange-500/10",
    fallbackText: "text-amber-500 dark:text-amber-300",
  },
  emerald: {
    ring: "ring-emerald-500/70 dark:ring-emerald-400/70",
    shadow: "shadow-emerald-500/15",
    overlay:
      "bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-500/[0.08] dark:from-emerald-400/[0.10] dark:to-teal-400/[0.10]",
    chipGradient: "from-emerald-500 to-teal-500",
    chipShadow: "shadow-emerald-500/30",
    iconActive: "bg-emerald-500 text-white",
    eyebrowActive: "text-emerald-600 dark:text-emerald-400",
    fallbackBg:
      "from-emerald-100 via-white to-teal-100 dark:from-emerald-500/10 dark:via-slate-800/40 dark:to-teal-500/10",
    fallbackText: "text-emerald-500 dark:text-emerald-300",
  },
  rose: {
    ring: "ring-rose-500/70 dark:ring-rose-400/70",
    shadow: "shadow-rose-500/15",
    overlay:
      "bg-gradient-to-br from-rose-500/[0.08] via-transparent to-pink-500/[0.08] dark:from-rose-400/[0.10] dark:to-pink-400/[0.10]",
    chipGradient: "from-rose-500 to-pink-500",
    chipShadow: "shadow-rose-500/30",
    iconActive: "bg-rose-500 text-white",
    eyebrowActive: "text-rose-600 dark:text-rose-400",
    fallbackBg:
      "from-rose-100 via-white to-pink-100 dark:from-rose-500/10 dark:via-slate-800/40 dark:to-pink-500/10",
    fallbackText: "text-rose-500 dark:text-rose-300",
  },
  violet: {
    ring: "ring-violet-500/70 dark:ring-violet-400/70",
    shadow: "shadow-violet-500/15",
    overlay:
      "bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.08] dark:from-indigo-400/[0.10] dark:to-violet-400/[0.10]",
    chipGradient: "from-indigo-500 to-violet-500",
    chipShadow: "shadow-violet-500/30",
    iconActive: "bg-violet-500 text-white",
    eyebrowActive: "text-violet-600 dark:text-violet-400",
    fallbackBg:
      "from-indigo-100 via-white to-violet-100 dark:from-indigo-500/10 dark:via-slate-800/40 dark:to-violet-500/10",
    fallbackText: "text-violet-500 dark:text-violet-300",
  },
};

interface SelectionCardProps {
  id: ContentType;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  mediaSrc?: string;
  secondaryMediaSrc?: string;
  fallbackIcon?: React.ReactNode;
  accent: CardAccent;
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
  fallbackIcon,
  accent,
  isSelected,
  onClick,
}) => {
  const tone = CARD_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={isSelected}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border bg-white/85 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-900/65 dark:focus-visible:ring-offset-slate-950",
        isSelected
          ? cn("border-transparent", tone.shadow)
          : "border-slate-200/70 hover:border-slate-300 dark:border-slate-700/60 dark:hover:border-slate-600/80",
      )}
    >
      {/* Gradient accent ring when selected — sits on top of the card border. */}
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
        <Check size={16} strokeWidth={3} />
      </div>

      {/*
        Mobile uses a horizontal layout (square thumbnail + content) so three
        cards don't push the page far below the fold. Desktop (md+) keeps the
        vertical layout with the wide 16:10 video preview.
      */}
      <div className="flex md:block">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-slate-100 sm:w-32 md:aspect-[16/10] md:w-full dark:bg-slate-800/80">
          {secondaryMediaSrc && mediaSrc ? (
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
          ) : mediaSrc ? (
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 md:p-3"
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
                tone.fallbackBg,
                tone.fallbackText,
              )}
            >
              {fallbackIcon}
            </div>
          )}
        </div>

        <div className="relative flex-1 p-4 md:p-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
                isSelected
                  ? tone.iconActive
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700",
              )}
            >
              {icon}
            </span>
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em] transition-colors duration-300",
                isSelected
                  ? tone.eyebrowActive
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

const ContentSelectionPage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { setContentType } = useQuizStore();
  const t = useTranslations("Quiz");
  const tc = useTranslations("Common");
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationFlash, setShowValidationFlash] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const handleContinue = () => {
    if (!selectedType) {
      setShowValidationFlash(true);
      setValidationMessage(t("contentSelection.validation"));
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

  const cards: Array<{
    id: ContentType;
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    mediaSrc?: string;
    secondaryMediaSrc?: string;
    fallbackIcon?: React.ReactNode;
    accent: CardAccent;
  }> = [
    {
      id: "movie" as ContentType,
      eyebrow: t("contentSelection.cards.movie.eyebrow"),
      title: t("contentSelection.cards.movie.title"),
      description: t("contentSelection.cards.movie.description"),
      icon: <Film size={14} />,
      fallbackIcon: <Film size={72} strokeWidth={1.5} />,
      accent: "amber",
    },
    {
      id: "book" as ContentType,
      eyebrow: t("contentSelection.cards.book.eyebrow"),
      title: t("contentSelection.cards.book.title"),
      description: t("contentSelection.cards.book.description"),
      icon: <BookOpen size={14} />,
      // BookOpen and Music have visual mass weighted to the bottom of
      // their SVG viewBox, so a flex-centered container makes them read
      // ~6px lower than Film/Sparkles. Nudge upward to bring all four
      // icons onto the same visual baseline.
      fallbackIcon: (
        <BookOpen size={72} strokeWidth={1.5} className="-translate-y-1.5" />
      ),
      accent: "emerald",
    },
    {
      id: "music" as ContentType,
      eyebrow: t("contentSelection.cards.music.eyebrow"),
      title: t("contentSelection.cards.music.title"),
      description: t("contentSelection.cards.music.description"),
      icon: <Music size={14} />,
      fallbackIcon: (
        <Music size={72} strokeWidth={1.5} className="-translate-y-1.5" />
      ),
      accent: "rose",
    },
    {
      id: "mix" as ContentType,
      eyebrow: t("contentSelection.cards.mix.eyebrow"),
      title: t("contentSelection.cards.mix.title"),
      description: t("contentSelection.cards.mix.description"),
      icon: <Sparkles size={14} />,
      fallbackIcon: <Sparkles size={72} strokeWidth={1.5} />,
      accent: "violet",
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = window.localStorage.getItem(PREF_CONTENT_KEY);
    if (
      storedContent &&
      ["movie", "book", "music", "mix"].includes(storedContent)
    ) {
      setSelectedType(storedContent as ContentType);
    }
  }, []);

  if (!ready) {
    return <PageLoader text={tc("loading")} />;
  }

  // Pass the in-flight selection through to the shell so the progress bar
  // and eyebrow tint shift the moment the user picks a card — no purple
  // "neutral" flash between content-selection and question-count once a
  // choice is made.
  return (
    <QuizStepShell
      category={t("category")}
      stepLabel={t("stepOf", { current: 1, total: 4 })}
      progress={25}
      onBack={handleBack}
      backLabel={t("back.dashboard")}
      contentType={selectedType}
    >
      <div className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm backdrop-blur-md sm:p-6 md:p-8 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-slate-900/40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            {t("contentSelection.title")}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {t("contentSelection.subtitle")}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
                fallbackIcon={card.fallbackIcon}
                accent={card.accent}
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
                "inline-flex items-center justify-center gap-2 border-transparent bg-gradient-to-br px-6 py-2.5 text-sm font-black tracking-tight text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md",
                selectedType
                  ? CARD_ACCENTS[
                      selectedType === "movie"
                        ? "amber"
                        : selectedType === "book"
                          ? "emerald"
                          : selectedType === "music"
                            ? "rose"
                            : "violet"
                    ].chipGradient
                  : "from-slate-700 to-slate-900 dark:from-slate-300 dark:to-white dark:text-slate-900",
              )}
            >
              {isLoading
                ? t("contentSelection.continuing")
                : t("contentSelection.continue")}
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
