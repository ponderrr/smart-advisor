import 'package:freezed_annotation/freezed_annotation.dart';

import 'enums.dart';

part 'library_item.freezed.dart';
part 'library_item.g.dart';

/// user_library row. `rating` is 1|2|3 in the web type; kept as int? here and
/// validated at the service boundary.
@freezed
abstract class LibraryItem with _$LibraryItem {
  const factory LibraryItem({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    required LibraryMedium medium,
    required String title,
    required String? creator,
    required int? year,
    @JsonKey(name: 'poster_url') required String? posterUrl,
    required LibraryStatus status,
    required int? rating,
    required String? reaction,
    @JsonKey(name: 'source_recommendation_id')
    required String? sourceRecommendationId,
    @JsonKey(name: 'logged_at') required String loggedAt,
    @JsonKey(name: 'finished_at') required String? finishedAt,
    @JsonKey(name: 'updated_at') required String updatedAt,
  }) = _LibraryItem;

  factory LibraryItem.fromJson(Map<String, dynamic> json) =>
      _$LibraryItemFromJson(json);
}

@freezed
abstract class LogLibraryInput with _$LogLibraryInput {
  const factory LogLibraryInput({
    required LibraryMedium medium,
    required String title,
    String? creator,
    int? year,
    @JsonKey(name: 'poster_url') String? posterUrl,
    LibraryStatus? status,
    int? rating,
    String? reaction,
    @JsonKey(name: 'source_recommendation_id') String? sourceRecommendationId,
  }) = _LogLibraryInput;

  factory LogLibraryInput.fromJson(Map<String, dynamic> json) =>
      _$LogLibraryInputFromJson(json);
}

@freezed
abstract class UpdateLibraryInput with _$UpdateLibraryInput {
  const factory UpdateLibraryInput({
    LibraryStatus? status,
    int? rating,
    String? reaction,
  }) = _UpdateLibraryInput;

  factory UpdateLibraryInput.fromJson(Map<String, dynamic> json) =>
      _$UpdateLibraryInputFromJson(json);
}
