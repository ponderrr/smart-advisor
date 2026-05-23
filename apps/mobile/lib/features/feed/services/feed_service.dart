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

  // Joins go through profiles_public (public-safe projection)
  // because the base `profiles` table has owner-only RLS. See
  // 20260522040000_profiles_public_view.sql.
  static const _postSelect = '''
    id, community, activity, title, body, poster_url, creator, year,
    rating, base_score, created_at,
    author:profiles_public!feed_posts_user_id_fkey ( id, name, avatar_url ),
    feed_comments (
      id, body, parent_id, created_at, edited_at,
      author:profiles_public!feed_comments_user_id_fkey ( id, name, avatar_url )
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
      edited: c['edited_at'] != null,
      parentId: c['parent_id'] as String?,
    );
  }

  FeedPost _mapPost(
    Map<String, dynamic> p,
    Map<String, int> commentScores,
    int postScore,
  ) {
    final author = _embed(p['author']);
    final community = feedCommunityFromWire(p['community'] as String);
    final comments = ((p['feed_comments'] as List?) ?? const [])
        .map((c) => _mapComment(
            Map<String, dynamic>.from(c as Map),
            commentScores[(c)['id']] ?? 0))
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
      rating: (p['rating'] as num?)?.toInt(),
      square: community == FeedCommunity.music,
      baseScore: (p['base_score'] as int?) ?? 0,
      score: postScore,
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

  /// Sums feed_post_votes for the given post ids → { id: score }.
  Future<Map<String, int>> _postScores(List<String> ids) async {
    if (ids.isEmpty) return {};
    final rows = await _c
        .from('feed_post_votes')
        .select('post_id, value')
        .inFilter('post_id', ids);
    final out = <String, int>{};
    for (final r in rows) {
      final id = r['post_id'] as String;
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
    final postIds = [for (final p in rows) p['id'] as String];
    final results = await Future.wait([
      _commentScores(commentIds),
      _postScores(postIds),
    ]);
    final commentScores = results[0];
    final postScores = results[1];
    return rows
        .map((p) => _mapPost(
              Map<String, dynamic>.from(p),
              commentScores,
              postScores[p['id'] as String] ?? 0,
            ))
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
    final postIds = [for (final p in rows) p['id'] as String];
    final results = await Future.wait([
      _commentScores(commentIds),
      _postScores(postIds),
    ]);
    final commentScores = results[0];
    final postScores = results[1];
    return rows
        .map((p) => _mapPost(
              Map<String, dynamic>.from(p),
              commentScores,
              postScores[p['id'] as String] ?? 0,
            ))
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
    int? rating,
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
      // Only meaningful for a 'rated' post; null otherwise.
      'rating': activity == FeedActivity.rated ? rating : null,
    });
  }

  /// Deletes a post (RLS only permits the author); cascades to children.
  Future<void> deletePost(String postId) =>
      _c.from('feed_posts').delete().eq('id', postId);

  /// Updates a post's editable fields (RLS only permits the author).
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
  }) =>
      _c.from('feed_posts').update({
        'community': community.wire,
        'activity': activity.name,
        'title': title.trim(),
        'body': body?.trim(),
        'poster_url': posterUrl?.trim(),
        'creator': creator?.trim(),
        'year': year,
        // Only meaningful for a 'rated' post; cleared otherwise.
        'rating': activity == FeedActivity.rated ? rating : null,
      }).eq('id', postId);

  /// Files a report on a post or a comment (exactly one id is non-null).
  Future<void> _report({
    String? postId,
    String? commentId,
    String? reason,
  }) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    await _c.from('feed_reports').insert({
      'reporter_id': uid,
      'post_id': ?postId,
      'comment_id': ?commentId,
      'reason': reason,
    });
  }

  Future<void> reportPost(String postId, {String? reason}) =>
      _report(postId: postId, reason: reason);

  Future<void> reportComment(String commentId, {String? reason}) =>
      _report(commentId: commentId, reason: reason);

  /// Reports the current user has filed, newest first. Readable via the
  /// reporter's own-row SELECT policy on feed_reports.
  Future<
      List<
          ({
            String id,
            String? reason,
            String createdAt,
            bool isPost,
            String? label,
          })>> fetchMyReports() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return const [];
    final rows = await _c
        .from('feed_reports')
        .select('id, reason, created_at, post_id, comment_id, '
            'post:feed_posts!feed_reports_post_id_fkey ( title ), '
            'comment:feed_comments!feed_reports_comment_id_fkey ( body )')
        .eq('reporter_id', uid)
        .order('created_at', ascending: false);
    return [
      for (final r in rows)
        (
          id: r['id'] as String,
          reason: r['reason'] as String?,
          createdAt: r['created_at'] as String,
          isPost: r['post_id'] != null,
          label: (_embed(r['post'])?['title'] as String?) ??
              (_embed(r['comment'])?['body'] as String?),
        ),
    ];
  }

  /// Every report in the system, newest first. Visible only to rows that
  /// satisfy the `feed_reports_select_admin` RLS policy — i.e. the caller
  /// has profiles.is_admin = true. Non-admins get back an empty list (or
  /// only their own reports via the additive select_own policy).
  Future<
      List<
          ({
            String id,
            String? reason,
            String createdAt,
            String? reporter,
            bool isPost,
            String? targetLabel,
            String? targetAuthor,
            String? postId,
            String? commentId,
            String? commentPostId,
          })>> fetchAllReports() async {
    final rows = await _c
        .from('feed_reports')
        .select(
            'id, reason, created_at, post_id, comment_id, '
            'reporter:profiles_public!feed_reports_reporter_id_fkey '
            '( name, username ), '
            'post:feed_posts!feed_reports_post_id_fkey '
            '( title, author:profiles_public!feed_posts_user_id_fkey ( name, username ) ), '
            'comment:feed_comments!feed_reports_comment_id_fkey '
            '( body, post_id, author:profiles_public!feed_comments_user_id_fkey ( name, username ) )')
        .order('created_at', ascending: false);
    return [
      for (final r in rows)
        () {
          final reporter = _embed(r['reporter']);
          final post = _embed(r['post']);
          final comment = _embed(r['comment']);
          final target = post ?? comment;
          final author = target == null ? null : _embed(target['author']);
          return (
            id: r['id'] as String,
            reason: r['reason'] as String?,
            createdAt: r['created_at'] as String,
            reporter: (reporter?['username'] ?? reporter?['name']) as String?,
            isPost: r['post_id'] != null,
            targetLabel: (post?['title'] ?? comment?['body']) as String?,
            targetAuthor:
                (author?['username'] ?? author?['name']) as String?,
            postId: r['post_id'] as String?,
            commentId: r['comment_id'] as String?,
            commentPostId: comment?['post_id'] as String?,
          );
        }(),
    ];
  }

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

  /// Deletes a comment (RLS only permits the author); the parent_id FK
  /// cascades, so any replies underneath go with it.
  Future<void> deleteComment(String commentId) =>
      _c.from('feed_comments').delete().eq('id', commentId);

  /// Updates a comment's body. RLS only permits the author. Stamps
  /// edited_at so the UI can show "(edited)" on the byline.
  Future<void> updateComment(String commentId, String body) =>
      _c.from('feed_comments').update({
        'body': body.trim(),
        'edited_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', commentId);

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

  /// Sets the current user's vote on a post. dir 0 clears it. Mirrors
  /// [setCommentVote] — same upsert/delete pattern against feed_post_votes.
  Future<void> setPostVote(String postId, int dir) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) throw Exception('Not signed in');
    if (dir == 0) {
      await _c
          .from('feed_post_votes')
          .delete()
          .eq('user_id', uid)
          .eq('post_id', postId);
      return;
    }
    await _c.from('feed_post_votes').upsert(
      {'user_id': uid, 'post_id': postId, 'value': dir},
      onConflict: 'user_id,post_id',
    );
  }

  /// The current user's own post votes → { postId: -1 | 1 }.
  Future<Map<String, int>> fetchMyPostVotes() async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return {};
    final rows = await _c
        .from('feed_post_votes')
        .select('post_id, value')
        .eq('user_id', uid);
    return {
      for (final r in rows)
        r['post_id'] as String: r['value'] as int,
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

  /// Profiles that [profileId] follows, newest follow first — the
  /// "Following" half of the friends list.
  Future<List<({String id, String name, String? avatarUrl})>>
      fetchFollowingProfiles(String profileId) async {
    final rows = await _c
        .from('feed_follows')
        .select('created_at, '
            'followee:profiles_public!feed_follows_followee_id_fkey '
            '( id, name, avatar_url )')
        .eq('follower_id', profileId)
        .order('created_at', ascending: false);
    return _mapPeople(rows, 'followee');
  }

  /// Profiles that follow [profileId], newest follow first — the
  /// "Followers" half of the friends list.
  Future<List<({String id, String name, String? avatarUrl})>>
      fetchFollowerProfiles(String profileId) async {
    final rows = await _c
        .from('feed_follows')
        .select('created_at, '
            'follower:profiles_public!feed_follows_follower_id_fkey '
            '( id, name, avatar_url )')
        .eq('followee_id', profileId)
        .order('created_at', ascending: false);
    return _mapPeople(rows, 'follower');
  }

  /// Pulls the embedded profile under [key] out of each follow row.
  List<({String id, String name, String? avatarUrl})> _mapPeople(
      List<dynamic> rows, String key) {
    final out = <({String id, String name, String? avatarUrl})>[];
    for (final r in rows) {
      final p = _embed((r as Map)[key]);
      final id = p?['id'] as String?;
      if (id != null) {
        out.add((
          id: id,
          name: (p?['name'] as String?) ?? 'Someone',
          avatarUrl: p?['avatar_url'] as String?,
        ));
      }
    }
    return out;
  }

  /// Distinct people who've recently posted — for the "Add friends"
  /// discover screen. Deliberately light: just the post authors, no
  /// comments and no score aggregation (unlike [fetchFeed]).
  Future<List<({String id, String name, String? avatarUrl})>>
      fetchSuggestedPeople() async {
    final rows = await _c
        .from('feed_posts')
        .select(
            'author:profiles_public!feed_posts_user_id_fkey ( id, name, avatar_url )')
        .order('created_at', ascending: false)
        .limit(150);
    final out = <String, ({String id, String name, String? avatarUrl})>{};
    for (final r in rows) {
      final p = _embed((r as Map)['author']);
      final id = p?['id'] as String?;
      if (id != null && !out.containsKey(id)) {
        out[id] = (
          id: id,
          name: (p?['name'] as String?) ?? 'Someone',
          avatarUrl: p?['avatar_url'] as String?,
        );
      }
    }
    return out.values.toList();
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
        .select('blocked:profiles_public!feed_blocks_blocked_id_fkey ( id, name )')
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
  Future<
      ({
        String id,
        String name,
        String? avatarUrl,
        String? bio,
        List<String> interests,
        List<String> tags,
      })?> fetchProfile(String profileId) async {
    final row = await _c
        .from('profiles_public')
        .select('id, name, avatar_url, bio, interests, tags')
        .eq('id', profileId)
        .maybeSingle();
    if (row == null) return null;
    List<String> strList(dynamic v) =>
        (v as List?)?.map((e) => e.toString()).toList() ?? const [];
    return (
      id: row['id'] as String,
      name: row['name'] as String,
      avatarUrl: row['avatar_url'] as String?,
      bio: row['bio'] as String?,
      interests: strList(row['interests']),
      tags: strList(row['tags']),
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

  /// Whether [profileId]'s library is publicly visible on their profile.
  /// Tolerates the column not existing yet (pre-migration) → true.
  Future<bool> fetchLibraryPublic(String profileId) async {
    try {
      final row = await _c
          .from('profiles_public')
          .select('library_public')
          .eq('id', profileId)
          .maybeSingle();
      return (row?['library_public'] as bool?) ?? true;
    } catch (_) {
      return true;
    }
  }

  /// Sets the current user's library visibility.
  Future<void> setMyLibraryPublic(bool value) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return;
    await _c
        .from('profiles')
        .update({'library_public': value}).eq('id', uid);
  }
}
