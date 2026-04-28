import { supabase } from "@/integrations/supabase/client";
import { generateQuestionsWithRetry } from "@/features/recommendations/services/ai-service";
import { generateRecommendations } from "@/features/recommendations/services/ai-service";
import { databaseService } from "@/features/recommendations/services/database-service";
import type { Answer } from "@/features/quiz/types/answer";
import type { Question } from "@/features/quiz/types/question";

import type {
  CreateSessionInput,
  GroupQuizResult,
  JoinSessionInput,
  QuizAnswer,
  QuizParticipant,
  QuizSession,
  QuizSessionStatus,
} from "../types/group-quiz";

const GUEST_ID_KEY = "smart-advisor.group-quiz.guest-participant-id";

const sessionsTable = () =>
  (supabase as unknown as { from: typeof supabase.from }).from(
    "quiz_sessions",
  );
const participantsTable = () =>
  (supabase as unknown as { from: typeof supabase.from }).from(
    "quiz_participants",
  );
const answersTable = () =>
  (supabase as unknown as { from: typeof supabase.from }).from("quiz_answers");

/** A 6-char shareable code without easily-confused characters. */
const generateCode = () => {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

const guestParticipantId = (sessionCode: string) => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${GUEST_ID_KEY}:${sessionCode}`);
  return raw ?? null;
};

const setGuestParticipantId = (sessionCode: string, id: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${GUEST_ID_KEY}:${sessionCode}`, id);
};

