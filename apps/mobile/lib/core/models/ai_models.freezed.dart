// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AiRecommendationItem {

 String get type; String get title; String get description; String get explanation; List<String> get genres; int get year; num get rating;@JsonKey(name: 'match_score') num get matchScore; String? get director; String? get author; String? get artist;
/// Create a copy of AiRecommendationItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<AiRecommendationItem> get copyWith => _$AiRecommendationItemCopyWithImpl<AiRecommendationItem>(this as AiRecommendationItem, _$identity);

  /// Serializes this AiRecommendationItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AiRecommendationItem&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&const DeepCollectionEquality().equals(other.genres, genres)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,title,description,explanation,const DeepCollectionEquality().hash(genres),year,rating,matchScore,director,author,artist);

@override
String toString() {
  return 'AiRecommendationItem(type: $type, title: $title, description: $description, explanation: $explanation, genres: $genres, year: $year, rating: $rating, matchScore: $matchScore, director: $director, author: $author, artist: $artist)';
}


}

/// @nodoc
abstract mixin class $AiRecommendationItemCopyWith<$Res>  {
  factory $AiRecommendationItemCopyWith(AiRecommendationItem value, $Res Function(AiRecommendationItem) _then) = _$AiRecommendationItemCopyWithImpl;
@useResult
$Res call({
 String type, String title, String description, String explanation, List<String> genres, int year, num rating,@JsonKey(name: 'match_score') num matchScore, String? director, String? author, String? artist
});




}
/// @nodoc
class _$AiRecommendationItemCopyWithImpl<$Res>
    implements $AiRecommendationItemCopyWith<$Res> {
  _$AiRecommendationItemCopyWithImpl(this._self, this._then);

  final AiRecommendationItem _self;
  final $Res Function(AiRecommendationItem) _then;

/// Create a copy of AiRecommendationItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? title = null,Object? description = null,Object? explanation = null,Object? genres = null,Object? year = null,Object? rating = null,Object? matchScore = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,}) {
  return _then(_self.copyWith(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,explanation: null == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String,genres: null == genres ? _self.genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,year: null == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as num,matchScore: null == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as num,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [AiRecommendationItem].
extension AiRecommendationItemPatterns on AiRecommendationItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AiRecommendationItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AiRecommendationItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AiRecommendationItem value)  $default,){
final _that = this;
switch (_that) {
case _AiRecommendationItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AiRecommendationItem value)?  $default,){
final _that = this;
switch (_that) {
case _AiRecommendationItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String type,  String title,  String description,  String explanation,  List<String> genres,  int year,  num rating, @JsonKey(name: 'match_score')  num matchScore,  String? director,  String? author,  String? artist)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AiRecommendationItem() when $default != null:
return $default(_that.type,_that.title,_that.description,_that.explanation,_that.genres,_that.year,_that.rating,_that.matchScore,_that.director,_that.author,_that.artist);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String type,  String title,  String description,  String explanation,  List<String> genres,  int year,  num rating, @JsonKey(name: 'match_score')  num matchScore,  String? director,  String? author,  String? artist)  $default,) {final _that = this;
switch (_that) {
case _AiRecommendationItem():
return $default(_that.type,_that.title,_that.description,_that.explanation,_that.genres,_that.year,_that.rating,_that.matchScore,_that.director,_that.author,_that.artist);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String type,  String title,  String description,  String explanation,  List<String> genres,  int year,  num rating, @JsonKey(name: 'match_score')  num matchScore,  String? director,  String? author,  String? artist)?  $default,) {final _that = this;
switch (_that) {
case _AiRecommendationItem() when $default != null:
return $default(_that.type,_that.title,_that.description,_that.explanation,_that.genres,_that.year,_that.rating,_that.matchScore,_that.director,_that.author,_that.artist);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AiRecommendationItem implements AiRecommendationItem {
  const _AiRecommendationItem({required this.type, required this.title, required this.description, required this.explanation, final  List<String> genres = const <String>[], required this.year, required this.rating, @JsonKey(name: 'match_score') required this.matchScore, this.director, this.author, this.artist}): _genres = genres;
  factory _AiRecommendationItem.fromJson(Map<String, dynamic> json) => _$AiRecommendationItemFromJson(json);

@override final  String type;
@override final  String title;
@override final  String description;
@override final  String explanation;
 final  List<String> _genres;
@override@JsonKey() List<String> get genres {
  if (_genres is EqualUnmodifiableListView) return _genres;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_genres);
}

@override final  int year;
@override final  num rating;
@override@JsonKey(name: 'match_score') final  num matchScore;
@override final  String? director;
@override final  String? author;
@override final  String? artist;

/// Create a copy of AiRecommendationItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AiRecommendationItemCopyWith<_AiRecommendationItem> get copyWith => __$AiRecommendationItemCopyWithImpl<_AiRecommendationItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AiRecommendationItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AiRecommendationItem&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&const DeepCollectionEquality().equals(other._genres, _genres)&&(identical(other.year, year) || other.year == year)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,title,description,explanation,const DeepCollectionEquality().hash(_genres),year,rating,matchScore,director,author,artist);

@override
String toString() {
  return 'AiRecommendationItem(type: $type, title: $title, description: $description, explanation: $explanation, genres: $genres, year: $year, rating: $rating, matchScore: $matchScore, director: $director, author: $author, artist: $artist)';
}


}

/// @nodoc
abstract mixin class _$AiRecommendationItemCopyWith<$Res> implements $AiRecommendationItemCopyWith<$Res> {
  factory _$AiRecommendationItemCopyWith(_AiRecommendationItem value, $Res Function(_AiRecommendationItem) _then) = __$AiRecommendationItemCopyWithImpl;
@override @useResult
$Res call({
 String type, String title, String description, String explanation, List<String> genres, int year, num rating,@JsonKey(name: 'match_score') num matchScore, String? director, String? author, String? artist
});




}
/// @nodoc
class __$AiRecommendationItemCopyWithImpl<$Res>
    implements _$AiRecommendationItemCopyWith<$Res> {
  __$AiRecommendationItemCopyWithImpl(this._self, this._then);

  final _AiRecommendationItem _self;
  final $Res Function(_AiRecommendationItem) _then;

/// Create a copy of AiRecommendationItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? title = null,Object? description = null,Object? explanation = null,Object? genres = null,Object? year = null,Object? rating = null,Object? matchScore = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,}) {
  return _then(_AiRecommendationItem(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,explanation: null == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String,genres: null == genres ? _self._genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,year: null == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as num,matchScore: null == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as num,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

/// @nodoc
mixin _$RecommendationData {

 AiRecommendationItem? get movieRecommendation; AiRecommendationItem? get bookRecommendation; AiRecommendationItem? get musicRecommendation;
/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RecommendationDataCopyWith<RecommendationData> get copyWith => _$RecommendationDataCopyWithImpl<RecommendationData>(this as RecommendationData, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RecommendationData&&(identical(other.movieRecommendation, movieRecommendation) || other.movieRecommendation == movieRecommendation)&&(identical(other.bookRecommendation, bookRecommendation) || other.bookRecommendation == bookRecommendation)&&(identical(other.musicRecommendation, musicRecommendation) || other.musicRecommendation == musicRecommendation));
}


@override
int get hashCode => Object.hash(runtimeType,movieRecommendation,bookRecommendation,musicRecommendation);

@override
String toString() {
  return 'RecommendationData(movieRecommendation: $movieRecommendation, bookRecommendation: $bookRecommendation, musicRecommendation: $musicRecommendation)';
}


}

/// @nodoc
abstract mixin class $RecommendationDataCopyWith<$Res>  {
  factory $RecommendationDataCopyWith(RecommendationData value, $Res Function(RecommendationData) _then) = _$RecommendationDataCopyWithImpl;
@useResult
$Res call({
 AiRecommendationItem? movieRecommendation, AiRecommendationItem? bookRecommendation, AiRecommendationItem? musicRecommendation
});


$AiRecommendationItemCopyWith<$Res>? get movieRecommendation;$AiRecommendationItemCopyWith<$Res>? get bookRecommendation;$AiRecommendationItemCopyWith<$Res>? get musicRecommendation;

}
/// @nodoc
class _$RecommendationDataCopyWithImpl<$Res>
    implements $RecommendationDataCopyWith<$Res> {
  _$RecommendationDataCopyWithImpl(this._self, this._then);

  final RecommendationData _self;
  final $Res Function(RecommendationData) _then;

/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? movieRecommendation = freezed,Object? bookRecommendation = freezed,Object? musicRecommendation = freezed,}) {
  return _then(_self.copyWith(
movieRecommendation: freezed == movieRecommendation ? _self.movieRecommendation : movieRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,bookRecommendation: freezed == bookRecommendation ? _self.bookRecommendation : bookRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,musicRecommendation: freezed == musicRecommendation ? _self.musicRecommendation : musicRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,
  ));
}
/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get movieRecommendation {
    if (_self.movieRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.movieRecommendation!, (value) {
    return _then(_self.copyWith(movieRecommendation: value));
  });
}/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get bookRecommendation {
    if (_self.bookRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.bookRecommendation!, (value) {
    return _then(_self.copyWith(bookRecommendation: value));
  });
}/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get musicRecommendation {
    if (_self.musicRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.musicRecommendation!, (value) {
    return _then(_self.copyWith(musicRecommendation: value));
  });
}
}


/// Adds pattern-matching-related methods to [RecommendationData].
extension RecommendationDataPatterns on RecommendationData {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RecommendationData value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RecommendationData() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RecommendationData value)  $default,){
final _that = this;
switch (_that) {
case _RecommendationData():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RecommendationData value)?  $default,){
final _that = this;
switch (_that) {
case _RecommendationData() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( AiRecommendationItem? movieRecommendation,  AiRecommendationItem? bookRecommendation,  AiRecommendationItem? musicRecommendation)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RecommendationData() when $default != null:
return $default(_that.movieRecommendation,_that.bookRecommendation,_that.musicRecommendation);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( AiRecommendationItem? movieRecommendation,  AiRecommendationItem? bookRecommendation,  AiRecommendationItem? musicRecommendation)  $default,) {final _that = this;
switch (_that) {
case _RecommendationData():
return $default(_that.movieRecommendation,_that.bookRecommendation,_that.musicRecommendation);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( AiRecommendationItem? movieRecommendation,  AiRecommendationItem? bookRecommendation,  AiRecommendationItem? musicRecommendation)?  $default,) {final _that = this;
switch (_that) {
case _RecommendationData() when $default != null:
return $default(_that.movieRecommendation,_that.bookRecommendation,_that.musicRecommendation);case _:
  return null;

}
}

}

/// @nodoc


class _RecommendationData implements RecommendationData {
  const _RecommendationData({this.movieRecommendation, this.bookRecommendation, this.musicRecommendation});
  

@override final  AiRecommendationItem? movieRecommendation;
@override final  AiRecommendationItem? bookRecommendation;
@override final  AiRecommendationItem? musicRecommendation;

/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RecommendationDataCopyWith<_RecommendationData> get copyWith => __$RecommendationDataCopyWithImpl<_RecommendationData>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RecommendationData&&(identical(other.movieRecommendation, movieRecommendation) || other.movieRecommendation == movieRecommendation)&&(identical(other.bookRecommendation, bookRecommendation) || other.bookRecommendation == bookRecommendation)&&(identical(other.musicRecommendation, musicRecommendation) || other.musicRecommendation == musicRecommendation));
}


