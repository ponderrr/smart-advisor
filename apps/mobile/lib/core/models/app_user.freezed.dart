// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'app_user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppUser {

 String get id; String get email; String get name; int get age;@JsonKey(name: 'created_at') String get createdAt; String? get username;@JsonKey(name: 'mfa_enabled') bool? get mfaEnabled;@JsonKey(name: 'is_admin') bool? get isAdmin;@JsonKey(name: 'last_login') String? get lastLogin;@JsonKey(name: 'backup_email') String? get backupEmail;@JsonKey(name: 'avatar_url') String? get avatarUrl;@JsonKey(name: 'content_tone') String? get contentTone; String? get locale;@JsonKey(name: 'setup_completed_at') String? get setupCompletedAt;@JsonKey(name: 'recommendation_filters') Map<String, dynamic>? get recommendationFilters;/// "About me" profile customization.
 String? get bio; List<String>? get interests; List<String>? get tags;
/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AppUserCopyWith<AppUser> get copyWith => _$AppUserCopyWithImpl<AppUser>(this as AppUser, _$identity);

  /// Serializes this AppUser to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AppUser&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.name, name) || other.name == name)&&(identical(other.age, age) || other.age == age)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.username, username) || other.username == username)&&(identical(other.mfaEnabled, mfaEnabled) || other.mfaEnabled == mfaEnabled)&&(identical(other.isAdmin, isAdmin) || other.isAdmin == isAdmin)&&(identical(other.lastLogin, lastLogin) || other.lastLogin == lastLogin)&&(identical(other.backupEmail, backupEmail) || other.backupEmail == backupEmail)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.contentTone, contentTone) || other.contentTone == contentTone)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.setupCompletedAt, setupCompletedAt) || other.setupCompletedAt == setupCompletedAt)&&const DeepCollectionEquality().equals(other.recommendationFilters, recommendationFilters)&&(identical(other.bio, bio) || other.bio == bio)&&const DeepCollectionEquality().equals(other.interests, interests)&&const DeepCollectionEquality().equals(other.tags, tags));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,email,name,age,createdAt,username,mfaEnabled,isAdmin,lastLogin,backupEmail,avatarUrl,contentTone,locale,setupCompletedAt,const DeepCollectionEquality().hash(recommendationFilters),bio,const DeepCollectionEquality().hash(interests),const DeepCollectionEquality().hash(tags));

@override
String toString() {
  return 'AppUser(id: $id, email: $email, name: $name, age: $age, createdAt: $createdAt, username: $username, mfaEnabled: $mfaEnabled, isAdmin: $isAdmin, lastLogin: $lastLogin, backupEmail: $backupEmail, avatarUrl: $avatarUrl, contentTone: $contentTone, locale: $locale, setupCompletedAt: $setupCompletedAt, recommendationFilters: $recommendationFilters, bio: $bio, interests: $interests, tags: $tags)';
}


}

