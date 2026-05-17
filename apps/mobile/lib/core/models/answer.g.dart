// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Answer _$AnswerFromJson(Map<String, dynamic> json) => _Answer(
  id: json['id'] as String,
  questionId: json['question_id'] as String,
  answerText: json['answer_text'] as String,
  questionText: json['question_text'] as String?,
  selectedOptions: (json['selected_options'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  createdAt: json['created_at'] as String?,
);

Map<String, dynamic> _$AnswerToJson(_Answer instance) => <String, dynamic>{
  'id': instance.id,
  'question_id': instance.questionId,
  'answer_text': instance.answerText,
  'question_text': instance.questionText,
  'selected_options': instance.selectedOptions,
  'created_at': instance.createdAt,
};
