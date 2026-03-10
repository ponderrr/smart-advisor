'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
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

type ContentType = "movie" | "book" | "both" | null;
const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";

interface SelectionCardProps {
  id: ContentType;
  title: string;
  description: string;
  mediaSrc: string;
  secondaryMediaSrc?: string;
  isSelected: boolean;
  onClick: (type: ContentType) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  title,
  description,
  mediaSrc,
  secondaryMediaSrc,
  isSelected,
  onClick,
}) => {
  return (
    <GlowPillButton
      onClick={() => onClick(id)}
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
          <Check size={16} />
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
        <h3 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </GlowPillButton>
  );
};

const ContentSelectionPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { setContentType } = useQuizStore();
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showValidationFlash, setShowValidationFlash] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  const handleContinue = () => {
    if (!selectedType) {
      setShowValidationFlash(true);
      setValidationMessage("Please select an option before continuing.");
      window.setTimeout(() => setShowValidationFlash(false), 650);
      window.setTimeout(() => setValidationMessage(null), 3200);
      return;
    }

    setIsLoading(true);
    setContentType(selectedType);
    router.push("/question-count");
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const cards = [
    {
      id: "movie" as ContentType,
      title: "Movie",
      description: "Find a movie recommendation that fits your current mood and pace.",
      mediaSrc: "/animations/Popcorn.webm",
    },
    {
      id: "book" as ContentType,
      title: "Book",
      description: "Get a reading recommendation tailored to your style and interests.",
      mediaSrc: "/animations/Books.webm",
    },
    {
      id: "both" as ContentType,
      title: "Both",
      description: "Get one movie and one book recommendation in the same flow.",
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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex w-[320px] shrink-0 items-center">
            <NavbarLogo />
          </div>
          <div className="flex flex-1 justify-center">
            <NavItems items={navItems} className="justify-center px-2" />
          </div>
          <div className="flex w-[320px] shrink-0 items-center justify-end gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              Sign Out
            </button>
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
            <button
              type="button"
              onClick={async () => {
                await handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-rose-600 dark:text-rose-400"
            >
              Sign Out
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {/* Demo-style header bar */}
          <div className="mb-8 flex items-center justify-between gap-3">
            <GlowPillButton
              onClick={handleBack}
              className="inline-flex items-center gap-2 border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70"
            >
              <ArrowLeft size={16} />
              Back
            </GlowPillButton>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              Step 1 of 4
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Quiz Setup
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={false}
              animate={{ width: "25%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Card container */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
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
                    title={card.title}
                    description={card.description}
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
                <GlowPillButton
                  onClick={handleContinue}
                  disabled={isLoading}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 bg-white px-6 py-2.5 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white",
                  )}
                >
                  {isLoading ? "Continuing..." : "Continue"}
                  <ArrowRight size={16} />
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
};

export default ContentSelectionPage;
