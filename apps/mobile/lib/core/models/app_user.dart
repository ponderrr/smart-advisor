import 'package:freezed_annotation/freezed_annotation.dart';

part 'app_user.freezed.dart';
part 'app_user.g.dart';

/// profiles row (web `User`). Named AppUser to avoid clashing with Supabase's
/// auth `User`.
@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    required String id,
    required String email,
    required String name,
    required int age,
    @JsonKey(name: 'created_at') required String createdAt,
    String? username,
    @JsonKey(name: 'mfa_enabled') bool? mfaEnabled,
    @JsonKey(name: 'last_login') String? lastLogin,
    @JsonKey(name: 'backup_email') String? backupEmail,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
    @JsonKey(name: 'content_tone') String? contentTone,
    String? locale,
    @JsonKey(name: 'setup_completed_at') String? setupCompletedAt,
    @JsonKey(name: 'recommendation_filters')
    Map<String, dynamic>? recommendationFilters,

    /// "About me" profile customization.
    String? bio,
    List<String>? interests,
    List<String>? tags,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) =>
      _$AppUserFromJson(json);
}
