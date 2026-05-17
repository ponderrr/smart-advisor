// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'group_quiz.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$GroupQuizPick {

 String get title; String? get director; String? get author; String? get artist; int? get year; List<String> get genres; String? get explanation; String? get description;@JsonKey(name: 'poster_url') String? get posterUrl;@JsonKey(name: 'preview_url') String? get previewUrl;
/// Create a copy of GroupQuizPick
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<GroupQuizPick> get copyWith => _$GroupQuizPickCopyWithImpl<GroupQuizPick>(this as GroupQuizPick, _$identity);

  /// Serializes this GroupQuizPick to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GroupQuizPick&&(identical(other.title, title) || other.title == title)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist)&&(identical(other.year, year) || other.year == year)&&const DeepCollectionEquality().equals(other.genres, genres)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&(identical(other.description, description) || other.description == description)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.previewUrl, previewUrl) || other.previewUrl == previewUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,director,author,artist,year,const DeepCollectionEquality().hash(genres),explanation,description,posterUrl,previewUrl);

@override
String toString() {
  return 'GroupQuizPick(title: $title, director: $director, author: $author, artist: $artist, year: $year, genres: $genres, explanation: $explanation, description: $description, posterUrl: $posterUrl, previewUrl: $previewUrl)';
}


}

/// @nodoc
abstract mixin class $GroupQuizPickCopyWith<$Res>  {
  factory $GroupQuizPickCopyWith(GroupQuizPick value, $Res Function(GroupQuizPick) _then) = _$GroupQuizPickCopyWithImpl;
@useResult
$Res call({
 String title, String? director, String? author, String? artist, int? year, List<String> genres, String? explanation, String? description,@JsonKey(name: 'poster_url') String? posterUrl,@JsonKey(name: 'preview_url') String? previewUrl
});




}
/// @nodoc
class _$GroupQuizPickCopyWithImpl<$Res>
    implements $GroupQuizPickCopyWith<$Res> {
  _$GroupQuizPickCopyWithImpl(this._self, this._then);

  final GroupQuizPick _self;
  final $Res Function(GroupQuizPick) _then;

/// Create a copy of GroupQuizPick
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,Object? year = freezed,Object? genres = null,Object? explanation = freezed,Object? description = freezed,Object? posterUrl = freezed,Object? previewUrl = freezed,}) {
  return _then(_self.copyWith(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,genres: null == genres ? _self.genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,explanation: freezed == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,previewUrl: freezed == previewUrl ? _self.previewUrl : previewUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [GroupQuizPick].
extension GroupQuizPickPatterns on GroupQuizPick {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GroupQuizPick value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GroupQuizPick() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GroupQuizPick value)  $default,){
final _that = this;
switch (_that) {
case _GroupQuizPick():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GroupQuizPick value)?  $default,){
final _that = this;
switch (_that) {
case _GroupQuizPick() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String? director,  String? author,  String? artist,  int? year,  List<String> genres,  String? explanation,  String? description, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GroupQuizPick() when $default != null:
return $default(_that.title,_that.director,_that.author,_that.artist,_that.year,_that.genres,_that.explanation,_that.description,_that.posterUrl,_that.previewUrl);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String? director,  String? author,  String? artist,  int? year,  List<String> genres,  String? explanation,  String? description, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl)  $default,) {final _that = this;
switch (_that) {
case _GroupQuizPick():
return $default(_that.title,_that.director,_that.author,_that.artist,_that.year,_that.genres,_that.explanation,_that.description,_that.posterUrl,_that.previewUrl);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String? director,  String? author,  String? artist,  int? year,  List<String> genres,  String? explanation,  String? description, @JsonKey(name: 'poster_url')  String? posterUrl, @JsonKey(name: 'preview_url')  String? previewUrl)?  $default,) {final _that = this;
switch (_that) {
case _GroupQuizPick() when $default != null:
return $default(_that.title,_that.director,_that.author,_that.artist,_that.year,_that.genres,_that.explanation,_that.description,_that.posterUrl,_that.previewUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GroupQuizPick implements GroupQuizPick {
  const _GroupQuizPick({required this.title, this.director, this.author, this.artist, this.year, final  List<String> genres = const <String>[], this.explanation, this.description, @JsonKey(name: 'poster_url') this.posterUrl, @JsonKey(name: 'preview_url') this.previewUrl}): _genres = genres;
  factory _GroupQuizPick.fromJson(Map<String, dynamic> json) => _$GroupQuizPickFromJson(json);

@override final  String title;
@override final  String? director;
@override final  String? author;
@override final  String? artist;
@override final  int? year;
 final  List<String> _genres;
@override@JsonKey() List<String> get genres {
  if (_genres is EqualUnmodifiableListView) return _genres;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_genres);
}

@override final  String? explanation;
@override final  String? description;
@override@JsonKey(name: 'poster_url') final  String? posterUrl;
@override@JsonKey(name: 'preview_url') final  String? previewUrl;

/// Create a copy of GroupQuizPick
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GroupQuizPickCopyWith<_GroupQuizPick> get copyWith => __$GroupQuizPickCopyWithImpl<_GroupQuizPick>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GroupQuizPickToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GroupQuizPick&&(identical(other.title, title) || other.title == title)&&(identical(other.director, director) || other.director == director)&&(identical(other.author, author) || other.author == author)&&(identical(other.artist, artist) || other.artist == artist)&&(identical(other.year, year) || other.year == year)&&const DeepCollectionEquality().equals(other._genres, _genres)&&(identical(other.explanation, explanation) || other.explanation == explanation)&&(identical(other.description, description) || other.description == description)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.previewUrl, previewUrl) || other.previewUrl == previewUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,director,author,artist,year,const DeepCollectionEquality().hash(_genres),explanation,description,posterUrl,previewUrl);

@override
String toString() {
  return 'GroupQuizPick(title: $title, director: $director, author: $author, artist: $artist, year: $year, genres: $genres, explanation: $explanation, description: $description, posterUrl: $posterUrl, previewUrl: $previewUrl)';
}


}

/// @nodoc
abstract mixin class _$GroupQuizPickCopyWith<$Res> implements $GroupQuizPickCopyWith<$Res> {
  factory _$GroupQuizPickCopyWith(_GroupQuizPick value, $Res Function(_GroupQuizPick) _then) = __$GroupQuizPickCopyWithImpl;
@override @useResult
$Res call({
 String title, String? director, String? author, String? artist, int? year, List<String> genres, String? explanation, String? description,@JsonKey(name: 'poster_url') String? posterUrl,@JsonKey(name: 'preview_url') String? previewUrl
});




}
/// @nodoc
class __$GroupQuizPickCopyWithImpl<$Res>
    implements _$GroupQuizPickCopyWith<$Res> {
  __$GroupQuizPickCopyWithImpl(this._self, this._then);

  final _GroupQuizPick _self;
  final $Res Function(_GroupQuizPick) _then;

/// Create a copy of GroupQuizPick
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? director = freezed,Object? author = freezed,Object? artist = freezed,Object? year = freezed,Object? genres = null,Object? explanation = freezed,Object? description = freezed,Object? posterUrl = freezed,Object? previewUrl = freezed,}) {
  return _then(_GroupQuizPick(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,director: freezed == director ? _self.director : director // ignore: cast_nullable_to_non_nullable
as String?,author: freezed == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as String?,artist: freezed == artist ? _self.artist : artist // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,genres: null == genres ? _self._genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,explanation: freezed == explanation ? _self.explanation : explanation // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,previewUrl: freezed == previewUrl ? _self.previewUrl : previewUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$GroupQuizResult {

 GroupQuizPick? get movie; GroupQuizPick? get book; GroupQuizPick? get music;
/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GroupQuizResultCopyWith<GroupQuizResult> get copyWith => _$GroupQuizResultCopyWithImpl<GroupQuizResult>(this as GroupQuizResult, _$identity);

  /// Serializes this GroupQuizResult to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GroupQuizResult&&(identical(other.movie, movie) || other.movie == movie)&&(identical(other.book, book) || other.book == book)&&(identical(other.music, music) || other.music == music));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,movie,book,music);

@override
String toString() {
  return 'GroupQuizResult(movie: $movie, book: $book, music: $music)';
}


}

/// @nodoc
abstract mixin class $GroupQuizResultCopyWith<$Res>  {
  factory $GroupQuizResultCopyWith(GroupQuizResult value, $Res Function(GroupQuizResult) _then) = _$GroupQuizResultCopyWithImpl;
@useResult
$Res call({
 GroupQuizPick? movie, GroupQuizPick? book, GroupQuizPick? music
});


$GroupQuizPickCopyWith<$Res>? get movie;$GroupQuizPickCopyWith<$Res>? get book;$GroupQuizPickCopyWith<$Res>? get music;

}
/// @nodoc
class _$GroupQuizResultCopyWithImpl<$Res>
    implements $GroupQuizResultCopyWith<$Res> {
  _$GroupQuizResultCopyWithImpl(this._self, this._then);

  final GroupQuizResult _self;
  final $Res Function(GroupQuizResult) _then;

/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? movie = freezed,Object? book = freezed,Object? music = freezed,}) {
  return _then(_self.copyWith(
movie: freezed == movie ? _self.movie : movie // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,book: freezed == book ? _self.book : book // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,music: freezed == music ? _self.music : music // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,
  ));
}
/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get movie {
    if (_self.movie == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.movie!, (value) {
    return _then(_self.copyWith(movie: value));
  });
}/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get book {
    if (_self.book == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.book!, (value) {
    return _then(_self.copyWith(book: value));
  });
}/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get music {
    if (_self.music == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.music!, (value) {
    return _then(_self.copyWith(music: value));
  });
}
}


/// Adds pattern-matching-related methods to [GroupQuizResult].
extension GroupQuizResultPatterns on GroupQuizResult {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GroupQuizResult value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GroupQuizResult() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GroupQuizResult value)  $default,){
final _that = this;
switch (_that) {
case _GroupQuizResult():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GroupQuizResult value)?  $default,){
final _that = this;
switch (_that) {
case _GroupQuizResult() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( GroupQuizPick? movie,  GroupQuizPick? book,  GroupQuizPick? music)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GroupQuizResult() when $default != null:
return $default(_that.movie,_that.book,_that.music);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( GroupQuizPick? movie,  GroupQuizPick? book,  GroupQuizPick? music)  $default,) {final _that = this;
switch (_that) {
case _GroupQuizResult():
return $default(_that.movie,_that.book,_that.music);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( GroupQuizPick? movie,  GroupQuizPick? book,  GroupQuizPick? music)?  $default,) {final _that = this;
switch (_that) {
case _GroupQuizResult() when $default != null:
return $default(_that.movie,_that.book,_that.music);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GroupQuizResult implements GroupQuizResult {
  const _GroupQuizResult({this.movie, this.book, this.music});
  factory _GroupQuizResult.fromJson(Map<String, dynamic> json) => _$GroupQuizResultFromJson(json);

@override final  GroupQuizPick? movie;
@override final  GroupQuizPick? book;
@override final  GroupQuizPick? music;

/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GroupQuizResultCopyWith<_GroupQuizResult> get copyWith => __$GroupQuizResultCopyWithImpl<_GroupQuizResult>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GroupQuizResultToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GroupQuizResult&&(identical(other.movie, movie) || other.movie == movie)&&(identical(other.book, book) || other.book == book)&&(identical(other.music, music) || other.music == music));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,movie,book,music);

@override
String toString() {
  return 'GroupQuizResult(movie: $movie, book: $book, music: $music)';
}


}

/// @nodoc
abstract mixin class _$GroupQuizResultCopyWith<$Res> implements $GroupQuizResultCopyWith<$Res> {
  factory _$GroupQuizResultCopyWith(_GroupQuizResult value, $Res Function(_GroupQuizResult) _then) = __$GroupQuizResultCopyWithImpl;
@override @useResult
$Res call({
 GroupQuizPick? movie, GroupQuizPick? book, GroupQuizPick? music
});


@override $GroupQuizPickCopyWith<$Res>? get movie;@override $GroupQuizPickCopyWith<$Res>? get book;@override $GroupQuizPickCopyWith<$Res>? get music;

}
/// @nodoc
class __$GroupQuizResultCopyWithImpl<$Res>
    implements _$GroupQuizResultCopyWith<$Res> {
  __$GroupQuizResultCopyWithImpl(this._self, this._then);

  final _GroupQuizResult _self;
  final $Res Function(_GroupQuizResult) _then;

/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? movie = freezed,Object? book = freezed,Object? music = freezed,}) {
  return _then(_GroupQuizResult(
movie: freezed == movie ? _self.movie : movie // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,book: freezed == book ? _self.book : book // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,music: freezed == music ? _self.music : music // ignore: cast_nullable_to_non_nullable
as GroupQuizPick?,
  ));
}

/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get movie {
    if (_self.movie == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.movie!, (value) {
    return _then(_self.copyWith(movie: value));
  });
}/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get book {
    if (_self.book == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.book!, (value) {
    return _then(_self.copyWith(book: value));
  });
}/// Create a copy of GroupQuizResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizPickCopyWith<$Res>? get music {
    if (_self.music == null) {
    return null;
  }

  return $GroupQuizPickCopyWith<$Res>(_self.music!, (value) {
    return _then(_self.copyWith(music: value));
  });
}
}


