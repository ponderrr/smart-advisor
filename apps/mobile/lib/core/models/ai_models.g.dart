// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ai_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AiRecommendationItem _$AiRecommendationItemFromJson(
  Map<String, dynamic> json,
) => _AiRecommendationItem(
  type: json['type'] as String,
  title: json['title'] as String,
  description: json['description'] as String,
  explanation: json['explanation'] as String,
  genres:
      (json['genres'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  year: (json['year'] as num).toInt(),
  rating: json['rating'] as num,
  matchScore: json['match_score'] as num,
  director: json['director'] as String?,
  author: json['author'] as String?,
  artist: json['artist'] as String?,
);

Map<String, dynamic> _$AiRecommendationItemToJson(
  _AiRecommendationItem instance,
) => <String, dynamic>{
  'type': instance.type,
  'title': instance.title,
  'description': instance.description,
  'explanation': instance.explanation,
  'genres': instance.genres,
  'year': instance.year,
  'rating': instance.rating,
  'match_score': instance.matchScore,
  'director': instance.director,
  'author': instance.author,
  'artist': instance.artist,
};
