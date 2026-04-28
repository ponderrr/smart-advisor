"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Copy,
  Crown,
  Film,
  LogOut,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLeaveGuard } from "@/features/quiz/hooks/use-leave-guard";
import {
  groupQuizService,
  guestParticipantId,
} from "@/features/group-quiz/services/group-quiz-service";
import type {
  QuizParticipant,
  QuizSession,
} from "@/features/group-quiz/types/group-quiz";
import {
  QuestionCard,
  type QuestionValue,
} from "@/features/quiz/components/question-card";
import { supabase } from "@/integrations/supabase/client";
import { PillButton } from "@/components/ui/pill-button";
import { AppNavbar } from "@/components/app-navbar";
import { PageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

type LocalAnswers = Record<string, QuestionValue>;

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

const GroupQuizLobbyPage = () => {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toUpperCase();
  const { user } = useAuth();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz-flow state (only used during status === "in_progress")
  const [localAnswers, setLocalAnswers] = useState<LocalAnswers>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [joinHereName, setJoinHereName] = useState("");
  const [joiningHere, setJoiningHere] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { session: s, error: e } = await groupQuizService.findByCode(code);
      if (cancelled) return;
      if (e || !s) {
        setError(e ?? "Session not found");
        setLoading(false);
        return;
      }
      setSession(s);
      const { data: p } = await groupQuizService.listParticipants(s.id);
      if (cancelled) return;
      setParticipants(p);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Subscribe once per session (keyed by id) — re-running on every session
  // patch would tear down and recreate the realtime channel on each tick.
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`quiz-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            setSession((prev) =>
              prev ? { ...prev, ...(payload.new as QuizSession) } : prev,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Surface joins/leaves as toasts for the host so they don't have
          // to keep eyeballing the chip strip.
          if (payload.eventType === "DELETE") {
            const left = payload.old as { display_name?: string } | undefined;
            if (left?.display_name) {
              toast.message(`${left.display_name} left the lobby`);
            }
          } else if (payload.eventType === "INSERT") {
            const joined = payload.new as { display_name?: string } | undefined;
            if (joined?.display_name) {
              toast.success(`${joined.display_name} joined`);
            }
          }
          const { data } = await groupQuizService.listParticipants(sessionId);
          setParticipants(data);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Reset the local question form whenever the host generates a new
  // question set (initial start OR restart).
  useEffect(() => {
    setLocalAnswers({});
    setCurrentQ(0);
  }, [session?.questions]);

  const me = useMemo(() => {
    if (!session) return null;
    if (user) {
      return participants.find((p) => p.user_id === user.id) ?? null;
    }
    const guestId = guestParticipantId(session.code);
    return participants.find((p) => p.id === guestId) ?? null;
  }, [participants, user, session]);

  const isHost = me?.is_host === true;
  const submitted = me?.answers_submitted_at != null;

  // Guard navigation during the answering phase. Once submitted, leaving is
  // fine — the answers are already on the server.
  useLeaveGuard(
    !!me &&
      session?.status === "in_progress" &&
      !submitted &&
      !!session.questions?.length,
    "Leave the group quiz? Your answers so far won't be submitted.",
  );
  const allSubmitted =
    participants.length > 0 &&
    participants.every((p) => p.answers_submitted_at);

  const handleCopy = async () => {
    if (!session) return;
    const url = `${window.location.origin}/group-quiz/${session.code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleStart = async () => {
    if (!session || !user) return;
    if (participants.length < 2) {
      toast.error("You need at least 2 players to start.");
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
      toast.error(e ?? "Couldn't start the quiz");
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
    const ok = window.confirm("End this session for everyone?");
    if (!ok) return;
    await groupQuizService.setStatus(session.id, "cancelled");
    router.push("/group-quiz");
  };

  const handleLeave = async () => {
    if (!me) return;
    if (!window.confirm("Leave this group quiz?")) return;
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
      toast.error("Answer every question first.");
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
    toast.success("Locked in!");
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
      toast.error(e ?? "Couldn't join session");
      return;
    }
    const { data: p } = await groupQuizService.listParticipants(session.id);
    setParticipants(p);
  };

  const handleBackToLobby = async () => {
    if (!session) return;
    const message =
      session.status === "in_progress"
        ? "Send everyone back to the lobby? In-progress answers will be cleared."
        : "Send everyone back to the lobby? Answers and the current pick will be cleared so a fresh round can start.";
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
      toast.error(e ?? "Couldn't restart the quiz");
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
      toast.error(e ?? "Failed to generate recommendation");
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

  if (loading) return <PageLoader text="Loading session…" />;

  if (error || !session) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AppNavbar />
        <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
            <h2 className="text-2xl font-black tracking-tight">
              Session Not Found
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {error ?? "That code doesn't match an active session."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/group-quiz")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Back to Group Quiz
              <ArrowRight size={14} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  const questions = session.questions ?? [];
  const currentQuestion = questions[currentQ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Code banner — only in lobby */}
            {session.status === "lobby" && (
              <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/15 dark:via-slate-900/60 dark:to-violet-500/15 sm:p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                    Share This Code
                  </p>
                  <p className="select-all font-mono text-4xl font-black tracking-[0.5em] sm:text-5xl">
                    {session.code}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-bold tracking-tight text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-200"
                  >
                    <Copy size={12} />
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            {/* Participant strip — visible in all states */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Users size={13} />
                  </span>
                  <h2 className="text-sm font-black tracking-tight">
                    {participants.length}{" "}
                    {participants.length === 1 ? "Player" : "Players"}
                    {session.status === "in_progress" && (
                      <span className="ml-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        ·{" "}
                        {
                          participants.filter((p) => p.answers_submitted_at)
                            .length
                        }
                        /{participants.length} submitted
                      </span>
                    )}
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
                      Leave
                    </button>
                  )}
                  {isHost && session.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={handleBackToLobby}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                    >
                      <ArrowLeft size={12} />
                      Back to Lobby
                    </button>
                  )}
                  {isHost && session.status !== "completed" && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold tracking-tight text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-tight",
                      p.answers_submitted_at
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-slate-200 bg-white/60 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-black uppercase leading-none text-white shadow-sm shadow-indigo-500/20">
                      {p.display_name.trim().charAt(0) || "?"}
                    </span>
                    {p.display_name}
                    {p.is_host && (
                      <Crown size={11} className="text-amber-500" />
                    )}
                    {p.answers_submitted_at && <CheckCircle2 size={12} />}
                  </li>
                ))}
              </ul>

              {/* Lobby actions */}
              {session.status === "lobby" && isHost && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting || participants.length < 2}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-base font-black tracking-tight text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:shadow-white/20 dark:hover:bg-slate-100 dark:hover:shadow-white/30"
                  >
                    {starting
                      ? "Generating questions…"
                      : `Start Quiz · ${session.question_count} ${session.question_count === 1 ? "question" : "questions"}`}
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
                    Waiting for the Host
                  </p>
                  <p className="-mt-0.5 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                    Hang tight — they'll kick things off any second.
                  </p>
                </div>
              )}
              {session.status === "lobby" && !me && (
                <div className="mt-5 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                    Join the Lobby
                  </p>
                  <p className="mt-1 text-sm font-bold tracking-tight">
                    Enter a name to join this group quiz.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={joinHereName}
                      onChange={(e) => setJoinHereName(e.target.value)}
                      placeholder={user?.username || "Display name"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJoinHere();
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70"
                    />
                    <button
                      type="button"
                      onClick={handleJoinHere}
                      disabled={joiningHere}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-black tracking-tight text-white shadow-sm shadow-indigo-500/30 transition-colors hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {joiningHere ? "Joining…" : "Join"}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
              {!me &&
                (session.status === "in_progress" ||
                  session.status === "completed") && (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="text-sm font-bold tracking-tight">
                      {session.status === "in_progress"
                        ? "The quiz is already underway."
                        : "This session is wrapped up."}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Ask the host to bring the lobby back so you can join.
                    </p>
                  </div>
                )}
            </div>

            {/* In-progress state */}
            {session.status === "in_progress" && questions.length > 0 && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65 sm:p-6">
                {submitted ? (
                  <div className="py-8 text-center">
                    <CheckCircle2
                      size={36}
                      className="mx-auto text-emerald-500"
                    />
                    <h3 className="mt-3 text-xl font-black tracking-tight">
                      {allSubmitted ? "Everyone's Locked In" : "Locked In"}
                    </h3>
                    {!allSubmitted && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Waiting for everyone else to finish…
                      </p>
                    )}
                    {isHost && allSubmitted && (
                      <button
                        type="button"
                        onClick={handleSynthesize}
                        disabled={synthesizing}
                        className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-base font-black tracking-tight text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:shadow-white/20 dark:hover:bg-slate-100 dark:hover:shadow-white/30"
                      >
                        {synthesizing
                          ? "Finding the pick…"
                          : "Reveal the Group's Pick"}
                      </button>
                    )}
                    {!isHost && allSubmitted && (
                      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        Host is generating the pick…
                      </p>
                    )}
                  </div>
                ) : currentQuestion ? (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                          Question {currentQ + 1} of {questions.length}
                        </p>
                      </div>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                          style={{
                            width: `${((currentQ + 1) / questions.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18 }}
                      >
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
                        />
                      </motion.div>
                    </AnimatePresence>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <PillButton
                        onClick={() =>
                          setCurrentQ((i) => Math.max(0, i - 1))
                        }
                        disabled={currentQ === 0}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
                      >
                        <ArrowLeft size={14} />
                        Back
                      </PillButton>
                      {currentQ === questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleSubmitAnswers}
                          disabled={
                            submitting ||
                            !hasAnswer(localAnswers[currentQuestion.id])
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                          {submitting ? "Submitting…" : "Lock It In"}
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentQ((i) => i + 1)}
                          disabled={!hasAnswer(localAnswers[currentQuestion.id])}
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
                        >
                          Next
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* In-progress state but questions still loading (rare) */}
            {session.status === "in_progress" && questions.length === 0 && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                <Sparkles
                  className="mx-auto h-8 w-8 animate-pulse text-indigo-400"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold tracking-tight">
                  Generating questions…
                </p>
              </div>
            )}

            {/* Completed state — show the recommendation */}
            {session.status === "completed" && session.result && (
              <div className="space-y-3">
                <div className="rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-sm dark:border-amber-500/30 dark:from-amber-500/15 dark:via-slate-900/60 dark:to-rose-500/15 sm:p-8">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-amber-600 dark:text-amber-400"
                    />
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                      The Group's Pick
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Based on what everyone said, here's something that should
                    land for the room.
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
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {isHost ? (
                      <>
                        <button
                          type="button"
                          onClick={handleRestart}
                          disabled={starting}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                          <RotateCcw size={14} />
                          {starting ? "Resetting…" : "Play Again"}
                        </button>
                        <button
                          type="button"
                          onClick={handleBackToLobby}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        >
                          <ArrowLeft size={12} />
                          Back to Lobby
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/group-quiz")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        >
                          Start a New Group
                          <ArrowRight size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/group-quiz")}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        Done
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
                      End Session
                    </button>
                  )}
                </div>
              </div>
            )}

            {session.status === "cancelled" && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
                <p className="text-sm font-bold tracking-tight">
                  This session was ended.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/group-quiz")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black tracking-tight text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Back to Group Quiz
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

type TrailerData =
  | {
      provider: "youtube";
      youtubeKey: string | null;
      name: string | null;
      tmdbId: number;
      posterUrl: string | null;
      overview: string | null;
    }
  | {
      provider: "open-library";
      workKey: string | null;
      infoLink: string | null;
      posterUrl: string | null;
    }
  | null;

interface ResultCardProps {
  type: "movie" | "book";
  title: string;
  creator?: string;
  year?: number;
  genres?: string[];
  explanation?: string;
}

const ResultCard = ({
  type,
  title,
  creator,
  year,
  genres,
  explanation,
}: ResultCardProps) => {
  const [media, setMedia] = useState<TrailerData>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ title, type });
    if (year) params.set("year", String(year));
    if (creator && type === "book") params.set("author", creator);
    fetch(`/api/trailer?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json) => {
        if (cancelled) return;
        setMedia((json.data ?? null) as TrailerData);
      })
      .catch(() => {
        if (cancelled) return;
        setMedia(null);
      });
    return () => {
      cancelled = true;
    };
  }, [title, year, type, creator]);

  const posterUrl = media?.posterUrl ?? null;
  const youtubeKey =
    media?.provider === "youtube" ? media.youtubeKey : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/65">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        {posterUrl && (
          <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800 sm:w-40">
            {/* Plain <img> — Google Books / TMDB sizes vary, no need to pay
                for Image optimization on a single result. */}
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              {type === "movie" ? <Film size={13} /> : <BookOpen size={13} />}
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              {type === "movie" ? "Movie" : "Book"}
            </p>
          </div>
          <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {creator
              ? `${type === "movie" ? "Directed by" : "By"} ${creator}`
              : ""}
            {year ? ` · ${year}` : ""}
          </p>
          {genres && genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {genres.slice(0, 5).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          {explanation && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {explanation}
            </p>
          )}
          {media?.provider === "youtube" && media.overview && (
            <p className="mt-3 border-t border-slate-200/70 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
              {media.overview}
            </p>
          )}
          {media?.provider === "open-library" && media.infoLink && (
            <a
              href={media.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-tight text-slate-700 hover:border-slate-300 hover:text-indigo-700 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:text-indigo-300"
            >
              View on Open Library
            </a>
          )}
        </div>
      </div>
      {youtubeKey && type === "movie" && (
        <div className="border-t border-slate-200/70 bg-slate-50/60 p-5 dark:border-slate-700/60 dark:bg-slate-900/40 sm:p-6">
          {!showPlayer ? (
            <button
              type="button"
              onClick={() => setShowPlayer(true)}
              aria-label={`Play trailer for ${title}`}
              className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-slate-900"
            >
                <img
                src={`https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg shadow-black/30 transition-transform duration-200 group-hover:scale-110">
                  <PlayCircle size={36} strokeWidth={1.5} />
                </span>
              </span>
              <span className="absolute bottom-3 left-3 right-3 truncate text-left text-xs font-bold text-white/90">
                {media?.provider === "youtube" && media.name
                  ? media.name
                  : "Watch trailer"}
              </span>
            </button>
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                title={`${title} trailer`}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupQuizLobbyPage;