/// @nodoc
mixin _$QuizSession {

 String get id; String get code;@JsonKey(name: 'host_user_id') String? get hostUserId; QuizSessionStatus get status;@JsonKey(name: 'content_type') String get contentType;@JsonKey(name: 'question_count') int get questionCount;@JsonKey(name: 'max_participants') int get maxParticipants;@JsonKey(name: 'recommendation_id') String? get recommendationId; List<Question>? get questions; GroupQuizResult? get result;@JsonKey(name: 'created_at') String get createdAt;@JsonKey(name: 'completed_at') String? get completedAt;@JsonKey(name: 'expires_at') String get expiresAt;
/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuizSessionCopyWith<QuizSession> get copyWith => _$QuizSessionCopyWithImpl<QuizSession>(this as QuizSession, _$identity);

  /// Serializes this QuizSession to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuizSession&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.hostUserId, hostUserId) || other.hostUserId == hostUserId)&&(identical(other.status, status) || other.status == status)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.questionCount, questionCount) || other.questionCount == questionCount)&&(identical(other.maxParticipants, maxParticipants) || other.maxParticipants == maxParticipants)&&(identical(other.recommendationId, recommendationId) || other.recommendationId == recommendationId)&&const DeepCollectionEquality().equals(other.questions, questions)&&(identical(other.result, result) || other.result == result)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,hostUserId,status,contentType,questionCount,maxParticipants,recommendationId,const DeepCollectionEquality().hash(questions),result,createdAt,completedAt,expiresAt);

@override
String toString() {
  return 'QuizSession(id: $id, code: $code, hostUserId: $hostUserId, status: $status, contentType: $contentType, questionCount: $questionCount, maxParticipants: $maxParticipants, recommendationId: $recommendationId, questions: $questions, result: $result, createdAt: $createdAt, completedAt: $completedAt, expiresAt: $expiresAt)';
}


}

