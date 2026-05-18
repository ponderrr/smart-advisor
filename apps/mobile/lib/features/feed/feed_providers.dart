import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';
import 'models/feed_models.dart';
import 'services/feed_service.dart';

/// Feed data seam. Swap [InMemoryFeedService] here when a backend lands.
final feedServiceProvider =
    Provider<FeedService>((ref) => const InMemoryFeedService());

// ---------------------------------------------------------------------------
// In-memory feed state (mirrors web zustand store; no persistence)
// ---------------------------------------------------------------------------

final feedProvider =
    NotifierProvider<FeedNotifier, List<FeedPost>>(FeedNotifier.new);

class FeedNotifier extends Notifier<List<FeedPost>> {
  FeedService get _svc => ref.read(feedServiceProvider);

  @override
  List<FeedPost> build() => _svc.seed();

  void setVote(String id, int dir) =>
      state = _svc.setVote(state, id, dir);

  void addComment(String postId, String body, {String? parentId}) =>
      state = _svc.addComment(state, postId, body, parentId: parentId);

  void addPost(
    FeedCommunity community,
    String title,
    String? body, {
    FeedActivity activity = FeedActivity.shared,
    String? posterUrl,
    String? creator,
    int? year,
  }) =>
      state = _svc.addPost(
        state,
        community: community,
        title: title,
        body: body,
        activity: activity,
        posterUrl: posterUrl,
        creator: creator,
        year: year,
      );
}

/// In-memory set of followed usernames (prototype only).
final followingProvider =
    NotifierProvider<FollowingNotifier, Set<String>>(FollowingNotifier.new);

class FollowingNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => <String>{};

  /// Returns whether [username] is now followed (for the undo banner).
  bool toggle(String username) {
    final (next, nowFollowing) =
        ref.read(feedServiceProvider).toggleIn(state, username);
    state = next;
    return nowFollowing;
  }
}

/// In-memory per-comment vote, keyed `"<postId>#<commentId>"` → -1/0/1.
final commentVotesProvider =
    NotifierProvider<CommentVotesNotifier, Map<String, int>>(
        CommentVotesNotifier.new);

class CommentVotesNotifier extends Notifier<Map<String, int>> {
  @override
  Map<String, int> build() => <String, int>{};

  void setVote(String key, int dir) => state =
      ref.read(feedServiceProvider).setCommentVote(state, key, dir);
}

/// In-memory set of joined communities (prototype only).
final joinedCommunitiesProvider =
    NotifierProvider<JoinedCommunitiesNotifier, Set<FeedCommunity>>(
        JoinedCommunitiesNotifier.new);

class JoinedCommunitiesNotifier extends Notifier<Set<FeedCommunity>> {
  @override
  Set<FeedCommunity> build() => <FeedCommunity>{};

  bool toggle(FeedCommunity c) {
    final (next, nowJoined) =
        ref.read(feedServiceProvider).toggleIn(state, c);
    state = next;
    return nowJoined;
  }
}

/// Picks the user saved to their library from the feed (in-memory).
final savedProvider =
    NotifierProvider<SavedNotifier, Set<String>>(SavedNotifier.new);

class SavedNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => <String>{};

  bool toggle(String postId) {
    final (next, nowSaved) =
        ref.read(feedServiceProvider).toggleIn(state, postId);
    state = next;
    return nowSaved;
  }
}

/// Built reply tree for [postId] under the current [CommentSort] pref.
/// Faithful port of the web `useMemo(() => buildCommentTree(...))`.
final commentTreeProvider =
    Provider.family<List<FeedCommentNode>, String>((ref, postId) {
  final sort = ref.watch(feedPrefsProvider).commentSort;
  final post = ref.watch(feedProvider).where((p) => p.id == postId);
  if (post.isEmpty) return const [];
  return buildCommentTree(post.first.comments, sort);
});

// ---------------------------------------------------------------------------
// Per-device feed visibility — public/private (web use-feed-visibility.ts)
// ---------------------------------------------------------------------------

enum FeedVisibility { public, private }

class FeedVisibilityNotifier extends Notifier<FeedVisibility> {
  @override
  FeedVisibility build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return prefs?.getString(StorageKeys.prefFeedVisibility) == 'private'
        ? FeedVisibility.private
        : FeedVisibility.public;
  }

  Future<void> set(FeedVisibility v) async {
    state = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.prefFeedVisibility,
        v == FeedVisibility.private ? 'private' : 'public');
  }
}

