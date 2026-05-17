// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'library_item.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LibraryItem {

 String get id;@JsonKey(name: 'user_id') String get userId; LibraryMedium get medium; String get title; String? get creator; int? get year;@JsonKey(name: 'poster_url') String? get posterUrl; LibraryStatus get status; int? get rating; String? get reaction;@JsonKey(name: 'source_recommendation_id') String? get sourceRecommendationId;@JsonKey(name: 'logged_at') String get loggedAt;@JsonKey(name: 'finished_at') String? get finishedAt;@JsonKey(name: 'updated_at') String get updatedAt;
/// Create a copy of LibraryItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LibraryItemCopyWith<LibraryItem> get copyWith => _$LibraryItemCopyWithImpl<LibraryItem>(this as LibraryItem, _$identity);

  /// Serializes this LibraryItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LibraryItem&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.medium, medium) || other.medium == medium)&&(identical(other.title, title) || other.title == title)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction)&&(identical(other.sourceRecommendationId, sourceRecommendationId) || other.sourceRecommendationId == sourceRecommendationId)&&(identical(other.loggedAt, loggedAt) || other.loggedAt == loggedAt)&&(identical(other.finishedAt, finishedAt) || other.finishedAt == finishedAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,medium,title,creator,year,posterUrl,status,rating,reaction,sourceRecommendationId,loggedAt,finishedAt,updatedAt);

