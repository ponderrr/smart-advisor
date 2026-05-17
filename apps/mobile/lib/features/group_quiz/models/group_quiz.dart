import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../core/models/question.dart';

part 'group_quiz.freezed.dart';
part 'group_quiz.g.dart';

enum QuizSessionStatus {
  @JsonValue('lobby')
  lobby,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled;

  String get wire => switch (this) {
        QuizSessionStatus.lobby => 'lobby',
        QuizSessionStatus.inProgress => 'in_progress',
        QuizSessionStatus.completed => 'completed',
        QuizSessionStatus.cancelled => 'cancelled',
      };
}

@freezed
abstract class GroupQuizPick with _$GroupQuizPick {
  const factory GroupQuizPick({
    required String title,
    String? director,
    String? author,
    String? artist,
    int? year,
    @Default(<String>[]) List<String> genres,
    String? explanation,
    String? description,
    @JsonKey(name: 'poster_url') String? posterUrl,
    @JsonKey(name: 'preview_url') String? previewUrl,
  }) = _GroupQuizPick;

  factory GroupQuizPick.fromJson(Map<String, dynamic> json) =>
      _$GroupQuizPickFromJson(json);
}

@freezed
abstract class GroupQuizResult with _$GroupQuizResult {
  const factory GroupQuizResult({
    GroupQuizPick? movie,
    GroupQuizPick? book,
    GroupQuizPick? music,
  }) = _GroupQuizResult;

  factory GroupQuizResult.fromJson(Map<String, dynamic> json) =>
      _$GroupQuizResultFromJson(json);
}

@freezed
abstract class QuizSession with _$QuizSession {
  const factory QuizSession({
    required String id,
    required String code,
    @JsonKey(name: 'host_user_id') String? hostUserId,
    required QuizSessionStatus status,
    @JsonKey(name: 'content_type') required String contentType,
    @JsonKey(name: 'question_count') required int questionCount,
    @JsonKey(name: 'max_participants') required int maxParticipants,
    @JsonKey(name: 'recommendation_id') String? recommendationId,
    List<Question>? questions,
    GroupQuizResult? result,
    @JsonKey(name: 'created_at') required String createdAt,
    @JsonKey(name: 'completed_at') String? completedAt,
    @JsonKey(name: 'expires_at') required String expiresAt,
  }) = _QuizSession;

  factory QuizSession.fromJson(Map<String, dynamic> json) =>
      _$QuizSessionFromJson(json);
}

@freezed
abstract class QuizParticipant with _$QuizParticipant {
  const factory QuizParticipant({
    required String id,
    @JsonKey(name: 'session_id') required String sessionId,
    @JsonKey(name: 'user_id') String? userId,
    @JsonKey(name: 'display_name') required String displayName,
    @JsonKey(name: 'is_host') @Default(false) bool isHost,
    @JsonKey(name: 'joined_at') required String joinedAt,
    @JsonKey(name: 'answers_submitted_at') String? answersSubmittedAt,
  }) = _QuizParticipant;

  factory QuizParticipant.fromJson(Map<String, dynamic> json) =>
      _$QuizParticipantFromJson(json);
}

@freezed
abstract class QuizAnswerRow with _$QuizAnswerRow {
  const factory QuizAnswerRow({
    required String id,
    @JsonKey(name: 'session_id') required String sessionId,
    @JsonKey(name: 'participant_id') required String participantId,
    @JsonKey(name: 'question_index') required int questionIndex,
    required String question,
    required String answer,
    @JsonKey(name: 'created_at') required String createdAt,
  }) = _QuizAnswerRow;

  factory QuizAnswerRow.fromJson(Map<String, dynamic> json) =>
      _$QuizAnswerRowFromJson(json);
}