/// @nodoc
abstract mixin class $AppUserCopyWith<$Res>  {
  factory $AppUserCopyWith(AppUser value, $Res Function(AppUser) _then) = _$AppUserCopyWithImpl;
@useResult
$Res call({
 String id, String email, String name, int age,@JsonKey(name: 'created_at') String createdAt, String? username,@JsonKey(name: 'mfa_enabled') bool? mfaEnabled,@JsonKey(name: 'is_admin') bool? isAdmin,@JsonKey(name: 'last_login') String? lastLogin,@JsonKey(name: 'backup_email') String? backupEmail,@JsonKey(name: 'avatar_url') String? avatarUrl,@JsonKey(name: 'content_tone') String? contentTone, String? locale,@JsonKey(name: 'setup_completed_at') String? setupCompletedAt,@JsonKey(name: 'recommendation_filters') Map<String, dynamic>? recommendationFilters, String? bio, List<String>? interests, List<String>? tags
});




}
/// @nodoc
class _$AppUserCopyWithImpl<$Res>
    implements $AppUserCopyWith<$Res> {
  _$AppUserCopyWithImpl(this._self, this._then);

  final AppUser _self;
  final $Res Function(AppUser) _then;

/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? email = null,Object? name = null,Object? age = null,Object? createdAt = null,Object? username = freezed,Object? mfaEnabled = freezed,Object? isAdmin = freezed,Object? lastLogin = freezed,Object? backupEmail = freezed,Object? avatarUrl = freezed,Object? contentTone = freezed,Object? locale = freezed,Object? setupCompletedAt = freezed,Object? recommendationFilters = freezed,Object? bio = freezed,Object? interests = freezed,Object? tags = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,age: null == age ? _self.age : age // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,username: freezed == username ? _self.username : username // ignore: cast_nullable_to_non_nullable
as String?,mfaEnabled: freezed == mfaEnabled ? _self.mfaEnabled : mfaEnabled // ignore: cast_nullable_to_non_nullable
as bool?,isAdmin: freezed == isAdmin ? _self.isAdmin : isAdmin // ignore: cast_nullable_to_non_nullable
as bool?,lastLogin: freezed == lastLogin ? _self.lastLogin : lastLogin // ignore: cast_nullable_to_non_nullable
as String?,backupEmail: freezed == backupEmail ? _self.backupEmail : backupEmail // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,contentTone: freezed == contentTone ? _self.contentTone : contentTone // ignore: cast_nullable_to_non_nullable
as String?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,setupCompletedAt: freezed == setupCompletedAt ? _self.setupCompletedAt : setupCompletedAt // ignore: cast_nullable_to_non_nullable
as String?,recommendationFilters: freezed == recommendationFilters ? _self.recommendationFilters : recommendationFilters // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,interests: freezed == interests ? _self.interests : interests // ignore: cast_nullable_to_non_nullable
as List<String>?,tags: freezed == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,
  ));
}

}


