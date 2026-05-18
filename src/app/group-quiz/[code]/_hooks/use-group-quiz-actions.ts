"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { groupQuizService } from "@/features/group-quiz/services/group-quiz-service";
import type {
  QuizParticipant,
  QuizSession,
} from "@/features/group-quiz/types/group-quiz";
import { isOverloadedError } from "@/features/recommendations/services/ai-service";

import { formatAnswerForStorage, hasAnswer, type LocalAnswers } from "../_lib/answers";

interface UseGroupQuizActionsParams {
  session: QuizSession | null;
  setSession: Dispatch<SetStateAction<QuizSession | null>>;
  participants: QuizParticipant[];
  setParticipants: Dispatch<SetStateAction<QuizParticipant[]>>;
  me: QuizParticipant | null;
  localAnswers: LocalAnswers;
  setCurrentQ: Dispatch<SetStateAction<number>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setStarting: Dispatch<SetStateAction<boolean>>;
  setSynthesizing: Dispatch<SetStateAction<boolean>>;
  joinHereName: string;
  setJoiningHere: Dispatch<SetStateAction<boolean>>;
}

/**
 * The group-quiz room action layer: host start/restart/synthesize,
 * cancel/leave, answer submission, join-here, back-to-lobby, and the
 * dashboard exit. Extracted verbatim from group-quiz/[code]/page.tsx;
 * owns its own router + auth + GroupQuiz.session i18n. Session state is
 * threaded in from useGroupQuizSession; optimistic setSession patches
 * are preserved exactly.
 */
export function useGroupQuizActions({
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
}: UseGroupQuizActionsParams) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("GroupQuiz.session");

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
        isOverloadedError(e)
          ? t("host.overloaded")
          : (e ?? t("host.startFailed")),
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
    const { result, error: e } =
      await groupQuizService.synthesizeRecommendation(
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

  // Guests can be in a room without an account, so their exit is the
  // marketing home — /feed would just redirect them to /auth.
  const handleBackHome = () => router.push(user ? "/feed" : "/");

  return {
    handleStart,
    handleCancel,
    handleLeave,
    handleSubmitAnswers,
    handleJoinHere,
    handleBackToLobby,
    handleRestart,
    handleSynthesize,
    handleBackHome,
  };
}
