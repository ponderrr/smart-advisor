'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
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
    <motion.button
      type="button"
      onClick={() => onClick(id)}
      whileHover={{ y: -4 }}
      className={cn(
        "w-full overflow-hidden rounded-3xl border p-0 text-left shadow-sm backdrop-blur-md transition-all duration-300",
        isSelected
          ? "border-indigo-500 bg-white shadow-lg dark:border-indigo-400 dark:bg-slate-900/70"
          : "border-slate-200/80 bg-white/80 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
      )}
    >
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

      <div className="p-5">
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </motion.button>
  );
};

const ContentSelectionPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { setContentType } = useQuizStore();
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setContentType(selectedType);
      router.push("/question-count");
    } catch (error) {
      console.error("Error proceeding to question count:", error);
      setIsLoading(false);
    }
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
              className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              <LogOut size={14} />
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

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1 of 4</p>
            <h1 className="mt-4 text-4xl font-black tracking-tighter md:text-5xl">What would you like a recommendation for?</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Pick one option to start your personalized flow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <div className="mt-8 flex justify-center">
            <StatefulButton
              onClick={handleContinue}
              disabled={!selectedType || isLoading}
              state={isLoading ? "loading" : "idle"}
              className="h-11 w-auto rounded-full px-8 text-sm font-semibold"
            >
              Continue
            </StatefulButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContentSelectionPage;
