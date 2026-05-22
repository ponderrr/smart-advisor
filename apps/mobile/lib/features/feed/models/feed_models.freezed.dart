// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'feed_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FeedComment {

 String get id;/// Author's profile id (uuid).
@JsonKey(name: 'author_id') String get authorId;/// Display name — `profiles.name`, joined at fetch time.
 String get author;@JsonKey(name: 'author_avatar_url') String? get authorAvatarUrl; String get body;@JsonKey(name: 'age_hours') int get ageHours; int get score;/// True once the author has edited the comment — drives the "(edited)"
/// label in the byline. Derived from feed_comments.edited_at.
 bool get edited;/// Reddit/Lemmy-style threading. null = top-level comment.
@JsonKey(name: 'parent_id') String? get parentId;
/// Create a copy of FeedComment
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FeedCommentCopyWith<FeedComment> get copyWith => _$FeedCommentCopyWithImpl<FeedComment>(this as FeedComment, _$identity);

  /// Serializes this FeedComment to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FeedComment&&(identical(other.id, id) || other.id == id)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.author, author) || other.author == author)&&(identical(other.authorAvatarUrl, authorAvatarUrl) || other.authorAvatarUrl == authorAvatarUrl)&&(identical(other.body, body) || other.body == body)&&(identical(other.ageHours, ageHours) || other.ageHours == ageHours)&&(identical(other.score, score) || other.score == score)&&(identical(other.edited, edited) || other.edited == edited)&&(identical(other.parentId, parentId) || other.parentId == parentId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorId,author,authorAvatarUrl,body,ageHours,score,edited,parentId);

@override
String toString() {
  return 'FeedComment(id: $id, authorId: $authorId, author: $author, authorAvatarUrl: $authorAvatarUrl, body: $body, ageHours: $ageHours, score: $score, edited: $edited, parentId: $parentId)';
}


}

