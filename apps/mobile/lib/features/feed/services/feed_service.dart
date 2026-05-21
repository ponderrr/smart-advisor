import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/feed_models.dart';

/// Supabase-backed feed data layer — reads and writes against the
/// feed_posts / feed_comments / feed_follows / feed_blocks / feed_saves /
/// feed_comment_votes tables. Replaces the old in-memory prototype.
///
/// Display names + avatars are joined from `profiles`; comment scores are
/// aggregated client-side from feed_comment_votes.
class FeedService {
  FeedService(this._c);
  final SupabaseClient _c;

  static const _postSelect = '''
    id, community, activity, title, body, poster_url, creator, year,
    base_score, created_at,
    author:profiles!feed_posts_user_id_fkey ( id, name, avatar_url ),
    feed_comments (
      id, body, parent_id, created_at,
      author:profiles!feed_comments_user_id_fkey ( id, name, avatar_url )
    )
  ''';

  int _hoursSince(String iso) {
    final ms = DateTime.now().difference(DateTime.parse(iso)).inMilliseconds;
    return ms < 0 ? 0 : ms ~/ 3600000;
  }

  FeedActivity _activity(String wire) => switch (wire) {
        'finished' => FeedActivity.finished,
        'added' => FeedActivity.added,
        'rated' => FeedActivity.rated,
        'group' => FeedActivity.group,
        _ => FeedActivity.shared,
      };

  /// PostgREST returns a to-one embed as an object; tolerate an array too.
  Map<String, dynamic>? _embed(dynamic v) {
    if (v is Map) return Map<String, dynamic>.from(v);
    if (v is List && v.isNotEmpty && v.first is Map) {
      return Map<String, dynamic>.from(v.first as Map);
    }
    return null;
  }

  FeedComment _mapComment(Map<String, dynamic> c, int score) {
    final author = _embed(c['author']);
    return FeedComment(
      id: c['id'] as String,
      authorId: (author?['id'] as String?) ?? '',
      author: (author?['name'] as String?) ?? 'Someone',
      authorAvatarUrl: author?['avatar_url'] as String?,
      body: (c['body'] as String?) ?? '',
      ageHours: _hoursSince(c['created_at'] as String),
      score: score,
      parentId: c['parent_id'] as String?,
    );
  }

  FeedPost _mapPost(Map<String, dynamic> p, Map<String, int> scores) {
    final author = _embed(p['author']);
    final community = feedCommunityFromWire(p['community'] as String);
    final comments = ((p['feed_comments'] as List?) ?? const [])
        .map((c) => _mapComment(
            Map<String, dynamic>.from(c as Map),
            scores[(c)['id']] ?? 0))
        .toList();
    return FeedPost(
      id: p['id'] as String,
      community: community,
      authorId: (author?['id'] as String?) ?? '',
      author: (author?['name'] as String?) ?? 'Someone',
      authorAvatarUrl: author?['avatar_url'] as String?,
      title: (p['title'] as String?) ?? '',
      ageHours: _hoursSince(p['created_at'] as String),
      activity: _activity(p['activity'] as String),
      body: p['body'] as String?,
      posterUrl: p['poster_url'] as String?,
      creator: p['creator'] as String?,
      year: p['year'] as int?,
      square: community == FeedCommunity.music,
      baseScore: (p['base_score'] as int?) ?? 0,
      comments: comments,
    );
  }

  /// Sums feed_comment_votes for the given comment ids → { id: score }.
  Future<Map<String, int>> _commentScores(List<String> ids) async {
    if (ids.isEmpty) return {};
    final rows = await _c
        .from('feed_comment_votes')
        .select('comment_id, value')
        .inFilter('comment_id', ids);
    final out = <String, int>{};
    for (final r in rows) {
      final id = r['comment_id'] as String;
      out[id] = (out[id] ?? 0) + (r['value'] as int);
    }
    return out;
  }

  /// The whole feed, newest first, with comments + author display data.
  Future<List<FeedPost>> fetchFeed() async {
    final rows = await _c
        .from('feed_posts')
        .select(_postSelect)
        .order('created_at', ascending: false);
    final commentIds = <String>[
      for (final p in rows)
        for (final c in (p['feed_comments'] as List? ?? const []))
          (c as Map)['id'] as String,
    ];
    final scores = await _commentScores(commentIds);
    return rows
        .map((p) => _mapPost(Map<String, dynamic>.from(p), scores))
        .toList();
  }

  /// Posts authored by [profileId], newest first.
  Future<List<FeedPost>> fetchUserPosts(String profileId) async {
    final rows = await _c
        .from('feed_posts')
        .select(_postSelect)
        .eq('user_id', profileId)
        .order('created_at', ascending: false);
    final commentIds = <String>[
      for (final p in rows)
        for (final c in (p['feed_comments'] as List? ?? const []))
          (c as Map)['id'] as String,
    ];
    final scores = await _commentScores(commentIds);
    return rows
        .map((p) => _mapPost(Map<String, dynamic>.from(p), scores))
        .toList();
  }