@override
int get hashCode => Object.hash(runtimeType,movieRecommendation,bookRecommendation,musicRecommendation);

@override
String toString() {
  return 'RecommendationData(movieRecommendation: $movieRecommendation, bookRecommendation: $bookRecommendation, musicRecommendation: $musicRecommendation)';
}


}

/// @nodoc
abstract mixin class _$RecommendationDataCopyWith<$Res> implements $RecommendationDataCopyWith<$Res> {
  factory _$RecommendationDataCopyWith(_RecommendationData value, $Res Function(_RecommendationData) _then) = __$RecommendationDataCopyWithImpl;
@override @useResult
$Res call({
 AiRecommendationItem? movieRecommendation, AiRecommendationItem? bookRecommendation, AiRecommendationItem? musicRecommendation
});


@override $AiRecommendationItemCopyWith<$Res>? get movieRecommendation;@override $AiRecommendationItemCopyWith<$Res>? get bookRecommendation;@override $AiRecommendationItemCopyWith<$Res>? get musicRecommendation;

}
/// @nodoc
class __$RecommendationDataCopyWithImpl<$Res>
    implements _$RecommendationDataCopyWith<$Res> {
  __$RecommendationDataCopyWithImpl(this._self, this._then);

  final _RecommendationData _self;
  final $Res Function(_RecommendationData) _then;

/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? movieRecommendation = freezed,Object? bookRecommendation = freezed,Object? musicRecommendation = freezed,}) {
  return _then(_RecommendationData(
movieRecommendation: freezed == movieRecommendation ? _self.movieRecommendation : movieRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,bookRecommendation: freezed == bookRecommendation ? _self.bookRecommendation : bookRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,musicRecommendation: freezed == musicRecommendation ? _self.musicRecommendation : musicRecommendation // ignore: cast_nullable_to_non_nullable
as AiRecommendationItem?,
  ));
}

/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get movieRecommendation {
    if (_self.movieRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.movieRecommendation!, (value) {
    return _then(_self.copyWith(movieRecommendation: value));
  });
}/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get bookRecommendation {
    if (_self.bookRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.bookRecommendation!, (value) {
    return _then(_self.copyWith(bookRecommendation: value));
  });
}/// Create a copy of RecommendationData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AiRecommendationItemCopyWith<$Res>? get musicRecommendation {
    if (_self.musicRecommendation == null) {
    return null;
  }

  return $AiRecommendationItemCopyWith<$Res>(_self.musicRecommendation!, (value) {
    return _then(_self.copyWith(musicRecommendation: value));
  });
}
}

// dart format on