/// @nodoc
abstract mixin class $QuizSessionCopyWith<$Res>  {
  factory $QuizSessionCopyWith(QuizSession value, $Res Function(QuizSession) _then) = _$QuizSessionCopyWithImpl;
@useResult
$Res call({
 String id, String code,@JsonKey(name: 'host_user_id') String? hostUserId, QuizSessionStatus status,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'question_count') int questionCount,@JsonKey(name: 'max_participants') int maxParticipants,@JsonKey(name: 'recommendation_id') String? recommendationId, List<Question>? questions, GroupQuizResult? result,@JsonKey(name: 'created_at') String createdAt,@JsonKey(name: 'completed_at') String? completedAt,@JsonKey(name: 'expires_at') String expiresAt
});


$GroupQuizResultCopyWith<$Res>? get result;

}
/// @nodoc
class _$QuizSessionCopyWithImpl<$Res>
    implements $QuizSessionCopyWith<$Res> {
  _$QuizSessionCopyWithImpl(this._self, this._then);

  final QuizSession _self;
  final $Res Function(QuizSession) _then;

/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? hostUserId = freezed,Object? status = null,Object? contentType = null,Object? questionCount = null,Object? maxParticipants = null,Object? recommendationId = freezed,Object? questions = freezed,Object? result = freezed,Object? createdAt = null,Object? completedAt = freezed,Object? expiresAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,hostUserId: freezed == hostUserId ? _self.hostUserId : hostUserId // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as QuizSessionStatus,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,questionCount: null == questionCount ? _self.questionCount : questionCount // ignore: cast_nullable_to_non_nullable
as int,maxParticipants: null == maxParticipants ? _self.maxParticipants : maxParticipants // ignore: cast_nullable_to_non_nullable
as int,recommendationId: freezed == recommendationId ? _self.recommendationId : recommendationId // ignore: cast_nullable_to_non_nullable
as String?,questions: freezed == questions ? _self.questions : questions // ignore: cast_nullable_to_non_nullable
as List<Question>?,result: freezed == result ? _self.result : result // ignore: cast_nullable_to_non_nullable
as GroupQuizResult?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as String?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}
/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizResultCopyWith<$Res>? get result {
    if (_self.result == null) {
    return null;
  }

  return $GroupQuizResultCopyWith<$Res>(_self.result!, (value) {
    return _then(_self.copyWith(result: value));
  });
}
}


