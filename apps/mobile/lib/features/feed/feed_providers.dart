import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/offline_cache.dart';
import '../../core/supabase/supabase_providers.dart';
import '../notifications/notification_prefs.dart';
import 'models/feed_models.dart';
import 'services/feed_service.dart';

/// Supabase-backed feed data layer.
final feedServiceProvider = Provider<FeedService>(
    (ref) => FeedService(ref.watch(supabaseClientProvider)));

// ---------------------------------------------------------------------------
// Feed data — backend-backed (feed_posts / comments / follows / blocks / …)
// ---------------------------------------------------------------------------

/// The whole feed, newest first. Re-fetched on invalidation after a write.
/// Wrapped in the offline cache: a successful fetch refreshes the snapshot,
/// and a failure (cold launch offline / flaky network) serves the last
/// good list so the feed never lands on a hard error state.
final feedProvider =
    FutureProvider.autoDispose<List<FeedPost>>((ref) async {
  try {
    final posts = await ref.watch(feedServiceProvider).fetchFeed();
    await OfflineCache.writeList(
        'feed', posts.map((p) => p.toJson()).toList());
    return posts;
  } catch (_) {
    final cached = await OfflineCache.readList('feed');
    if (cached.isEmpty) rethrow;
    return cached.map(FeedPost.fromJson).toList();
  }
});

/// Profile ids the current user follows.
final followingProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchFollowing());

/// Profile ids the current user has blocked.
final blockedProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchBlocked());

/// Blocked profiles with display names + avatars — for the Settings list.
final blockedProfilesProvider = FutureProvider.autoDispose<
        List<({String id, String name, String? avatarUrl})>>(
    (ref) => ref.watch(feedServiceProvider).fetchBlockedProfiles());

/// Post ids the current user has saved.
final savedProvider = FutureProvider.autoDispose<List<String>>(
    (ref) => ref.watch(feedServiceProvider).fetchSaved());

/// The current user's own comment votes → { commentId: -1 | 1 }.
final commentVotesProvider = FutureProvider.autoDispose<Map<String, int>>(
    (ref) => ref.watch(feedServiceProvider).fetchMyCommentVotes());

/// The current user's own post votes → { postId: -1 | 1 }.
final postVotesProvider = FutureProvider.autoDispose<Map<String, int>>(
    (ref) => ref.watch(feedServiceProvider).fetchMyPostVotes());

/// Aggregated reactions for every post + comment currently in the feed.
/// One round-trip per kind, fanned in via [FeedService.fetchReactions].
/// Returns `({counts, mine})` keyed by target id (post OR comment uuid).
final feedReactionsProvider = FutureProvider.autoDispose<
    ({Map<String, Map<String, int>> counts, Map<String, String> mine})>(
    (ref) async {
  final posts = ref.watch(feedProvider).value ?? const <FeedPost>[];
  final postIds = [for (final p in posts) p.id];
  final commentIds = [
    for (final p in posts)
      for (final c in p.comments) c.id,
  ];
  return ref.watch(feedServiceProvider).fetchReactions(
        postIds: postIds,
        commentIds: commentIds,
      );
});

/// Reactions for one post + its comments (post-detail screen). Scoped
/// independently of [feedReactionsProvider] so deep-links don't have to
/// wait on the whole feed loading.
final postReactionsProvider = FutureProvider.autoDispose.family<
    ({Map<String, Map<String, int>> counts, Map<String, String> mine}),
    String>((ref, postId) async {
  final post = await ref.watch(singlePostProvider(postId).future);
  if (post == null) {
    return (counts: <String, Map<String, int>>{}, mine: <String, String>{});
  }
  return ref.watch(feedServiceProvider).fetchReactions(
        postIds: [post.id],
        commentIds: [for (final c in post.comments) c.id],
      );
});

/// One profile's public display data.
final feedProfileProvider = FutureProvider.autoDispose.family<
    ({
      String id,
      String name,
      String? avatarUrl,
      String? bio,
      List<String> interests,
      List<String> tags,
    })?,
    String>(
    (ref, id) => ref.watch(feedServiceProvider).fetchProfile(id));

/// Reports the current user has filed — for "Reports you've filed".
final myReportsProvider = FutureProvider.autoDispose<
    List<
        ({
          String id,
          String? reason,
          String createdAt,
          bool isPost,
          String? label,
          String status,
        })>>(
    (ref) => ref.watch(feedServiceProvider).fetchMyReports());

/// How many profiles follow a given profile.
final followerCountProvider = FutureProvider.autoDispose
    .family<int, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchFollowerCount(id));

/// Profiles a given profile follows — the "Following" friends list.
final followingProfilesProvider = FutureProvider.autoDispose.family<
    List<({String id, String name, String? avatarUrl})>, String>(
    (ref, id) => ref.watch(feedServiceProvider).fetchFollowingProfiles(id));

