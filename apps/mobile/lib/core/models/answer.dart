import 'package:freezed_annotation/freezed_annotation.dart';

part 'answer.freezed.dart';
part 'answer.g.dart';

@freezed
abstract class Answer with _$Answer {
  const factory Answer({
    required String id,
    @JsonKey(name: 'question_id') required String questionId,
    @JsonKey(name: 'answer_text') required String answerText,
    @JsonKey(name: 'question_text') String? questionText,
    @JsonKey(name: 'selected_options') List<String>? selectedOptions,
    @JsonKey(name: 'created_at') String? createdAt,
  }) = _Answer;

  factory Answer.fromJson(Map<String, dynamic> json) => _$AnswerFromJson(json);
}
