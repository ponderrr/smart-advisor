'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { ThemeToggle } from "@/components/theme-toggle";
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
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
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

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-4xl flex-col justify-center">
          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/content-selection')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              Step 2 of 4
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Quiz Setup
              </p>
              <ThemeToggle />
            </div>
          </div>

          <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={false}
              animate={{ width: "50%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                How many questions should we ask?
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                Choose the depth for your {getContentTypeDisplay(contentType as ContentType)} recommendation flow.
              </p>
            </motion.div>

            <div className="mt-7 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-5 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="mb-4 text-center">
                <div className="text-6xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {questionCount}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {questionCount === 1 ? "Question" : "Questions"}
                </p>
              </div>

              <input
                type="range"
                min={3}
                max={15}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer accent-indigo-500"
              />

              <motion.p
                key={questionCount}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                {questionCount <= 5
                  ? "Quick and focused"
                  : questionCount <= 10
                    ? "Balanced depth"
                    : "Comprehensive detail"}
              </motion.p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/60">
                3 minimum
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/60">
                15 maximum
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
              <button
                onClick={handleContinue}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
                )}
              >
                {isLoading ? "Continuing..." : "Continue"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionCountPage;
