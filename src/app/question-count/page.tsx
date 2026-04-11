"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { useQuizStore } from "@/features/quiz/store/quiz-store";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";

type ContentType = "movie" | "book" | "both";
const PREF_QUESTION_COUNT_KEY = "smart_advisor_pref_question_count";

const QuestionCountPage = () => {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { contentType, setQuestionCount: setStoreQuestionCount } =
    useQuizStore();
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!contentType) {
      router.push("/content-selection");
    }
  }, [contentType, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCount = Number(
      window.localStorage.getItem(PREF_QUESTION_COUNT_KEY) || "5",
    );
    if (Number.isFinite(storedCount) && storedCount >= 3 && storedCount <= 15) {
      setQuestionCount(storedCount);
    }
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      setStoreQuestionCount(questionCount);
      router.push("/questionnaire");
    } catch (error) {
      console.error("Error proceeding to questionnaire:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeDisplay = (type: ContentType) => {
    if (type === "both") return "movie and book";
    return type;
  };

  if (!ready || !contentType) {
    return <PageLoader text="Loading..." />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-32 md:pt-36 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <PillButton
              onClick={() => router.push("/content-selection")}
              className="inline-flex items-center gap-2 border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900/70"
            >
              <ArrowLeft size={16} />
              Back
            </PillButton>
            <p className="text-base font-extrabold tracking-wide text-slate-800 dark:text-slate-100 md:text-lg">
              Step 2 of 4
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Quiz Setup
            </p>
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
                Choose the depth for your{" "}
                {getContentTypeDisplay(contentType as ContentType)}{" "}
                recommendation flow.
              </p>
            </motion.div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-5 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="mb-4 text-center">
                <div className="text-6xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {questionCount}
                </div>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-700 dark:text-slate-200 sm:text-xl">
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
                className="mt-3 text-center text-lg font-black tracking-tight text-slate-700 dark:text-slate-200 sm:text-xl"
              >
                {questionCount <= 5
                  ? "Quick and focused"
                  : questionCount <= 10
                    ? "Balanced depth"
                    : "Comprehensive detail"}
              </motion.p>
            </div>

            <div className="mt-8 flex items-center justify-end">
              <PillButton
                onClick={handleContinue}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center justify-center gap-2 bg-white px-7 py-3 text-sm font-black tracking-tight text-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-white",
                )}
              >
                {isLoading ? "Continuing..." : "Continue"}
                <ArrowRight size={16} />
              </PillButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionCountPage;
