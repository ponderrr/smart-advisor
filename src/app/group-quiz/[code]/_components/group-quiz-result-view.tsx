"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import type { QuizSession } from "@/features/group-quiz/types/group-quiz";

import { ResultCard } from "./result-card";
import { PRIMARY_CTA } from "../_lib/styles";

interface GroupQuizResultViewProps {
  session: QuizSession;
  tone: ReturnType<typeof getAccentTone>;
  isHost: boolean;
  starting: boolean;
  onRestart: () => void;
  onBackToLobby: () => void;
  onCancel: () => void;
}

/**
 * The completed-session result view (synthesized picks + host/guest
 * actions). Extracted verbatim from group-quiz/[code]/page.tsx's
 * `session.status === "completed"` block; owns its own router +
 * GroupQuiz.session i18n. Returns null when there's no result (the page
 * guarded on `session.result` before; the guard is preserved here).
 */
export const GroupQuizResultView = ({
  session,
  tone,
  isHost,
  starting,
  onRestart,
  onBackToLobby,
  onCancel,
}: GroupQuizResultViewProps) => {
  const router = useRouter();
  const t = useTranslations("GroupQuiz.session");

  if (!session.result) return null;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-3xl border bg-gradient-to-br p-5 shadow-sm sm:p-6",
          tone.surfaceBorder,
          tone.surfaceGradient,
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className={tone.text} />
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.18em] sm:text-[11px]",
              tone.text,
            )}
          >
            {t("completed.eyebrow")}
          </p>
        </div>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          {t("completed.subtitle")}
        </p>
      </div>
      {session.result.movie && (
        <ResultCard
          type="movie"
          title={session.result.movie.title}
          creator={session.result.movie.director}
          year={session.result.movie.year}
          genres={session.result.movie.genres}
          explanation={session.result.movie.explanation}
        />
      )}
      {session.result.book && (
        <ResultCard
          type="book"
          title={session.result.book.title}
          creator={session.result.book.author}
          year={session.result.book.year}
          genres={session.result.book.genres}
          explanation={session.result.book.explanation}
        />
      )}
      {session.result.music && (
        <ResultCard
          type="music"
          title={session.result.music.title}
          creator={session.result.music.artist}
          year={session.result.music.year}
          genres={session.result.music.genres}
          explanation={session.result.music.explanation}
          previewUrl={session.result.music.preview_url}
        />
      )}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={onRestart}
                disabled={starting}
                className={cn(
                  PRIMARY_CTA,
                  "px-5 py-2.5 text-sm",
                  tone.barGradient,
                )}
              >
                {starting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                {starting
                  ? t("completed.resetting")
                  : t("completed.playAgain")}
              </button>
              <button
                type="button"
                onClick={onBackToLobby}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <ArrowLeft size={12} />
                {t("backToLobby")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/group-quiz")}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                {t("completed.newGroup")}
                <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/group-quiz")}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {t("completed.done")}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
        {isHost && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold tracking-tight text-rose-700 hover:bg-rose-100 sm:self-auto dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {t("completed.endSession")}
          </button>
        )}
      </div>
    </div>
  );
};