/// @nodoc
abstract mixin class $FeedCommentCopyWith<$Res>  {
  factory $FeedCommentCopyWith(FeedComment value, $Res Function(FeedComment) _then) = _$FeedCommentCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'author_id') String authorId, String author,@JsonKey(name: 'author_avatar_url') String? authorAvatarUrl, String body,@JsonKey(name: 'age_hours') int ageHours, int score, bool edited,@JsonKey(name: 'parent_id') String? parentId
});




}
/// @nodoc
class _$FeedCommentCopyWithImpl<$Res>
    implements $FeedCommentCopyWith<$Res> {
  _$FeedCommentCopyWithImpl(this._self, this._then);

  final FeedComment _self;
  final $Res Function(FeedComment) _then;

/// Create a copy of FeedComment
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? authorId = null,Object? author = null,Object? authorAvatarUrl = freezed,Object? body = null,Object? ageHours = null,Object? score = null,Object? edited = null,Object? parentId = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorId: null == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String,authorAvatarUrl: freezed == authorAvatarUrl ? _self.authorAvatarUrl : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,ageHours: null == ageHours ? _self.ageHours : ageHours // ignore: cast_nullable_to_non_nullable
as int,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as int,edited: null == edited ? _self.edited : edited // ignore: cast_nullable_to_non_nullable
as bool,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [FeedComment].
extension FeedCommentPatterns on FeedComment {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FeedComment value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FeedComment() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FeedComment value)  $default,){
final _that = this;
switch (_that) {
case _FeedComment():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FeedComment value)?  $default,){
final _that = this;
switch (_that) {
case _FeedComment() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String body, @JsonKey(name: 'age_hours')  int ageHours,  int score,  bool edited, @JsonKey(name: 'parent_id')  String? parentId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FeedComment() when $default != null:
return $default(_that.id,_that.authorId,_that.author,_that.authorAvatarUrl,_that.body,_that.ageHours,_that.score,_that.edited,_that.parentId);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String body, @JsonKey(name: 'age_hours')  int ageHours,  int score,  bool edited, @JsonKey(name: 'parent_id')  String? parentId)  $default,) {final _that = this;
switch (_that) {
case _FeedComment():
return $default(_that.id,_that.authorId,_that.author,_that.authorAvatarUrl,_that.body,_that.ageHours,_that.score,_that.edited,_that.parentId);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String body, @JsonKey(name: 'age_hours')  int ageHours,  int score,  bool edited, @JsonKey(name: 'parent_id')  String? parentId)?  $default,) {final _that = this;
switch (_that) {
case _FeedComment() when $default != null:
return $default(_that.id,_that.authorId,_that.author,_that.authorAvatarUrl,_that.body,_that.ageHours,_that.score,_that.edited,_that.parentId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FeedComment extends FeedComment {
  const _FeedComment({required this.id, @JsonKey(name: 'author_id') required this.authorId, required this.author, @JsonKey(name: 'author_avatar_url') this.authorAvatarUrl, required this.body, @JsonKey(name: 'age_hours') required this.ageHours, this.score = 0, this.edited = false, @JsonKey(name: 'parent_id') this.parentId}): super._();
  factory _FeedComment.fromJson(Map<String, dynamic> json) => _$FeedCommentFromJson(json);

@override final  String id;
/// Author's profile id (uuid).
@override@JsonKey(name: 'author_id') final  String authorId;
/// Display name — `profiles.name`, joined at fetch time.
@override final  String author;
@override@JsonKey(name: 'author_avatar_url') final  String? authorAvatarUrl;
@override final  String body;
@override@JsonKey(name: 'age_hours') final  int ageHours;
@override@JsonKey() final  int score;
/// True once the author has edited the comment — drives the "(edited)"
/// label in the byline. Derived from feed_comments.edited_at.
@override@JsonKey() final  bool edited;
/// Reddit/Lemmy-style threading. null = top-level comment.
@override@JsonKey(name: 'parent_id') final  String? parentId;

/// Create a copy of FeedComment
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FeedCommentCopyWith<_FeedComment> get copyWith => __$FeedCommentCopyWithImpl<_FeedComment>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FeedCommentToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FeedComment&&(identical(other.id, id) || other.id == id)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.author, author) || other.author == author)&&(identical(other.authorAvatarUrl, authorAvatarUrl) || other.authorAvatarUrl == authorAvatarUrl)&&(identical(other.body, body) || other.body == body)&&(identical(other.ageHours, ageHours) || other.ageHours == ageHours)&&(identical(other.score, score) || other.score == score)&&(identical(other.edited, edited) || other.edited == edited)&&(identical(other.parentId, parentId) || other.parentId == parentId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorId,author,authorAvatarUrl,body,ageHours,score,edited,parentId);

@override
String toString() {
  return 'FeedComment(id: $id, authorId: $authorId, author: $author, authorAvatarUrl: $authorAvatarUrl, body: $body, ageHours: $ageHours, score: $score, edited: $edited, parentId: $parentId)';
}


}

/// @nodoc
abstract mixin class _$FeedCommentCopyWith<$Res> implements $FeedCommentCopyWith<$Res> {
  factory _$FeedCommentCopyWith(_FeedComment value, $Res Function(_FeedComment) _then) = __$FeedCommentCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'author_id') String authorId, String author,@JsonKey(name: 'author_avatar_url') String? authorAvatarUrl, String body,@JsonKey(name: 'age_hours') int ageHours, int score, bool edited,@JsonKey(name: 'parent_id') String? parentId
});




}
/// @nodoc
class __$FeedCommentCopyWithImpl<$Res>
    implements _$FeedCommentCopyWith<$Res> {
  __$FeedCommentCopyWithImpl(this._self, this._then);

  final _FeedComment _self;
  final $Res Function(_FeedComment) _then;

/// Create a copy of FeedComment
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? authorId = null,Object? author = null,Object? authorAvatarUrl = freezed,Object? body = null,Object? ageHours = null,Object? score = null,Object? edited = null,Object? parentId = freezed,}) {
  return _then(_FeedComment(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorId: null == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String,authorAvatarUrl: freezed == authorAvatarUrl ? _self.authorAvatarUrl : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,ageHours: null == ageHours ? _self.ageHours : ageHours // ignore: cast_nullable_to_non_nullable
as int,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as int,edited: null == edited ? _self.edited : edited // ignore: cast_nullable_to_non_nullable
as bool,parentId: freezed == parentId ? _self.parentId : parentId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$FeedPost {

 String get id; FeedCommunity get community;/// Author's profile id (uuid).
@JsonKey(name: 'author_id') String get authorId;/// Display name — `profiles.name`, joined at fetch time.
 String get author;@JsonKey(name: 'author_avatar_url') String? get authorAvatarUrl; String get title;@JsonKey(name: 'age_hours') int get ageHours; FeedActivity get activity;/// Taste overlap with the current user, 0–100 (in-memory mock).
@JsonKey(name: 'taste_match') int get tasteMatch; String? get body;/// Optional tag (Discussion / Recommendation / etc.).
 String? get flair;@JsonKey(name: 'poster_url') String? get posterUrl; String? get creator; int? get year;/// Three-way pick rating (1 Nope / 2 Meh / 3 Loved). Only set for
/// `rated` posts; null for every other activity.
 int? get rating; bool get square;@JsonKey(name: 'base_score') int get baseScore;/// Sum of user up/down-votes from feed_post_votes — the canonical
/// vote score shown in the UI. Server-aggregated, includes every
/// vote (including the current user's).
 int get score;/// -1, 0 or 1 — the current user's vote on this post. Drives the
/// arrow color/state; NOT added to [score] (the server score
/// already includes it — adding it would double-count).
 int get vote; List<FeedComment> get comments;
/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FeedPostCopyWith<FeedPost> get copyWith => _$FeedPostCopyWithImpl<FeedPost>(this as FeedPost, _$identity);

  /// Serializes this FeedPost to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FeedPost&&(identical(other.id, id) || other.id == id)&&(identical(other.community, community) || other.community == community)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.author, author) || other.author == author)&&(identical(other.authorAvatarUrl, authorAvatarUrl) || other.authorAvatarUrl == authorAvatarUrl)&&(identical(other.title, title) || other.title == title)&&(identical(other.ageHours, ageHours) || other.ageHours == ageHours)&&(identical(other.activity, activity) || other.activity == activity)&&(identical(other.tasteMatch, tasteMatch) || other.tasteMatch == tasteMatch)&&(identical(other.body, body) || other.body == body)&&(identical(other.flair, flair) || other.flair == flair)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.square, square) || other.square == square)&&(identical(other.baseScore, baseScore) || other.baseScore == baseScore)&&(identical(other.score, score) || other.score == score)&&(identical(other.vote, vote) || other.vote == vote)&&const DeepCollectionEquality().equals(other.comments, comments));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,community,authorId,author,authorAvatarUrl,title,ageHours,activity,tasteMatch,body,flair,posterUrl,creator,year,rating,square,baseScore,score,vote,const DeepCollectionEquality().hash(comments)]);

@override
String toString() {
  return 'FeedPost(id: $id, community: $community, authorId: $authorId, author: $author, authorAvatarUrl: $authorAvatarUrl, title: $title, ageHours: $ageHours, activity: $activity, tasteMatch: $tasteMatch, body: $body, flair: $flair, posterUrl: $posterUrl, creator: $creator, year: $year, rating: $rating, square: $square, baseScore: $baseScore, score: $score, vote: $vote, comments: $comments)';
}


}

/// @nodoc
abstract mixin class $FeedPostCopyWith<$Res>  {
  factory $FeedPostCopyWith(FeedPost value, $Res Function(FeedPost) _then) = _$FeedPostCopyWithImpl;
@useResult
$Res call({
 String id, FeedCommunity community,@JsonKey(name: 'author_id') String authorId, String author,@JsonKey(name: 'author_avatar_url') String? authorAvatarUrl, String title,@JsonKey(name: 'age_hours') int ageHours, FeedActivity activity,@JsonKey(name: 'taste_match') int tasteMatch, String? body, String? flair,@JsonKey(name: 'poster_url') String? posterUrl, String? creator, int? year, int? rating, bool square,@JsonKey(name: 'base_score') int baseScore, int score, int vote, List<FeedComment> comments
});




}
/// @nodoc
class _$FeedPostCopyWithImpl<$Res>
    implements $FeedPostCopyWith<$Res> {
  _$FeedPostCopyWithImpl(this._self, this._then);

  final FeedPost _self;
  final $Res Function(FeedPost) _then;

/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? community = null,Object? authorId = null,Object? author = null,Object? authorAvatarUrl = freezed,Object? title = null,Object? ageHours = null,Object? activity = null,Object? tasteMatch = null,Object? body = freezed,Object? flair = freezed,Object? posterUrl = freezed,Object? creator = freezed,Object? year = freezed,Object? rating = freezed,Object? square = null,Object? baseScore = null,Object? score = null,Object? vote = null,Object? comments = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,community: null == community ? _self.community : community // ignore: cast_nullable_to_non_nullable
as FeedCommunity,authorId: null == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String,authorAvatarUrl: freezed == authorAvatarUrl ? _self.authorAvatarUrl : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,ageHours: null == ageHours ? _self.ageHours : ageHours // ignore: cast_nullable_to_non_nullable
as int,activity: null == activity ? _self.activity : activity // ignore: cast_nullable_to_non_nullable
as FeedActivity,tasteMatch: null == tasteMatch ? _self.tasteMatch : tasteMatch // ignore: cast_nullable_to_non_nullable
as int,body: freezed == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String?,flair: freezed == flair ? _self.flair : flair // ignore: cast_nullable_to_non_nullable
as String?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,square: null == square ? _self.square : square // ignore: cast_nullable_to_non_nullable
as bool,baseScore: null == baseScore ? _self.baseScore : baseScore // ignore: cast_nullable_to_non_nullable
as int,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as int,vote: null == vote ? _self.vote : vote // ignore: cast_nullable_to_non_nullable
as int,comments: null == comments ? _self.comments : comments // ignore: cast_nullable_to_non_nullable
as List<FeedComment>,
  ));
}

}


