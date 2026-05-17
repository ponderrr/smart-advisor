// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LibraryItem _$LibraryItemFromJson(Map<String, dynamic> json) => _LibraryItem(
  id: json['id'] as String,
  userId: json['user_id'] as String,
  medium: $enumDecode(_$LibraryMediumEnumMap, json['medium']),
  title: json['title'] as String,
  creator: json['creator'] as String?,
  year: (json['year'] as num?)?.toInt(),
  posterUrl: json['poster_url'] as String?,
  status: $enumDecode(_$LibraryStatusEnumMap, json['status']),
  rating: (json['rating'] as num?)?.toInt(),
  reaction: json['reaction'] as String?,
  sourceRecommendationId: json['source_recommendation_id'] as String?,
  loggedAt: json['logged_at'] as String,
  finishedAt: json['finished_at'] as String?,
  updatedAt: json['updated_at'] as String,
);

Map<String, dynamic> _$LibraryItemToJson(_LibraryItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'user_id': instance.userId,
      'medium': _$LibraryMediumEnumMap[instance.medium]!,
      'title': instance.title,
      'creator': instance.creator,
      'year': instance.year,
      'poster_url': instance.posterUrl,
      'status': _$LibraryStatusEnumMap[instance.status]!,
      'rating': instance.rating,
      'reaction': instance.reaction,
      'source_recommendation_id': instance.sourceRecommendationId,
      'logged_at': instance.loggedAt,
      'finished_at': instance.finishedAt,
      'updated_at': instance.updatedAt,
    };

const _$LibraryMediumEnumMap = {
  LibraryMedium.movie: 'movie',
  LibraryMedium.book: 'book',
  LibraryMedium.music: 'music',
};

const _$LibraryStatusEnumMap = {
  LibraryStatus.finished: 'finished',
  LibraryStatus.inProgress: 'in_progress',
  LibraryStatus.wishlist: 'wishlist',
  LibraryStatus.dropped: 'dropped',
};

_LogLibraryInput _$LogLibraryInputFromJson(Map<String, dynamic> json) =>
    _LogLibraryInput(
      medium: $enumDecode(_$LibraryMediumEnumMap, json['medium']),
      title: json['title'] as String,
      creator: json['creator'] as String?,
      year: (json['year'] as num?)?.toInt(),
      posterUrl: json['poster_url'] as String?,
      status: $enumDecodeNullable(_$LibraryStatusEnumMap, json['status']),
      rating: (json['rating'] as num?)?.toInt(),
      reaction: json['reaction'] as String?,
      sourceRecommendationId: json['source_recommendation_id'] as String?,
    );

Map<String, dynamic> _$LogLibraryInputToJson(_LogLibraryInput instance) =>
    <String, dynamic>{
      'medium': _$LibraryMediumEnumMap[instance.medium]!,
      'title': instance.title,
      'creator': instance.creator,
      'year': instance.year,
      'poster_url': instance.posterUrl,
      'status': _$LibraryStatusEnumMap[instance.status],
      'rating': instance.rating,
      'reaction': instance.reaction,
      'source_recommendation_id': instance.sourceRecommendationId,
    };

_UpdateLibraryInput _$UpdateLibraryInputFromJson(Map<String, dynamic> json) =>
    _UpdateLibraryInput(
      status: $enumDecodeNullable(_$LibraryStatusEnumMap, json['status']),
      rating: (json['rating'] as num?)?.toInt(),
      reaction: json['reaction'] as String?,
    );

Map<String, dynamic> _$UpdateLibraryInputToJson(_UpdateLibraryInput instance) =>
    <String, dynamic>{
      'status': _$LibraryStatusEnumMap[instance.status],
      'rating': instance.rating,
      'reaction': instance.reaction,
    };
