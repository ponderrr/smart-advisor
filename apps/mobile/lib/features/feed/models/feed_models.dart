import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../ui/ui.dart';

part 'feed_models.freezed.dart';
part 'feed_models.g.dart';

/// In-memory taste-graph feed models — a faithful port of the web
/// `src/features/feed` types/store. Nothing here is networked or persisted
/// (SharedPreferences holds only the per-device prefs/visibility). The shape
/// maps cleanly onto future Supabase tables (follows / feed posts / saves /
/// comments) when a backend is wired — hence the snake_case [JsonKey]s so a
/// swap is mechanical.

// ---------------------------------------------------------------------------
// Enums (ported verbatim from the monolith, with their extensions)
// ---------------------------------------------------------------------------

enum FeedCommunity {
  @JsonValue('movies')
  movies,
  @JsonValue('books')
  books,
  @JsonValue('music')
  music,
}

extension FeedCommunityX on FeedCommunity {
  String get wire => switch (this) {
        FeedCommunity.movies => 'movies',
        FeedCommunity.books => 'books',
        FeedCommunity.music => 'music',
      };
  String get label => switch (this) {
        FeedCommunity.movies => 'Movies',
        FeedCommunity.books => 'Books',
        FeedCommunity.music => 'Music',
      };
  String get tag => switch (this) {
        FeedCommunity.movies => 'r/movies',
        FeedCommunity.books => 'r/books',
        FeedCommunity.music => 'r/music',
      };
  ContentAccentName get accent => switch (this) {
        FeedCommunity.movies => ContentAccentName.amber,
        FeedCommunity.books => ContentAccentName.emerald,
        FeedCommunity.music => ContentAccentName.rose,
      };
  IconData get icon => switch (this) {
        FeedCommunity.movies => Icons.movie_outlined,
        FeedCommunity.books => Icons.menu_book_outlined,
        FeedCommunity.music => Icons.music_note_outlined,
      };
  String get blurb => switch (this) {
        FeedCommunity.movies =>
          'Films worth your evening — recs, reviews & hot takes.',
        FeedCommunity.books =>
          'What to read next, page-turner debates & shelf pics.',
        FeedCommunity.music =>
          'Albums on repeat, deep cuts & listening parties.',
      };
}

/// Wire → enum (route param decoding). Top-level (not a static extension
/// member, which Dart can't expose as `FeedCommunity.fromWire`).
FeedCommunity feedCommunityFromWire(String v) =>
    FeedCommunity.values.firstWhere((e) => e.wire == v);

/// What a friend did with a pick — drives the activity line on each card.
enum FeedActivity {
  @JsonValue('finished')
  finished,
  @JsonValue('added')
  added,
  @JsonValue('rated')
  rated,
  @JsonValue('shared')
  shared,
  @JsonValue('group')
  group,
}

extension FeedActivityX on FeedActivity {
  String get verb => switch (this) {
        FeedActivity.finished => 'finished',
        FeedActivity.added => 'added to library',
        FeedActivity.rated => 'rated',
        FeedActivity.shared => 'shared',
        FeedActivity.group => 'group pick',
      };
  IconData get icon => switch (this) {
        FeedActivity.finished => Icons.check_circle_outline,
        FeedActivity.added => Icons.bookmark_added_outlined,
        FeedActivity.rated => Icons.star_outline,
        FeedActivity.shared => Icons.ios_share,
        FeedActivity.group => Icons.groups_outlined,
      };
}

enum FeedSort { hot, newest, top }

/// Feed scope: people you follow, discovery suggestions, or your group
/// sessions.
enum FeedScope {
  @JsonValue('friends')
  friends,
  @JsonValue('discover')
  discover,
  @JsonValue('group')
  group,
}

/// How each post is laid out — mirrors Reddit's Card / Compact / Media views.
/// Web only persists Cards/List; the mobile prototype keeps a 3rd `media`
/// view (an intentional prototype extra — see brief).
enum FeedView { card, compact, media }

/// Thread comment ordering (web `CommentSort`).
enum CommentSort {
  @JsonValue('top')
  top,
  @JsonValue('new')
  newest,
}

/// Three-way pick rating, shared with the library's logging UI
/// (1 = Nope, 2 = Meh, 3 = Loved).
const kRatingEmoji = <int, String>{1: '👎', 2: '😐', 3: '👍'};
const kRatingWord = <int, String>{1: 'Nope', 2: 'Meh', 3: 'Loved'};

/// Selectable post flairs and their accent colors.
const kFeedFlairs = <String, Color>{
  'Discussion': Tw.violet500,
  'Recommendation': Tw.emerald500,
  'Review': Tw.amber500,
  'Question': Tw.indigo500,
  'Hot take': Tw.rose500,
};

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

@freezed
abstract class FeedComment with _$FeedComment {
  const FeedComment._();

