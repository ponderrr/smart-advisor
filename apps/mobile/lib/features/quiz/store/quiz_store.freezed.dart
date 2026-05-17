// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'quiz_store.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$QuizState {

 ContentType? get contentType; int get questionCount; List<Answer> get answers; int? get userAge; List<String> get genres; List<String> get moods; List<Recommendation> get recommendations;
/// Create a copy of QuizState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuizStateCopyWith<QuizState> get copyWith => _$QuizStateCopyWithImpl<QuizState>(this as QuizState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuizState&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.questionCount, questionCount) || other.questionCount == questionCount)&&const DeepCollectionEquality().equals(other.answers, answers)&&(identical(other.userAge, userAge) || other.userAge == userAge)&&const DeepCollectionEquality().equals(other.genres, genres)&&const DeepCollectionEquality().equals(other.moods, moods)&&const DeepCollectionEquality().equals(other.recommendations, recommendations));
}


@override
int get hashCode => Object.hash(runtimeType,contentType,questionCount,const DeepCollectionEquality().hash(answers),userAge,const DeepCollectionEquality().hash(genres),const DeepCollectionEquality().hash(moods),const DeepCollectionEquality().hash(recommendations));

@override
String toString() {
  return 'QuizState(contentType: $contentType, questionCount: $questionCount, answers: $answers, userAge: $userAge, genres: $genres, moods: $moods, recommendations: $recommendations)';
}


}

/// @nodoc
abstract mixin class $QuizStateCopyWith<$Res>  {
  factory $QuizStateCopyWith(QuizState value, $Res Function(QuizState) _then) = _$QuizStateCopyWithImpl;
@useResult
$Res call({
 ContentType? contentType, int questionCount, List<Answer> answers, int? userAge, List<String> genres, List<String> moods, List<Recommendation> recommendations
});




}
/// @nodoc
class _$QuizStateCopyWithImpl<$Res>
    implements $QuizStateCopyWith<$Res> {
  _$QuizStateCopyWithImpl(this._self, this._then);

  final QuizState _self;
  final $Res Function(QuizState) _then;

/// Create a copy of QuizState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? contentType = freezed,Object? questionCount = null,Object? answers = null,Object? userAge = freezed,Object? genres = null,Object? moods = null,Object? recommendations = null,}) {
  return _then(_self.copyWith(
contentType: freezed == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as ContentType?,questionCount: null == questionCount ? _self.questionCount : questionCount // ignore: cast_nullable_to_non_nullable
as int,answers: null == answers ? _self.answers : answers // ignore: cast_nullable_to_non_nullable
as List<Answer>,userAge: freezed == userAge ? _self.userAge : userAge // ignore: cast_nullable_to_non_nullable
as int?,genres: null == genres ? _self.genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,moods: null == moods ? _self.moods : moods // ignore: cast_nullable_to_non_nullable
as List<String>,recommendations: null == recommendations ? _self.recommendations : recommendations // ignore: cast_nullable_to_non_nullable
as List<Recommendation>,
  ));
}

}


/// Adds pattern-matching-related methods to [QuizState].
extension QuizStatePatterns on QuizState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuizState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuizState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuizState value)  $default,){
final _that = this;
switch (_that) {
case _QuizState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuizState value)?  $default,){
final _that = this;
switch (_that) {
case _QuizState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ContentType? contentType,  int questionCount,  List<Answer> answers,  int? userAge,  List<String> genres,  List<String> moods,  List<Recommendation> recommendations)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuizState() when $default != null:
return $default(_that.contentType,_that.questionCount,_that.answers,_that.userAge,_that.genres,_that.moods,_that.recommendations);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ContentType? contentType,  int questionCount,  List<Answer> answers,  int? userAge,  List<String> genres,  List<String> moods,  List<Recommendation> recommendations)  $default,) {final _that = this;
switch (_that) {
case _QuizState():
return $default(_that.contentType,_that.questionCount,_that.answers,_that.userAge,_that.genres,_that.moods,_that.recommendations);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ContentType? contentType,  int questionCount,  List<Answer> answers,  int? userAge,  List<String> genres,  List<String> moods,  List<Recommendation> recommendations)?  $default,) {final _that = this;
switch (_that) {
case _QuizState() when $default != null:
return $default(_that.contentType,_that.questionCount,_that.answers,_that.userAge,_that.genres,_that.moods,_that.recommendations);case _:
  return null;

}
}

}

