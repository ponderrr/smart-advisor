import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/group_quiz/models/group_quiz.dart';
import 'package:smart_advisor/features/group_quiz/screens/group_quiz_screen.dart';
import 'package:smart_advisor/ui/theme/app_theme.dart';

void main() {
  test('QuizSession parses a realtime row incl. nested result/questions', () {
    final row = {
      'id': 's1',
      'code': 'AB12CD',
      'host_user_id': 'u1',
      'status': 'completed',
      'content_type': 'mix',
      'question_count': 5,
      'max_participants': 8,
      'recommendation_id': null,
      'questions': [
        {'id': 'q1', 'text': 'Vibe?', 'type': 'single_select',
         'options': ['A', 'B']},
      ],
      'result': {
        'movie': {'title': 'Past Lives', 'director': 'Celine Song',
                  'year': 2023, 'genres': ['Drama'],
                  'explanation': 'group fit'},
      },
      'created_at': '2026-05-16T00:00:00Z',
      'completed_at': '2026-05-16T01:00:00Z',
      'expires_at': '2026-05-17T00:00:00Z',
    };
    final s = QuizSession.fromJson(row);
    expect(s.status, QuizSessionStatus.completed);
    expect(s.questions!.single.text, 'Vibe?');
    expect(s.result!.movie!.title, 'Past Lives');
    expect(s.result!.movie!.director, 'Celine Song');
  });

  test('QuizParticipant maps snake_case + host flag', () {
    final p = QuizParticipant.fromJson(const {
      'id': 'p1',
      'session_id': 's1',
      'user_id': null,
      'display_name': 'Guest',
      'is_host': false,
      'joined_at': 't',
      'answers_submitted_at': null,
    });
    expect(p.displayName, 'Guest');
    expect(p.isHost, isFalse);
    expect(p.userId, isNull);
  });

  testWidgets('Group-quiz landing shows host/join paths', (t) async {
    await t.pumpWidget(ProviderScope(
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const GroupQuizScreen(),
      ),
    ));
    await t.pump();
    expect(find.text('Find a pick together'), findsOneWidget);
    expect(find.text('Host a session'), findsOneWidget);
    expect(find.text('Join with a code'), findsOneWidget);
  });
}