/// Adds pattern-matching-related methods to [QuizSession].
extension QuizSessionPatterns on QuizSession {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuizSession value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuizSession() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuizSession value)  $default,){
final _that = this;
switch (_that) {
case _QuizSession():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuizSession value)?  $default,){
final _that = this;
switch (_that) {
case _QuizSession() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code, @JsonKey(name: 'host_user_id')  String? hostUserId,  QuizSessionStatus status, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'question_count')  int questionCount, @JsonKey(name: 'max_participants')  int maxParticipants, @JsonKey(name: 'recommendation_id')  String? recommendationId,  List<Question>? questions,  GroupQuizResult? result, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'completed_at')  String? completedAt, @JsonKey(name: 'expires_at')  String expiresAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuizSession() when $default != null:
return $default(_that.id,_that.code,_that.hostUserId,_that.status,_that.contentType,_that.questionCount,_that.maxParticipants,_that.recommendationId,_that.questions,_that.result,_that.createdAt,_that.completedAt,_that.expiresAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code, @JsonKey(name: 'host_user_id')  String? hostUserId,  QuizSessionStatus status, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'question_count')  int questionCount, @JsonKey(name: 'max_participants')  int maxParticipants, @JsonKey(name: 'recommendation_id')  String? recommendationId,  List<Question>? questions,  GroupQuizResult? result, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'completed_at')  String? completedAt, @JsonKey(name: 'expires_at')  String expiresAt)  $default,) {final _that = this;
switch (_that) {
case _QuizSession():
return $default(_that.id,_that.code,_that.hostUserId,_that.status,_that.contentType,_that.questionCount,_that.maxParticipants,_that.recommendationId,_that.questions,_that.result,_that.createdAt,_that.completedAt,_that.expiresAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code, @JsonKey(name: 'host_user_id')  String? hostUserId,  QuizSessionStatus status, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'question_count')  int questionCount, @JsonKey(name: 'max_participants')  int maxParticipants, @JsonKey(name: 'recommendation_id')  String? recommendationId,  List<Question>? questions,  GroupQuizResult? result, @JsonKey(name: 'created_at')  String createdAt, @JsonKey(name: 'completed_at')  String? completedAt, @JsonKey(name: 'expires_at')  String expiresAt)?  $default,) {final _that = this;
switch (_that) {
case _QuizSession() when $default != null:
return $default(_that.id,_that.code,_that.hostUserId,_that.status,_that.contentType,_that.questionCount,_that.maxParticipants,_that.recommendationId,_that.questions,_that.result,_that.createdAt,_that.completedAt,_that.expiresAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _QuizSession implements QuizSession {
  const _QuizSession({required this.id, required this.code, @JsonKey(name: 'host_user_id') this.hostUserId, required this.status, @JsonKey(name: 'content_type') required this.contentType, @JsonKey(name: 'question_count') required this.questionCount, @JsonKey(name: 'max_participants') required this.maxParticipants, @JsonKey(name: 'recommendation_id') this.recommendationId, final  List<Question>? questions, this.result, @JsonKey(name: 'created_at') required this.createdAt, @JsonKey(name: 'completed_at') this.completedAt, @JsonKey(name: 'expires_at') required this.expiresAt}): _questions = questions;
  factory _QuizSession.fromJson(Map<String, dynamic> json) => _$QuizSessionFromJson(json);

@override final  String id;
@override final  String code;
@override@JsonKey(name: 'host_user_id') final  String? hostUserId;
@override final  QuizSessionStatus status;
@override@JsonKey(name: 'content_type') final  String contentType;
@override@JsonKey(name: 'question_count') final  int questionCount;
@override@JsonKey(name: 'max_participants') final  int maxParticipants;
@override@JsonKey(name: 'recommendation_id') final  String? recommendationId;
 final  List<Question>? _questions;
@override List<Question>? get questions {
  final value = _questions;
  if (value == null) return null;
  if (_questions is EqualUnmodifiableListView) return _questions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  GroupQuizResult? result;
@override@JsonKey(name: 'created_at') final  String createdAt;
@override@JsonKey(name: 'completed_at') final  String? completedAt;
@override@JsonKey(name: 'expires_at') final  String expiresAt;

/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuizSessionCopyWith<_QuizSession> get copyWith => __$QuizSessionCopyWithImpl<_QuizSession>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$QuizSessionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuizSession&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.hostUserId, hostUserId) || other.hostUserId == hostUserId)&&(identical(other.status, status) || other.status == status)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.questionCount, questionCount) || other.questionCount == questionCount)&&(identical(other.maxParticipants, maxParticipants) || other.maxParticipants == maxParticipants)&&(identical(other.recommendationId, recommendationId) || other.recommendationId == recommendationId)&&const DeepCollectionEquality().equals(other._questions, _questions)&&(identical(other.result, result) || other.result == result)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,hostUserId,status,contentType,questionCount,maxParticipants,recommendationId,const DeepCollectionEquality().hash(_questions),result,createdAt,completedAt,expiresAt);

