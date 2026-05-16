"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Film,
  Loader2,
  LogOut,
  Music,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import type { QuizContentType } from "@/features/group-quiz/types/group-quiz";
import {
  QuestionCard,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { isOverloadedError } from "@/features/recommendations/services/ai-service";
import { Dialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { AppNavbar } from "@/components/app-navbar";
import { ResultCard } from "./_components/result-card";
import { PageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useGroupQuizShare } from "./_hooks/use-group-quiz-share";
import { useGroupQuizSession } from "./_hooks/use-group-quiz-session";

type LocalAnswers = Record<string, QuestionValue>;

/** Gradient primary CTAs (Next / Submit / Join here). Pair with size +
 *  tone.barGradient. Disabled state freezes shadow + adds not-allowed. */
const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r font-black tracking-tight text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-sm disabled:hover:shadow-sm";

/** Hero CTAs with a translate-on-hover lift (Start Quiz / Reveal). */
const HERO_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r font-black tracking-tight text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-lg disabled:hover:translate-y-0 disabled:hover:shadow-lg";

const formatAnswerForStorage = (
  type: "single_select" | "select_all" | "fill_in_blank",
  value: QuestionValue | undefined,
) => {
  if (value === undefined || value === null) return "";
  if (type === "select_all") {
    return Array.isArray(value) ? value.join(", ") : "";
  }
  return typeof value === "string" ? value : "";
};

const hasAnswer = (value: QuestionValue | undefined) => {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
};

/** Icon shown on the content-type chip in the lobby params bar. Music
 *  always gets the album icon; mix/both fall back to the generic sparkle. */
const contentIconFor = (type: QuizContentType) => {
  if (type === "movie") return Film;
  if (type === "book") return BookOpen;
  if (type === "music") return Music;
  return Sparkles;
};

const contentParamKey = (type: QuizContentType) => {
  if (type === "movie") return "contentMovie";
  if (type === "book") return "contentBook";
  if (type === "music") return "contentMusic";
  return "contentMix";
};

/** Same per-question time model used on the host landing slider — keeps
 *  the "~N min" estimate consistent between setup and lobby preview. */
const estimateMinutes = (questionCount: number) =>
  Math.max(1, Math.ceil((questionCount * 18 + 30) / 60));

/** Total number of steps in the full group-quiz arc — landing accounts
 *  for path picker + host/join setup; in-session accounts for lobby,
 *  quiz, and result. Mirrors the constant used on the landing page. */
const TOTAL_STEPS = 5;

const GroupQuizLobbyPage = () => {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toUpperCase();
  const { user } = useAuth();
  const t = useTranslations("GroupQuiz.session");
  const tShell = useTranslations("GroupQuiz");

  const {
    session,
    setSession,
    participants,
    setParticipants,
    loading,
    error,
    me,
    isHost,
    submitted,
    lobbyFull,
    submittedCount,
    allSubmitted,
  } = useGroupQuizSession(code);

  // Quiz-flow state (only used during status === "in_progress")
  const [localAnswers, setLocalAnswers] = useState<LocalAnswers>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [joinHereName, setJoinHereName] = useState("");
  const [joiningHere, setJoiningHere] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Reset the local question form whenever the host generates a new
  // question set (initial start OR restart).
  useEffect(() => {
    setLocalAnswers({});
    setCurrentQ(0);
  }, [session?.questions]);
  // Pull the live accent from the session's content_type. Falls back to
  // violet for null while the session is still loading, but every branch
  // below gates on `session` being present before reading these.
  const tone = getAccentTone(session?.content_type ?? null);

  const { canNativeShare, handleCopy, handleNativeShare } =
    useGroupQuizShare(session);

  const handleStart = async () => {
    if (!session || !user) return;
    if (participants.length < 2) {
      toast.error(t("host.needTwoPlayers"));
      return;
    }
    setStarting(true);
    const { questions: newQuestions, error: e } =
      await groupQuizService.generateAndStartQuiz(
        session,
        user.age,
        user.username || user.name || "Host",
      );
    setStarting(false);
    if (e || !newQuestions) {
      toast.error(
        isOverloadedError(e) ? t("host.overloaded") : (e ?? t("host.startFailed")),
      );
      return;
    }
    setSession((prev) =>
      prev
        ? { ...prev, status: "in_progress", questions: newQuestions }
        : prev,
    );
  };

  const handleCancel = async () => {
    if (!session) return;
    const ok = window.confirm(t("endConfirm"));
    if (!ok) return;
    await groupQuizService.setStatus(session.id, "cancelled");
    router.push("/group-quiz");
  };

  const handleLeave = async () => {
    if (!me) return;
    if (!window.confirm(t("leaveConfirm"))) return;
    await groupQuizService.leave(me.id);
    router.push("/group-quiz");
  };

  const handleSubmitAnswers = async () => {
    if (!session || !me || !session.questions) return;
    const unanswered = session.questions.findIndex(
      (q) => !hasAnswer(localAnswers[q.id]),
    );
    if (unanswered !== -1) {
      setCurrentQ(unanswered);
      toast.error(t("quiz.answerAll"));
      return;
    }
    setSubmitting(true);
    for (let i = 0; i < session.questions.length; i += 1) {
      const q = session.questions[i];
      const answerText = formatAnswerForStorage(q.type, localAnswers[q.id]);
      const { error: e } = await groupQuizService.submitAnswer({
        session_id: session.id,
        participant_id: me.id,
        question_index: i,
        question: q.text,
        answer: answerText,
      });
      if (e) {
        toast.error(e);
        setSubmitting(false);
        return;
      }
    }
    await groupQuizService.markParticipantSubmitted(me.id);
    setSubmitting(false);
    toast.success(t("quiz.submittedToast"));
  };

  const handleJoinHere = async () => {
    if (!session) return;
    const name =
      joinHereName.trim() ||
      user?.username ||
      user?.name?.split(/\s+/)[0] ||
      "Guest";
    setJoiningHere(true);
    const { participant, error: e } = await groupQuizService.joinSession({
      code: session.code,
      display_name: name,
    });
    setJoiningHere(false);
    if (e || !participant) {
      toast.error(e ?? t("guest.joinFailed"));
      return;
    }
    const { data: p } = await groupQuizService.listParticipants(session.id);
    setParticipants(p);
  };

  const handleBackToLobby = async () => {
    if (!session) return;
    const message =
      session.status === "in_progress"
        ? t("backToLobbyConfirmInProgress")
        : t("backToLobbyConfirmCompleted");
    if (!window.confirm(message)) return;
    const { error: e } = await groupQuizService.returnToLobby(session);
    if (e) {
      toast.error(e);
      return;
    }
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: "lobby",
            questions: null,
            result: null,
            completed_at: null,
          }
        : prev,
    );
  };

  const handleRestart = async () => {
    if (!session || !user) return;
    setStarting(true);
    const { questions: newQuestions, error: e } =
      await groupQuizService.restartSession(
        session,
        user.age,
        user.username || user.name || "Host",
      );
    setStarting(false);
    if (e || !newQuestions) {
      toast.error(
        isOverloadedError(e)
          ? t("host.overloaded")
          : (e ?? t("host.restartFailed")),
      );
      return;
    }
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: "in_progress",
            questions: newQuestions,
            result: null,
            completed_at: null,
          }
        : prev,
    );
  };

  const handleSynthesize = async () => {
    if (!session || !user) return;
    setSynthesizing(true);
    const { data: answersData } = await groupQuizService.listAnswers(
      session.id,
    );
    const { result, error: e } = await groupQuizService.synthesizeRecommendation(
      session,
      participants,
      answersData,
      user.age,
      user.username || user.name || "Host",
    );
    setSynthesizing(false);
    if (e || !result) {
      toast.error(
        isOverloadedError(e)
          ? t("host.overloaded")
          : (e ?? t("host.synthesizeFailed")),
      );
      return;
    }
    // Flip the host's local state immediately so the result page appears
    // without waiting for realtime to round-trip.
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: "completed",
            result,
            completed_at: new Date().toISOString(),
          }
        : prev,
    );
  };

  if (loading) return <PageLoader text={t("loading")} />;

  if (error || !session) {
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
  }

  const questions = session.questions ?? [];
  const currentQuestion = questions[currentQ];

  // Empty-seat placeholders shown only in the lobby state. Anything past
  // max_participants vs. actual count is unused; clamp to 0.
  const emptySlots =
    session.status === "lobby"
      ? Math.max(0, session.max_participants - participants.length)
      : 0;
  const ContentIcon = contentIconFor(session.content_type);
  const inProgressProgressPct =
    participants.length > 0
      ? (submittedCount / participants.length) * 100
      : 0;

  /** Key driving the AnimatePresence inside the in-progress card. Each
   *  question is its own snapshot; "waiting" and "reveal" are the two
   *  post-submit screens. */
  const stageKey: string = submitted
    ? allSubmitted
      ? "reveal"
      : "waiting"
    : currentQuestion?.id ?? "no-question";

  // Map session state → step-shell chrome. The category shifts to
  // "Live round" while answering so the eyebrow context tells the user
  // they're mid-quiz, not still in the lobby. Progress walks from 60%
  // (start of lobby/step 3) to 100% (result/step 5).
  let shellCategory = tShell("category");
  let shellStepLabel = "";
  let shellProgress = 60;
  if (session.status === "lobby") {
    shellStepLabel = tShell("stepOf", { current: 3, total: TOTAL_STEPS });
    shellProgress = (3 / TOTAL_STEPS) * 100;
  } else if (session.status === "in_progress") {
    shellCategory = t("quiz.category");
    if (submitted) {
      shellStepLabel = allSubmitted
        ? t("submitted.lockedInAll")
        : t("submitted.lockedIn");
      // Once submitted, we're effectively done with step 4 — bump the bar
      // closer to step 5 without claiming the round is complete.
      shellProgress = 85;
    } else if (questions.length > 0 && currentQuestion) {
      shellStepLabel = t("quiz.questionOf", {
        current: currentQ + 1,
        total: questions.length,
      });
      // Walk progress across the question span within step 4's slice.
      shellProgress =
        (4 / TOTAL_STEPS) * 100 -
        20 +
        ((currentQ + 1) / questions.length) * 20;
    } else {
      shellStepLabel = tShell("stepOf", { current: 4, total: TOTAL_STEPS });
      shellProgress = (4 / TOTAL_STEPS) * 100 - 20;
    }
  } else if (session.status === "completed") {
    shellStepLabel = tShell("stepOf", { current: 5, total: TOTAL_STEPS });
    shellProgress = 100;
  } else {
    // cancelled
    shellStepLabel = tShell("stepLabel.result");
    shellProgress = 100;
  }

  const handleBackToDashboard = () => router.push("/dashboard");

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <QuizStepShell
          category={shellCategory}
          stepLabel={shellStepLabel}
          progress={shellProgress}
          onBack={handleBackToDashboard}
          backLabel={tShell("back.dashboard")}
          contentType={session.content_type}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Code banner — only in lobby. Tinted by session.content_type
                so a movie-mode group lobby reads amber, books emerald, etc. */}
            {session.status === "lobby" && (
              <div
                className={cn(
                  "relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-sm sm:p-8",
                  tone.surfaceBorder,
                  tone.surfaceGradient,
                )}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <p
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.16em]",
                      tone.text,
                    )}
                  >
                    {t("shareCode")}
                  </p>
                  <p className="select-all font-mono text-4xl font-black tracking-[0.5em] sm:text-5xl">
                    {session.code}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {canNativeShare && (
                      <button
                        type="button"
                        onClick={() => void handleNativeShare()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-200"
                      >
                        <Share2 size={12} />
                        {t("shareLink")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-200"
                    >
                      <Copy size={12} />
                      {t("copyLink")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQR(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-200"
                    >
                      <QrCode size={12} />
                      {t("qr.show")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Session params bar — surfaces what kind of round this is so
                a joiner knows what they're walking into. Lobby only; once
                the round starts the params are baked into the experience. */}
            {session.status === "lobby" && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-xs font-bold tracking-tight text-slate-600 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 dark:text-slate-300">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
                    tone.iconCircle,
                  )}
                >
                  <ContentIcon size={12} />
                  {t(`params.${contentParamKey(session.content_type)}`)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  {t("params.questions", { count: session.question_count })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock
                    size={12}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  {t("params.timeEstimate", {
                    minutes: estimateMinutes(session.question_count),
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users
                    size={12}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  {t("params.maxPlayers", { max: session.max_participants })}
                </span>
              </div>
            )}

            {/* Participants strip — visible in all states. During in_progress
                it doubles as a live "X of Y locked in" progress display so
                the persistent panel keeps a heartbeat. */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Users size={13} />
                  </span>
                  <h2 className="text-sm font-black tracking-tight">
                    {session.status === "lobby"
                      ? t("playerCountOf", {
                          count: participants.length,
                          max: session.max_participants,
                        })
                      : t("playerCount", { count: participants.length })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {me && !isHost && session.status !== "completed" && (
                    <button
                      type="button"
                      onClick={handleLeave}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tracking-tight text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                      <LogOut size={12} />
                      {t("leave")}
                    </button>
                  )}
                  {isHost && session.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={handleBackToLobby}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                    >
                      <ArrowLeft size={12} />
                      {t("backToLobby")}
                    </button>
                  )}
                  {isHost && session.status !== "completed" && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold tracking-tight text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      {t("end")}
                    </button>
                  )}
                </div>
              </div>

              <ul className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {participants.map((p) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -4 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28,
                        mass: 0.7,
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-tight transition-colors duration-300",
                        p.answers_submitted_at
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-slate-200 bg-white/60 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
                      )}
                    >
                      {/* Avatar initial circle uses the session's accent so
                          the participant chips sit inside the same visual
                          family as the surrounding card. */}
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-black uppercase leading-none text-white shadow-sm",
                          tone.barGradient,
                        )}
                      >
                        {p.display_name.trim().charAt(0) || "?"}
                      </span>
                      {p.display_name}
                      {p.is_host && (
                        <Crown size={11} className="text-amber-500" />
                      )}
                      {p.answers_submitted_at && <CheckCircle2 size={12} />}
                    </motion.li>
                  ))}
                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <motion.li
                      key={`empty-${i}`}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50/40 px-3 py-1.5 text-xs font-bold tracking-tight text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/30 dark:text-slate-500"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-300 dark:border-slate-700/80 dark:text-slate-600">
                        <UserPlus size={11} />
                      </span>
                      {t("params.emptySeat")}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {/* Mid-game submission progress — only when the round is
                  actually live AND there's somebody who could've submitted. */}
              {session.status === "in_progress" && participants.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {t("params.submittedProgress", {
                        done: submittedCount,
                        total: participants.length,
                      })}
                    </p>
                  </div>
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70">
                    <motion.div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        tone.barGradient,
                      )}
                      initial={false}
                      animate={{ width: `${inProgressProgressPct}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 90,
                        damping: 24,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Lobby actions */}
              {session.status === "lobby" && isHost && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting || participants.length < 2}
                    className={cn(HERO_CTA, "px-8 py-3.5 text-base", tone.barGradient)}
                  >
                    {starting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {starting
                      ? t("host.generatingQuestions")
                      : t("host.startQuiz", { count: session.question_count })}
                  </button>
                </div>
              )}
              {session.status === "lobby" && me && !isHost && (
                <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </span>
                  <p className="text-sm font-black tracking-tight">
                    {t("guest.waitingHost")}
                  </p>
                  <p className="-mt-0.5 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                    {t("guest.waitingBody")}
                  </p>
                </div>
              )}
              {session.status === "lobby" && !me && !lobbyFull && (
                <div
                  className={cn(
                    "mt-5 rounded-2xl border bg-gradient-to-br p-5",
                    tone.surfaceBorder,
                    tone.surfaceGradient,
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.16em]",
                      tone.text,
                    )}
                  >
                    {t("guest.joinLobby")}
                  </p>
                  <p className="mt-1 text-sm font-bold tracking-tight">
                    {t("guest.joinPrompt")}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={joinHereName}
                      onChange={(e) => setJoinHereName(e.target.value)}
                      placeholder={user?.username || t("guest.joinPlaceholder")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJoinHere();
                      }}
                      className={cn(
                        "flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/70",
                        tone.focusRing,
                      )}
                    />
                    <button
                      type="button"
                      onClick={handleJoinHere}
                      disabled={joiningHere}
                      className={cn(
                        PRIMARY_CTA,
                        "shrink-0 px-5 py-2.5 text-sm",
                        tone.barGradient,
                      )}
                    >
                      {joiningHere ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {joiningHere ? t("guest.joining") : t("guest.join")}
                      {!joiningHere ? <ArrowRight size={14} /> : null}
                    </button>
                  </div>
                </div>
              )}
              {session.status === "lobby" && !me && lobbyFull && (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                  <p className="text-sm font-bold tracking-tight">
                    {t("guest.lobbyFull")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t("guest.lobbyFullBody")}
                  </p>
                </div>
              )}
              {!me &&
                (session.status === "in_progress" ||
                  session.status === "completed") && (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="text-sm font-bold tracking-tight">
                      {session.status === "in_progress"
                        ? t("guest.inProgress")
                        : t("guest.completed")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("guest.askHost")}
                    </p>
                  </div>
                )}
            </div>

            {/* In-progress quiz card — tone-tinted surface, layout-morphing
                height, slide transition between questions and the
                post-submit states. The category eyebrow and step progress
                already live in the step shell up top, so the card body
                jumps straight to the question. */}
            {session.status === "in_progress" && questions.length > 0 && (
              <motion.div
                layout
                transition={{
                  layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                }}
                className={cn(
                  "rounded-3xl border bg-gradient-to-br p-5 shadow-sm backdrop-blur-md sm:p-6",
                  tone.surfaceBorder,
                  tone.surfaceGradient,
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={stageKey}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        duration: 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.15, ease: "easeIn" },
                    }}
                  >
                    {submitted ? (
                      <div className="py-6 text-center">
                        <CheckCircle2
                          size={36}
                          className="mx-auto text-emerald-500"
                        />
                        <h3 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
                          {allSubmitted
                            ? t("submitted.lockedInAll")
                            : t("submitted.lockedIn")}
                        </h3>
                        {!allSubmitted && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {t("submitted.waitingOthers")}
                          </p>
                        )}
                        {isHost && allSubmitted && (
                          <button
                            type="button"
                            onClick={handleSynthesize}
                            disabled={synthesizing}
                            className={cn(
                              HERO_CTA,
                              "mt-5 px-8 py-3.5 text-base",
                              tone.barGradient,
                            )}
                          >
                            {synthesizing ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : null}
                            {synthesizing
                              ? t("submitted.revealing")
                              : t("submitted.reveal")}
                          </button>
                        )}
                        {!isHost && allSubmitted && (
                          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                            {t("submitted.guestWaiting")}
                          </p>
                        )}
                      </div>
                    ) : currentQuestion ? (
                      <>
                        <QuestionCard
                          title={currentQuestion.text}
                          type={currentQuestion.type}
                          options={currentQuestion.options}
                          placeholder={currentQuestion.placeholder}
                          value={localAnswers[currentQuestion.id]}
                          onChange={(value) =>
                            setLocalAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: value,
                            }))
                          }
                          contentType={session.content_type}
                        />
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <PillButton
                            onClick={() =>
                              setCurrentQ((i) => Math.max(0, i - 1))
                            }
                            disabled={currentQ === 0}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
                          >
                            <ArrowLeft size={14} />
                            {t("quiz.back")}
                          </PillButton>
                          {currentQ === questions.length - 1 ? (
                            <button
                              type="button"
                              onClick={handleSubmitAnswers}
                              disabled={
                                submitting ||
                                !hasAnswer(localAnswers[currentQuestion.id])
                              }
                              className={cn(
                                PRIMARY_CTA,
                                "px-5 py-2.5 text-sm",
                                tone.barGradient,
                              )}
                            >
                              {submitting ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : null}
                              {submitting
                                ? t("quiz.submitting")
                                : t("quiz.submit")}
                              {!submitting ? <ArrowRight size={14} /> : null}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCurrentQ((i) => i + 1)}
                              disabled={
                                !hasAnswer(localAnswers[currentQuestion.id])
                              }
                              className={cn(
                                PRIMARY_CTA,
                                "px-5 py-2.5 text-sm",
                                tone.barGradient,
                              )}
                            >
                              {t("quiz.next")}
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* In-progress state but questions still loading (rare) */}
            {session.status === "in_progress" && questions.length === 0 && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                <Sparkles
                  className={cn(
                    "mx-auto h-8 w-8 animate-pulse",
                    tone.text,
                  )}
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold tracking-tight">
                  {t("host.generatingQuestions")}
                </p>
              </div>
            )}

            {/* Completed state — show the recommendation. Hero card uses
                the session's accent (not hardcoded amber). Per-rec
                ResultCards have their own per-type tint inside. */}
            {session.status === "completed" && session.result && (
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
                          onClick={handleRestart}
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
                          onClick={handleBackToLobby}
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
                      onClick={handleCancel}
                      className="inline-flex items-center justify-center gap-1.5 self-start rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold tracking-tight text-rose-700 hover:bg-rose-100 sm:self-auto dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      {t("completed.endSession")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {session.status === "cancelled" && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                <p className="text-sm font-bold tracking-tight">
                  {t("cancelled.body")}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/group-quiz")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {t("backToHome")}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </QuizStepShell>
      </main>

      {/* QR-to-join dialog. Renders via portal, so its placement here is
          just for code locality — keeps lobby-only behavior next to the
          banner that triggers it. The QR encodes the full share URL so
          the joiner lands directly on /group-quiz/[code]. */}
      <Dialog
        open={showQR}
        onClose={() => setShowQR(false)}
        ariaLabel={t("qr.title")}
        size="sm"
      >
        <div className="px-6 pb-8 pt-10 text-center sm:px-8">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.18em]",
              tone.text,
            )}
          >
            {t("qr.title")}
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t("qr.subtitle")}
          </p>

          {/* Always-light tile around the QR so it stays scannable in
              dark mode (camera apps want high black-on-white contrast). */}
          <div className="mx-auto mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/group-quiz/${session.code}`}
              size={208}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
              marginSize={0}
              aria-label={t("qr.title")}
            />
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("qr.codeHint")}
            </p>
            <p className="mt-1 select-all font-mono text-2xl font-black tracking-[0.4em] sm:text-3xl">
              {session.code}
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <Share2 size={12} />
                {t("shareLink")}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 sm:w-auto dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <Copy size={12} />
              {t("copyLink")}
            </button>
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className={cn(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r px-5 py-2 text-xs font-black tracking-tight text-white shadow-sm transition-shadow hover:shadow-md sm:w-auto",
                tone.barGradient,
              )}
            >
              {t("qr.close")}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default GroupQuizLobbyPage;
