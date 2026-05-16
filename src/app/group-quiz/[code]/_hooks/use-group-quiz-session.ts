"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
import { supabase } from "@/integrations/supabase/client";

/**
 * Owns the group-quiz room's session lifecycle: initial load by code,
 * the realtime channel (session patches + participant joins/leaves with
 * toasts), the resolved "me" participant, and the host/submission
 * derivations + leave-guard. Extracted verbatim from
 * group-quiz/[code]/page.tsx; owns its own auth + GroupQuiz.session i18n.
 */
export function useGroupQuizSession(code: string) {
  const { user } = useAuth();
  const t = useTranslations("GroupQuiz.session");

  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              toast.message(t("left", { name: left.display_name }));
            }
          } else if (payload.eventType === "INSERT") {
            const joined = payload.new as
              | { display_name?: string }
              | undefined;
            if (joined?.display_name) {
              toast.success(t("joined", { name: joined.display_name }));
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
  const lobbyFull =
    !!session && participants.length >= session.max_participants;

  // Guard navigation during the answering phase. Once submitted, leaving is
  // fine — the answers are already on the server.
  useLeaveGuard(
    !!me &&
      session?.status === "in_progress" &&
      !submitted &&
      !!session.questions?.length,
    t("leaveQuizConfirm"),
  );
  const submittedCount = participants.filter(
    (p) => p.answers_submitted_at,
  ).length;
  const allSubmitted =
    participants.length > 0 && submittedCount === participants.length;

  return {
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
  };
}
