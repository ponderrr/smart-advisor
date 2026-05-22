import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';
import 'models/feed_models.dart';
import 'services/feed_service.dart';

/// Supabase-backed feed data layer.
final feedServiceProvider = Provider<FeedService>(
    (ref) => FeedService(ref.watch(supabaseClientProvider)));

// ---------------------------------------------------------------------------
// Feed data — backend-backed (feed_posts / comments / follows / blocks / …)
// ---------------------------------------------------------------------------

/// The whole feed, newest first. Re-fetched on invalidation after a write.
final feedProvider = FutureProvider.autoDispose<List<FeedPost>>(
    (ref) => ref.watch(feedServiceProvider).fetchFeed());

/// Profile ids the current user follows.
final followingProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchFollowing());

/// Profile ids the current user has blocked.
final blockedProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchBlocked());

/// Blocked profiles with display names — for the Settings list.
final blockedProfilesProvider =
    FutureProvider.autoDispose<List<({String id, String name})>>(
        (ref) => ref.watch(feedServiceProvider).fetchBlockedProfiles());

/// Post ids the current user has saved.
final savedProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchSaved());

/// The current user's own comment votes → { commentId: -1 | 1 }.
final commentVotesProvider = FutureProvider.autoDispose<Map<String, int>>(
    (ref) => ref.watch(feedServiceProvider).fetchMyCommentVotes());

/// One profile's public display data.
final feedProfileProvider = FutureProvider.autoDispose
    .family<({String id, String name, String? avatarUrl})?, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchProfile(id));

/// How many profiles follow a given profile.
final followerCountProvider = FutureProvider.autoDispose
    .family<int, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchFollowerCount(id));

/// Profiles a given profile follows — the "Following" friends list.
final followingProfilesProvider = FutureProvider.autoDispose.family<
    List<({String id, String name, String? avatarUrl})>, String>(
    (ref, id) => ref.watch(feedServiceProvider).fetchFollowingProfiles(id));

/// Profiles that follow a given profile — the "Followers" friends list.
final followerProfilesProvider = FutureProvider.autoDispose.family<
    List<({String id, String name, String? avatarUrl})>, String>(
    (ref, id) => ref.watch(feedServiceProvider).fetchFollowerProfiles(id));

/// Whether a profile's library is publicly visible on their profile.
final libraryPublicProvider =
    FutureProvider.autoDispose.family<bool, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchLibraryPublic(id));

/// Posts authored by a given profile.
final userPostsProvider = FutureProvider.autoDispose
    .family<List<FeedPost>, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchUserPosts(id));

/// The feed with blocked authors filtered out — posts AND comments authored
/// by a blocked profile are dropped. Use this everywhere a user-facing feed
/// list is rendered.
final visibleFeedProvider = Provider.autoDispose<AsyncValue<List<FeedPost>>>(
    (ref) {
  final feed = ref.watch(feedProvider);
  final blocked = ref.watch(blockedProvider).value ?? const <String>[];
  return feed.whenData((posts) {
    if (blocked.isEmpty) return posts;
    final set = blocked.toSet();
    return [
      for (final p in posts)
        if (!set.contains(p.authorId))
          p.copyWith(comments: [
            for (final c in p.comments)
              if (!set.contains(c.authorId)) c,
          ]),
    ];
  });
});

/// Built reply tree for [postId] under the current [CommentSort] pref.
final commentTreeProvider =
    Provider.autoDispose.family<List<FeedCommentNode>, String>((ref, postId) {
  final sort = ref.watch(feedPrefsProvider).commentSort;
  final posts = ref.watch(visibleFeedProvider).value ?? const <FeedPost>[];
  final post = posts.where((p) => p.id == postId);
  if (post.isEmpty) return const [];
  return buildCommentTree(post.first.comments, sort);
});

/// Feed write actions — each performs the Supabase mutation then invalidates
/// the affected query providers so watchers re-fetch.
class FeedActions {
  FeedActions(this._ref);
  final Ref _ref;
  FeedService get _svc => _ref.read(feedServiceProvider);