/// The current user's own Following list — convenience over the family
/// version above so callers (Send-to-friend sheet) don't all have to
/// thread the auth uid through.
final myFollowingProfilesProvider = FutureProvider.autoDispose<
    List<({String id, String name, String? avatarUrl})>>((ref) async {
  final uid = ref.watch(supabaseClientProvider).auth.currentUser?.id;
  if (uid == null) return const [];
  return ref.watch(feedServiceProvider).fetchFollowingProfiles(uid);
});

/// Profiles that follow a given profile — the "Followers" friends list.
final followerProfilesProvider = FutureProvider.autoDispose.family<
    List<({String id, String name, String? avatarUrl})>, String>(
    (ref, id) => ref.watch(feedServiceProvider).fetchFollowerProfiles(id));

/// Distinct recent posters — the lightweight source for "Add friends".
final suggestedPeopleProvider = FutureProvider.autoDispose<
    List<({String id, String name, String? avatarUrl})>>(
    (ref) => ref.watch(feedServiceProvider).fetchSuggestedPeople());

/// Taste-graph follow suggestions — people followed by people you
/// follow, ranked by overlap. Empty when you have no follows yet
/// (cold start): UIs that consume this should fall back to
/// [suggestedPeopleProvider] in that case.
final followSuggestionsProvider = FutureProvider.autoDispose<
    List<({String id, String name, String? avatarUrl, int mutual})>>(
    (ref) => ref.watch(feedServiceProvider).fetchFollowSuggestions());

/// People matching a search query (name OR @username), capped at 30.
final searchProfilesProvider = FutureProvider.autoDispose.family<
    List<({String id, String name, String? username, String? avatarUrl})>,
    String>((ref, q) => ref.watch(feedServiceProvider).searchProfiles(q));

/// Posts matching a search query (title OR body), capped at 30.
final searchPostsProvider = FutureProvider.autoDispose.family<
    List<
        ({
          String id,
          String title,
          String? body,
          String? posterUrl,
          FeedCommunity community,
          String author,
          String authorId,
        })>,
    String>((ref, q) => ref.watch(feedServiceProvider).searchPosts(q));

/// Whether a profile's library is publicly visible on their profile.
final libraryPublicProvider =
    FutureProvider.autoDispose.family<bool, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchLibraryPublic(id));

/// Posts authored by a given profile.
final userPostsProvider = FutureProvider.autoDispose
    .family<List<FeedPost>, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchUserPosts(id));

/// A single post by id — fast path for the post-detail screen so deep
/// links and admin "Open post" jumps don't have to wait for the entire
/// feed to load. `null` if the post no longer exists.
final singlePostProvider =
    FutureProvider.autoDispose.family<FeedPost?, String>(
        (ref, id) => ref.watch(feedServiceProvider).fetchPostById(id));

/// Server notifications (feed_notifications), with muted kinds
/// filtered out so the bell badge and inbox match the toggles in
/// Settings → Notifications. Polled on app resume + when the inbox
/// screen mounts; no Realtime subscription.
final feedNotificationsProvider =
    FutureProvider.autoDispose<List<FeedNotification>>((ref) async {
  final list = await ref.watch(feedServiceProvider).fetchNotifications();
  final muted = ref.watch(mutedNotificationKindsProvider);
  if (muted.isEmpty) return list;
  return [for (final n in list) if (!muted.contains(n.kind)) n];
});