final feedVisibilityProvider =
    NotifierProvider<FeedVisibilityNotifier, FeedVisibility>(
        FeedVisibilityNotifier.new);

// ---------------------------------------------------------------------------
// Per-device feed display prefs (web use-feed-prefs.ts JSON blob)
// ---------------------------------------------------------------------------

/// Mirrors the web `FeedPrefs`. Web `view` is `"cards"|"list"`; mobile keeps
/// a 3rd `media` view, so we store the [FeedView] name and tolerate the web
/// `"cards"`/`"list"` strings on read for cross-client compatibility.
class FeedPrefs {
  const FeedPrefs({
    this.view = FeedView.card,
    this.scope = FeedScope.friends,
    this.community, // null = "all"
    this.commentSort = CommentSort.top,
  });

  final FeedView view;
  final FeedScope scope;
  final FeedCommunity? community;
  final CommentSort commentSort;

  FeedPrefs copyWith({
    FeedView? view,
    FeedScope? scope,
    Object? community = _unset,
    CommentSort? commentSort,
  }) =>
      FeedPrefs(
        view: view ?? this.view,
        scope: scope ?? this.scope,
        community: community == _unset
            ? this.community
            : community as FeedCommunity?,
        commentSort: commentSort ?? this.commentSort,
      );

  static const _unset = Object();

  static String _viewWire(FeedView v) => switch (v) {
        // Keep web-compatible strings for cards/list; `media` is mobile-only.
        FeedView.card => 'cards',
        FeedView.compact => 'list',
        FeedView.media => 'media',
      };

  static FeedView _viewFrom(Object? v) => switch (v) {
        'cards' || 'card' => FeedView.card,
        'list' || 'compact' => FeedView.compact,
        'media' => FeedView.media,
        _ => FeedView.card,
      };

  static FeedScope _scopeFrom(Object? v) => switch (v) {
        'discover' => FeedScope.discover,
        'group' => FeedScope.group,
        _ => FeedScope.friends,
      };

  static FeedCommunity? _communityFrom(Object? v) => switch (v) {
        'movies' => FeedCommunity.movies,
        'books' => FeedCommunity.books,
        'music' => FeedCommunity.music,
        _ => null, // "all" or invalid
      };

  static CommentSort _sortFrom(Object? v) =>
      v == 'new' ? CommentSort.newest : CommentSort.top;

  Map<String, dynamic> toJson() => {
        'view': _viewWire(view),
        'scope': switch (scope) {
          FeedScope.friends => 'friends',
          FeedScope.discover => 'discover',
          FeedScope.group => 'group',
        },
        'community': community?.wire ?? 'all',
        'commentSort':
            commentSort == CommentSort.newest ? 'new' : 'top',
      };

  factory FeedPrefs.fromJson(Map<String, dynamic> j) => FeedPrefs(
        view: _viewFrom(j['view']),
        scope: _scopeFrom(j['scope']),
        community: _communityFrom(j['community']),
        commentSort: _sortFrom(j['commentSort']),
      );
}

class FeedPrefsNotifier extends Notifier<FeedPrefs> {
  @override
  FeedPrefs build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    final raw = prefs?.getString(StorageKeys.prefFeedPrefs);
    if (raw == null || raw.isEmpty) return const FeedPrefs();
    try {
      return FeedPrefs.fromJson(
          jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const FeedPrefs();
    }
  }

  Future<void> _persist(FeedPrefs next) async {
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        StorageKeys.prefFeedPrefs, jsonEncode(next.toJson()));
  }

  Future<void> setView(FeedView v) => _persist(state.copyWith(view: v));
  Future<void> setScope(FeedScope s) => _persist(state.copyWith(scope: s));
  Future<void> setCommunity(FeedCommunity? c) =>
      _persist(state.copyWith(community: c));
  Future<void> setCommentSort(CommentSort s) =>
      _persist(state.copyWith(commentSort: s));
}

final feedPrefsProvider =
    NotifierProvider<FeedPrefsNotifier, FeedPrefs>(FeedPrefsNotifier.new);
