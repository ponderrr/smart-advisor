import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/ai_models.dart';
import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/question.dart';
import '../../../core/result.dart';
import '../../recommendations/services/ai_service.dart';
import '../models/group_quiz.dart';

/// Port of web group-quiz-service.ts. All direct Supabase (no Next.js
/// routes); questions/recs via the anthropic-* Edge Functions through
/// AiService. Realtime is handled separately by the session provider.
class GroupQuizService {
  GroupQuizService(this._c, this._ai);

  final SupabaseClient _c;
  final AiService _ai;

  static const _sessions = 'quiz_sessions';
  static const _participants = 'quiz_participants';
  static const _answers = 'quiz_answers';

  String _code() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final r = Random.secure();
    return List.generate(6, (_) => a[r.nextInt(a.length)]).join();
  }

  Future<({QuizSession? session, QuizParticipant? participant, String? error})>
      createSession({
    required String contentType,
    required int questionCount,
    required int maxParticipants,
    required String displayName,
    // Async mode (additive): live callers omit both and behaviour is
    // identical to before. A non-null deadlineAt creates an async session.
    DateTime? deadlineAt,
    DateTime? plannedFor,
  }) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) {
      return (session: null, participant: null, error: 'Sign in to host.');
    }
    try {
      final s = await _c
          .from(_sessions)
          .insert({
            'code': _code(),
            'host_user_id': uid,
            'content_type': contentType,
            'question_count': questionCount,
            'max_participants': maxParticipants,
            if (deadlineAt != null)
              'deadline_at': deadlineAt.toUtc().toIso8601String(),
            if (plannedFor != null)
              'planned_for': plannedFor.toUtc().toIso8601String(),
          })
          .select()
          .single();
      final session = QuizSession.fromJson(Map<String, dynamic>.from(s));
      final p = await _c
          .from(_participants)
          .insert({
            'session_id': session.id,
            'user_id': uid,
            'display_name': displayName,
            'is_host': true,
          })
          .select()
          .single();
      return (
        session: session,
        participant:
            QuizParticipant.fromJson(Map<String, dynamic>.from(p)),
        error: null,
      );
    } on PostgrestException catch (e) {
      return (session: null, participant: null, error: e.message);
    }
  }

  Future<({QuizSession? session, String? error})> findByCode(
      String code) async {
    try {
      final row = await _c
          .from(_sessions)
          .select()
          .eq('code', code.toUpperCase())
          .gte('expires_at', DateTime.now().toUtc().toIso8601String())
          .maybeSingle();
      if (row == null) {
        return (session: null, error: 'Session not found or expired.');
      }
      return (
        session: QuizSession.fromJson(Map<String, dynamic>.from(row)),
        error: null
      );
    } on PostgrestException catch (e) {
      return (session: null, error: e.message);
    }
  }

  Future<({QuizSession? session, QuizParticipant? participant, String? error})>
      joinSession(
          {required String code, required String displayName}) async {
    final found = await findByCode(code);
    if (found.session == null) {
      return (session: null, participant: null, error: found.error);
    }
    final session = found.session!;
    try {
      final count = await _c
          .from(_participants)
          .select('id')
          .eq('session_id', session.id)
          .count();
      if (count.count >= session.maxParticipants) {
        return (session: null, participant: null, error: 'Session is full.');
      }
      final p = await _c
          .from(_participants)
          .insert({
            'session_id': session.id,
            'user_id': _c.auth.currentUser?.id,
            'display_name': displayName,
          })
          .select()
          .single();
      final participant =
          QuizParticipant.fromJson(Map<String, dynamic>.from(p));
      await _setGuestId(session.code, participant.id);
      return (session: session, participant: participant, error: null);
    } on PostgrestException catch (e) {
      return (session: null, participant: null, error: e.message);
    }
  }

  Future<QuizSession?> getSession(String sessionId) async {
    final row = await _c
        .from(_sessions)
        .select()
        .eq('id', sessionId)
        .maybeSingle();
    return row == null
        ? null
        : QuizSession.fromJson(Map<String, dynamic>.from(row));
  }

  Future<List<QuizParticipant>> listParticipants(String sessionId) async {
    final rows = await _c
        .from(_participants)
        .select()
        .eq('session_id', sessionId)
        .order('joined_at');
    return rows
        .map((r) => QuizParticipant.fromJson(Map<String, dynamic>.from(r)))
        .toList();
  }

  Future<List<QuizAnswerRow>> listAnswers(String sessionId) async {
    final rows =
        await _c.from(_answers).select().eq('session_id', sessionId);
    return rows
        .map((r) => QuizAnswerRow.fromJson(Map<String, dynamic>.from(r)))
        .toList();
  }

  Future<ServiceResult<void>> submitAnswer({
    required String sessionId,
    required String participantId,
    required int questionIndex,
    required String question,
    required String answer,
  }) async {
    try {
      await _c.from(_answers).upsert({
        'session_id': sessionId,
        'participant_id': participantId,
        'question_index': questionIndex,
        'question': question,
        'answer': answer,
      }, onConflict: 'participant_id,question_index');
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> markParticipantSubmitted(
      String participantId) async {
    try {
      await _c.from(_participants).update({
        'answers_submitted_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', participantId);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> setStatus(
      String sessionId, QuizSessionStatus status) async {
    try {
      await _c.from(_sessions).update({
        'status': status.wire,
        if (status == QuizSessionStatus.completed)
          'completed_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', sessionId);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> leave(String participantId) async {
    try {
      await _c.from(_participants).delete().eq('id', participantId);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<({List<Question>? questions, String? error})> generateAndStartQuiz(
      QuizSession session, int hostAge, String hostName,
      {required String contentTone}) async {
    try {
      final qs = await _ai.generateQuestionsWithRetry(
        contentType: ContentType.fromWire(session.contentType),
        userAge: hostAge,
        contentTone: contentTone,
        questionCount: session.questionCount,
        userName: hostName,
      );
      await _c.from(_sessions).update({
        'questions': qs.map((q) => q.toJson()).toList(),
        'status': QuizSessionStatus.inProgress.wire,
      }).eq('id', session.id);
      return (questions: qs, error: null);
    } on AiServiceException catch (e) {
      return (questions: null, error: e.message);
    }
  }

  /// Combine every participant's answers into one profile and synthesize a
  /// shared recommendation, then complete the session (realtime propagates).
  ///
  /// This is the live-mode completion entry point and is unchanged in
  /// behaviour — it just delegates the actual synthesis+finalize to the
  /// shared [_finalize] helper so async mode can reuse the exact same
  /// recommendation/completion logic instead of duplicating it.
  Future<ServiceResult<void>> synthesizeRecommendation(
      QuizSession session, List<QuizParticipant> participants, int hostAge,
      String hostName,
      {required String contentTone}) {
    return _finalize(
      session,
      participants.length,
      hostAge,
      hostName,
      contentTone: contentTone,
    );
  }

  /// Shared synthesize-and-complete used by BOTH live completion and async
  /// resolution. Sets result/status/completed_at exactly as live mode did.
  Future<ServiceResult<void>> _finalize(
      QuizSession session, int groupSize, int hostAge, String hostName,
      {required String contentTone}) async {
    final answerRows = await listAnswers(session.id);
    final answers = [
      for (var i = 0; i < answerRows.length; i++)
        Answer(
          id: 'g$i',
          questionId: 'q${answerRows[i].questionIndex}',
          questionText: answerRows[i].question,
          answerText: answerRows[i].answer,
        ),
    ];
    try {
      final data = await _ai.generateRecommendationsWithRetry(
        answers: answers,
        contentType: ContentType.fromWire(session.contentType),
        userAge: hostAge,
        contentTone: contentTone,
        userName: '$hostName hosting $groupSize group',
      );
      GroupQuizPick? pick(item) => item == null
          ? null
          : GroupQuizPick(
              title: item.title,
              director: item.director,
              author: item.author,
              artist: item.artist,
              year: item.year,
              genres: item.genres,
              explanation: item.explanation,
              description: item.description,
            );
      final result = GroupQuizResult(
        movie: pick(data.movieRecommendation),
        book: pick(data.bookRecommendation),
        music: pick(data.musicRecommendation),
      );
      await _c.from(_sessions).update({
        'result': result.toJson(),
        'status': QuizSessionStatus.completed.wire,
        'completed_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', session.id);
      return ServiceResult.ok(null);
    } on AiServiceException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  /// Async-mode resolution without a server scheduler. Resolves the group
  /// pick CLIENT-side when either condition holds:
  ///   * every joined participant has submitted, OR
  ///   * the deadline has passed (now >= deadline_at).
  /// Idempotent — guarded on a non-completed async session, so concurrent
  /// callers (last submitter + a post-deadline opener) can't double-run and
  /// the live (deadline_at == null) path is never touched.
  ///
  /// Returns (resolved, error): resolved == true only when this call
  /// actually performed the finalize; false means "not ready / already
  /// done" (not an error).
  Future<({bool resolved, String? error})> resolveIfReady(
      String sessionId, int hostAge, String hostName,
      {required String contentTone}) async {
    final session = await getSession(sessionId);
    if (session == null) {
      return (resolved: false, error: 'Session not found.');
    }
    // Live sessions (no deadline) and already-completed sessions are
    // explicitly out of scope — never alter the live completion path.
    if (!session.isAsync ||
        session.status == QuizSessionStatus.completed) {
      return (resolved: false, error: null);
    }
    final parts = await listParticipants(sessionId);
    final allIn = parts.isNotEmpty &&
        parts.every((p) => p.answersSubmittedAt != null);
    final deadline = session.deadlineAtUtc;
    final past = deadline != null &&
        !DateTime.now().toUtc().isBefore(deadline);
    if (!allIn && !past) {
      return (resolved: false, error: null);
    }
    final r = await _finalize(
      session,
      parts.length,
      hostAge,
      hostName,
      contentTone: contentTone,
    );
    return (resolved: !r.isError, error: r.error);
  }

  /// Async create flow: generate the question set and move the session
  /// straight to in_progress (no host-driven lobby start), reusing the
  /// same question generation as live. Live mode keeps using
  /// generateAndStartQuiz from the lobby — that path is unchanged.
  Future<({List<Question>? questions, String? error})> startAsyncQuiz(
      QuizSession session, int hostAge, String hostName,
      {required String contentTone}) {
    return generateAndStartQuiz(session, hostAge, hostName,
        contentTone: contentTone);
  }

  // Guest participant id cache (parity with web localStorage).
  Future<void> _setGuestId(String code, String id) async {
    final p = await SharedPreferences.getInstance();
    await p.setString('sa.group-quiz.guest:$code', id);
  }

  Future<String?> guestParticipantId(String code) async {
    final p = await SharedPreferences.getInstance();
    return p.getString('sa.group-quiz.guest:$code');
  }
}
