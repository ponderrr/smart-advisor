'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Book, Film, LogOut, Target } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
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
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: (type: ContentType) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  icon,
  title,
  description,
  isSelected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "w-full rounded-3xl border p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300",
        isSelected
          ? "border-indigo-500 bg-white shadow-lg dark:border-indigo-400 dark:bg-slate-900/70"
          : "border-slate-200/80 bg-white/80 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/65 dark:hover:border-indigo-500/60",
      )}
    >
      <div className={cn(
        "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full",
        isSelected
          ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-900"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      )}>
        {icon}
      </div>
      <h3 className="text-2xl font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </button>
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
    { name: "Start Quiz", link: "/content-selection" },
    { name: "History", link: "/history" },
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
      icon: <Film size={22} />,
      title: "Movie",
      description: "Find a movie recommendation that fits your current mood and pace.",
    },
    {
      id: "book" as ContentType,
      icon: <Book size={22} />,
      title: "Book",
      description: "Get a reading recommendation tailored to your style and interests.",
    },
    {
      id: "both" as ContentType,
      icon: <Target size={22} />,
      title: "Both",
      description: "Get one movie and one book recommendation in the same flow.",
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
              className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <HoverBorderGradient
              onClick={handleContinue}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="rounded-full"
              className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
            >
              Continue
            </HoverBorderGradient>
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
            <HoverBorderGradient
              onClick={() => {
                handleContinue();
                setIsMobileMenuOpen(false);
              }}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="mt-2 w-full rounded-full"
              className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
            >
              Continue
            </HoverBorderGradient>
            <button
              type="button"
              onClick={async () => {
                await handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
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
                icon={card.icon}
                title={card.title}
                description={card.description}
                isSelected={selectedType === card.id}
                onClick={setSelectedType}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedType || isLoading}
              className={cn(
                "rounded-xl px-8 py-3 text-sm font-semibold transition-colors",
                selectedType && !isLoading
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
              )}
            >
              {isLoading ? "Continuing..." : "Continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContentSelectionPage;