@override
String toString() {
  return 'LibraryItem(id: $id, userId: $userId, medium: $medium, title: $title, creator: $creator, year: $year, posterUrl: $posterUrl, status: $status, rating: $rating, reaction: $reaction, sourceRecommendationId: $sourceRecommendationId, loggedAt: $loggedAt, finishedAt: $finishedAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $LibraryItemCopyWith<$Res>  {
  factory $LibraryItemCopyWith(LibraryItem value, $Res Function(LibraryItem) _then) = _$LibraryItemCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'user_id') String userId, LibraryMedium medium, String title, String? creator, int? year,@JsonKey(name: 'poster_url') String? posterUrl, LibraryStatus status, int? rating, String? reaction,@JsonKey(name: 'source_recommendation_id') String? sourceRecommendationId,@JsonKey(name: 'logged_at') String loggedAt,@JsonKey(name: 'finished_at') String? finishedAt,@JsonKey(name: 'updated_at') String updatedAt
});




}
/// @nodoc
class _$LibraryItemCopyWithImpl<$Res>
    implements $LibraryItemCopyWith<$Res> {
  _$LibraryItemCopyWithImpl(this._self, this._then);

  final LibraryItem _self;
  final $Res Function(LibraryItem) _then;

/// Create a copy of LibraryItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userId = null,Object? medium = null,Object? title = null,Object? creator = freezed,Object? year = freezed,Object? posterUrl = freezed,Object? status = null,Object? rating = freezed,Object? reaction = freezed,Object? sourceRecommendationId = freezed,Object? loggedAt = null,Object? finishedAt = freezed,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,medium: null == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as LibraryMedium,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,sourceRecommendationId: freezed == sourceRecommendationId ? _self.sourceRecommendationId : sourceRecommendationId // ignore: cast_nullable_to_non_nullable
as String?,loggedAt: null == loggedAt ? _self.loggedAt : loggedAt // ignore: cast_nullable_to_non_nullable
as String,finishedAt: freezed == finishedAt ? _self.finishedAt : finishedAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [LibraryItem].
extension LibraryItemPatterns on LibraryItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LibraryItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LibraryItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LibraryItem value)  $default,){
final _that = this;
switch (_that) {
case _LibraryItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LibraryItem value)?  $default,){
final _that = this;
switch (_that) {
case _LibraryItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'user_id')  String userId,  LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId, @JsonKey(name: 'logged_at')  String loggedAt, @JsonKey(name: 'finished_at')  String? finishedAt, @JsonKey(name: 'updated_at')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LibraryItem() when $default != null:
return $default(_that.id,_that.userId,_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId,_that.loggedAt,_that.finishedAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'user_id')  String userId,  LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId, @JsonKey(name: 'logged_at')  String loggedAt, @JsonKey(name: 'finished_at')  String? finishedAt, @JsonKey(name: 'updated_at')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _LibraryItem():
return $default(_that.id,_that.userId,_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId,_that.loggedAt,_that.finishedAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'user_id')  String userId,  LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId, @JsonKey(name: 'logged_at')  String loggedAt, @JsonKey(name: 'finished_at')  String? finishedAt, @JsonKey(name: 'updated_at')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _LibraryItem() when $default != null:
return $default(_that.id,_that.userId,_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId,_that.loggedAt,_that.finishedAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LibraryItem implements LibraryItem {
  const _LibraryItem({required this.id, @JsonKey(name: 'user_id') required this.userId, required this.medium, required this.title, required this.creator, required this.year, @JsonKey(name: 'poster_url') required this.posterUrl, required this.status, required this.rating, required this.reaction, @JsonKey(name: 'source_recommendation_id') required this.sourceRecommendationId, @JsonKey(name: 'logged_at') required this.loggedAt, @JsonKey(name: 'finished_at') required this.finishedAt, @JsonKey(name: 'updated_at') required this.updatedAt});
  factory _LibraryItem.fromJson(Map<String, dynamic> json) => _$LibraryItemFromJson(json);

@override final  String id;
@override@JsonKey(name: 'user_id') final  String userId;
@override final  LibraryMedium medium;
@override final  String title;
@override final  String? creator;
@override final  int? year;
@override@JsonKey(name: 'poster_url') final  String? posterUrl;
@override final  LibraryStatus status;
@override final  int? rating;
@override final  String? reaction;
@override@JsonKey(name: 'source_recommendation_id') final  String? sourceRecommendationId;
@override@JsonKey(name: 'logged_at') final  String loggedAt;
@override@JsonKey(name: 'finished_at') final  String? finishedAt;
@override@JsonKey(name: 'updated_at') final  String updatedAt;

/// Create a copy of LibraryItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LibraryItemCopyWith<_LibraryItem> get copyWith => __$LibraryItemCopyWithImpl<_LibraryItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LibraryItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LibraryItem&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.medium, medium) || other.medium == medium)&&(identical(other.title, title) || other.title == title)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction)&&(identical(other.sourceRecommendationId, sourceRecommendationId) || other.sourceRecommendationId == sourceRecommendationId)&&(identical(other.loggedAt, loggedAt) || other.loggedAt == loggedAt)&&(identical(other.finishedAt, finishedAt) || other.finishedAt == finishedAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userId,medium,title,creator,year,posterUrl,status,rating,reaction,sourceRecommendationId,loggedAt,finishedAt,updatedAt);

@override
String toString() {
  return 'LibraryItem(id: $id, userId: $userId, medium: $medium, title: $title, creator: $creator, year: $year, posterUrl: $posterUrl, status: $status, rating: $rating, reaction: $reaction, sourceRecommendationId: $sourceRecommendationId, loggedAt: $loggedAt, finishedAt: $finishedAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$LibraryItemCopyWith<$Res> implements $LibraryItemCopyWith<$Res> {
  factory _$LibraryItemCopyWith(_LibraryItem value, $Res Function(_LibraryItem) _then) = __$LibraryItemCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'user_id') String userId, LibraryMedium medium, String title, String? creator, int? year,@JsonKey(name: 'poster_url') String? posterUrl, LibraryStatus status, int? rating, String? reaction,@JsonKey(name: 'source_recommendation_id') String? sourceRecommendationId,@JsonKey(name: 'logged_at') String loggedAt,@JsonKey(name: 'finished_at') String? finishedAt,@JsonKey(name: 'updated_at') String updatedAt
});




}
/// @nodoc
class __$LibraryItemCopyWithImpl<$Res>
    implements _$LibraryItemCopyWith<$Res> {
  __$LibraryItemCopyWithImpl(this._self, this._then);

  final _LibraryItem _self;
  final $Res Function(_LibraryItem) _then;

/// Create a copy of LibraryItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userId = null,Object? medium = null,Object? title = null,Object? creator = freezed,Object? year = freezed,Object? posterUrl = freezed,Object? status = null,Object? rating = freezed,Object? reaction = freezed,Object? sourceRecommendationId = freezed,Object? loggedAt = null,Object? finishedAt = freezed,Object? updatedAt = null,}) {
  return _then(_LibraryItem(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,medium: null == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as LibraryMedium,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,sourceRecommendationId: freezed == sourceRecommendationId ? _self.sourceRecommendationId : sourceRecommendationId // ignore: cast_nullable_to_non_nullable
as String?,loggedAt: null == loggedAt ? _self.loggedAt : loggedAt // ignore: cast_nullable_to_non_nullable
as String,finishedAt: freezed == finishedAt ? _self.finishedAt : finishedAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$LogLibraryInput {

 LibraryMedium get medium; String get title; String? get creator; int? get year;@JsonKey(name: 'poster_url') String? get posterUrl; LibraryStatus? get status; int? get rating; String? get reaction;@JsonKey(name: 'source_recommendation_id') String? get sourceRecommendationId;
/// Create a copy of LogLibraryInput
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LogLibraryInputCopyWith<LogLibraryInput> get copyWith => _$LogLibraryInputCopyWithImpl<LogLibraryInput>(this as LogLibraryInput, _$identity);

  /// Serializes this LogLibraryInput to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LogLibraryInput&&(identical(other.medium, medium) || other.medium == medium)&&(identical(other.title, title) || other.title == title)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction)&&(identical(other.sourceRecommendationId, sourceRecommendationId) || other.sourceRecommendationId == sourceRecommendationId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,medium,title,creator,year,posterUrl,status,rating,reaction,sourceRecommendationId);

@override
String toString() {
  return 'LogLibraryInput(medium: $medium, title: $title, creator: $creator, year: $year, posterUrl: $posterUrl, status: $status, rating: $rating, reaction: $reaction, sourceRecommendationId: $sourceRecommendationId)';
}


}

/// @nodoc
abstract mixin class $LogLibraryInputCopyWith<$Res>  {
  factory $LogLibraryInputCopyWith(LogLibraryInput value, $Res Function(LogLibraryInput) _then) = _$LogLibraryInputCopyWithImpl;
@useResult
$Res call({
 LibraryMedium medium, String title, String? creator, int? year,@JsonKey(name: 'poster_url') String? posterUrl, LibraryStatus? status, int? rating, String? reaction,@JsonKey(name: 'source_recommendation_id') String? sourceRecommendationId
});




}
/// @nodoc
class _$LogLibraryInputCopyWithImpl<$Res>
    implements $LogLibraryInputCopyWith<$Res> {
  _$LogLibraryInputCopyWithImpl(this._self, this._then);

  final LogLibraryInput _self;
  final $Res Function(LogLibraryInput) _then;

/// Create a copy of LogLibraryInput
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? medium = null,Object? title = null,Object? creator = freezed,Object? year = freezed,Object? posterUrl = freezed,Object? status = freezed,Object? rating = freezed,Object? reaction = freezed,Object? sourceRecommendationId = freezed,}) {
  return _then(_self.copyWith(
medium: null == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as LibraryMedium,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,sourceRecommendationId: freezed == sourceRecommendationId ? _self.sourceRecommendationId : sourceRecommendationId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [LogLibraryInput].
extension LogLibraryInputPatterns on LogLibraryInput {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LogLibraryInput value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LogLibraryInput() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LogLibraryInput value)  $default,){
final _that = this;
switch (_that) {
case _LogLibraryInput():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LogLibraryInput value)?  $default,){
final _that = this;
switch (_that) {
case _LogLibraryInput() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus? status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LogLibraryInput() when $default != null:
return $default(_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus? status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId)  $default,) {final _that = this;
switch (_that) {
case _LogLibraryInput():
return $default(_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( LibraryMedium medium,  String title,  String? creator,  int? year, @JsonKey(name: 'poster_url')  String? posterUrl,  LibraryStatus? status,  int? rating,  String? reaction, @JsonKey(name: 'source_recommendation_id')  String? sourceRecommendationId)?  $default,) {final _that = this;
switch (_that) {
case _LogLibraryInput() when $default != null:
return $default(_that.medium,_that.title,_that.creator,_that.year,_that.posterUrl,_that.status,_that.rating,_that.reaction,_that.sourceRecommendationId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LogLibraryInput implements LogLibraryInput {
  const _LogLibraryInput({required this.medium, required this.title, this.creator, this.year, @JsonKey(name: 'poster_url') this.posterUrl, this.status, this.rating, this.reaction, @JsonKey(name: 'source_recommendation_id') this.sourceRecommendationId});
  factory _LogLibraryInput.fromJson(Map<String, dynamic> json) => _$LogLibraryInputFromJson(json);

@override final  LibraryMedium medium;
@override final  String title;
@override final  String? creator;
@override final  int? year;
@override@JsonKey(name: 'poster_url') final  String? posterUrl;
@override final  LibraryStatus? status;
@override final  int? rating;
@override final  String? reaction;
@override@JsonKey(name: 'source_recommendation_id') final  String? sourceRecommendationId;

/// Create a copy of LogLibraryInput
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LogLibraryInputCopyWith<_LogLibraryInput> get copyWith => __$LogLibraryInputCopyWithImpl<_LogLibraryInput>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LogLibraryInputToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LogLibraryInput&&(identical(other.medium, medium) || other.medium == medium)&&(identical(other.title, title) || other.title == title)&&(identical(other.creator, creator) || other.creator == creator)&&(identical(other.year, year) || other.year == year)&&(identical(other.posterUrl, posterUrl) || other.posterUrl == posterUrl)&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction)&&(identical(other.sourceRecommendationId, sourceRecommendationId) || other.sourceRecommendationId == sourceRecommendationId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,medium,title,creator,year,posterUrl,status,rating,reaction,sourceRecommendationId);

@override
String toString() {
  return 'LogLibraryInput(medium: $medium, title: $title, creator: $creator, year: $year, posterUrl: $posterUrl, status: $status, rating: $rating, reaction: $reaction, sourceRecommendationId: $sourceRecommendationId)';
}


}

/// @nodoc
abstract mixin class _$LogLibraryInputCopyWith<$Res> implements $LogLibraryInputCopyWith<$Res> {
  factory _$LogLibraryInputCopyWith(_LogLibraryInput value, $Res Function(_LogLibraryInput) _then) = __$LogLibraryInputCopyWithImpl;
@override @useResult
$Res call({
 LibraryMedium medium, String title, String? creator, int? year,@JsonKey(name: 'poster_url') String? posterUrl, LibraryStatus? status, int? rating, String? reaction,@JsonKey(name: 'source_recommendation_id') String? sourceRecommendationId
});




}
/// @nodoc
class __$LogLibraryInputCopyWithImpl<$Res>
    implements _$LogLibraryInputCopyWith<$Res> {
  __$LogLibraryInputCopyWithImpl(this._self, this._then);

  final _LogLibraryInput _self;
  final $Res Function(_LogLibraryInput) _then;

/// Create a copy of LogLibraryInput
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? medium = null,Object? title = null,Object? creator = freezed,Object? year = freezed,Object? posterUrl = freezed,Object? status = freezed,Object? rating = freezed,Object? reaction = freezed,Object? sourceRecommendationId = freezed,}) {
  return _then(_LogLibraryInput(
medium: null == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as LibraryMedium,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,creator: freezed == creator ? _self.creator : creator // ignore: cast_nullable_to_non_nullable
as String?,year: freezed == year ? _self.year : year // ignore: cast_nullable_to_non_nullable
as int?,posterUrl: freezed == posterUrl ? _self.posterUrl : posterUrl // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,sourceRecommendationId: freezed == sourceRecommendationId ? _self.sourceRecommendationId : sourceRecommendationId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$UpdateLibraryInput {

 LibraryStatus? get status; int? get rating; String? get reaction;
/// Create a copy of UpdateLibraryInput
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UpdateLibraryInputCopyWith<UpdateLibraryInput> get copyWith => _$UpdateLibraryInputCopyWithImpl<UpdateLibraryInput>(this as UpdateLibraryInput, _$identity);

  /// Serializes this UpdateLibraryInput to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UpdateLibraryInput&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,status,rating,reaction);

@override
String toString() {
  return 'UpdateLibraryInput(status: $status, rating: $rating, reaction: $reaction)';
}


}

/// @nodoc
abstract mixin class $UpdateLibraryInputCopyWith<$Res>  {
  factory $UpdateLibraryInputCopyWith(UpdateLibraryInput value, $Res Function(UpdateLibraryInput) _then) = _$UpdateLibraryInputCopyWithImpl;
@useResult
$Res call({
 LibraryStatus? status, int? rating, String? reaction
});




}
/// @nodoc
class _$UpdateLibraryInputCopyWithImpl<$Res>
    implements $UpdateLibraryInputCopyWith<$Res> {
  _$UpdateLibraryInputCopyWithImpl(this._self, this._then);

  final UpdateLibraryInput _self;
  final $Res Function(UpdateLibraryInput) _then;

/// Create a copy of UpdateLibraryInput
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = freezed,Object? rating = freezed,Object? reaction = freezed,}) {
  return _then(_self.copyWith(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [UpdateLibraryInput].
extension UpdateLibraryInputPatterns on UpdateLibraryInput {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UpdateLibraryInput value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UpdateLibraryInput() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UpdateLibraryInput value)  $default,){
final _that = this;
switch (_that) {
case _UpdateLibraryInput():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UpdateLibraryInput value)?  $default,){
final _that = this;
switch (_that) {
case _UpdateLibraryInput() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( LibraryStatus? status,  int? rating,  String? reaction)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UpdateLibraryInput() when $default != null:
return $default(_that.status,_that.rating,_that.reaction);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( LibraryStatus? status,  int? rating,  String? reaction)  $default,) {final _that = this;
switch (_that) {
case _UpdateLibraryInput():
return $default(_that.status,_that.rating,_that.reaction);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( LibraryStatus? status,  int? rating,  String? reaction)?  $default,) {final _that = this;
switch (_that) {
case _UpdateLibraryInput() when $default != null:
return $default(_that.status,_that.rating,_that.reaction);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UpdateLibraryInput implements UpdateLibraryInput {
  const _UpdateLibraryInput({this.status, this.rating, this.reaction});
  factory _UpdateLibraryInput.fromJson(Map<String, dynamic> json) => _$UpdateLibraryInputFromJson(json);

@override final  LibraryStatus? status;
@override final  int? rating;
@override final  String? reaction;

/// Create a copy of UpdateLibraryInput
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UpdateLibraryInputCopyWith<_UpdateLibraryInput> get copyWith => __$UpdateLibraryInputCopyWithImpl<_UpdateLibraryInput>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UpdateLibraryInputToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UpdateLibraryInput&&(identical(other.status, status) || other.status == status)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.reaction, reaction) || other.reaction == reaction));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,status,rating,reaction);

@override
String toString() {
  return 'UpdateLibraryInput(status: $status, rating: $rating, reaction: $reaction)';
}


}

/// @nodoc
abstract mixin class _$UpdateLibraryInputCopyWith<$Res> implements $UpdateLibraryInputCopyWith<$Res> {
  factory _$UpdateLibraryInputCopyWith(_UpdateLibraryInput value, $Res Function(_UpdateLibraryInput) _then) = __$UpdateLibraryInputCopyWithImpl;
@override @useResult
$Res call({
 LibraryStatus? status, int? rating, String? reaction
});




}
/// @nodoc
class __$UpdateLibraryInputCopyWithImpl<$Res>
    implements _$UpdateLibraryInputCopyWith<$Res> {
  __$UpdateLibraryInputCopyWithImpl(this._self, this._then);

  final _UpdateLibraryInput _self;
  final $Res Function(_UpdateLibraryInput) _then;

/// Create a copy of UpdateLibraryInput
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = freezed,Object? rating = freezed,Object? reaction = freezed,}) {
  return _then(_UpdateLibraryInput(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as LibraryStatus?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,reaction: freezed == reaction ? _self.reaction : reaction // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
