import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums.dart';

part 'question.freezed.dart';
part 'question.g.dart';

/// Quiz question. The anthropic-questions Edge Function returns the subset
/// {id, text, type, options?, placeholder?}; content_type/user_age_range are
/// attached client-side, so they're nullable here.
@freezed
abstract class Question with _$Question {
  const factory Question({
    required String id,
    required String text,
    required QuestionType type,
    @JsonKey(name: 'content_type') ContentType? contentType,
    @JsonKey(name: 'user_age_range') String? userAgeRange,
    List<String>? options,
    String? placeholder,
  }) = _Question;

  factory Question.fromJson(Map<String, dynamic> json) =>
      _$QuestionFromJson(json);
}