/// Adds pattern-matching-related methods to [AppUser].
extension AppUserPatterns on AppUser {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AppUser value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AppUser() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AppUser value)  $default,){
final _that = this;
switch (_that) {
case _AppUser():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AppUser value)?  $default,){
final _that = this;
switch (_that) {
case _AppUser() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String email,  String name,  int age, @JsonKey(name: 'created_at')  String createdAt,  String? username, @JsonKey(name: 'mfa_enabled')  bool? mfaEnabled, @JsonKey(name: 'is_admin')  bool? isAdmin, @JsonKey(name: 'last_login')  String? lastLogin, @JsonKey(name: 'backup_email')  String? backupEmail, @JsonKey(name: 'avatar_url')  String? avatarUrl, @JsonKey(name: 'content_tone')  String? contentTone,  String? locale, @JsonKey(name: 'setup_completed_at')  String? setupCompletedAt, @JsonKey(name: 'recommendation_filters')  Map<String, dynamic>? recommendationFilters,  String? bio,  List<String>? interests,  List<String>? tags)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AppUser() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.age,_that.createdAt,_that.username,_that.mfaEnabled,_that.isAdmin,_that.lastLogin,_that.backupEmail,_that.avatarUrl,_that.contentTone,_that.locale,_that.setupCompletedAt,_that.recommendationFilters,_that.bio,_that.interests,_that.tags);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String email,  String name,  int age, @JsonKey(name: 'created_at')  String createdAt,  String? username, @JsonKey(name: 'mfa_enabled')  bool? mfaEnabled, @JsonKey(name: 'is_admin')  bool? isAdmin, @JsonKey(name: 'last_login')  String? lastLogin, @JsonKey(name: 'backup_email')  String? backupEmail, @JsonKey(name: 'avatar_url')  String? avatarUrl, @JsonKey(name: 'content_tone')  String? contentTone,  String? locale, @JsonKey(name: 'setup_completed_at')  String? setupCompletedAt, @JsonKey(name: 'recommendation_filters')  Map<String, dynamic>? recommendationFilters,  String? bio,  List<String>? interests,  List<String>? tags)  $default,) {final _that = this;
switch (_that) {
case _AppUser():
return $default(_that.id,_that.email,_that.name,_that.age,_that.createdAt,_that.username,_that.mfaEnabled,_that.isAdmin,_that.lastLogin,_that.backupEmail,_that.avatarUrl,_that.contentTone,_that.locale,_that.setupCompletedAt,_that.recommendationFilters,_that.bio,_that.interests,_that.tags);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String email,  String name,  int age, @JsonKey(name: 'created_at')  String createdAt,  String? username, @JsonKey(name: 'mfa_enabled')  bool? mfaEnabled, @JsonKey(name: 'is_admin')  bool? isAdmin, @JsonKey(name: 'last_login')  String? lastLogin, @JsonKey(name: 'backup_email')  String? backupEmail, @JsonKey(name: 'avatar_url')  String? avatarUrl, @JsonKey(name: 'content_tone')  String? contentTone,  String? locale, @JsonKey(name: 'setup_completed_at')  String? setupCompletedAt, @JsonKey(name: 'recommendation_filters')  Map<String, dynamic>? recommendationFilters,  String? bio,  List<String>? interests,  List<String>? tags)?  $default,) {final _that = this;
switch (_that) {
case _AppUser() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.age,_that.createdAt,_that.username,_that.mfaEnabled,_that.isAdmin,_that.lastLogin,_that.backupEmail,_that.avatarUrl,_that.contentTone,_that.locale,_that.setupCompletedAt,_that.recommendationFilters,_that.bio,_that.interests,_that.tags);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AppUser implements AppUser {
  const _AppUser({required this.id, required this.email, required this.name, required this.age, @JsonKey(name: 'created_at') required this.createdAt, this.username, @JsonKey(name: 'mfa_enabled') this.mfaEnabled, @JsonKey(name: 'is_admin') this.isAdmin, @JsonKey(name: 'last_login') this.lastLogin, @JsonKey(name: 'backup_email') this.backupEmail, @JsonKey(name: 'avatar_url') this.avatarUrl, @JsonKey(name: 'content_tone') this.contentTone, this.locale, @JsonKey(name: 'setup_completed_at') this.setupCompletedAt, @JsonKey(name: 'recommendation_filters') final  Map<String, dynamic>? recommendationFilters, this.bio, final  List<String>? interests, final  List<String>? tags}): _recommendationFilters = recommendationFilters,_interests = interests,_tags = tags;
  factory _AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);

@override final  String id;
@override final  String email;
@override final  String name;
@override final  int age;
@override@JsonKey(name: 'created_at') final  String createdAt;
@override final  String? username;
@override@JsonKey(name: 'mfa_enabled') final  bool? mfaEnabled;
@override@JsonKey(name: 'is_admin') final  bool? isAdmin;
@override@JsonKey(name: 'last_login') final  String? lastLogin;
@override@JsonKey(name: 'backup_email') final  String? backupEmail;
@override@JsonKey(name: 'avatar_url') final  String? avatarUrl;
@override@JsonKey(name: 'content_tone') final  String? contentTone;
@override final  String? locale;
@override@JsonKey(name: 'setup_completed_at') final  String? setupCompletedAt;
 final  Map<String, dynamic>? _recommendationFilters;
@override@JsonKey(name: 'recommendation_filters') Map<String, dynamic>? get recommendationFilters {
  final value = _recommendationFilters;
  if (value == null) return null;
  if (_recommendationFilters is EqualUnmodifiableMapView) return _recommendationFilters;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

/// "About me" profile customization.
@override final  String? bio;
 final  List<String>? _interests;
@override List<String>? get interests {
  final value = _interests;
  if (value == null) return null;
  if (_interests is EqualUnmodifiableListView) return _interests;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<String>? _tags;
@override List<String>? get tags {
  final value = _tags;
  if (value == null) return null;
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AppUserCopyWith<_AppUser> get copyWith => __$AppUserCopyWithImpl<_AppUser>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AppUserToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AppUser&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.name, name) || other.name == name)&&(identical(other.age, age) || other.age == age)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.username, username) || other.username == username)&&(identical(other.mfaEnabled, mfaEnabled) || other.mfaEnabled == mfaEnabled)&&(identical(other.isAdmin, isAdmin) || other.isAdmin == isAdmin)&&(identical(other.lastLogin, lastLogin) || other.lastLogin == lastLogin)&&(identical(other.backupEmail, backupEmail) || other.backupEmail == backupEmail)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.contentTone, contentTone) || other.contentTone == contentTone)&&(identical(other.locale, locale) || other.locale == locale)&&(identical(other.setupCompletedAt, setupCompletedAt) || other.setupCompletedAt == setupCompletedAt)&&const DeepCollectionEquality().equals(other._recommendationFilters, _recommendationFilters)&&(identical(other.bio, bio) || other.bio == bio)&&const DeepCollectionEquality().equals(other._interests, _interests)&&const DeepCollectionEquality().equals(other._tags, _tags));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,email,name,age,createdAt,username,mfaEnabled,isAdmin,lastLogin,backupEmail,avatarUrl,contentTone,locale,setupCompletedAt,const DeepCollectionEquality().hash(_recommendationFilters),bio,const DeepCollectionEquality().hash(_interests),const DeepCollectionEquality().hash(_tags));

