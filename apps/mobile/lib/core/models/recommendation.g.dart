// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recommendation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Recommendation _$RecommendationFromJson(Map<String, dynamic> json) =>
    _Recommendation(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      genres:
          (json['genres'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      isFavorited: json['is_favorited'] as bool? ?? false,
      contentType: json['content_type'] as String,
      createdAt: json['created_at'] as String,
      director: json['director'] as String?,
      author: json['author'] as String?,
      artist: json['artist'] as String?,
      year: (json['year'] as num?)?.toInt(),
      rating: json['rating'] as num?,
      posterUrl: json['poster_url'] as String?,
      previewUrl: json['preview_url'] as String?,
      explanation: json['explanation'] as String?,
      description: json['description'] as String?,
      matchScore: json['match_score'] as num?,
    );

Map<String, dynamic> _$RecommendationToJson(_Recommendation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'user_id': instance.userId,
      'type': instance.type,
      'title': instance.title,
      'genres': instance.genres,
      'is_favorited': instance.isFavorited,
      'content_type': instance.contentType,
      'created_at': instance.createdAt,
      'director': instance.director,
      'author': instance.author,
      'artist': instance.artist,
      'year': instance.year,
      'rating': instance.rating,
      'poster_url': instance.posterUrl,
      'preview_url': instance.previewUrl,
      'explanation': instance.explanation,
      'description': instance.description,
      'match_score': instance.matchScore,
    };
