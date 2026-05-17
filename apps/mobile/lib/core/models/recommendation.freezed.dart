// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'recommendation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Recommendation {

 String get id;@JsonKey(name: 'user_id') String get userId; String get type; String get title; List<String> get genres;@JsonKey(name: 'is_favorited') bool get isFavorited;@JsonKey(name: 'content_type') String get contentType;@JsonKey(name: 'created_at') String get createdAt; String? get director; String? get author; String? get artist; int? get year; num? get rating;@JsonKey(name: 'poster_url') String? get posterUrl;@JsonKey(name: 'preview_url') String? get previewUrl; String? get explanation; String? get description;@JsonKey(name: 'match_score') num? get matchScore;
/// Create a copy of Recommendation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RecommendationCopyWith<Recommendation> get copyWith => _$RecommendationCopyWithImpl<Recommendation>(this as Recommendation, _$identity);

  /// Serializes this Recommendation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Recommendation&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other.genres, genres)&&(identical(other.isFavorited, isFavorited) || other.isFavorited == isFavorited)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.previewUrl, previewUrl) || other.previewUrl == previewUrl)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&(identical(other.description, description) || other.description == description)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,type,title,const DeepCollectionEquality().hash(genres),isFavorited,contentType,createdAt,director,author,artist,year,rating,posterUrl,previewUrl,explanation,description,matchScore);

@override
String toString() {
  return 'Recommendation(id: $id, userId: $userId, type: $type, title: $title, genres: $genres, isFavorited: $isFavorited, contentType: $contentType, createdAt: $createdAt, director: $director, author: $author, artist: $artist, year: $year, rating: $rating, posterUrl: $posterUrl, previewUrl: $previewUrl, explanation: $explanation, description: $description, matchScore: $matchScore)';
}


}

/// @nodoc
abstract mixin class $RecommendationCopyWith<$Res>  {
  factory $RecommendationCopyWith(Recommendation value, $Res Function(Recommendation) _then) = _$RecommendationCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'user_id') String userId, String type, String title, List<String> genres,@JsonKey(name: 'is_favorited') bool isFavorited,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'created_at') String createdAt, String? director, String? author, String? artist, int? year, num? rating,@JsonKey(name: 'poster_url') String? posterUrl,@JsonKey(name: 'preview_url') String? previewUrl, String? explanation, String? description,@JsonKey(name: 'match_score') num? matchScore
});




}
/// @nodoc
class _$RecommendationCopyWithImpl<$Res>
    implements $RecommendationCopyWith<$Res> {
  _$RecommendationCopyWithImpl(this._self, this._then);

  final Recommendation _self;
  final $Res Function(Recommendation) _then;

/// Create a copy of Recommendation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userId = null,Object? type = null,Object? title = null,Object? genres = null,Object? isFavorited = null,Object? contentType = null,Object? createdAt = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,Object? year = freezed,Object? rating = freezed,Object? posterUrl = freezed,Object? previewUrl = freezed,Object? explanation = freezed,Object? description = freezed,Object? matchScore = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,genres: null == genres ? _self.genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,isFavorited: null == isFavorited ? _self.isFavorited : isFavorited // ignore: cast_nullable_to_non_nullable
as bool,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as num?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,previewUrl: freezed == previewUrl ? _self.previewUrl : previewUrl // ignore: cast_nullable_to_non_nullable
as String?,explanation: freezed == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,matchScore: freezed == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as num?,
  ));
}

}


