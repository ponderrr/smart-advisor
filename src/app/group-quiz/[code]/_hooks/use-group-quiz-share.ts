"use client";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { QuizSession } from "@/features/group-quiz/types/group-quiz";

/**
 * Owns the "invite people to this room" copy-link affordance for the
 * session code. Extracted verbatim from group-quiz/[code]/page.tsx; owns
 * its own useTranslations("GroupQuiz.session").
 */
export function useGroupQuizShare(session: QuizSession | null) {
  const t = useTranslations("GroupQuiz.session");

  const handleCopy = async () => {
    if (!session) return;
    const url = `${window.location.origin}/group-quiz/${session.code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("linkCopyFailed"));
    }
  };

  return { handleCopy };
}
