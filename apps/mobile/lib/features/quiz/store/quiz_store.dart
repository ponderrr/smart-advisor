import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/recommendation.dart';

part 'quiz_store.freezed.dart';

/// Port of web quiz-store.ts (Zustand). In-memory only — a hard reload
/// clears it, matching web behavior.
@freezed
abstract class QuizState with _$QuizState {
  const factory QuizState({
    ContentType? contentType,
    @Default(5) int questionCount,
    @Default(<Answer>[]) List<Answer> answers,
    int? userAge,
    @Default(<String>[]) List<String> genres,
    @Default(<String>[]) List<String> moods,
    @Default(<Recommendation>[]) List<Recommendation> recommendations,
  }) = _QuizState;
}

class QuizStore extends Notifier<QuizState> {
  @override
  QuizState build() => const QuizState();

  void setContentType(ContentType type) =>
      state = state.copyWith(contentType: type);

  void setQuestionCount(int count) =>
      state = state.copyWith(questionCount: count);

  void setAnswers(List<Answer> answers) =>
      state = state.copyWith(answers: answers);

  void setUserAge(int age) => state = state.copyWith(userAge: age);

  void setFilters({required List<String> genres, required List<String> moods}) =>
      state = state.copyWith(genres: genres, moods: moods);

  void setRecommendations(List<Recommendation> recs) =>
      state = state.copyWith(recommendations: recs);

  void reset() => state = const QuizState();
}

final quizStoreProvider =
    NotifierProvider<QuizStore, QuizState>(QuizStore.new);
