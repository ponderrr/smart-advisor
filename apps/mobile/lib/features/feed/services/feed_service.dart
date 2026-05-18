import '../models/feed_models.dart';

/// Feed data seam. The whole social feed is in-memory + per-device prefs
/// (no Supabase) — mirroring the web zustand store. [FeedService] is an
/// abstract boundary so swapping [InMemoryFeedService] for a Supabase-backed
/// implementation later is mechanical: same methods, same return shapes.
abstract class FeedService {
  List<FeedPost> seed();

  /// Inserts a new "you" post at the top of [posts] and returns the new list.
  List<FeedPost> addPost(
    List<FeedPost> posts, {
    required FeedCommunity community,
    required String title,
    String? body,
    FeedActivity activity = FeedActivity.shared,
    String? posterUrl,
    String? creator,
    int? year,
  });

  /// Prepends a "you" comment (optionally threaded under [parentId]) to the
  /// matching post and returns the new list.
  List<FeedPost> addComment(
    List<FeedPost> posts,
    String postId,
    String body, {
    String? parentId,
  });

  /// Sets the current user's post vote (-1/0/1); re-tapping the same
  /// direction clears it. Returns the new list.
  List<FeedPost> setVote(List<FeedPost> posts, String postId, int dir);

  /// Toggles membership of [set], returning the new set and whether the id
  /// is now present (used for the "saved"/"following" toggles + their
  /// undo banners).
  (Set<T>, bool) toggleIn<T>(Set<T> set, T value);

  /// Per-comment vote map mutation, keyed `"<postId>#<commentId>"`.
  Map<String, int> setCommentVote(Map<String, int> votes, String key, int dir);
}

class InMemoryFeedService implements FeedService {
  const InMemoryFeedService();

  @override
  List<FeedPost> seed() => const [
        FeedPost(
          id: '1',
          community: FeedCommunity.movies,
          author: 'maya',
          activity: FeedActivity.finished,
          tasteMatch: 92,
          title: 'Dune: Part Two',
          body: 'The IMAX sound design alone justifies it — epic '
              'without ever losing the characters.',
          posterUrl: 'https://picsum.photos/seed/dune/300/450',
          creator: 'Denis Villeneuve',
          year: 2024,
          ageHours: 5,
          baseScore: 1284,
          comments: [
            FeedComment(
                id: 'c1',
                author: 'jon',
                body: 'Chalamet finally won me over here.',
                ageHours: 4,
                score: 92,
                parentId: null),
            FeedComment(
                id: 'c1r1',
                author: 'maya',
                body: 'Right? The dunes-as-character thing finally '
                    'clicked for me too.',
                ageHours: 3,
                score: 28,
                parentId: 'c1'),
            FeedComment(
                id: 'c1r2',
                author: 'theo',
                body: 'Hard disagree, the pacing dragged in act two.',
                ageHours: 2,
                score: 9,
                parentId: 'c1'),
            FeedComment(
                id: 'c2',
                author: 'priya',
                body: 'Adding this to my list now.',
                ageHours: 3,
                score: 41,
                parentId: null),
          ],
        ),
        FeedPost(
          id: '2',
          community: FeedCommunity.books,
          author: 'jon',
          activity: FeedActivity.finished,
          tasteMatch: 88,
          title: 'Project Hail Mary',
          body: 'Went in for hard sci-fi, left emotionally wrecked. '
              'No spoilers but: Rocky.',
          posterUrl: 'https://picsum.photos/seed/phm/300/450',
          creator: 'Andy Weir',
          year: 2021,
          ageHours: 14,
          baseScore: 803,
          comments: [
            FeedComment(
                id: 'c3',
                author: 'maya',
                body: "Read it in two sittings. Couldn't stop.",
                ageHours: 12,
                score: 58,
                parentId: null),
            FeedComment(
                id: 'c3r1',
                author: 'jon',
                body: 'Same — the Rocky chapters wrecked me.',
                ageHours: 10,
                score: 22,
                parentId: 'c3'),
          ],
        ),
        FeedPost(
          id: '3',
          community: FeedCommunity.music,
          author: 'priya',
          activity: FeedActivity.added,
          tasteMatch: 74,
          title: 'Wall of Eyes',
          body: 'On repeat all month — the strings on track 2.',
          posterUrl: 'https://picsum.photos/seed/album/300/300',
          creator: 'The Smile',
          year: 2024,
          square: true,
          ageHours: 9,
          baseScore: 412,
          comments: [
            FeedComment(
                id: 'c4',
                author: 'theo',
                body: 'Their best yet, honestly.',
                ageHours: 6,
                score: 31,
                parentId: null),
          ],
        ),
        FeedPost(
          id: '4',
          community: FeedCommunity.movies,
          author: 'theo',
          activity: FeedActivity.rated,
          tasteMatch: 95,
          title: 'Oppenheimer',
          body: "Holds up even better on a rewatch — Nolan's best "
              'structure work. ★★★★★',
          posterUrl: 'https://picsum.photos/seed/oppen/300/450',
          creator: 'Christopher Nolan',
          year: 2023,
          ageHours: 28,
          baseScore: 967,
        ),
        FeedPost(
          id: '5',
          community: FeedCommunity.books,
          author: 'lena',
          activity: FeedActivity.rated,
          tasteMatch: 70,
          title: 'Thinking, Fast and Slow',
          body: 'Rewired a few of my defaults. Dense but worth it.',
          posterUrl: 'https://picsum.photos/seed/tfas/300/450',
          creator: 'Daniel Kahneman',
          year: 2011,
          ageHours: 40,
          baseScore: 318,
          comments: [
            FeedComment(
                id: 'c5',
                author: 'sam',
                body: 'The anchoring chapter stuck with me.',
                ageHours: 30,
                score: 14,
                parentId: null),
          ],
        ),
        FeedPost(
          id: '6',
          community: FeedCommunity.movies,
          author: 'movie night crew',
          activity: FeedActivity.group,
          tasteMatch: 81,
          title: 'Past Lives',
          body: 'Your group quiz with 3 friends landed here — '
              'unanimous on the vibe.',
          posterUrl: 'https://picsum.photos/seed/pastlives/300/450',
          creator: 'Celine Song',
          year: 2023,
          ageHours: 52,
          baseScore: 588,
        ),
      ];

