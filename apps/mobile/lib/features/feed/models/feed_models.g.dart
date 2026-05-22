// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feed_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FeedComment _$FeedCommentFromJson(Map<String, dynamic> json) => _FeedComment(
  id: json['id'] as String,
  authorId: json['author_id'] as String,
  author: json['author'] as String,
  authorAvatarUrl: json['author_avatar_url'] as String?,
  body: json['body'] as String,
  ageHours: (json['age_hours'] as num).toInt(),
  score: (json['score'] as num?)?.toInt() ?? 0,
  parentId: json['parent_id'] as String?,
);

Map<String, dynamic> _$FeedCommentToJson(_FeedComment instance) =>
    <String, dynamic>{
      'id': instance.id,
      'author_id': instance.authorId,
      'author': instance.author,
      'author_avatar_url': instance.authorAvatarUrl,
      'body': instance.body,
      'age_hours': instance.ageHours,
      'score': instance.score,
      'parent_id': instance.parentId,
    };

_FeedPost _$FeedPostFromJson(Map<String, dynamic> json) => _FeedPost(
  id: json['id'] as String,
  community: $enumDecode(_$FeedCommunityEnumMap, json['community']),
  authorId: json['author_id'] as String,
  author: json['author'] as String,
  authorAvatarUrl: json['author_avatar_url'] as String?,
  title: json['title'] as String,
  ageHours: (json['age_hours'] as num).toInt(),
  activity:
      $enumDecodeNullable(_$FeedActivityEnumMap, json['activity']) ??
      FeedActivity.shared,
  tasteMatch: (json['taste_match'] as num?)?.toInt() ?? 0,
  body: json['body'] as String?,
  flair: json['flair'] as String?,
  posterUrl: json['poster_url'] as String?,
  creator: json['creator'] as String?,
  year: (json['year'] as num?)?.toInt(),
  rating: (json['rating'] as num?)?.toInt(),
  square: json['square'] as bool? ?? false,
  baseScore: (json['base_score'] as num?)?.toInt() ?? 0,
  vote: (json['vote'] as num?)?.toInt() ?? 0,
  comments:
      (json['comments'] as List<dynamic>?)
          ?.map((e) => FeedComment.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <FeedComment>[],
);

Map<String, dynamic> _$FeedPostToJson(_FeedPost instance) => <String, dynamic>{
  'id': instance.id,
  'community': _$FeedCommunityEnumMap[instance.community]!,
  'author_id': instance.authorId,
  'author': instance.author,
  'author_avatar_url': instance.authorAvatarUrl,
  'title': instance.title,
  'age_hours': instance.ageHours,
  'activity': _$FeedActivityEnumMap[instance.activity]!,
  'taste_match': instance.tasteMatch,
  'body': instance.body,
  'flair': instance.flair,
  'poster_url': instance.posterUrl,
  'creator': instance.creator,
  'year': instance.year,
  'rating': instance.rating,
  'square': instance.square,
  'base_score': instance.baseScore,
  'vote': instance.vote,
  'comments': instance.comments,
};

const _$FeedCommunityEnumMap = {
  FeedCommunity.movies: 'movies',
  FeedCommunity.books: 'books',
  FeedCommunity.music: 'music',
};

const _$FeedActivityEnumMap = {
  FeedActivity.finished: 'finished',
  FeedActivity.added: 'added',
  FeedActivity.rated: 'rated',
  FeedActivity.shared: 'shared',
  FeedActivity.group: 'group',
};
