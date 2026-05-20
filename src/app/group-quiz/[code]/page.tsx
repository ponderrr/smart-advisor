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
import type { QuizContentType } from "@/features/group-quiz/types/group-quiz";
import { QuestionCard } from "@/features/quiz/components/question-card";
import { QuizStepShell } from "@/features/quiz/components/quiz-step-shell";
import { getAccentTone } from "@/features/quiz/utils/content-accent";
import { Dialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { AppNavbar } from "@/components/app-navbar";
import { ResultCard } from "./_components/result-card";
import { PageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import { useGroupQuizShare } from "./_hooks/use-group-quiz-share";
import { useGroupQuizSession } from "./_hooks/use-group-quiz-session";
import { useGroupQuizActions } from "./_hooks/use-group-quiz-actions";
import { GroupQuizNotFound } from "./_components/group-quiz-not-found";
import { GroupQuizResultView } from "./_components/group-quiz-result-view";
import { GroupQuizQuizView } from "./_components/group-quiz-quiz-view";
import { hasAnswer, type LocalAnswers } from "./_lib/answers";
import { PRIMARY_CTA, HERO_CTA } from "./_lib/styles";

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

  const {
    handleStart,
    handleCancel,
    handleLeave,
    handleSubmitAnswers,
    handleJoinHere,
    handleBackToLobby,
    handleRestart,
    handleSynthesize,
    handleBackHome,
  } = useGroupQuizActions({
    session,
    setSession,
    participants,
    setParticipants,
    me,
    localAnswers,
    setCurrentQ,
    setSubmitting,
    setStarting,
    setSynthesizing,
    joinHereName,
    setJoiningHere,
  });

  // Async resolver — idempotent server-side, so the page can fire it on
  // mount + every 30s while in-progress. Mobile parity (resolveIfReady).
  // The realtime channel on quiz_sessions picks up the row patch and
  // flips the UI to the result view — no extra refetch needed here.
  const isAsync = session?.deadline_at != null;
  const inProgress = session?.status === "in_progress";
  useEffect(() => {
    if (!isAsync || !inProgress || !session || !user) return;
    const hostAge = user.age ?? 18;
    const hostName =
      user.username ?? user.name?.split(/\s+/)[0] ?? "Host";
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      void groupQuizService.resolveIfReady(session.id, hostAge, hostName);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isAsync, inProgress, session, user]);

  if (loading) return <PageLoader text={t("loading")} />;

  if (error || !session) {
    return <GroupQuizNotFound error={error} />;
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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <QuizStepShell
          category={shellCategory}
          stepLabel={shellStepLabel}
          progress={shellProgress}
          onBack={handleBackHome}
          backLabel={user ? tShell("back.dashboard") : tShell("back.home")}
          contentType={session.content_type}
        >
          {isAsync && session.status !== "completed" && (
            <AsyncBanner
              deadlineAt={session.deadline_at!}
              plannedFor={session.planned_for}
              submittedCount={submittedCount}
              totalParticipants={participants.length}
            />
          )}
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
            {session.status === "in_progress" && (
              <GroupQuizQuizView
                tone={tone}
                stageKey={stageKey}
                submitted={submitted}
                allSubmitted={allSubmitted}
                isHost={isHost}
                synthesizing={synthesizing}
                submitting={submitting}
                questions={questions}
                currentQuestion={currentQuestion}
                currentQ={currentQ}
                localAnswers={localAnswers}
                contentType={session.content_type}
                onSynthesize={handleSynthesize}
                onSubmitAnswers={handleSubmitAnswers}
                setCurrentQ={setCurrentQ}
                setLocalAnswers={setLocalAnswers}
              />
            )}

            {/* Completed state — show the recommendation. Hero card uses
                the session's accent (not hardcoded amber). Per-rec
                ResultCards have their own per-type tint inside. */}
            {session.status === "completed" && session.result && (
              <GroupQuizResultView
                session={session}
                tone={tone}
                isHost={isHost}
                starting={starting}
                onRestart={handleRestart}
                onBackToLobby={handleBackToLobby}
                onCancel={handleCancel}
              />
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

/**
 * Slim banner shown on async (deadline-mode) group quizzes. Surfaces the
 * deadline countdown + the optional "planned for" date + a live N-of-M
 * submitted readout. Re-ticks once a minute so the countdown stays fresh
 * for users who leave the tab open.
 */
const AsyncBanner = ({
  deadlineAt,
  plannedFor,
  submittedCount,
  totalParticipants,
}: {
  deadlineAt: string;
  plannedFor: string | null;
  submittedCount: number;
  totalParticipants: number;
}) => {
  const t = useTranslations("GroupQuiz.session.async");
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const deadline = new Date(deadlineAt);
  const msLeft = deadline.getTime() - Date.now();
  const passed = msLeft <= 0;
  const hoursLeft = Math.max(0, Math.floor(msLeft / (60 * 60 * 1000)));
  const daysLeft = Math.floor(hoursLeft / 24);
  const countdown = passed
    ? t("deadlinePassed")
    : daysLeft >= 1
      ? t("deadlineInDays", { days: daysLeft })
      : t("deadlineInHours", { hours: Math.max(1, hoursLeft) });

  const plannedLabel = plannedFor
    ? new Date(plannedFor).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-4 shadow-sm backdrop-blur-md dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900/60 dark:to-amber-500/5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
        <Clock size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
          {t("eyebrow")}
        </p>
        <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
          {countdown}
        </p>
        {plannedLabel && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t("plannedFor", { date: plannedLabel })}
          </p>
        )}
      </div>
      <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold tracking-tight text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {t("submitted", { done: submittedCount, total: totalParticipants })}
      </span>
    </div>
  );
};