/// Unread server-notification count — used by the feed-header bell
/// alongside the local-only count. Reads through
/// [feedNotificationsProvider] so a single fetch backs both surfaces.
final feedNotificationsUnreadCountProvider = Provider.autoDispose<int>((ref) {
  final list = ref.watch(feedNotificationsProvider).value ??
      const <FeedNotification>[];
  return list.where((n) => !n.isRead).length;
});

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
    int? rating,
  }) async {
    await _svc.createPost(
      community: community,
      title: title,
      body: body,
      activity: activity,
      posterUrl: posterUrl,
      creator: creator,
      year: year,
      rating: rating,
    );
    _ref.invalidate(feedProvider);
  }

  Future<void> deletePost(String postId) async {
    await _svc.deletePost(postId);
    _ref.invalidate(feedProvider);
    _ref.invalidate(userPostsProvider);
    _ref.invalidate(singlePostProvider);
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
    int? rating,
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
      rating: rating,
    );
    _ref.invalidate(feedProvider);
    _ref.invalidate(userPostsProvider);
    _ref.invalidate(singlePostProvider);
  }

  Future<void> reportPost(String postId, {String? reason}) async {
    await _svc.reportPost(postId, reason: reason);
    _ref.invalidate(myReportsProvider);
  }

  Future<void> reportComment(String commentId, {String? reason}) async {
    await _svc.reportComment(commentId, reason: reason);
    _ref.invalidate(myReportsProvider);
  }

  Future<void> addComment(String postId, String body,
      {String? parentId}) async {
    await _svc.createComment(postId, body, parentId);
    _ref.invalidate(feedProvider);
    _ref.invalidate(singlePostProvider);
  }

  Future<void> deleteComment(String commentId) async {
    await _svc.deleteComment(commentId);
    _ref.invalidate(feedProvider);
    _ref.invalidate(singlePostProvider);
  }

  Future<void> updateComment(String commentId, String body) async {
    await _svc.updateComment(commentId, body);
    _ref.invalidate(feedProvider);
    _ref.invalidate(singlePostProvider);
  }

  Future<void> setCommentVote(String commentId, int dir) async {
    await _svc.setCommentVote(commentId, dir);
    _ref.invalidate(feedProvider);
    _ref.invalidate(commentVotesProvider);
    _ref.invalidate(singlePostProvider);
  }

  Future<void> setPostVote(String postId, int dir) async {
    await _svc.setPostVote(postId, dir);
    _ref.invalidate(feedProvider);
    _ref.invalidate(postVotesProvider);
    _ref.invalidate(singlePostProvider);
  }

  /// Sets (or clears with [emoji] = null) the current user's reaction
  /// on a post or comment, then refreshes the reaction providers so
  /// the bar updates without waiting for the next poll.
  Future<void> setReaction({
    required String targetKind,
    required String targetId,
    String? emoji,
  }) async {
    await _svc.setReaction(
      targetKind: targetKind,
      targetId: targetId,
      emoji: emoji,
    );
    _ref.invalidate(feedReactionsProvider);
    _ref.invalidate(postReactionsProvider);
  }

  /// Sends a post to another user as a "have you seen this" pick. The
  /// AFTER-INSERT trigger fans this out as a feed_notifications row on
  /// the recipient — no client-side notification provider to invalidate.
  Future<void> sendPick({
    required String postId,
    required String recipientId,
    String? message,
  }) =>
      _svc.sendPick(
          postId: postId, recipientId: recipientId, message: message);

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
    _ref.invalidate(singlePostProvider);
    // Suggested people, friends lists, and the post-author profile
    // tile all need to refetch — the blocked user must drop off
    // these surfaces immediately.
    _ref.invalidate(suggestedPeopleProvider);
    _ref.invalidate(followingProfilesProvider);
    _ref.invalidate(followerProfilesProvider);
  }

  /// Admin: change a report's moderation status (open / reviewed /
  /// dismissed). Requires `profiles.is_admin = TRUE` — server-side RLS
  /// rejects everyone else.
  Future<void> setReportStatus(String reportId, String status) async {
    await _svc.setReportStatus(reportId, status);
  }

  Future<void> markNotificationRead(String id) async {
    await _svc.markNotificationRead(id);
    _ref.invalidate(feedNotificationsProvider);
  }

  Future<void> markAllNotificationsRead() async {
    await _svc.markAllNotificationsRead();
    _ref.invalidate(feedNotificationsProvider);
  }

  Future<void> deleteNotification(String id) async {
    await _svc.deleteNotification(id);
    _ref.invalidate(feedNotificationsProvider);
  }

  Future<void> clearAllNotifications() async {
    await _svc.clearAllNotifications();
    _ref.invalidate(feedNotificationsProvider);
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
    this.sort = FeedSort.hot,
    this.commentSort = CommentSort.top,
  });

  final FeedView view;
  final FeedScope scope;
  final FeedCommunity? community;
  /// Reddit-style sort axis across the visible feed (web "trending/new/top").
  final FeedSort sort;
  final CommentSort commentSort;

  FeedPrefs copyWith({
    FeedView? view,
    FeedScope? scope,
    Object? community = _unset,
    FeedSort? sort,
    CommentSort? commentSort,
  }) =>
      FeedPrefs(
        view: view ?? this.view,
        scope: scope ?? this.scope,
        community: community == _unset
            ? this.community
            : community as FeedCommunity?,
        sort: sort ?? this.sort,
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

  /// Web wires sort as `trending|new|top`; mobile mirrors with
  /// hot|newest|top under the hood.
  static FeedSort _feedSortFrom(Object? v) => switch (v) {
        'new' => FeedSort.newest,
        'top' => FeedSort.top,
        _ => FeedSort.hot,
      };

  static String _feedSortWire(FeedSort s) => switch (s) {
        FeedSort.hot => 'trending',
        FeedSort.newest => 'new',
        FeedSort.top => 'top',
      };

  Map<String, dynamic> toJson() => {
        'view': _viewWire(view),
        'scope': switch (scope) {
          FeedScope.friends => 'friends',
          FeedScope.discover => 'discover',
          FeedScope.group => 'group',
        },
        'community': community?.wire ?? 'all',
        'sort': _feedSortWire(sort),
        'commentSort':
            commentSort == CommentSort.newest ? 'new' : 'top',
      };

  factory FeedPrefs.fromJson(Map<String, dynamic> j) => FeedPrefs(
        view: _viewFrom(j['view']),
        scope: _scopeFrom(j['scope']),
        community: _communityFrom(j['community']),
        sort: _feedSortFrom(j['sort'] ?? 'trending'),
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
  Future<void> setSort(FeedSort s) => _persist(state.copyWith(sort: s));
}

final feedPrefsProvider =
    NotifierProvider<FeedPrefsNotifier, FeedPrefs>(FeedPrefsNotifier.new);