  String? _clean(String? s) =>
      (s == null || s.trim().isEmpty) ? null : s.trim();

  @override
  List<FeedPost> addPost(
    List<FeedPost> posts, {
    required FeedCommunity community,
    required String title,
    String? body,
    FeedActivity activity = FeedActivity.shared,
    String? posterUrl,
    String? creator,
    int? year,
  }) {
    return [
      FeedPost(
        id: 'u${DateTime.now().millisecondsSinceEpoch}',
        community: community,
        author: 'you',
        title: title,
        activity: activity,
        body: _clean(body),
        posterUrl: _clean(posterUrl),
        creator: _clean(creator),
        year: year,
        square: community == FeedCommunity.music,
        ageHours: 0,
        baseScore: 1,
        vote: 1,
      ),
      ...posts,
    ];
  }

  @override
  List<FeedPost> addComment(
    List<FeedPost> posts,
    String postId,
    String body, {
    String? parentId,
  }) {
    return [
      for (final p in posts)
        if (p.id == postId)
          p.copyWith(comments: [
            FeedComment(
              id: 'u${DateTime.now().millisecondsSinceEpoch}',
              author: 'you',
              body: body,
              ageHours: 0,
              score: 1,
              parentId: parentId,
            ),
            ...p.comments,
          ])
        else
          p,
    ];
  }

  @override
  List<FeedPost> setVote(List<FeedPost> posts, String postId, int dir) {
    return [
      for (final p in posts)
        if (p.id == postId)
          p.copyWith(vote: p.vote == dir ? 0 : dir)
        else
          p,
    ];
  }

  @override
  (Set<T>, bool) toggleIn<T>(Set<T> set, T value) {
    final next = {...set};
    final nowPresent = !next.contains(value);
    if (nowPresent) {
      next.add(value);
    } else {
      next.remove(value);
    }
    return (next, nowPresent);
  }

  @override
  Map<String, int> setCommentVote(
      Map<String, int> votes, String key, int dir) {
    final cur = votes[key] ?? 0;
    return {...votes, key: cur == dir ? 0 : dir};
  }
}