/// Adds pattern-matching-related methods to [Recommendation].
extension RecommendationPatterns on Recommendation {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Recommendation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Recommendation() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Recommendation value)  $default,){
final _that = this;
switch (_that) {
case _Recommendation():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Recommendation value)?  $default,){
final _that = this;
switch (_that) {
case _Recommendation() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'user_id')  String userId,  String type,  String title,  List<String> genres, @JsonKey(name: 'is_favorited')  bool isFavorited, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'created_at')  String createdAt,  String? director,  String? author,  String? artist,  int? year,  num? rating, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl,  String? explanation,  String? description, @JsonKey(name: 'match_score')  num? matchScore)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Recommendation() when $default != null:
return $default(_that.id,_that.userId,_that.type,_that.title,_that.genres,_that.isFavorited,_that.contentType,_that.createdAt,_that.director,_that.author,_that.artist,_that.year,_that.rating,_that.posterUrl,_that.previewUrl,_that.explanation,_that.description,_that.matchScore);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'user_id')  String userId,  String type,  String title,  List<String> genres, @JsonKey(name: 'is_favorited')  bool isFavorited, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'created_at')  String createdAt,  String? director,  String? author,  String? artist,  int? year,  num? rating, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl,  String? explanation,  String? description, @JsonKey(name: 'match_score')  num? matchScore)  $default,) {final _that = this;
switch (_that) {
case _Recommendation():
return $default(_that.id,_that.userId,_that.type,_that.title,_that.genres,_that.isFavorited,_that.contentType,_that.createdAt,_that.director,_that.author,_that.artist,_that.year,_that.rating,_that.posterUrl,_that.previewUrl,_that.explanation,_that.description,_that.matchScore);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'user_id')  String userId,  String type,  String title,  List<String> genres, @JsonKey(name: 'is_favorited')  bool isFavorited, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'created_at')  String createdAt,  String? director,  String? author,  String? artist,  int? year,  num? rating, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl,  String? explanation,  String? description, @JsonKey(name: 'match_score')  num? matchScore)?  $default,) {final _that = this;
switch (_that) {
case _Recommendation() when $default != null:
return $default(_that.id,_that.userId,_that.type,_that.title,_that.genres,_that.isFavorited,_that.contentType,_that.createdAt,_that.director,_that.author,_that.artist,_that.year,_that.rating,_that.posterUrl,_that.previewUrl,_that.explanation,_that.description,_that.matchScore);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Recommendation implements Recommendation {
  const _Recommendation({required this.id, @JsonKey(name: 'user_id') required this.userId, required this.type, required this.title, final  List<String> genres = const <String>[], @JsonKey(name: 'is_favorited') this.isFavorited = false, @JsonKey(name: 'content_type') required this.contentType, @JsonKey(name: 'created_at') required this.createdAt, this.director, this.author, this.artist, this.year, this.rating, @JsonKey(name: 'poster_url') this.posterUrl, @JsonKey(name: 'preview_url') this.previewUrl, this.explanation, this.description, @JsonKey(name: 'match_score') this.matchScore}): _genres = genres;
  factory _Recommendation.fromJson(Map<String, dynamic> json) => _$RecommendationFromJson(json);

@override final  String id;
@override@JsonKey(name: 'user_id') final  String userId;
@override final  String type;
@override final  String title;
 final  List<String> _genres;
@override@JsonKey() List<String> get genres {
  if (_genres is EqualUnmodifiableListView) return _genres;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_genres);
}

@override@JsonKey(name: 'is_favorited') final  bool isFavorited;
@override@JsonKey(name: 'content_type') final  String contentType;
@override@JsonKey(name: 'created_at') final  String createdAt;
@override final  String? director;
@override final  String? author;
@override final  String? artist;
@override final  int? year;
@override final  num? rating;
@override@JsonKey(name: 'poster_url') final  String? posterUrl;
@override@JsonKey(name: 'preview_url') final  String? previewUrl;
@override final  String? explanation;
@override final  String? description;
@override@JsonKey(name: 'match_score') final  num? matchScore;

/// Create a copy of Recommendation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RecommendationCopyWith<_Recommendation> get copyWith => __$RecommendationCopyWithImpl<_Recommendation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RecommendationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Recommendation&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other._genres, _genres)&&(identical(other.isFavorited, isFavorited) || other.isFavorited == isFavorited)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.previewUrl, previewUrl) || other.previewUrl == previewUrl)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&(identical(other.description, description) || other.description == description)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,type,title,const DeepCollectionEquality().hash(_genres),isFavorited,contentType,createdAt,director,author,artist,year,rating,posterUrl,previewUrl,explanation,description,matchScore);

@override
String toString() {
  return 'Recommendation(id: $id, userId: $userId, type: $type, title: $title, genres: $genres, isFavorited: $isFavorited, contentType: $contentType, createdAt: $createdAt, director: $director, author: $author, artist: $artist, year: $year, rating: $rating, posterUrl: $posterUrl, previewUrl: $previewUrl, explanation: $explanation, description: $description, matchScore: $matchScore)';
}


}

/// @nodoc
abstract mixin class _$RecommendationCopyWith<$Res> implements $RecommendationCopyWith<$Res> {
  factory _$RecommendationCopyWith(_Recommendation value, $Res Function(_Recommendation) _then) = __$RecommendationCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'user_id') String userId, String type, String title, List<String> genres,@JsonKey(name: 'is_favorited') bool isFavorited,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'created_at') String createdAt, String? director, String? author, String? artist, int? year, num? rating,@JsonKey(name: 'poster_url') String? posterUrl,@JsonKey(name: 'preview_url') String? previewUrl, String? explanation, String? description,@JsonKey(name: 'match_score') num? matchScore
});




}
/// @nodoc
class __$RecommendationCopyWithImpl<$Res>
    implements _$RecommendationCopyWith<$Res> {
  __$RecommendationCopyWithImpl(this._self, this._then);

  final _Recommendation _self;
  final $Res Function(_Recommendation) _then;

/// Create a copy of Recommendation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userId = null,Object? type = null,Object? title = null,Object? genres = null,Object? isFavorited = null,Object? contentType = null,Object? createdAt = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,Object? year = freezed,Object? rating = freezed,Object? posterUrl = freezed,Object? previewUrl = freezed,Object? explanation = freezed,Object? description = freezed,Object? matchScore = freezed,}) {
  return _then(_Recommendation(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,genres: null == genres ? _self._genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,isFavorited: null == isFavorited ? _self.isFavorited : isFavorited // ignore: cast_nullable_to_non_nullable
as bool,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as num?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,previewUrl: freezed == previewUrl ? _self.previewUrl : previewUrl // ignore: cast_nullable_to_non_nullable
as String?,explanation: freezed == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,matchScore: freezed == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as num?,
  ));
}


}

// dart format on
