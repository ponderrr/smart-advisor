"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppNavbar } from "@/components/app-navbar";

/**
 * Full-page "session not found / errored" state for the group-quiz room.
 * Extracted verbatim from page.tsx's `if (error || !session)` early
 * return; owns its own router + GroupQuiz.session i18n.
 */
export const GroupQuizNotFound = ({ error }: { error: string | null }) => {
  const router = useRouter();
  const t = useTranslations("GroupQuiz.session");
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
          <h2 className="text-2xl font-black tracking-tight">
            {t("notFoundTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {error ?? t("notFoundBody")}
          </p>
          <button
            type="button"
            onClick={() => router.push("/group-quiz")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {t("backToHome")}
            <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
};