/// Adds pattern-matching-related methods to [FeedPost].
extension FeedPostPatterns on FeedPost {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FeedPost value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FeedPost value)  $default,){
final _that = this;
switch (_that) {
case _FeedPost():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FeedPost value)?  $default,){
final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  FeedCommunity community, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String title, @JsonKey(name: 'age_hours')  int ageHours,  FeedActivity activity, @JsonKey(name: 'taste_match')  int tasteMatch,  String? body,  String? flair, @JsonKey(name: 'poster_url')  String? posterUrl,  String? creator,  int? year,  int? rating,  bool square, @JsonKey(name: 'base_score')  int baseScore,  int score,  int vote,  List<FeedComment> comments)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that.id,_that.community,_that.authorId,_that.author,_that.authorAvatarUrl,_that.title,_that.ageHours,_that.activity,_that.tasteMatch,_that.body,_that.flair,_that.posterUrl,_that.creator,_that.year,_that.rating,_that.square,_that.baseScore,_that.score,_that.vote,_that.comments);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  FeedCommunity community, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String title, @JsonKey(name: 'age_hours')  int ageHours,  FeedActivity activity, @JsonKey(name: 'taste_match')  int tasteMatch,  String? body,  String? flair, @JsonKey(name: 'poster_url')  String? posterUrl,  String? creator,  int? year,  int? rating,  bool square, @JsonKey(name: 'base_score')  int baseScore,  int score,  int vote,  List<FeedComment> comments)  $default,) {final _that = this;
switch (_that) {
case _FeedPost():
return $default(_that.id,_that.community,_that.authorId,_that.author,_that.authorAvatarUrl,_that.title,_that.ageHours,_that.activity,_that.tasteMatch,_that.body,_that.flair,_that.posterUrl,_that.creator,_that.year,_that.rating,_that.square,_that.baseScore,_that.score,_that.vote,_that.comments);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  FeedCommunity community, @JsonKey(name: 'author_id')  String authorId,  String author, @JsonKey(name: 'author_avatar_url')  String? authorAvatarUrl,  String title, @JsonKey(name: 'age_hours')  int ageHours,  FeedActivity activity, @JsonKey(name: 'taste_match')  int tasteMatch,  String? body,  String? flair, @JsonKey(name: 'poster_url')  String? posterUrl,  String? creator,  int? year,  int? rating,  bool square, @JsonKey(name: 'base_score')  int baseScore,  int score,  int vote,  List<FeedComment> comments)?  $default,) {final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that.id,_that.community,_that.authorId,_that.author,_that.authorAvatarUrl,_that.title,_that.ageHours,_that.activity,_that.tasteMatch,_that.body,_that.flair,_that.posterUrl,_that.creator,_that.year,_that.rating,_that.square,_that.baseScore,_that.score,_that.vote,_that.comments);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FeedPost extends FeedPost {
  const _FeedPost({required this.id, required this.community, @JsonKey(name: 'author_id') required this.authorId, required this.author, @JsonKey(name: 'author_avatar_url') this.authorAvatarUrl, required this.title, @JsonKey(name: 'age_hours') required this.ageHours, this.activity = FeedActivity.shared, @JsonKey(name: 'taste_match') this.tasteMatch = 0, this.body, this.flair, @JsonKey(name: 'poster_url') this.posterUrl, this.creator, this.year, this.rating, this.square = false, @JsonKey(name: 'base_score') this.baseScore = 0, this.score = 0, this.vote = 0, final  List<FeedComment> comments = const <FeedComment>[]}): _comments = comments,super._();
  factory _FeedPost.fromJson(Map<String, dynamic> json) => _$FeedPostFromJson(json);

@override final  String id;
@override final  FeedCommunity community;
/// Author's profile id (uuid).
@override@JsonKey(name: 'author_id') final  String authorId;
/// Display name — `profiles.name`, joined at fetch time.
@override final  String author;
@override@JsonKey(name: 'author_avatar_url') final  String? authorAvatarUrl;
@override final  String title;
@override@JsonKey(name: 'age_hours') final  int ageHours;
@override@JsonKey() final  FeedActivity activity;
/// Taste overlap with the current user, 0–100 (in-memory mock).
@override@JsonKey(name: 'taste_match') final  int tasteMatch;
@override final  String? body;
/// Optional tag (Discussion / Recommendation / etc.).
@override final  String? flair;
@override@JsonKey(name: 'poster_url') final  String? posterUrl;
@override final  String? creator;
@override final  int? year;
/// Three-way pick rating (1 Nope / 2 Meh / 3 Loved). Only set for
/// `rated` posts; null for every other activity.
@override final  int? rating;
@override@JsonKey() final  bool square;
@override@JsonKey(name: 'base_score') final  int baseScore;
/// Sum of user up/down-votes from feed_post_votes — the canonical
/// vote score shown in the UI. Server-aggregated, includes every
/// vote (including the current user's).
@override@JsonKey() final  int score;
/// -1, 0 or 1 — the current user's vote on this post. Drives the
/// arrow color/state; NOT added to [score] (the server score
/// already includes it — adding it would double-count).
@override@JsonKey() final  int vote;
 final  List<FeedComment> _comments;
@override@JsonKey() List<FeedComment> get comments {
  if (_comments is EqualUnmodifiableListView) return _comments;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_comments);
}


