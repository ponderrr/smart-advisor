'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
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

type ContentType = "movie" | "book" | "both";

const QuestionCountPage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { contentType, setQuestionCount: setStoreQuestionCount } = useQuizStore();
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!contentType) {
      router.push("/content-selection");
    }
  }, [contentType, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      setStoreQuestionCount(questionCount);
      router.push("/questionnaire");
    } catch (error) {
      console.error("Error proceeding to questionnaire:", error);
      setIsLoading(false);
    }
  };

  const getContentTypeDisplay = (type: ContentType) => {
    if (type === "both") return "movie and book";
    return type;
  };

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Start Quiz", link: "/content-selection" },
    { name: "History", link: "/history" },
  ];

  if (!contentType) return null;

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
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-10 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2 of 4</p>
            <h1 className="mt-4 text-4xl font-black tracking-tighter md:text-5xl">
              How many questions should we ask?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Choose the depth for your {getContentTypeDisplay(contentType as ContentType)} recommendation flow.
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65 md:p-8"
          >
            <div className="mb-8 text-center">
              <div className="text-6xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {questionCount}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {questionCount === 1 ? "Question" : "Questions"}
              </p>
            </div>

            <div className="relative mb-4">
              <input
                type="range"
                min={3}
                max={15}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer accent-indigo-500"
              />
              <motion.div
                key={questionCount}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400"
              >
                {questionCount <= 5
                  ? "Quick and focused"
                  : questionCount <= 10
                    ? "Balanced depth"
                    : "Comprehensive detail"}
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>3 minimum</span>
              <span>15 maximum</span>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => router.push('/content-selection')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading}
              className={cn(
                "rounded-xl px-6 py-3 text-sm font-semibold transition-colors",
                isLoading
                  ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500",
              )}
            >
              {isLoading ? "Continuing..." : "Continue"}
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QuestionCountPage;