  const factory FeedComment({
    required String id,

    /// Author's profile id (uuid).
    @JsonKey(name: 'author_id') required String authorId,

    /// Display name — `profiles.name`, joined at fetch time.
    required String author,
    @JsonKey(name: 'author_avatar_url') String? authorAvatarUrl,
    required String body,
    @JsonKey(name: 'age_hours') required int ageHours,
    @Default(0) int score,

    /// Reddit/Lemmy-style threading. null = top-level comment.
    @JsonKey(name: 'parent_id') String? parentId,
  }) = _FeedComment;

  factory FeedComment.fromJson(Map<String, dynamic> json) =>
      _$FeedCommentFromJson(json);
}

/// A comment plus its nested replies — built client-side from the flat list.
class FeedCommentNode {
  FeedCommentNode(this.comment, this.replies);
  final FeedComment comment;
  final List<FeedCommentNode> replies;

  String get id => comment.id;
  String get authorId => comment.authorId;
  String get author => comment.author;
  String? get authorAvatarUrl => comment.authorAvatarUrl;
  String get body => comment.body;
  int get ageHours => comment.ageHours;
  int get score => comment.score;
  String? get parentId => comment.parentId;
}

@freezed
abstract class FeedPost with _$FeedPost {
  const FeedPost._();

  const factory FeedPost({
    required String id,
    required FeedCommunity community,

    /// Author's profile id (uuid).
    @JsonKey(name: 'author_id') required String authorId,

    /// Display name — `profiles.name`, joined at fetch time.
    required String author,
    @JsonKey(name: 'author_avatar_url') String? authorAvatarUrl,
    required String title,
    @JsonKey(name: 'age_hours') required int ageHours,
    @Default(FeedActivity.shared) FeedActivity activity,

    /// Taste overlap with the current user, 0–100 (in-memory mock).
    @JsonKey(name: 'taste_match') @Default(0) int tasteMatch,
    String? body,

    /// Optional tag (Discussion / Recommendation / etc.).
    String? flair,
    @JsonKey(name: 'poster_url') String? posterUrl,
    String? creator,
    int? year,

    /// Three-way pick rating (1 Nope / 2 Meh / 3 Loved). Only set for
    /// `rated` posts; null for every other activity.
    int? rating,
    @Default(false) bool square,
    @JsonKey(name: 'base_score') @Default(0) int baseScore,

    /// -1, 0 or 1 — the current user's vote (in-memory only).
    @Default(0) int vote,
    @Default(<FeedComment>[]) List<FeedComment> comments,
  }) = _FeedPost;

  factory FeedPost.fromJson(Map<String, dynamic> json) =>
      _$FeedPostFromJson(json);

  int get score => baseScore + vote;

  /// Cheap "hot" rank: score decayed by age (Reddit-ish, not exact).
  double get hotRank => score / (1 + ageHours / 12.0);

  /// Activity verb for the card's byline, with the rating emoji appended
  /// for rated posts — e.g. "rated 👍". Plain verb when there's no rating.
  String get activityLabel =>
      activity == FeedActivity.rated && rating != null
          ? 'rated ${kRatingEmoji[rating] ?? ''}'.trimRight()
          : activity.verb;
}

// ---------------------------------------------------------------------------
// Comment tree (faithful port of web buildCommentTree)
// ---------------------------------------------------------------------------

/// Turn the flat comment list into a reply tree. [sort] controls every
/// level: `top` = highest score first, `new` = most recent first.
List<FeedCommentNode> buildCommentTree(
  List<FeedComment> flat, [
  CommentSort sort = CommentSort.top,
]) {
  final nodes = <String, FeedCommentNode>{
    for (final c in flat) c.id: FeedCommentNode(c, <FeedCommentNode>[]),
  };
  final roots = <FeedCommentNode>[];
  // Preserve insertion order while wiring children, mirroring the web's
  // Map iteration order (insertion order in both JS and Dart).
  for (final c in flat) {
    final node = nodes[c.id]!;
    final parent = c.parentId == null ? null : nodes[c.parentId];
    if (parent != null) {
      parent.replies.add(node);
    } else {
      roots.add(node);
    }
  }
  int cmp(FeedCommentNode a, FeedCommentNode b) {
    if (sort == CommentSort.newest) return a.ageHours - b.ageHours;
    final byScore = b.score - a.score;
    return byScore != 0 ? byScore : a.ageHours - b.ageHours;
  }

  void sortLevel(List<FeedCommentNode> list) {
    list.sort(cmp);
    for (final n in list) {
      sortLevel(n.replies);
    }
  }

  sortLevel(roots);
  return roots;
}

/// Total descendant count under [n] (used for the collapsed "N more" badge).
int countDescendants(FeedCommentNode n) =>
    n.replies.fold(0, (acc, r) => acc + 1 + countDescendants(r));

// ---------------------------------------------------------------------------
// Deterministic mock follower count (ported from web `mockFollowerCount`)
// ---------------------------------------------------------------------------

/// Deterministic mock follower count so the UI has stable numbers without a
/// backend (replace with a real count when follows are persisted).
int mockFollowerCount(String author) {
  var h = 0;
  for (var i = 0; i < author.length; i += 1) {
    h = (h * 31 + author.codeUnitAt(i)) & 0xFFFFFFFF;
  }
  return 40 + (h % 960);
}