@override
String toString() {
  return 'AppUser(id: $id, email: $email, name: $name, age: $age, createdAt: $createdAt, username: $username, mfaEnabled: $mfaEnabled, isAdmin: $isAdmin, lastLogin: $lastLogin, backupEmail: $backupEmail, avatarUrl: $avatarUrl, contentTone: $contentTone, locale: $locale, setupCompletedAt: $setupCompletedAt, recommendationFilters: $recommendationFilters, bio: $bio, interests: $interests, tags: $tags)';
}


}

/// @nodoc
abstract mixin class _$AppUserCopyWith<$Res> implements $AppUserCopyWith<$Res> {
  factory _$AppUserCopyWith(_AppUser value, $Res Function(_AppUser) _then) = __$AppUserCopyWithImpl;
@override @useResult
$Res call({
 String id, String email, String name, int age,@JsonKey(name: 'created_at') String createdAt, String? username,@JsonKey(name: 'mfa_enabled') bool? mfaEnabled,@JsonKey(name: 'is_admin') bool? isAdmin,@JsonKey(name: 'last_login') String? lastLogin,@JsonKey(name: 'backup_email') String? backupEmail,@JsonKey(name: 'avatar_url') String? avatarUrl,@JsonKey(name: 'content_tone') String? contentTone, String? locale,@JsonKey(name: 'setup_completed_at') String? setupCompletedAt,@JsonKey(name: 'recommendation_filters') Map<String, dynamic>? recommendationFilters, String? bio, List<String>? interests, List<String>? tags
});




}
/// @nodoc
class __$AppUserCopyWithImpl<$Res>
    implements _$AppUserCopyWith<$Res> {
  __$AppUserCopyWithImpl(this._self, this._then);

  final _AppUser _self;
  final $Res Function(_AppUser) _then;

/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? email = null,Object? name = null,Object? age = null,Object? createdAt = null,Object? username = freezed,Object? mfaEnabled = freezed,Object? isAdmin = freezed,Object? lastLogin = freezed,Object? backupEmail = freezed,Object? avatarUrl = freezed,Object? contentTone = freezed,Object? locale = freezed,Object? setupCompletedAt = freezed,Object? recommendationFilters = freezed,Object? bio = freezed,Object? interests = freezed,Object? tags = freezed,}) {
  return _then(_AppUser(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,age: null == age ? _self.age : age // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,username: freezed == username ? _self.username : username // ignore: cast_nullable_to_non_nullable
as String?,mfaEnabled: freezed == mfaEnabled ? _self.mfaEnabled : mfaEnabled // ignore: cast_nullable_to_non_nullable
as bool?,isAdmin: freezed == isAdmin ? _self.isAdmin : isAdmin // ignore: cast_nullable_to_non_nullable
as bool?,lastLogin: freezed == lastLogin ? _self.lastLogin : lastLogin // ignore: cast_nullable_to_non_nullable
as String?,backupEmail: freezed == backupEmail ? _self.backupEmail : backupEmail // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,contentTone: freezed == contentTone ? _self.contentTone : contentTone // ignore: cast_nullable_to_non_nullable
as String?,locale: freezed == locale ? _self.locale : locale // ignore: cast_nullable_to_non_nullable
as String?,setupCompletedAt: freezed == setupCompletedAt ? _self.setupCompletedAt : setupCompletedAt // ignore: cast_nullable_to_non_nullable
as String?,recommendationFilters: freezed == recommendationFilters ? _self._recommendationFilters : recommendationFilters // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,interests: freezed == interests ? _self._interests : interests // ignore: cast_nullable_to_non_nullable
as List<String>?,tags: freezed == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,
  ));
}


}

// dart format on