/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FeedPostCopyWith<_FeedPost> get copyWith => __$FeedPostCopyWithImpl<_FeedPost>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FeedPostToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FeedPost&&(identical(other.id, id) || other.id == id)&&(identical(other.community, community) || other.community == community)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.author, author) || other.author == author)&&(identical(other.authorAvatarUrl, authorAvatarUrl) || other.authorAvatarUrl == authorAvatarUrl)&&(identical(other.title, title) || other.title == title)&&(identical(other.ageHours, ageHours) || other.ageHours == ageHours)&&(identical(other.activity, activity) || other.activity == activity)&&(identical(other.tasteMatch, tasteMatch) || other.tasteMatch == tasteMatch)&&(identical(other.body, body) || other.body == body)&&(identical(other.flair, flair) || other.flair == flair)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.square, square) || other.square == square)&&(identical(other.baseScore, baseScore) || other.baseScore == baseScore)&&(identical(other.score, score) || other.score == score)&&(identical(other.vote, vote) || other.vote == vote)&&const DeepCollectionEquality().equals(other._comments, _comments));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,community,authorId,author,authorAvatarUrl,title,ageHours,activity,tasteMatch,body,flair,posterUrl,creator,year,rating,square,baseScore,score,vote,const DeepCollectionEquality().hash(_comments)]);

