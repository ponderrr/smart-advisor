import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/models/answer.dart';
import 'package:smart_advisor/core/models/enums.dart';
import 'package:smart_advisor/features/quiz/store/quiz_store.dart';

void main() {
  late ProviderContainer c;
  setUp(() => c = ProviderContainer());
  tearDown(() => c.dispose());

  test('defaults match the web store', () {
    final s = c.read(quizStoreProvider);
    expect(s.contentType, isNull);
    expect(s.questionCount, 5);
    expect(s.answers, isEmpty);
    expect(s.recommendations, isEmpty);
  });

  test('actions update state immutably', () {
    final store = c.read(quizStoreProvider.notifier);
    store.setContentType(ContentType.mix);
    store.setQuestionCount(10);
    store.setUserAge(22);
    store.setFilters(genres: ['Drama'], moods: ['cozy']);
    store.setAnswers(const [
      Answer(id: 'a1', questionId: 'q1', answerText: 'Cozy'),
    ]);

    final s = c.read(quizStoreProvider);
    expect(s.contentType, ContentType.mix);
    expect(s.questionCount, 10);
    expect(s.userAge, 22);
    expect(s.genres, ['Drama']);
    expect(s.answers.single.answerText, 'Cozy');
  });

  test('reset returns to defaults', () {
    final store = c.read(quizStoreProvider.notifier);
    store.setContentType(ContentType.movie);
    store.setQuestionCount(12);
    store.reset();

    final s = c.read(quizStoreProvider);
    expect(s.contentType, isNull);
    expect(s.questionCount, 5);
  });
}