  Future<void> createPost({
    required FeedCommunity community,
    required String title,
    String? body,
    FeedActivity activity = FeedActivity.shared,
    String? posterUrl,
    String? creator,
    int? year,
  }) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    await _c.from('feed_posts').insert({
      'user_id': uid,
      'community': community.wire,
      'activity': activity.name,
      'title': title.trim(),
      'body': body?.trim(),
      'poster_url': posterUrl?.trim(),
      'creator': creator?.trim(),
      'year': year,
    });
  }

  /// Deletes a post (RLS only permits the author); cascades to children.
  Future<void> deletePost(String postId) =>
      _c.from('feed_posts').delete().eq('id', postId);

  Future<void> createComment(
      String postId, String body, String? parentId) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    await _c.from('feed_comments').insert({
      'post_id': postId,
      'user_id': uid,
      'parent_id': parentId,
      'body': body.trim(),
    });
  }

  /// Sets the current user's vote on a comment. dir 0 clears it.
  Future<void> setCommentVote(String commentId, int dir) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    if (dir == 0) {
      await _c
          .from('feed_comment_votes')
          .delete()
          .eq('user_id', uid)
          .eq('comment_id', commentId);
      return;
    }
    await _c.from('feed_comment_votes').upsert(
      {'user_id': uid, 'comment_id': commentId, 'value': dir},
      onConflict: 'user_id,comment_id',
    );
  }

  /// The current user's own comment votes → { commentId: -1 | 1 }.
  Future<Map<String, int>> fetchMyCommentVotes() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return {};
    final rows = await _c
        .from('feed_comment_votes')
        .select('comment_id, value')
        .eq('user_id', uid);
    return {
      for (final r in rows)
        r['comment_id'] as String: r['value'] as int,
    };
  }

  Future<List<String>> fetchFollowing() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return [];
    final rows = await _c
        .from('feed_follows')
        .select('followee_id')
        .eq('follower_id', uid);
    return rows.map((r) => r['followee_id'] as String).toList();
  }

  /// Follows/unfollows; returns the new following state.
  Future<bool> toggleFollow(String followeeId) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    final existing = await _c
        .from('feed_follows')
        .select('follower_id')
        .eq('follower_id', uid)
        .eq('followee_id', followeeId)
        .maybeSingle();
    if (existing != null) {
      await _c
          .from('feed_follows')
          .delete()
          .eq('follower_id', uid)
          .eq('followee_id', followeeId);
      return false;
    }
    await _c
        .from('feed_follows')
        .insert({'follower_id': uid, 'followee_id': followeeId});
    return true;
  }

  Future<List<String>> fetchBlocked() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return [];
    final rows = await _c
        .from('feed_blocks')
        .select('blocked_id')
        .eq('blocker_id', uid);
    return rows.map((r) => r['blocked_id'] as String).toList();
  }

  /// Blocked profiles with display names — for the Settings list.
  Future<List<({String id, String name})>> fetchBlockedProfiles() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return [];
    final rows = await _c
        .from('feed_blocks')
        .select('blocked:profiles!feed_blocks_blocked_id_fkey ( id, name )')
        .eq('blocker_id', uid);
    final out = <({String id, String name})>[];
    for (final r in rows) {
      final b = _embed(r['blocked']);
      if (b != null) {
        out.add((id: b['id'] as String, name: b['name'] as String));
      }
    }
    return out;
  }

  /// Blocks a profile — also drops any follow so the tie is fully cut.
  Future<void> blockUser(String blockedId) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null || uid == blockedId) return;
    await _c.from('feed_blocks').upsert(
      {'blocker_id': uid, 'blocked_id': blockedId},
      onConflict: 'blocker_id,blocked_id',
    );
    await _c
        .from('feed_follows')
        .delete()
        .eq('follower_id', uid)
        .eq('followee_id', blockedId);
  }

  Future<void> unblockUser(String blockedId) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return;
    await _c
        .from('feed_blocks')
        .delete()
        .eq('blocker_id', uid)
        .eq('blocked_id', blockedId);
  }

  Future<List<String>> fetchSaved() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return [];
    final rows = await _c
        .from('feed_saves')
        .select('post_id')
        .eq('user_id', uid);
    return rows.map((r) => r['post_id'] as String).toList();
  }

  /// Saves/unsaves a post; returns the new saved state.
  Future<bool> toggleSave(String postId) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    final existing = await _c
        .from('feed_saves')
        .select('post_id')
        .eq('user_id', uid)
        .eq('post_id', postId)
        .maybeSingle();
    if (existing != null) {
      await _c
          .from('feed_saves')
          .delete()
          .eq('user_id', uid)
          .eq('post_id', postId);
      return false;
    }
    await _c.from('feed_saves').insert({'user_id': uid, 'post_id': postId});
    return true;
  }

  /// A profile's public display data, or null if missing.
  Future<({String id, String name, String? avatarUrl})?> fetchProfile(
      String profileId) async {
    final row = await _c
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', profileId)
        .maybeSingle();
    if (row == null) return null;
    return (
      id: row['id'] as String,
      name: row['name'] as String,
      avatarUrl: row['avatar_url'] as String?,
    );
  }

  /// How many profiles follow [profileId].
  Future<int> fetchFollowerCount(String profileId) async {
    final rows = await _c
        .from('feed_follows')
        .select('follower_id')
        .eq('followee_id', profileId);
    return rows.length;
  }
}
