'use client';

import { useEffect, useState } from "react";
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

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-10 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2 of 4</p>
            <h1 className="mt-4 text-4xl font-black tracking-tighter md:text-5xl md:whitespace-nowrap">
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
            className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 md:p-8"
          >
            <div className="mb-6 text-center">
              <div className="text-7xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {questionCount}
              </div>
              <p className="mt-2 text-base font-semibold text-slate-600 dark:text-slate-300">
                {questionCount === 1 ? "Question" : "Questions"}
              </p>
            </div>

            <div className="relative mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-5 dark:border-slate-700 dark:bg-slate-950/40">
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
                className="mt-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                {questionCount <= 5
                  ? "Quick and focused"
                  : questionCount <= 10
                    ? "Balanced depth"
                    : "Comprehensive detail"}
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/60">
                3 minimum
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/60">
                15 maximum
              </div>
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
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back
            </button>
            <StatefulButton
              onClick={handleContinue}
              disabled={isLoading}
              state={isLoading ? "loading" : "idle"}
              className="h-11 w-auto rounded-full px-6 text-sm font-semibold"
            >
              Continue
            </StatefulButton>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QuestionCountPage;
