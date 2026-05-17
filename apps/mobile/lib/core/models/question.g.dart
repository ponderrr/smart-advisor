// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Question _$QuestionFromJson(Map<String, dynamic> json) => _Question(
  id: json['id'] as String,
  text: json['text'] as String,
  type: $enumDecode(_$QuestionTypeEnumMap, json['type']),
  contentType: $enumDecodeNullable(_$ContentTypeEnumMap, json['content_type']),
  userAgeRange: json['user_age_range'] as String?,
  options: (json['options'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  placeholder: json['placeholder'] as String?,
);

Map<String, dynamic> _$QuestionToJson(_Question instance) => <String, dynamic>{
  'id': instance.id,
  'text': instance.text,
  'type': _$QuestionTypeEnumMap[instance.type]!,
  'content_type': _$ContentTypeEnumMap[instance.contentType],
  'user_age_range': instance.userAgeRange,
  'options': instance.options,
  'placeholder': instance.placeholder,
};

const _$QuestionTypeEnumMap = {
  QuestionType.singleSelect: 'single_select',
  QuestionType.selectAll: 'select_all',
  QuestionType.fillInBlank: 'fill_in_blank',
};

const _$ContentTypeEnumMap = {
  ContentType.movie: 'movie',
  ContentType.book: 'book',
  ContentType.music: 'music',
  ContentType.both: 'both',
  ContentType.mix: 'mix',
};
