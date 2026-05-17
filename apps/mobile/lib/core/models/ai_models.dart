import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_models.freezed.dart';
part 'ai_models.g.dart';

/// One item from the anthropic-recommendations Edge Function response array.
/// Shape: {type, title, description, explanation, genres, year,
/// director?, author?, artist?, rating, match_score}.
@freezed
abstract class AiRecommendationItem with _$AiRecommendationItem {
  const factory AiRecommendationItem({
    required String type,
    required String title,
    required String description,
    required String explanation,
    @Default(<String>[]) List<String> genres,
    required int year,
    required num rating,
    @JsonKey(name: 'match_score') required num matchScore,
    String? director,
    String? author,
    String? artist,
  }) = _AiRecommendationItem;

  factory AiRecommendationItem.fromJson(Map<String, dynamic> json) =>
      _$AiRecommendationItemFromJson(json);
}

/// Grouped result returned by ai-service.generateRecommendations (web
/// RecommendationData).
@freezed
abstract class RecommendationData with _$RecommendationData {
  const factory RecommendationData({
    AiRecommendationItem? movieRecommendation,
    AiRecommendationItem? bookRecommendation,
    AiRecommendationItem? musicRecommendation,
  }) = _RecommendationData;

  /// Groups the anthropic-recommendations response array by `type`, taking
  /// the first of each. Pure, so the contract is unit-testable without a
  /// network round-trip.
  factory RecommendationData.fromItems(List<AiRecommendationItem> items) {
    AiRecommendationItem? first(String t) {
      for (final i in items) {
        if (i.type == t) return i;
      }
      return null;
    }

    return RecommendationData(
      movieRecommendation: first('movie'),
      bookRecommendation: first('book'),
      musicRecommendation: first('music'),
    );
  }
}

/// Error classification driving retry policy (web AIErrorKind).
enum AiErrorKind { overloaded, auth, network, generic }

class AiServiceException implements Exception {
  AiServiceException(this.kind, this.message);

  final AiErrorKind kind;
  final String message;

  @override
  String toString() => 'AiServiceException($kind): $message';
}