class GroupQuizService {
  /**
   * Create a session as the host. The host must be authenticated (RLS).
   * Returns both the session and the host's participant row so the UI can
   * immediately treat the creator as a player too.
   */
  async createSession(input: CreateSessionInput): Promise<{
    session: QuizSession | null;
    participant: QuizParticipant | null;
    error: string | null;
  }> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return {
        session: null,
        participant: null,
        error: "You must be signed in to host a group quiz.",
      };
    }

    // Try a few times in the (rare) case of a code collision.
    let session: QuizSession | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateCode();
      const { data, error } = (await sessionsTable()
        .insert({
          code,
          host_user_id: authData.user.id,
          status: "lobby",
          content_type: input.content_type,
          question_count: input.question_count,
        })
        .select("*")
        .single()) as { data: QuizSession | null; error: { code?: string; message: string } | null };

      if (!error && data) {
        session = data;
        break;
      }
      if (error?.code !== "23505") {
        return { session: null, participant: null, error: error?.message ?? "Failed to create session" };
      }
    }

    if (!session) {
      return {
        session: null,
        participant: null,
        error: "Couldn't generate a unique code, try again.",
      };
    }

    const { data: participant, error: pErr } = (await participantsTable()
      .insert({
        session_id: session.id,
        user_id: authData.user.id,
        display_name: input.display_name,
        is_host: true,
      })
      .select("*")
      .single()) as { data: QuizParticipant | null; error: { message: string } | null };

    if (pErr || !participant) {
      return {
        session,
        participant: null,
        error: pErr?.message ?? "Failed to register host as participant",
      };
    }
    return { session, participant, error: null };
  }

  /**
   * Look up a session by its share code, ignoring sessions that have already
   * passed their `expires_at` (24h after creation). Stale codes look like
   * "Session not found" rather than letting people resurrect expired lobbies.
   */
  async findByCode(
    code: string,
  ): Promise<{ session: QuizSession | null; error: string | null }> {
    const { data, error } = (await sessionsTable()
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .gte("expires_at", new Date().toISOString())
      .maybeSingle()) as { data: QuizSession | null; error: { message: string } | null };
    if (error) return { session: null, error: error.message };
    return { session: data, error: null };
  }

  /**
   * Join a session — works for signed-in users and anonymous guests.
   * The guest's participant id is cached in localStorage so a refresh
   * doesn't kick them out.
   */
  async joinSession(input: JoinSessionInput): Promise<{
    session: QuizSession | null;
    participant: QuizParticipant | null;
    error: string | null;
  }> {
    const { session, error: lookupErr } = await this.findByCode(input.code);
    if (lookupErr || !session) {
      return { session: null, participant: null, error: lookupErr ?? "Code not found" };
    }
    if (session.status === "cancelled") {
      return { session: null, participant: null, error: "Session was cancelled." };
    }
    if (session.status === "completed") {
      return { session, participant: null, error: "Session already finished." };
    }

    // Re-use existing guest participant if present
    const existingGuestId = guestParticipantId(session.code);
    if (existingGuestId) {
      const { data: existing } = (await participantsTable()
        .select("*")
        .eq("id", existingGuestId)
        .maybeSingle()) as { data: QuizParticipant | null };
      if (existing && existing.session_id === session.id) {
        return { session, participant: existing, error: null };
      }
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? null;

    const { data: participant, error } = (await participantsTable()
      .insert({
        session_id: session.id,
        user_id: userId,
        display_name: input.display_name.trim() || "Guest",
        is_host: false,
      })
      .select("*")
      .single()) as { data: QuizParticipant | null; error: { message: string } | null };

    if (error || !participant) {
      return {
        session,
        participant: null,
        error: error?.message ?? "Failed to join session",
      };
    }

    if (!userId) setGuestParticipantId(session.code, participant.id);
    return { session, participant, error: null };
  }

  async listParticipants(
    sessionId: string,
  ): Promise<{ data: QuizParticipant[]; error: string | null }> {
    const { data, error } = (await participantsTable()
      .select("*")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true })) as {
      data: QuizParticipant[] | null;
      error: { message: string } | null;
    };
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  async listAnswers(
    sessionId: string,
  ): Promise<{ data: QuizAnswer[]; error: string | null }> {
    const { data, error } = (await answersTable()
      .select("*")
      .eq("session_id", sessionId)) as {
      data: QuizAnswer[] | null;
      error: { message: string } | null;
    };
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  async submitAnswer(input: {
    session_id: string;
    participant_id: string;
    question_index: number;
    question: string;
    answer: string;
  }): Promise<{ error: string | null }> {
    const { error } = await answersTable()
      .upsert(input, { onConflict: "participant_id,question_index" })
      .select();
    return { error: error?.message ?? null };
  }

  async markParticipantSubmitted(
    participantId: string,
  ): Promise<{ error: string | null }> {
    const { error } = await participantsTable()
      .update({ answers_submitted_at: new Date().toISOString() })
      .eq("id", participantId);
    return { error: error?.message ?? null };
  }

  async setStatus(
    sessionId: string,
    status: QuizSessionStatus,
  ): Promise<{ error: string | null }> {
    const patch: Record<string, unknown> = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await sessionsTable().update(patch).eq("id", sessionId);
    return { error: error?.message ?? null };
  }

  async leave(participantId: string): Promise<{ error: string | null }> {
    const { error } = await participantsTable().delete().eq("id", participantId);
    return { error: error?.message ?? null };
  }

  /**
   * Pause the quiz and send everyone back to the lobby (e.g., the host wants
   * to wait for late joiners). Clears any in-flight answers, prior questions,
   * and the result so a fresh round starts cleanly when Start Quiz is
   * pressed again.
   */
  async returnToLobby(
    session: QuizSession,
  ): Promise<{ error: string | null }> {
    const { error: ansErr } = await answersTable()
      .delete()
      .eq("session_id", session.id);
    if (ansErr) return { error: ansErr.message };

    const { error: pErr } = await participantsTable()
      .update({ answers_submitted_at: null })
      .eq("session_id", session.id);
    if (pErr) return { error: pErr.message };

    const { error: sErr } = await sessionsTable()
      .update({
        status: "lobby",
        questions: null,
        result: null,
        completed_at: null,
      })
      .eq("id", session.id);
    return { error: sErr?.message ?? null };
  }

  /**
   * Reset the session for another round with the same lobby — clear all
   * answers, reset every participant's submitted timestamp, drop the prior
   * result, then generate fresh questions and flip status back to in_progress.
   */
  async restartSession(
    session: QuizSession,
    hostAge: number,
    hostName: string,
  ): Promise<{ questions: Question[] | null; error: string | null }> {
    const { error: ansErr } = await answersTable()
      .delete()
      .eq("session_id", session.id);
    if (ansErr) return { questions: null, error: ansErr.message };

    const { error: pErr } = await participantsTable()
      .update({ answers_submitted_at: null })
      .eq("session_id", session.id);
    if (pErr) return { questions: null, error: pErr.message };

    const { error: sErr } = await sessionsTable()
      .update({ result: null, completed_at: null })
      .eq("id", session.id);
    if (sErr) return { questions: null, error: sErr.message };

    return this.generateAndStartQuiz(session, hostAge, hostName);
  }

  /**
   * Generate the question set for a session and persist it on the row, then
   * flip status to in_progress. All participants pick up the questions via
   * the realtime subscription on `quiz_sessions`.
   */
  async generateAndStartQuiz(
    session: QuizSession,
    hostAge: number,
    hostName: string,
  ): Promise<{ questions: Question[] | null; error: string | null }> {
    try {
      const questions = await generateQuestionsWithRetry(
        session.content_type,
        hostAge,
        session.question_count,
        hostName,
      );
      const { error } = await sessionsTable()
        .update({ questions, status: "in_progress" })
        .eq("id", session.id);
      if (error) return { questions: null, error: error.message };
      return { questions, error: null };
    } catch (err) {
      return {
        questions: null,
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate questions",
      };
    }
  }

  /**
   * Combine every participant's answers into a single synthetic answer set
   * and ask the existing recommendations edge function to find common ground.
   * Saves the result on the session and flips status to completed.
   */
  async synthesizeRecommendation(
    session: QuizSession,
    participants: QuizParticipant[],
    answers: QuizAnswer[],
    hostAge: number,
    hostName: string,
  ): Promise<{ result: GroupQuizResult | null; error: string | null }> {
    if (!session.questions || session.questions.length === 0) {
      return { result: null, error: "No questions on session" };
    }

    // Group answers by question_index → list of `Name: answer` lines
    const byQuestion = new Map<number, string[]>();
    const nameById = new Map(
      participants.map((p) => [p.id, p.display_name] as const),
    );
    answers.forEach((a) => {
      const name = nameById.get(a.participant_id) ?? "Player";
      const list = byQuestion.get(a.question_index) ?? [];
      list.push(`${name}: ${a.answer}`);
      byQuestion.set(a.question_index, list);
    });

    const combinedAnswers: Answer[] = session.questions.map((q, idx) => ({
      id: `combined-${idx}`,
      question_id: q.id,
      question_text: q.text,
      answer_text:
        byQuestion.get(idx)?.join(" | ") ??
        "(no responses — pick something widely appealing)",
      created_at: new Date().toISOString(),
    }));

    try {
      const data = await generateRecommendations(
        combinedAnswers,
        session.content_type,
        hostAge,
        // Synthesizer prompt: tell the model these are multiple players.
        `${hostName} hosting a group of ${participants.length}`,
      );
      const result: GroupQuizResult = {};
      if (data.movieRecommendation) {
        const m = data.movieRecommendation;
        result.movie = {
          title: m.title,
          director: m.director,
          year: m.year,
          genres: m.genres,
          explanation: m.explanation,
        };
      }
      if (data.bookRecommendation) {
        const b = data.bookRecommendation;
        result.book = {
          title: b.title,
          author: b.author,
          year: b.year,
          genres: b.genres,
          explanation: b.explanation,
        };
      }

      // Persist the picks to the host's recommendations table so they show
      // up in History/Library and feed future taste signals. We swallow any
      // save errors — the synth result is already committed to the session
      // row, so the group experience isn't blocked by a save failure.
      // saveRecommendation reads user_id from the auth session, so user_id
      // here is a stub the service ignores — but the type requires it.
      let savedRecommendationId: string | null = null;
      if (result.movie) {
        const saved = await databaseService.saveRecommendation({
          user_id: "",
          type: "movie",
          title: result.movie.title,
          director: result.movie.director,
          year: result.movie.year,
          genres: result.movie.genres ?? [],
          explanation: result.movie.explanation,
          content_type: session.content_type,
          is_favorited: false,
          rating: 0,
        } as Parameters<typeof databaseService.saveRecommendation>[0]);
        savedRecommendationId = saved.data?.id ?? null;
      }
      if (result.book) {
        const saved = await databaseService.saveRecommendation({
          user_id: "",
          type: "book",
          title: result.book.title,
          author: result.book.author,
          year: result.book.year,
          genres: result.book.genres ?? [],
          explanation: result.book.explanation,
          content_type: session.content_type,
          is_favorited: false,
          rating: 0,
        } as Parameters<typeof databaseService.saveRecommendation>[0]);
        savedRecommendationId = savedRecommendationId ?? saved.data?.id ?? null;
      }

      const { error } = await sessionsTable()
        .update({
          result,
          status: "completed",
          completed_at: new Date().toISOString(),
          recommendation_id: savedRecommendationId,
        })
        .eq("id", session.id);
      if (error) return { result, error: error.message };
      return { result, error: null };
    } catch (err) {
      return {
        result: null,
        error:
          err instanceof Error
            ? err.message
            : "Failed to synthesize recommendation",
      };
    }
  }
}

export const groupQuizService = new GroupQuizService();
export { guestParticipantId, setGuestParticipantId };
