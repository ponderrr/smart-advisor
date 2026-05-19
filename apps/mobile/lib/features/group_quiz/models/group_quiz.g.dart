// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'group_quiz.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_GroupQuizPick _$GroupQuizPickFromJson(Map<String, dynamic> json) =>
    _GroupQuizPick(
      title: json['title'] as String,
      director: json['director'] as String?,
      author: json['author'] as String?,
      artist: json['artist'] as String?,
      year: (json['year'] as num?)?.toInt(),
      genres:
          (json['genres'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      explanation: json['explanation'] as String?,
      description: json['description'] as String?,
      posterUrl: json['poster_url'] as String?,
      previewUrl: json['preview_url'] as String?,
    );

Map<String, dynamic> _$GroupQuizPickToJson(_GroupQuizPick instance) =>
    <String, dynamic>{
      'title': instance.title,
      'director': instance.director,
      'author': instance.author,
      'artist': instance.artist,
      'year': instance.year,
      'genres': instance.genres,
      'explanation': instance.explanation,
      'description': instance.description,
      'poster_url': instance.posterUrl,
      'preview_url': instance.previewUrl,
    };

_GroupQuizResult _$GroupQuizResultFromJson(Map<String, dynamic> json) =>
    _GroupQuizResult(
      movie: json['movie'] == null
          ? null
          : GroupQuizPick.fromJson(json['movie'] as Map<String, dynamic>),
      book: json['book'] == null
          ? null
          : GroupQuizPick.fromJson(json['book'] as Map<String, dynamic>),
      music: json['music'] == null
          ? null
          : GroupQuizPick.fromJson(json['music'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$GroupQuizResultToJson(_GroupQuizResult instance) =>
    <String, dynamic>{
      'movie': instance.movie,
      'book': instance.book,
      'music': instance.music,
    };

_QuizSession _$QuizSessionFromJson(Map<String, dynamic> json) => _QuizSession(
  id: json['id'] as String,
  code: json['code'] as String,
  hostUserId: json['host_user_id'] as String?,
  status: $enumDecode(_$QuizSessionStatusEnumMap, json['status']),
  contentType: json['content_type'] as String,
  questionCount: (json['question_count'] as num).toInt(),
  maxParticipants: (json['max_participants'] as num).toInt(),
  recommendationId: json['recommendation_id'] as String?,
  questions: (json['questions'] as List<dynamic>?)
      ?.map((e) => Question.fromJson(e as Map<String, dynamic>))
      .toList(),
  result: json['result'] == null
      ? null
      : GroupQuizResult.fromJson(json['result'] as Map<String, dynamic>),
  createdAt: json['created_at'] as String,
  completedAt: json['completed_at'] as String?,
  expiresAt: json['expires_at'] as String,
  deadlineAt: json['deadline_at'] as String?,
  plannedFor: json['planned_for'] as String?,
);

Map<String, dynamic> _$QuizSessionToJson(_QuizSession instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'host_user_id': instance.hostUserId,
      'status': _$QuizSessionStatusEnumMap[instance.status]!,
      'content_type': instance.contentType,
      'question_count': instance.questionCount,
      'max_participants': instance.maxParticipants,
      'recommendation_id': instance.recommendationId,
      'questions': instance.questions,
      'result': instance.result,
      'created_at': instance.createdAt,
      'completed_at': instance.completedAt,
      'expires_at': instance.expiresAt,
      'deadline_at': instance.deadlineAt,
      'planned_for': instance.plannedFor,
    };

const _$QuizSessionStatusEnumMap = {
  QuizSessionStatus.lobby: 'lobby',
  QuizSessionStatus.inProgress: 'in_progress',
  QuizSessionStatus.completed: 'completed',
  QuizSessionStatus.cancelled: 'cancelled',
};

_QuizParticipant _$QuizParticipantFromJson(Map<String, dynamic> json) =>
    _QuizParticipant(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      userId: json['user_id'] as String?,
      displayName: json['display_name'] as String,
      isHost: json['is_host'] as bool? ?? false,
      joinedAt: json['joined_at'] as String,
      answersSubmittedAt: json['answers_submitted_at'] as String?,
    );

Map<String, dynamic> _$QuizParticipantToJson(_QuizParticipant instance) =>
    <String, dynamic>{
      'id': instance.id,
      'session_id': instance.sessionId,
      'user_id': instance.userId,
      'display_name': instance.displayName,
      'is_host': instance.isHost,
      'joined_at': instance.joinedAt,
      'answers_submitted_at': instance.answersSubmittedAt,
    };

_QuizAnswerRow _$QuizAnswerRowFromJson(Map<String, dynamic> json) =>
    _QuizAnswerRow(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      participantId: json['participant_id'] as String,
      questionIndex: (json['question_index'] as num).toInt(),
      question: json['question'] as String,
      answer: json['answer'] as String,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$QuizAnswerRowToJson(_QuizAnswerRow instance) =>
    <String, dynamic>{
      'id': instance.id,
      'session_id': instance.sessionId,
      'participant_id': instance.participantId,
      'question_index': instance.questionIndex,
      'question': instance.question,
      'answer': instance.answer,
      'created_at': instance.createdAt,
    };