@override
String toString() {
  return 'FeedPost(id: $id, community: $community, authorId: $authorId, author: $author, authorAvatarUrl: $authorAvatarUrl, title: $title, ageHours: $ageHours, activity: $activity, tasteMatch: $tasteMatch, body: $body, flair: $flair, posterUrl: $posterUrl, creator: $creator, year: $year, rating: $rating, square: $square, baseScore: $baseScore, score: $score, vote: $vote, comments: $comments)';
}


}

/// @nodoc
abstract mixin class _$FeedPostCopyWith<$Res> implements $FeedPostCopyWith<$Res> {
  factory _$FeedPostCopyWith(_FeedPost value, $Res Function(_FeedPost) _then) = __$FeedPostCopyWithImpl;
@override @useResult
$Res call({
 String id, FeedCommunity community,@JsonKey(name: 'author_id') String authorId, String author,@JsonKey(name: 'author_avatar_url') String? authorAvatarUrl, String title,@JsonKey(name: 'age_hours') int ageHours, FeedActivity activity,@JsonKey(name: 'taste_match') int tasteMatch, String? body, String? flair,@JsonKey(name: 'poster_url') String? posterUrl, String? creator, int? year, int? rating, bool square,@JsonKey(name: 'base_score') int baseScore, int score, int vote, List<FeedComment> comments
});




}
/// @nodoc
class __$FeedPostCopyWithImpl<$Res>
    implements _$FeedPostCopyWith<$Res> {
  __$FeedPostCopyWithImpl(this._self, this._then);

  final _FeedPost _self;
  final $Res Function(_FeedPost) _then;

/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? community = null,Object? authorId = null,Object? author = null,Object? authorAvatarUrl = freezed,Object? title = null,Object? ageHours = null,Object? activity = null,Object? tasteMatch = null,Object? body = freezed,Object? flair = freezed,Object? posterUrl = freezed,Object? creator = freezed,Object? year = freezed,Object? rating = freezed,Object? square = null,Object? baseScore = null,Object? score = null,Object? vote = null,Object? comments = null,}) {
  return _then(_FeedPost(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,community: null == community ? _self.community : community // ignore: cast_nullable_to_non_nullable
as FeedCommunity,authorId: null == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String,authorAvatarUrl: freezed == authorAvatarUrl ? _self.authorAvatarUrl : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,ageHours: null == ageHours ? _self.ageHours : ageHours // ignore: cast_nullable_to_non_nullable
as int,activity: null == activity ? _self.activity : activity // ignore: cast_nullable_to_non_nullable
as FeedActivity,tasteMatch: null == tasteMatch ? _self.tasteMatch : tasteMatch // ignore: cast_nullable_to_non_nullable
as int,body: freezed == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String?,flair: freezed == flair ? _self.flair : flair // ignore: cast_nullable_to_non_nullable
as String?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,square: null == square ? _self.square : square // ignore: cast_nullable_to_non_nullable
as bool,baseScore: null == baseScore ? _self.baseScore : baseScore // ignore: cast_nullable_to_non_nullable
as int,score: null == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as int,vote: null == vote ? _self.vote : vote // ignore: cast_nullable_to_non_nullable
as int,comments: null == comments ? _self._comments : comments // ignore: cast_nullable_to_non_nullable
as List<FeedComment>,
  ));
}


}

// dart format on
