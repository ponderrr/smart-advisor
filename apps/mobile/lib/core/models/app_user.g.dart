// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppUser _$AppUserFromJson(Map<String, dynamic> json) => _AppUser(
  id: json['id'] as String,
  email: json['email'] as String,
  name: json['name'] as String,
  age: (json['age'] as num).toInt(),
  createdAt: json['created_at'] as String,
  username: json['username'] as String?,
  mfaEnabled: json['mfa_enabled'] as bool?,
  lastLogin: json['last_login'] as String?,
  backupEmail: json['backup_email'] as String?,
  avatarUrl: json['avatar_url'] as String?,
  contentTone: json['content_tone'] as String?,
  locale: json['locale'] as String?,
  setupCompletedAt: json['setup_completed_at'] as String?,
  recommendationFilters:
      json['recommendation_filters'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$AppUserToJson(_AppUser instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'name': instance.name,
  'age': instance.age,
  'created_at': instance.createdAt,
  'username': instance.username,
  'mfa_enabled': instance.mfaEnabled,
  'last_login': instance.lastLogin,
  'backup_email': instance.backupEmail,
  'avatar_url': instance.avatarUrl,
  'content_tone': instance.contentTone,
  'locale': instance.locale,
  'setup_completed_at': instance.setupCompletedAt,
  'recommendation_filters': instance.recommendationFilters,
};
