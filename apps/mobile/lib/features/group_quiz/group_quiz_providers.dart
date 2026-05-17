import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/services/service_providers.dart';
import '../../core/supabase/supabase_providers.dart';
import 'models/group_quiz.dart';
import 'services/group_quiz_service.dart';

final groupQuizServiceProvider = Provider<GroupQuizService>((ref) =>
    GroupQuizService(
        ref.watch(supabaseClientProvider), ref.watch(aiServiceProvider)));

class GroupQuizState {
  const GroupQuizState(this.session, this.participants);
  final QuizSession session;
  final List<QuizParticipant> participants;
}

/// Realtime session stream: initial fetch + a `quiz-session-<id>` channel
/// (postgres_changes on quiz_sessions + quiz_participants, filtered to this
/// session) that refetches on any change — mirrors the web hook.
final groupQuizSessionProvider = StreamProvider.autoDispose
    .family<GroupQuizState, String>((ref, sessionId) {
  final c = ref.watch(supabaseClientProvider);
  final svc = ref.watch(groupQuizServiceProvider);
  final controller = StreamController<GroupQuizState>();

  Future<void> push() async {
    final session = await svc.getSession(sessionId);
    final participants = await svc.listParticipants(sessionId);
    if (session != null && !controller.isClosed) {
      controller.add(GroupQuizState(session, participants));
    }
  }

  final channel = c
      .channel('quiz-session-$sessionId')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'quiz_sessions',
        filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: sessionId),
        callback: (_) => push(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'quiz_participants',
        filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'session_id',
            value: sessionId),
        callback: (_) => push(),
      )
      .subscribe();

  ref.onDispose(() {
    c.removeChannel(channel);
    controller.close();
  });

  push();
  return controller.stream;
});
