import 'package:freezed_annotation/freezed_annotation.dart';

part 'recommendation.freezed.dart';
part 'recommendation.g.dart';

/// Persisted recommendation row (recommendations table) — mirrors the web
/// Recommendation interface. `type` and `content_type` are kept as raw
/// strings: content_type spans "movie|book|music|both|mix" and stays a
/// string to match the DB column exactly.
@freezed
abstract class Recommendation with _$Recommendation {
  const factory Recommendation({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    required String type,
    required String title,
    @Default(<String>[]) List<String> genres,
    @JsonKey(name: 'is_favorited') @Default(false) bool isFavorited,
    @JsonKey(name: 'content_type') required String contentType,
    @JsonKey(name: 'created_at') required String createdAt,
    String? director,
    String? author,
    String? artist,
    int? year,
    num? rating,
    @JsonKey(name: 'poster_url') String? posterUrl,
    @JsonKey(name: 'preview_url') String? previewUrl,
    String? explanation,
    String? description,
    @JsonKey(name: 'match_score') num? matchScore,
  }) = _Recommendation;

  factory Recommendation.fromJson(Map<String, dynamic> json) =>
      _$RecommendationFromJson(json);
}
