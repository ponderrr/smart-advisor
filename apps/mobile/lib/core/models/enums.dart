import 'package:json_annotation/json_annotation.dart';

/// Mirrors the web ContentType union: "movie" | "book" | "music" | "both"
/// | "mix" (| null at the store level).
enum ContentType {
  @JsonValue('movie')
  movie,
  @JsonValue('book')
  book,
  @JsonValue('music')
  music,
  @JsonValue('both')
  both,
  @JsonValue('mix')
  mix;

  String get wire => switch (this) {
        ContentType.movie => 'movie',
        ContentType.book => 'book',
        ContentType.music => 'music',
        ContentType.both => 'both',
        ContentType.mix => 'mix',
      };

  static ContentType fromWire(String v) =>
      ContentType.values.firstWhere((e) => e.wire == v);
}

/// Question render type from the anthropic-questions Edge Function.
enum QuestionType {
  @JsonValue('single_select')
  singleSelect,
  @JsonValue('select_all')
  selectAll,
  @JsonValue('fill_in_blank')
  fillInBlank;

  String get wire => switch (this) {
        QuestionType.singleSelect => 'single_select',
        QuestionType.selectAll => 'select_all',
        QuestionType.fillInBlank => 'fill_in_blank',
      };
}

/// Recommendation kind returned by anthropic-recommendations.
enum RecType {
  @JsonValue('movie')
  movie,
  @JsonValue('book')
  book,
  @JsonValue('music')
  music;

  String get wire => name;
}

enum LibraryMedium {
  @JsonValue('movie')
  movie,
  @JsonValue('book')
  book,
  @JsonValue('music')
  music;

  String get wire => name;
}

enum LibraryStatus {
  @JsonValue('finished')
  finished,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('wishlist')
  wishlist,
  @JsonValue('dropped')
  dropped;

  String get wire => switch (this) {
        LibraryStatus.finished => 'finished',
        LibraryStatus.inProgress => 'in_progress',
        LibraryStatus.wishlist => 'wishlist',
        LibraryStatus.dropped => 'dropped',
      };
}