  Future<void> createPost({
    required FeedCommunity community,
    required String title,
    String? body,
    FeedActivity activity = FeedActivity.shared,
    String? posterUrl,
    String? creator,
    int? year,
  }) async {
    await _svc.createPost(
      community: community,
      title: title,
      body: body,
      activity: activity,
      posterUrl: posterUrl,
      creator: creator,
      year: year,
    );
    _ref.invalidate(feedProvider);
  }

  Future<void> deletePost(String postId) async {
    await _svc.deletePost(postId);
    _ref.invalidate(feedProvider);
    _ref.invalidate(userPostsProvider);
  }

  Future<void> updatePost({
    required String postId,
    required FeedCommunity community,
    required FeedActivity activity,
    required String title,
    String? body,
    String? posterUrl,
    String? creator,
    int? year,
  }) async {
    await _svc.updatePost(
      postId: postId,
      community: community,
      activity: activity,
      title: title,
      body: body,
      posterUrl: posterUrl,
      creator: creator,
      year: year,
    );
    _ref.invalidate(feedProvider);
    _ref.invalidate(userPostsProvider);
  }

  Future<void> reportPost(String postId, {String? reason}) =>
      _svc.reportPost(postId, reason: reason);

  Future<void> reportComment(String commentId, {String? reason}) =>
      _svc.reportComment(commentId, reason: reason);

  Future<void> addComment(String postId, String body,
      {String? parentId}) async {
    await _svc.createComment(postId, body, parentId);
    _ref.invalidate(feedProvider);
  }

  Future<void> deleteComment(String commentId) async {
    await _svc.deleteComment(commentId);
    _ref.invalidate(feedProvider);
  }

  Future<void> setCommentVote(String commentId, int dir) async {
    await _svc.setCommentVote(commentId, dir);
    _ref.invalidate(feedProvider);
    _ref.invalidate(commentVotesProvider);
  }

  /// Returns the new following state (for undo banners).
  Future<bool> toggleFollow(String followeeId) async {
    final now = await _svc.toggleFollow(followeeId);
    _ref.invalidate(followingProvider);
    _ref.invalidate(followerCountProvider);
    _ref.invalidate(followingProfilesProvider);
    _ref.invalidate(followerProfilesProvider);
    return now;
  }

  /// Returns the new saved state.
  Future<bool> toggleSave(String postId) async {
    final now = await _svc.toggleSave(postId);
    _ref.invalidate(savedProvider);
    return now;
  }

  Future<void> block(String blockedId) async {
    await _svc.blockUser(blockedId);
    _ref.invalidate(blockedProvider);
    _ref.invalidate(blockedProfilesProvider);
    _ref.invalidate(followingProvider);
  }

  Future<void> unblock(String blockedId) async {
    await _svc.unblockUser(blockedId);
    _ref.invalidate(blockedProvider);
    _ref.invalidate(blockedProfilesProvider);
  }

  /// Sets the current user's library visibility (profile pages).
  Future<void> setLibraryPublic(bool value) async {
    await _svc.setMyLibraryPublic(value);
    _ref.invalidate(libraryPublicProvider);
  }
}

final feedActionsProvider = Provider<FeedActions>(FeedActions.new);

/// In-memory set of joined communities — a per-session prototype toggle
/// (communities are just content lanes; there's no server table for it).
final joinedCommunitiesProvider =
    NotifierProvider<JoinedCommunitiesNotifier, Set<FeedCommunity>>(
        JoinedCommunitiesNotifier.new);

class JoinedCommunitiesNotifier extends Notifier<Set<FeedCommunity>> {
  @override
  Set<FeedCommunity> build() => <FeedCommunity>{};

  bool toggle(FeedCommunity c) {
    final next = {...state};
    final nowJoined = !next.contains(c);
    if (nowJoined) {
      next.add(c);
    } else {
      next.remove(c);
    }
    state = next;
    return nowJoined;
  }
}

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