/// @nodoc


class _QuizState implements QuizState {
  const _QuizState({this.contentType, this.questionCount = 5, final  List<Answer> answers = const <Answer>[], this.userAge, final  List<String> genres = const <String>[], final  List<String> moods = const <String>[], final  List<Recommendation> recommendations = const <Recommendation>[]}): _answers = answers,_genres = genres,_moods = moods,_recommendations = recommendations;
  

@override final  ContentType? contentType;
@override@JsonKey() final  int questionCount;
 final  List<Answer> _answers;
@override@JsonKey() List<Answer> get answers {
  if (_answers is EqualUnmodifiableListView) return _answers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_answers);
}

@override final  int? userAge;
 final  List<String> _genres;
@override@JsonKey() List<String> get genres {
  if (_genres is EqualUnmodifiableListView) return _genres;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_genres);
}

 final  List<String> _moods;
@override@JsonKey() List<String> get moods {
  if (_moods is EqualUnmodifiableListView) return _moods;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_moods);
}

 final  List<Recommendation> _recommendations;
@override@JsonKey() List<Recommendation> get recommendations {
  if (_recommendations is EqualUnmodifiableListView) return _recommendations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_recommendations);
}


/// Create a copy of QuizState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuizStateCopyWith<_QuizState> get copyWith => __$QuizStateCopyWithImpl<_QuizState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuizState&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.questionCount, questionCount) || other.questionCount == questionCount)&&const DeepCollectionEquality().equals(other._answers, _answers)&&(identical(other.userAge, userAge) || other.userAge == userAge)&&const DeepCollectionEquality().equals(other._genres, _genres)&&const DeepCollectionEquality().equals(other._moods, _moods)&&const DeepCollectionEquality().equals(other._recommendations, _recommendations));
}


@override
int get hashCode => Object.hash(runtimeType,contentType,questionCount,const DeepCollectionEquality().hash(_answers),userAge,const DeepCollectionEquality().hash(_genres),const DeepCollectionEquality().hash(_moods),const DeepCollectionEquality().hash(_recommendations));

@override
String toString() {
  return 'QuizState(contentType: $contentType, questionCount: $questionCount, answers: $answers, userAge: $userAge, genres: $genres, moods: $moods, recommendations: $recommendations)';
}


}

/// @nodoc
abstract mixin class _$QuizStateCopyWith<$Res> implements $QuizStateCopyWith<$Res> {
  factory _$QuizStateCopyWith(_QuizState value, $Res Function(_QuizState) _then) = __$QuizStateCopyWithImpl;
@override @useResult
$Res call({
 ContentType? contentType, int questionCount, List<Answer> answers, int? userAge, List<String> genres, List<String> moods, List<Recommendation> recommendations
});




}
/// @nodoc
class __$QuizStateCopyWithImpl<$Res>
    implements _$QuizStateCopyWith<$Res> {
  __$QuizStateCopyWithImpl(this._self, this._then);

  final _QuizState _self;
  final $Res Function(_QuizState) _then;

/// Create a copy of QuizState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? contentType = freezed,Object? questionCount = null,Object? answers = null,Object? userAge = freezed,Object? genres = null,Object? moods = null,Object? recommendations = null,}) {
  return _then(_QuizState(
contentType: freezed == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as ContentType?,questionCount: null == questionCount ? _self.questionCount : questionCount // ignore: cast_nullable_to_non_nullable
as int,answers: null == answers ? _self._answers : answers // ignore: cast_nullable_to_non_nullable
as List<Answer>,userAge: freezed == userAge ? _self.userAge : userAge // ignore: cast_nullable_to_non_nullable
as int?,genres: null == genres ? _self._genres : genres // ignore: cast_nullable_to_non_nullable
as List<String>,moods: null == moods ? _self._moods : moods // ignore: cast_nullable_to_non_nullable
as List<String>,recommendations: null == recommendations ? _self._recommendations : recommendations // ignore: cast_nullable_to_non_nullable
as List<Recommendation>,
  ));
}


}

// dart format on
