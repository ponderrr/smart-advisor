"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageLoader } from "@/components/ui/loader";
import { useQuizStore } from "@/features/quiz/store/quiz-store";

/**
 * Legacy `/results` route. The recommendations UI now lives as the final
 * step inside `/quiz` so the entire flow (content → count → questions →
 * loader → results) reads as a single morphing card with no route flashes.
 *
 * This page exists only to redirect existing bookmarks / external links —
 * we forward into `/quiz?step=results` when the in-memory store still has
 * recs from a recent quiz, and otherwise drop the user at the start.
 */
const ResultsPage = () => {
  const router = useRouter();
  const tc = useTranslations("Common");
  const { recommendations } = useQuizStore();

  useEffect(() => {
    if (recommendations.length > 0) {
      router.replace("/quiz?step=results");
    } else {
      router.replace("/quiz");
    }
  }, [recommendations.length, router]);

  return <PageLoader text={tc("loading")} />;
};

export default ResultsPage;