@override
String toString() {
  return 'QuizSession(id: $id, code: $code, hostUserId: $hostUserId, status: $status, contentType: $contentType, questionCount: $questionCount, maxParticipants: $maxParticipants, recommendationId: $recommendationId, questions: $questions, result: $result, createdAt: $createdAt, completedAt: $completedAt, expiresAt: $expiresAt)';
}


}

/// @nodoc
abstract mixin class _$QuizSessionCopyWith<$Res> implements $QuizSessionCopyWith<$Res> {
  factory _$QuizSessionCopyWith(_QuizSession value, $Res Function(_QuizSession) _then) = __$QuizSessionCopyWithImpl;
@override @useResult
$Res call({
 String id, String code,@JsonKey(name: 'host_user_id') String? hostUserId, QuizSessionStatus status,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'question_count') int questionCount,@JsonKey(name: 'max_participants') int maxParticipants,@JsonKey(name: 'recommendation_id') String? recommendationId, List<Question>? questions, GroupQuizResult? result,@JsonKey(name: 'created_at') String createdAt,@JsonKey(name: 'completed_at') String? completedAt,@JsonKey(name: 'expires_at') String expiresAt
});


@override $GroupQuizResultCopyWith<$Res>? get result;

}
/// @nodoc
class __$QuizSessionCopyWithImpl<$Res>
    implements _$QuizSessionCopyWith<$Res> {
  __$QuizSessionCopyWithImpl(this._self, this._then);

  final _QuizSession _self;
  final $Res Function(_QuizSession) _then;

/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? hostUserId = freezed,Object? status = null,Object? contentType = null,Object? questionCount = null,Object? maxParticipants = null,Object? recommendationId = freezed,Object? questions = freezed,Object? result = freezed,Object? createdAt = null,Object? completedAt = freezed,Object? expiresAt = null,}) {
  return _then(_QuizSession(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,hostUserId: freezed == hostUserId ? _self.hostUserId : hostUserId // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as QuizSessionStatus,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,questionCount: null == questionCount ? _self.questionCount : questionCount // ignore: cast_nullable_to_non_nullable
as int,maxParticipants: null == maxParticipants ? _self.maxParticipants : maxParticipants // ignore: cast_nullable_to_non_nullable
as int,recommendationId: freezed == recommendationId ? _self.recommendationId : recommendationId // ignore: cast_nullable_to_non_nullable
as String?,questions: freezed == questions ? _self._questions : questions // ignore: cast_nullable_to_non_nullable
as List<Question>?,result: freezed == result ? _self.result : result // ignore: cast_nullable_to_non_nullable
as GroupQuizResult?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as String?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

/// Create a copy of QuizSession
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GroupQuizResultCopyWith<$Res>? get result {
    if (_self.result == null) {
    return null;
  }

  return $GroupQuizResultCopyWith<$Res>(_self.result!, (value) {
    return _then(_self.copyWith(result: value));
  });
}
}


/// @nodoc
mixin _$QuizParticipant {

 String get id;@JsonKey(name: 'session_id') String get sessionId;@JsonKey(name: 'user_id') String? get userId;@JsonKey(name: 'display_name') String get displayName;@JsonKey(name: 'is_host') bool get isHost;@JsonKey(name: 'joined_at') String get joinedAt;@JsonKey(name: 'answers_submitted_at') String? get answersSubmittedAt;
/// Create a copy of QuizParticipant
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuizParticipantCopyWith<QuizParticipant> get copyWith => _$QuizParticipantCopyWithImpl<QuizParticipant>(this as QuizParticipant, _$identity);

  /// Serializes this QuizParticipant to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuizParticipant&&(identical(other.id, id) || other.id == id)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.isHost, isHost) || other.isHost == isHost)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt)&&(identical(other.answersSubmittedAt, answersSubmittedAt) || other.answersSubmittedAt == answersSubmittedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,sessionId,userId,displayName,isHost,joinedAt,answersSubmittedAt);

@override
String toString() {
  return 'QuizParticipant(id: $id, sessionId: $sessionId, userId: $userId, displayName: $displayName, isHost: $isHost, joinedAt: $joinedAt, answersSubmittedAt: $answersSubmittedAt)';
}


}

/// @nodoc
abstract mixin class $QuizParticipantCopyWith<$Res>  {
  factory $QuizParticipantCopyWith(QuizParticipant value, $Res Function(QuizParticipant) _then) = _$QuizParticipantCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'session_id') String sessionId,@JsonKey(name: 'user_id') String? userId,@JsonKey(name: 'display_name') String displayName,@JsonKey(name: 'is_host') bool isHost,@JsonKey(name: 'joined_at') String joinedAt,@JsonKey(name: 'answers_submitted_at') String? answersSubmittedAt
});




}
/// @nodoc
class _$QuizParticipantCopyWithImpl<$Res>
    implements $QuizParticipantCopyWith<$Res> {
  _$QuizParticipantCopyWithImpl(this._self, this._then);

  final QuizParticipant _self;
  final $Res Function(QuizParticipant) _then;

/// Create a copy of QuizParticipant
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? sessionId = null,Object? userId = freezed,Object? displayName = null,Object? isHost = null,Object? joinedAt = null,Object? answersSubmittedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,isHost: null == isHost ? _self.isHost : isHost // ignore: cast_nullable_to_non_nullable
as bool,joinedAt: null == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as String,answersSubmittedAt: freezed == answersSubmittedAt ? _self.answersSubmittedAt : answersSubmittedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [QuizParticipant].
extension QuizParticipantPatterns on QuizParticipant {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuizParticipant value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuizParticipant() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuizParticipant value)  $default,){
final _that = this;
switch (_that) {
case _QuizParticipant():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuizParticipant value)?  $default,){
final _that = this;
switch (_that) {
case _QuizParticipant() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'user_id')  String? userId, @JsonKey(name: 'display_name')  String displayName, @JsonKey(name: 'is_host')  bool isHost, @JsonKey(name: 'joined_at')  String joinedAt, @JsonKey(name: 'answers_submitted_at')  String? answersSubmittedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuizParticipant() when $default != null:
return $default(_that.id,_that.sessionId,_that.userId,_that.displayName,_that.isHost,_that.joinedAt,_that.answersSubmittedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'user_id')  String? userId, @JsonKey(name: 'display_name')  String displayName, @JsonKey(name: 'is_host')  bool isHost, @JsonKey(name: 'joined_at')  String joinedAt, @JsonKey(name: 'answers_submitted_at')  String? answersSubmittedAt)  $default,) {final _that = this;
switch (_that) {
case _QuizParticipant():
return $default(_that.id,_that.sessionId,_that.userId,_that.displayName,_that.isHost,_that.joinedAt,_that.answersSubmittedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'user_id')  String? userId, @JsonKey(name: 'display_name')  String displayName, @JsonKey(name: 'is_host')  bool isHost, @JsonKey(name: 'joined_at')  String joinedAt, @JsonKey(name: 'answers_submitted_at')  String? answersSubmittedAt)?  $default,) {final _that = this;
switch (_that) {
case _QuizParticipant() when $default != null:
return $default(_that.id,_that.sessionId,_that.userId,_that.displayName,_that.isHost,_that.joinedAt,_that.answersSubmittedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _QuizParticipant implements QuizParticipant {
  const _QuizParticipant({required this.id, @JsonKey(name: 'session_id') required this.sessionId, @JsonKey(name: 'user_id') this.userId, @JsonKey(name: 'display_name') required this.displayName, @JsonKey(name: 'is_host') this.isHost = false, @JsonKey(name: 'joined_at') required this.joinedAt, @JsonKey(name: 'answers_submitted_at') this.answersSubmittedAt});
  factory _QuizParticipant.fromJson(Map<String, dynamic> json) => _$QuizParticipantFromJson(json);

@override final  String id;
@override@JsonKey(name: 'session_id') final  String sessionId;
@override@JsonKey(name: 'user_id') final  String? userId;
@override@JsonKey(name: 'display_name') final  String displayName;
@override@JsonKey(name: 'is_host') final  bool isHost;
@override@JsonKey(name: 'joined_at') final  String joinedAt;
@override@JsonKey(name: 'answers_submitted_at') final  String? answersSubmittedAt;

/// Create a copy of QuizParticipant
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuizParticipantCopyWith<_QuizParticipant> get copyWith => __$QuizParticipantCopyWithImpl<_QuizParticipant>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$QuizParticipantToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuizParticipant&&(identical(other.id, id) || other.id == id)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.isHost, isHost) || other.isHost == isHost)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt)&&(identical(other.answersSubmittedAt, answersSubmittedAt) || other.answersSubmittedAt == answersSubmittedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,sessionId,userId,displayName,isHost,joinedAt,answersSubmittedAt);

@override
String toString() {
  return 'QuizParticipant(id: $id, sessionId: $sessionId, userId: $userId, displayName: $displayName, isHost: $isHost, joinedAt: $joinedAt, answersSubmittedAt: $answersSubmittedAt)';
}


}

