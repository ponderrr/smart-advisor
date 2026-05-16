"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { nativeShareOrCopy } from "@/lib/share";
import type { QuizSession } from "@/features/group-quiz/types/group-quiz";

/**
 * Owns the "invite people to this room" share affordances: native-share
 * capability detection plus the copy-link and native-share handlers for
 * the session code. Extracted verbatim from group-quiz/[code]/page.tsx;
 * owns its own useTranslations("GroupQuiz.session").
 */
export function useGroupQuizShare(session: QuizSession | null) {
  const t = useTranslations("GroupQuiz.session");

  // Native OS share sheet — resolved after mount to avoid SSR mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator?.share === "function");
  }, []);

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

  const handleNativeShare = async () => {
    if (!session) return;
    const url = `${window.location.origin}/group-quiz/${session.code}`;
    const status = await nativeShareOrCopy({
      title: t("shareTitle"),
      text: t("shareText", { code: session.code }),
      url,
    });
    if (status === "copied") toast.success(t("linkCopied"));
    else if (status === "failed") toast.error(t("linkShareFailed"));
  };

  return { canNativeShare, handleCopy, handleNativeShare };
}