/// @nodoc
abstract mixin class _$QuizParticipantCopyWith<$Res> implements $QuizParticipantCopyWith<$Res> {
  factory _$QuizParticipantCopyWith(_QuizParticipant value, $Res Function(_QuizParticipant) _then) = __$QuizParticipantCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'session_id') String sessionId,@JsonKey(name: 'user_id') String? userId,@JsonKey(name: 'display_name') String displayName,@JsonKey(name: 'is_host') bool isHost,@JsonKey(name: 'joined_at') String joinedAt,@JsonKey(name: 'answers_submitted_at') String? answersSubmittedAt
});




}
/// @nodoc
class __$QuizParticipantCopyWithImpl<$Res>
    implements _$QuizParticipantCopyWith<$Res> {
  __$QuizParticipantCopyWithImpl(this._self, this._then);

  final _QuizParticipant _self;
  final $Res Function(_QuizParticipant) _then;

/// Create a copy of QuizParticipant
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? sessionId = null,Object? userId = freezed,Object? displayName = null,Object? isHost = null,Object? joinedAt = null,Object? answersSubmittedAt = freezed,}) {
  return _then(_QuizParticipant(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,isHost: null == isHost ? _self.isHost : isHost // ignore: cast_nullable_to_non_nullable
as bool,joinedAt: null == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as String,answersSubmittedAt: freezed == answersSubmittedAt ? _self.answersSubmittedAt : answersSubmittedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$QuizAnswerRow {

 String get id;@JsonKey(name: 'session_id') String get sessionId;@JsonKey(name: 'participant_id') String get participantId;@JsonKey(name: 'question_index') int get questionIndex; String get question; String get answer;@JsonKey(name: 'created_at') String get createdAt;
/// Create a copy of QuizAnswerRow
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuizAnswerRowCopyWith<QuizAnswerRow> get copyWith => _$QuizAnswerRowCopyWithImpl<QuizAnswerRow>(this as QuizAnswerRow, _$identity);

  /// Serializes this QuizAnswerRow to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuizAnswerRow&&(identical(other.id, id) || other.id == id)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.participantId, participantId) || other.participantId == participantId)&&(identical(other.questionIndex, questionIndex) || other.questionIndex == questionIndex)&&(identical(other.question, question) || other.question == question)&&(identical(other.answer, answer) || other.answer == answer)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,sessionId,participantId,questionIndex,question,answer,createdAt);

@override
String toString() {
  return 'QuizAnswerRow(id: $id, sessionId: $sessionId, participantId: $participantId, questionIndex: $questionIndex, question: $question, answer: $answer, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $QuizAnswerRowCopyWith<$Res>  {
  factory $QuizAnswerRowCopyWith(QuizAnswerRow value, $Res Function(QuizAnswerRow) _then) = _$QuizAnswerRowCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'session_id') String sessionId,@JsonKey(name: 'participant_id') String participantId,@JsonKey(name: 'question_index') int questionIndex, String question, String answer,@JsonKey(name: 'created_at') String createdAt
});




}
/// @nodoc
class _$QuizAnswerRowCopyWithImpl<$Res>
    implements $QuizAnswerRowCopyWith<$Res> {
  _$QuizAnswerRowCopyWithImpl(this._self, this._then);

  final QuizAnswerRow _self;
  final $Res Function(QuizAnswerRow) _then;

/// Create a copy of QuizAnswerRow
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? sessionId = null,Object? participantId = null,Object? questionIndex = null,Object? question = null,Object? answer = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,participantId: null == participantId ? _self.participantId : participantId // ignore: cast_nullable_to_non_nullable
as String,questionIndex: null == questionIndex ? _self.questionIndex : questionIndex // ignore: cast_nullable_to_non_nullable
as int,question: null == question ? _self.question : question // ignore: cast_nullable_to_non_nullable
as String,answer: null == answer ? _self.answer : answer // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [QuizAnswerRow].
extension QuizAnswerRowPatterns on QuizAnswerRow {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuizAnswerRow value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuizAnswerRow() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuizAnswerRow value)  $default,){
final _that = this;
switch (_that) {
case _QuizAnswerRow():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuizAnswerRow value)?  $default,){
final _that = this;
switch (_that) {
case _QuizAnswerRow() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'participant_id')  String participantId, @JsonKey(name: 'question_index')  int questionIndex,  String question,  String answer, @JsonKey(name: 'created_at')  String createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuizAnswerRow() when $default != null:
return $default(_that.id,_that.sessionId,_that.participantId,_that.questionIndex,_that.question,_that.answer,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'participant_id')  String participantId, @JsonKey(name: 'question_index')  int questionIndex,  String question,  String answer, @JsonKey(name: 'created_at')  String createdAt)  $default,) {final _that = this;
switch (_that) {
case _QuizAnswerRow():
return $default(_that.id,_that.sessionId,_that.participantId,_that.questionIndex,_that.question,_that.answer,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'session_id')  String sessionId, @JsonKey(name: 'participant_id')  String participantId, @JsonKey(name: 'question_index')  int questionIndex,  String question,  String answer, @JsonKey(name: 'created_at')  String createdAt)?  $default,) {final _that = this;
switch (_that) {
case _QuizAnswerRow() when $default != null:
return $default(_that.id,_that.sessionId,_that.participantId,_that.questionIndex,_that.question,_that.answer,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _QuizAnswerRow implements QuizAnswerRow {
  const _QuizAnswerRow({required this.id, @JsonKey(name: 'session_id') required this.sessionId, @JsonKey(name: 'participant_id') required this.participantId, @JsonKey(name: 'question_index') required this.questionIndex, required this.question, required this.answer, @JsonKey(name: 'created_at') required this.createdAt});
  factory _QuizAnswerRow.fromJson(Map<String, dynamic> json) => _$QuizAnswerRowFromJson(json);

@override final  String id;
@override@JsonKey(name: 'session_id') final  String sessionId;
@override@JsonKey(name: 'participant_id') final  String participantId;
@override@JsonKey(name: 'question_index') final  int questionIndex;
@override final  String question;
@override final  String answer;
@override@JsonKey(name: 'created_at') final  String createdAt;

/// Create a copy of QuizAnswerRow
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuizAnswerRowCopyWith<_QuizAnswerRow> get copyWith => __$QuizAnswerRowCopyWithImpl<_QuizAnswerRow>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$QuizAnswerRowToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuizAnswerRow&&(identical(other.id, id) || other.id == id)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.participantId, participantId) || other.participantId == participantId)&&(identical(other.questionIndex, questionIndex) || other.questionIndex == questionIndex)&&(identical(other.question, question) || other.question == question)&&(identical(other.answer, answer) || other.answer == answer)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,sessionId,participantId,questionIndex,question,answer,createdAt);

@override
String toString() {
  return 'QuizAnswerRow(id: $id, sessionId: $sessionId, participantId: $participantId, questionIndex: $questionIndex, question: $question, answer: $answer, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$QuizAnswerRowCopyWith<$Res> implements $QuizAnswerRowCopyWith<$Res> {
  factory _$QuizAnswerRowCopyWith(_QuizAnswerRow value, $Res Function(_QuizAnswerRow) _then) = __$QuizAnswerRowCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'session_id') String sessionId,@JsonKey(name: 'participant_id') String participantId,@JsonKey(name: 'question_index') int questionIndex, String question, String answer,@JsonKey(name: 'created_at') String createdAt
});




}
/// @nodoc
class __$QuizAnswerRowCopyWithImpl<$Res>
    implements _$QuizAnswerRowCopyWith<$Res> {
  __$QuizAnswerRowCopyWithImpl(this._self, this._then);

  final _QuizAnswerRow _self;
  final $Res Function(_QuizAnswerRow) _then;

/// Create a copy of QuizAnswerRow
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? sessionId = null,Object? participantId = null,Object? questionIndex = null,Object? question = null,Object? answer = null,Object? createdAt = null,}) {
  return _then(_QuizAnswerRow(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,participantId: null == participantId ? _self.participantId : participantId // ignore: cast_nullable_to_non_nullable
as String,questionIndex: null == questionIndex ? _self.questionIndex : questionIndex // ignore: cast_nullable_to_non_nullable
as int,question: null == question ? _self.question : question // ignore: cast_nullable_to_non_nullable
as String,answer: null == answer ? _self.answer : answer // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
