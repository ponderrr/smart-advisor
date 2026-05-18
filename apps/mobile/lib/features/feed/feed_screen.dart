import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ui_messenger.dart';
import '../../ui/ui.dart';

/// Experimental Reddit-style social feed — a *new tab* trialled alongside the
/// existing Home/Dashboard (which is untouched and stays the fallback).
///
/// UI only: everything below is in-memory seeded data. No Supabase tables,
/// no network, nothing persists across launches. The point is to judge the
/// look & feel before committing to a real social backend.

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

enum FeedCommunity { movies, books, music }

extension FeedCommunityX on FeedCommunity {
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

class FeedComment {
  const FeedComment({
    required this.author,
    required this.body,
    required this.ageHours,
    this.score = 0,
  });
  final String author;
  final String body;
  final int ageHours;
  final int score;
}

class FeedPost {
  FeedPost({
    required this.id,
    required this.community,
    required this.author,
    required this.title,
    required this.ageHours,
    this.body,
    this.flair,
    this.posterUrl,
    this.creator,
    this.year,
    this.square = false,
    this.baseScore = 0,
    this.vote = 0,
    List<FeedComment>? comments,
  }) : comments = comments ?? <FeedComment>[];

  final String id;
  final FeedCommunity community;
  final String author;
  final String title;
  final int ageHours;
  final String? body;

  /// Optional Reddit-style flair: Discussion / Recommendation / etc.
  final String? flair;
  final String? posterUrl;
  final String? creator;
  final int? year;
  final bool square;
  final int baseScore;

  /// -1, 0 or 1 — the current user's vote (in-memory only).
  int vote;
  final List<FeedComment> comments;

  int get score => baseScore + vote;

  /// Cheap "hot" rank: score decayed by age (Reddit-ish, not exact).
  double get hotRank => score / (1 + ageHours / 12.0);
}

enum FeedSort { hot, newest, top }

/// How each post is laid out — mirrors Reddit's Card / Compact / Media views.
enum FeedView { card, compact, media }

/// Selectable post flairs and their accent colors.
const kFeedFlairs = <String, Color>{
  'Discussion': Tw.violet500,
  'Recommendation': Tw.emerald500,
  'Review': Tw.amber500,
  'Question': Tw.indigo500,
  'Hot take': Tw.rose500,
};

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

final feedProvider =
    NotifierProvider<FeedNotifier, List<FeedPost>>(FeedNotifier.new);

/// In-memory set of followed usernames (prototype only).
final followingProvider =
    NotifierProvider<FollowingNotifier, Set<String>>(
        FollowingNotifier.new);

class FollowingNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => <String>{};

  void toggle(String username) {
    final next = {...state};
    next.contains(username)
        ? next.remove(username)
        : next.add(username);
    state = next;
  }
}

/// In-memory per-comment vote, keyed `"<postId>#<index>"` → -1/0/1.
final commentVotesProvider =
    NotifierProvider<CommentVotesNotifier, Map<String, int>>(
        CommentVotesNotifier.new);

class CommentVotesNotifier extends Notifier<Map<String, int>> {
  @override
  Map<String, int> build() => <String, int>{};

  void setVote(String key, int dir) {
    final cur = state[key] ?? 0;
    state = {...state, key: cur == dir ? 0 : dir};
  }
}

/// In-memory set of joined communities (prototype only).
final joinedCommunitiesProvider =
    NotifierProvider<JoinedCommunitiesNotifier, Set<FeedCommunity>>(
        JoinedCommunitiesNotifier.new);

class JoinedCommunitiesNotifier extends Notifier<Set<FeedCommunity>> {
  @override
  Set<FeedCommunity> build() => <FeedCommunity>{};

  void toggle(FeedCommunity c) {
    final next = {...state};
    next.contains(c) ? next.remove(c) : next.add(c);
    state = next;
  }
}

class FeedNotifier extends Notifier<List<FeedPost>> {
  @override
  List<FeedPost> build() => _seed();

  void setVote(String id, int next) {
    state = [
      for (final p in state)
        if (p.id == id) (p..vote = p.vote == next ? 0 : next) else p,
    ];
  }

  void addComment(String id, String body) {
    state = [
      for (final p in state)
        if (p.id == id)
          (p
            ..comments.insert(
                0,
                FeedComment(
                    author: 'you', body: body, ageHours: 0, score: 1)))
        else
          p,
    ];
  }

  void addPost(
    FeedCommunity community,
    String title,
    String? body, {
    String? flair,
    String? posterUrl,
    String? creator,
    int? year,
  }) {
    String? clean(String? s) =>
        (s == null || s.trim().isEmpty) ? null : s.trim();
    state = [
      FeedPost(
        id: 'u${DateTime.now().millisecondsSinceEpoch}',
        community: community,
        author: 'you',
        title: title,
        body: clean(body),
        flair: flair,
        posterUrl: clean(posterUrl),
        creator: clean(creator),
        year: year,
        square: community == FeedCommunity.music,
        ageHours: 0,
        baseScore: 1,
        vote: 1,
      ),
      ...state,
    ];
  }

  static List<FeedPost> _seed() => [
        FeedPost(
          id: '1',
          community: FeedCommunity.movies,
          author: 'reel_takes',
          title: 'Dune: Part Two is the rare sequel that outdoes the original',
          flair: 'Review',
          body:
              'The IMAX sound design alone justifies the ticket. Villeneuve '
              'gets the scale right without losing the characters.',
          posterUrl: 'https://picsum.photos/seed/dune/300/450',
          creator: 'Denis Villeneuve',
          year: 2024,
          ageHours: 5,
          baseScore: 1284,
          comments: const [
            FeedComment(
                author: 'sandworm',
                body: 'Chalamet finally won me over here.',
                ageHours: 4,
                score: 92),
            FeedComment(
                author: 'spice_must_flow',
                body: 'Part Three can not come soon enough.',
                ageHours: 3,
                score: 41),
          ],
        ),
        FeedPost(
          id: '2',
          community: FeedCommunity.books,
          author: 'pages_at_2am',
          title: 'Project Hail Mary — the friendship subplot wrecked me',
          body: 'Went in expecting hard sci-fi, left emotionally compromised. '
              'No spoilers but: Rocky.',
          posterUrl: 'https://picsum.photos/seed/phm/300/450',
          creator: 'Andy Weir',
          year: 2021,
          ageHours: 14,
          baseScore: 803,
          comments: const [
            FeedComment(
                author: 'astrophage',
                body: 'Read it in two sittings. Couldn\'t stop.',
                ageHours: 12,
                score: 58),
          ],
        ),
        FeedPost(
          id: '3',
          community: FeedCommunity.music,
          author: 'loopfiend',
          title: 'What album have you played to death this month?',
          flair: 'Discussion',
          body: 'Mine is on repeat and I have no regrets. Drop yours.',
          ageHours: 9,
          baseScore: 412,
          comments: const [
            FeedComment(
                author: 'bassline',
                body: 'Anything with a good low end honestly.',
                ageHours: 7,
                score: 22),
            FeedComment(
                author: 'vinyl_only',
                body: 'The Smile - Wall of Eyes. Nonstop.',
                ageHours: 6,
                score: 31),
          ],
        ),
        FeedPost(
          id: '4',
          community: FeedCommunity.movies,
          author: 'midnight_screening',
          title: 'Oppenheimer holds up even better on a rewatch',
          body: 'Knowing where it lands, the first hour hits completely '
              'differently. Nolan\'s best structure work.',
          posterUrl: 'https://picsum.photos/seed/oppen/300/450',
          creator: 'Christopher Nolan',
          year: 2023,
          ageHours: 28,
          baseScore: 967,
        ),
        FeedPost(
          id: '5',
          community: FeedCommunity.music,
          author: 'crate_digger',
          title: 'Underrated 2024 records that deserved more attention',
          posterUrl: 'https://picsum.photos/seed/album/300/300',
          creator: 'various',
          square: true,
          ageHours: 40,
          baseScore: 318,
          comments: const [
            FeedComment(
                author: 'tapehead',
                body: 'Adding half of these to my list, thanks.',
                ageHours: 30,
                score: 14),
          ],
        ),
        FeedPost(
          id: '6',
          community: FeedCommunity.books,
          author: 'shelf_life',
          title: 'Tell me a book that genuinely changed how you think',
          body: 'Not looking for the usual list — something that actually '
              'rewired a default for you.',
          ageHours: 52,
          baseScore: 588,
        ),
      ];
}

// ---------------------------------------------------------------------------
// Feed screen
// ---------------------------------------------------------------------------

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  FeedSort _sort = FeedSort.hot;
  FeedCommunity? _community; // null = All
  FeedView _view = FeedView.card;

  List<FeedPost> _visible(List<FeedPost> posts) {
    final filtered = _community == null
        ? [...posts]
        : posts.where((p) => p.community == _community).toList();
    switch (_sort) {
      case FeedSort.hot:
        filtered.sort((a, b) => b.hotRank.compareTo(a.hotRank));
      case FeedSort.newest:
        filtered.sort((a, b) => a.ageHours.compareTo(b.ageHours));
      case FeedSort.top:
        filtered.sort((a, b) => b.score.compareTo(a.score));
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final posts = _visible(ref.watch(feedProvider));
    final fabColor = _community == null
        ? Tw.indigo500
        : contentAccent(
                _community!.accent, Theme.of(context).brightness)
            .dot;
    return Scaffold(
      backgroundColor: brandBg(Theme.of(context).brightness),
      floatingActionButton: _PostFab(
        color: fabColor,
        label: _community == null
            ? 'Post'
            : 'Post to ${_community!.label}',
        onTap: () => _openComposer(_community),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          Row(
            children: [
              const Expanded(child: BrandHeading('Feed', size: 26)),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: context.colors.muted,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text('BETA',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        color: context.brandMuted)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Subtitle('What people are recommending right now.'),
          const SizedBox(height: 14),
          _communitySegmented(),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: _sortSegmented()),
            const SizedBox(width: 8),
            _FeedViewToggle(
              value: _view,
              onChanged: (v) => setState(() => _view = v),
            ),
          ]),
          const SizedBox(height: 14),
          if (posts.isEmpty)
            Padding(
              padding: const EdgeInsets.all(40),
              child: Subtitle('Nothing here yet — be the first to post.',
                  center: true),
            )
          else
            for (var i = 0; i < posts.length; i++)
              _postFor(posts[i])
                  .animate()
                  .fadeIn(delay: (i * 60).ms, duration: 280.ms)
                  .slideY(begin: 0.05, curve: Curves.easeOut),
        ],
      ),
    );
  }

  /// Community filter — `BrandSegmented`, color-coded to the selected
  /// community's content accent (All → indigo, Movies → amber, Books →
  /// emerald, Music → rose), matching the Library screen's pattern.
  Widget _communitySegmented() {
    const labels = ['All', 'Movies', 'Books', 'Music'];
    final idx = _community == null ? 0 : _community!.index + 1;
    return BrandSegmented(
      color: accentColorForLabel(labels[idx]),
      labels: labels,
      selectedIndex: idx,
      onValueChanged: (i) => setState(() =>
          _community = i == 0 ? null : FeedCommunity.values[i - 1]),
    );
  }

  /// Sort — `BrandSegmented`, tinted to a per-sort accent so the active
  /// mode is color-coded too (Hot → rose, New → emerald, Top → amber).
  Widget _sortSegmented() {
    const sorts = [FeedSort.hot, FeedSort.newest, FeedSort.top];
    const colors = [Tw.rose500, Tw.emerald500, Tw.amber500];
    final idx = sorts.indexOf(_sort);
    return BrandSegmented(
      color: colors[idx],
      labels: const ['Hot', 'New', 'Top'],
      selectedIndex: idx,
      onValueChanged: (i) => setState(() => _sort = sorts[i]),
    );
  }


  Widget _postFor(FeedPost p) {
    void onOpen() => _openPost(p.id);
    return switch (_view) {
      FeedView.card => _PostCard(post: p, onOpen: onOpen),
      FeedView.compact => _CompactPostRow(post: p, onOpen: onOpen),
      FeedView.media => _MediaPostCard(post: p, onOpen: onOpen),
    };
  }

  void _openPost(String id) {
    Navigator.of(context).push(MaterialPageRoute<void>(
      builder: (_) => PostDetailScreen(postId: id),
    ));
  }

  void _openComposer(FeedCommunity? initial) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _Composer(
          initialCommunity: initial ?? FeedCommunity.movies),
    );
  }
}

/// Extended FAB that smoothly grows/shrinks as its label changes ("Post" ↔
/// "Post to Movies") and cross-fades both the text and the accent color,
/// instead of snapping between sizes.
class _PostFab extends StatelessWidget {
  const _PostFab(
      {required this.color, required this.label, required this.onTap});
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<Color?>(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      tween: ColorTween(end: color),
      builder: (context, animColor, _) {
        final bg = animColor ?? color;
        return Material(
          color: bg,
          elevation: 6,
          shadowColor: bg.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(26),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox(
              // Fixed height → only the width animates, never the height.
              height: 52,
              child: AnimatedSize(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.edit_outlined,
                        size: 18, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      softWrap: false,
                      maxLines: 1,
                      overflow: TextOverflow.clip,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Post card (Reddit-style: vote rail + content)
// ---------------------------------------------------------------------------

String _ago(int hours) {
  if (hours <= 0) return 'just now';
  if (hours < 24) return '${hours}h ago';
  final d = hours ~/ 24;
  return '${d}d ago';
}

String _compact(int n) {
  if (n >= 1000) {
    final k = n / 1000;
    return '${k.toStringAsFixed(k >= 10 ? 0 : 1)}k';
  }
  return '$n';
}

void _openUserProfile(BuildContext context, String username) {
  Navigator.of(context).push(MaterialPageRoute<void>(
    builder: (_) => UserProfileScreen(username: username),
  ));
}

void _openCommunity(BuildContext context, FeedCommunity community) {
  Navigator.of(context).push(MaterialPageRoute<void>(
    builder: (_) => CommunityScreen(community: community),
  ));
}

/// Tappable community tag (`r/movies`) → opens the community page.
class _CommunityTag extends StatelessWidget {
  const _CommunityTag({
    required this.community,
    required this.tone,
    this.dense = false,
  });
  final FeedCommunity community;
  final ContentAccentTone tone;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _openCommunity(context, community),
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: dense ? 0 : 8, vertical: dense ? 0 : 2),
        decoration: dense
            ? null
            : BoxDecoration(
                color: tone.iconCircleBg,
                borderRadius: BorderRadius.circular(999)),
        child: Text(community.tag,
            style: TextStyle(
                fontSize: dense ? 10.5 : 10,
                fontWeight: FontWeight.w900,
                color: dense ? tone.text : tone.iconCircleFg)),
      ),
    );
  }
}

/// Tappable `u/<name>` (+ optional trailing meta) that opens that user's
/// profile — used on cards, the post detail and comments.
class _AuthorTag extends StatelessWidget {
  const _AuthorTag({
    required this.author,
    this.trailing = '',
    this.style,
    this.bold = false,
  });
  final String author;
  final String trailing;
  final TextStyle? style;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final base = style ??
        TextStyle(fontSize: 11, color: context.brandMuted);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _openUserProfile(context, author),
      child: Text.rich(
        TextSpan(children: [
          TextSpan(
              text: 'u/$author',
              style: base.copyWith(
                  fontWeight:
                      bold ? FontWeight.w800 : FontWeight.w600,
                  color: context.brandInk)),
          if (trailing.isNotEmpty) TextSpan(text: trailing, style: base),
        ]),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

class _VoteRail extends ConsumerWidget {
  const _VoteRail({required this.post});
  final FeedPost post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(feedProvider.notifier);
    Color voteColor(int dir) => post.vote == dir
        ? (dir > 0 ? Tw.indigo500 : Tw.rose500)
        : context.brandMuted;
    return Column(
      children: [
        GestureDetector(
          onTap: () => notifier.setVote(post.id, 1),
          child: Icon(Icons.keyboard_arrow_up,
              size: 26, color: voteColor(1)),
        ),
        Text(_compact(post.score),
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: post.vote != 0
                    ? voteColor(post.vote)
                    : context.brandInk)),
        GestureDetector(
          onTap: () => notifier.setVote(post.id, -1),
          child: Icon(Icons.keyboard_arrow_down,
              size: 26, color: voteColor(-1)),
        ),
      ],
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(
        post.community.accent, Theme.of(context).brightness);
    final meta = [
      if (post.creator != null) post.creator!,
      if (post.year != null) '${post.year}',
    ].join(' · ');

    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _VoteRail(post: post),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  _CommunityTag(community: post.community, tone: tone),
                  if (post.flair != null) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                          color: (kFeedFlairs[post.flair] ??
                                  Tw.indigo500)
                              .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(999)),
                      child: Text(post.flair!,
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: kFeedFlairs[post.flair] ??
                                  Tw.indigo500)),
                    ),
                  ],
                  const SizedBox(width: 8),
                  Expanded(
                    child: _AuthorTag(
                      author: post.author,
                      trailing: ' · ${_ago(post.ageHours)}',
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(post.title,
                    style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w800,
                        height: 1.25,
                        color: context.brandInk)),
                if (post.posterUrl != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PosterThumb(
                          url: post.posterUrl,
                          square: post.square,
                          w: 52),
                      const SizedBox(width: 10),
                      if (meta.isNotEmpty)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(meta,
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: context.brandMuted)),
                          ),
                        ),
                    ],
                  ),
                ],
                if (post.body != null) ...[
                  const SizedBox(height: 8),
                  Text(post.body!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: context.brandMuted)),
                ],
                const SizedBox(height: 10),
                Row(children: [
                  Icon(Icons.mode_comment_outlined,
                      size: 15, color: context.brandMuted),
                  const SizedBox(width: 5),
                  Text('${post.comments.length} comments',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: context.brandMuted)),
                  const SizedBox(width: 16),
                  Icon(Icons.share_outlined,
                      size: 15, color: context.brandMuted),
                  const SizedBox(width: 5),
                  Text('Share',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: context.brandMuted)),
                ]),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

/// Card / Compact / Media switch — track + sliding pill with icons,
/// styled to match [ViewModeToggle]. Pure Flutter (no platform widgets)
/// so it renders identically on iOS and Android.
class _FeedViewToggle extends StatelessWidget {
  const _FeedViewToggle({required this.value, required this.onChanged});
  final FeedView value;
  final ValueChanged<FeedView> onChanged;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final track = dark ? Tw.slate800 : Tw.slate200;
    final pill = dark ? Tw.slate950 : Tw.white;
    final active = dark ? Tw.slate100 : Tw.slate900;
    final muted = dark ? Tw.slate400 : Tw.slate500;

    Widget cell(FeedView v, IconData icon, String tip) {
      final selected = value == v;
      return Tooltip(
        message: tip,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: selected ? null : () => onChanged(v),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: 38,
            height: 34,
            decoration: BoxDecoration(
              color: selected ? pill : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: Colors.black
                              .withValues(alpha: dark ? 0.3 : 0.08),
                          blurRadius: 6,
                          offset: const Offset(0, 2))
                    ]
                  : null,
            ),
            child: Icon(icon,
                size: 17, color: selected ? active : muted),
          ),
        ),
      );
    }

    return Container(
      height: 42,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
          color: track, borderRadius: BorderRadius.circular(14)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        cell(FeedView.card, Icons.view_agenda_outlined, 'Card view'),
        const SizedBox(width: 2),
        cell(FeedView.compact, Icons.density_small, 'Compact view'),
        const SizedBox(width: 2),
        cell(FeedView.media, Icons.photo_library_outlined, 'Media view'),
      ]),
    );
  }
}

/// Compact view: a dense one/two-line row — Reddit's "compact" mode.
class _CompactPostRow extends StatelessWidget {
  const _CompactPostRow({required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(
        post.community.accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: context.colors.muted,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (post.posterUrl != null) ...[
            PosterThumb(
                url: post.posterUrl, square: post.square, w: 34),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                        color: context.brandInk)),
                const SizedBox(height: 4),
                Row(children: [
                  _CommunityTag(
                      community: post.community,
                      tone: tone,
                      dense: true),
                  Text('  ·  ',
                      style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: tone.text)),
                  Flexible(
                    child: _AuthorTag(
                      author: post.author,
                      trailing: '  ·  ${_ago(post.ageHours)}',
                      style: TextStyle(
                          fontSize: 10.5, color: context.brandMuted),
                    ),
                  ),
                ]),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(children: [
            Icon(Icons.keyboard_arrow_up,
                size: 18, color: context.brandMuted),
            Text(_compact(post.score),
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: context.brandInk)),
            Row(children: [
              Icon(Icons.mode_comment_outlined,
                  size: 11, color: context.brandMuted),
              const SizedBox(width: 3),
              Text('${post.comments.length}',
                  style: TextStyle(
                      fontSize: 10.5, color: context.brandMuted)),
            ]),
          ]),
        ]),
      ),
    );
  }
}

/// Media view: poster-forward, immersive — large cover with the title and
/// vote/comment bar over a gradient scrim.
class _MediaPostCard extends StatelessWidget {
  const _MediaPostCard({required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(
        post.community.accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 200,
              width: double.infinity,
              child: Stack(fit: StackFit.expand, children: [
                if (post.posterUrl != null)
                  Image.network(post.posterUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          ColoredBox(color: tone.iconCircleBg))
                else
                  Center(
                    child: Icon(Icons.forum_outlined,
                        size: 48, color: tone.iconCircleFg),
                  ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.65),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 12,
                  top: 12,
                  child:
                      _CommunityTag(community: post.community, tone: tone),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: 12,
                  child: Text(post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          height: 1.2,
                          color: Colors.white)),
                ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Row(children: [
                Icon(Icons.keyboard_arrow_up,
                    size: 20, color: context.brandMuted),
                const SizedBox(width: 4),
                Text(_compact(post.score),
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: context.brandInk)),
                const SizedBox(width: 16),
                Icon(Icons.mode_comment_outlined,
                    size: 16, color: context.brandMuted),
                const SizedBox(width: 5),
                Text('${post.comments.length}',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: context.brandMuted)),
                const Spacer(),
                _AuthorTag(
                  author: post.author,
                  trailing: ' · ${_ago(post.ageHours)}',
                  style: TextStyle(
                      fontSize: 11, color: context.brandMuted),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Post detail + comments
// ---------------------------------------------------------------------------

class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.postId});
  final String postId;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    ref.read(feedProvider.notifier).addComment(widget.postId, text);
    _ctrl.clear();
    FocusScope.of(context).unfocus();
    showBanner('Comment added',
        type: AdaptiveSnackBarType.success,
        duration: const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    final post = ref
        .watch(feedProvider)
        .firstWhere((p) => p.id == widget.postId,
            orElse: () => ref.read(feedProvider).first);
    final tone = contentAccent(
        post.community.accent, Theme.of(context).brightness);
    final meta = [
      if (post.creator != null) post.creator!,
      if (post.year != null) '${post.year}',
    ].join(' · ');

    return Scaffold(
      backgroundColor: brandBg(Theme.of(context).brightness),
      appBar: AppBar(
        backgroundColor: brandBg(Theme.of(context).brightness),
        title: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _openCommunity(context, post.community),
          child: Text(post.community.tag,
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: context.brandInk)),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: tone.surfaceGradient),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tone.surfaceBorder),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _VoteRail(post: post),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _AuthorTag(
                              author: post.author,
                              trailing: ' · ${_ago(post.ageHours)}',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: context.brandMuted),
                            ),
                            const SizedBox(height: 8),
                            Text(post.title,
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    height: 1.25,
                                    color: context.brandInk)),
                            if (post.posterUrl != null) ...[
                              const SizedBox(height: 12),
                              Row(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  PosterThumb(
                                      url: post.posterUrl,
                                      square: post.square,
                                      w: 64),
                                  const SizedBox(width: 12),
                                  if (meta.isNotEmpty)
                                    Expanded(
                                      child: Text(meta,
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight:
                                                  FontWeight.w600,
                                              color:
                                                  context.brandMuted)),
                                    ),
                                ],
                              ),
                            ],
                            if (post.body != null) ...[
                              const SizedBox(height: 12),
                              Text(post.body!,
                                  style: TextStyle(
                                      fontSize: 14,
                                      height: 1.5,
                                      color: context.brandInk)),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Eyebrow('${post.comments.length} comments'),
                const SizedBox(height: 12),
                if (post.comments.isEmpty)
                  Subtitle('No comments yet — start the conversation.')
                else
                  for (var i = 0; i < post.comments.length; i++)
                    _CommentTile(
                        c: post.comments[i],
                        postId: post.id,
                        index: i),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      hintText: 'Add a comment…',
                      isDense: true,
                      filled: true,
                      fillColor: context.colors.muted,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(999),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _submit,
                  icon: const Icon(Icons.send_rounded),
                  color: Tw.indigo500,
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _CommentTile extends ConsumerWidget {
  const _CommentTile(
      {required this.c, required this.postId, required this.index});
  final FeedComment c;
  final String postId;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final key = '$postId#$index';
    final vote = ref.watch(commentVotesProvider)[key] ?? 0;
    final notifier = ref.read(commentVotesProvider.notifier);
    final score = c.score + vote;
    Color voteColor(int dir) => vote == dir
        ? (dir > 0 ? Tw.indigo500 : Tw.rose500)
        : context.brandMuted;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colors.muted,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _AuthorTag(
              author: c.author,
              bold: true,
              style: const TextStyle(fontSize: 12),
            ),
            const SizedBox(width: 8),
            Text(_ago(c.ageHours),
                style: TextStyle(
                    fontSize: 11, color: context.brandMuted)),
            const Spacer(),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => notifier.setVote(key, 1),
              child: Padding(
                padding: const EdgeInsets.all(2),
                child: Icon(Icons.keyboard_arrow_up,
                    size: 18, color: voteColor(1)),
              ),
            ),
            const SizedBox(width: 2),
            Text('$score',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: vote != 0
                        ? voteColor(vote)
                        : context.brandInk)),
            const SizedBox(width: 2),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => notifier.setVote(key, -1),
              child: Padding(
                padding: const EdgeInsets.all(2),
                child: Icon(Icons.keyboard_arrow_down,
                    size: 18, color: voteColor(-1)),
              ),
            ),
          ]),
          const SizedBox(height: 6),
          Text(c.body,
              style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: context.brandInk)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Composer (in-memory new post)
// ---------------------------------------------------------------------------

class _Composer extends ConsumerStatefulWidget {
  const _Composer({required this.initialCommunity});
  final FeedCommunity initialCommunity;

  @override
  ConsumerState<_Composer> createState() => _ComposerState();
}

class _ComposerState extends ConsumerState<_Composer> {
  static const _maxTitle = 120;
  static final _flairKeys = kFeedFlairs.keys.toList();
  static final _flairLabels = ['None', ..._flairKeys];

  late FeedCommunity _community = widget.initialCommunity;
  String? _flair;
  final _title = TextEditingController();
  final _body = TextEditingController();
  final _cover = TextEditingController();
  final _creator = TextEditingController();
  final _year = TextEditingController();

  @override
  void initState() {
    super.initState();
    for (final c in [_title, _cover, _creator]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    for (final c in [_title, _body, _cover, _creator, _year]) {
      c.dispose();
    }
    super.dispose();
  }

  Color get _accent =>
      contentAccent(_community.accent, Theme.of(context).brightness)
          .dot;

  bool get _valid => _title.text.trim().isNotEmpty;

  void _post() {
    if (!_valid) return;
    ref.read(feedProvider.notifier).addPost(
          _community,
          _title.text.trim(),
          _body.text,
          flair: _flair,
          posterUrl: _cover.text,
          creator: _creator.text,
          year: int.tryParse(_year.text.trim()),
        );
    Navigator.of(context).pop();
    showBanner('Posted to ${_community.label}',
        type: AdaptiveSnackBarType.success,
        duration: const Duration(seconds: 2));
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Align(
            alignment: Alignment.centerLeft, child: Eyebrow(text)),
      );

  @override
  Widget build(BuildContext context) {
    final remaining = _maxTitle - _title.text.characters.length;
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.9),
        padding: EdgeInsets.fromLTRB(
            16, 12, 16, MediaQuery.of(context).padding.bottom + 16),
        decoration: BoxDecoration(
          color: brandBg(Theme.of(context).brightness),
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 44,
            height: 4,
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
                color: context.colors.border,
                borderRadius: BorderRadius.circular(999)),
          ),
          Row(children: [
            const BrandHeading('New post', size: 20),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: _accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999)),
              child: Text(_community.tag,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: _accent)),
            ),
          ]),
          const SizedBox(height: 8),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.only(top: 6),
              children: [
                _label('Community'),
                BrandSegmented(
                  color: _accent,
                  labels: const ['Movies', 'Books', 'Music'],
                  selectedIndex: _community.index,
                  onValueChanged: (i) => setState(
                      () => _community = FeedCommunity.values[i]),
                ),
                _label('Flair'),
                BrandSegmented(
                  color: _flair == null
                      ? Tw.indigo500
                      : kFeedFlairs[_flair]!,
                  labels: _flairLabels,
                  selectedIndex: _flair == null
                      ? 0
                      : _flairKeys.indexOf(_flair!) + 1,
                  onValueChanged: (i) => setState(() =>
                      _flair = i == 0 ? null : _flairKeys[i - 1]),
                ),
                _label('Title'),
                AdaptiveTextField(
                  controller: _title,
                  placeholder: 'A clear, specific title',
                  inputFormatters: [
                    LengthLimitingTextInputFormatter(_maxTitle)
                  ],
                  suffix: Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: Text('$remaining',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: remaining < 0
                                ? Tw.rose500
                                : context.brandMuted)),
                  ),
                ),
                const SizedBox(height: 10),
                AdaptiveTextField(
                  controller: _body,
                  placeholder: 'Say something (optional)',
                  minLines: 3,
                  maxLines: 6,
                ),
                _label('Attach a pick (optional)'),
                AdaptiveTextField(
                  controller: _cover,
                  placeholder: 'Cover image URL',
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    flex: 3,
                    child: AdaptiveTextField(
                      controller: _creator,
                      placeholder: 'Creator / artist',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: AdaptiveTextField(
                      controller: _year,
                      placeholder: 'Year',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ]),
                if (_cover.text.trim().isNotEmpty ||
                    _title.text.trim().isNotEmpty) ...[
                  _label('Preview'),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.colors.muted,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: _accent.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        PosterThumb(
                            url: _cover.text.trim(),
                            square:
                                _community == FeedCommunity.music,
                            w: 44),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              if (_flair != null)
                                Padding(
                                  padding: const EdgeInsets.only(
                                      bottom: 4),
                                  child: Text(_flair!.toUpperCase(),
                                      style: TextStyle(
                                          fontSize: 9,
                                          fontWeight:
                                              FontWeight.w900,
                                          letterSpacing: 0.5,
                                          color: kFeedFlairs[
                                              _flair])),
                                ),
                              Text(
                                  _title.text.trim().isEmpty
                                      ? 'Your title…'
                                      : _title.text.trim(),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: context.brandInk)),
                              if (_creator.text.trim().isNotEmpty)
                                Text(_creator.text.trim(),
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: context.brandMuted)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: AdaptiveButton(
                    onPressed: _valid ? _post : null,
                    label: 'Post to ${_community.label}',
                    color: _accent,
                  ),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

/// Animated Follow / Following toggle. Color + icon + label morph with a
/// scale-fade switch and an animated background; in-memory only.
class _FollowButton extends ConsumerWidget {
  const _FollowButton({required this.username, required this.tone});
  final String username;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final following =
        ref.watch(followingProvider).contains(username);
    final fg = following ? tone.iconCircleFg : Colors.white;
    return GestureDetector(
      onTap: () {
        final nowFollowing = !following;
        ref.read(followingProvider.notifier).toggle(username);
        showBanner(
          nowFollowing
              ? 'Following u/$username'
              : 'Unfollowed u/$username',
          type: nowFollowing
              ? AdaptiveSnackBarType.success
              : AdaptiveSnackBarType.info,
          action: 'Undo',
          onAction: () =>
              ref.read(followingProvider.notifier).toggle(username),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOutCubic,
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: following ? tone.iconCircleBg : tone.dot,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color: following
                  ? tone.surfaceBorder
                  : Colors.transparent),
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          switchInCurve: Curves.easeOutBack,
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: ScaleTransition(scale: anim, child: child),
          ),
          child: Row(
            key: ValueKey(following),
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                  following
                      ? Icons.check_rounded
                      : Icons.person_add_alt_1,
                  size: 17,
                  color: fg),
              const SizedBox(width: 8),
              Text(following ? 'Following' : 'Follow',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Animated Join / Joined toggle for a community (mirrors [_FollowButton]).
class _JoinButton extends ConsumerWidget {
  const _JoinButton({required this.community, required this.tone});
  final FeedCommunity community;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final joined =
        ref.watch(joinedCommunitiesProvider).contains(community);
    final fg = joined ? tone.iconCircleFg : Colors.white;
    return GestureDetector(
      onTap: () {
        final nowJoined = !joined;
        ref.read(joinedCommunitiesProvider.notifier).toggle(community);
        showBanner(
          nowJoined
              ? 'Joined ${community.tag}'
              : 'Left ${community.tag}',
          type: nowJoined
              ? AdaptiveSnackBarType.success
              : AdaptiveSnackBarType.info,
          action: 'Undo',
          onAction: () => ref
              .read(joinedCommunitiesProvider.notifier)
              .toggle(community),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOutCubic,
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: joined ? tone.iconCircleBg : tone.dot,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color:
                  joined ? tone.surfaceBorder : Colors.transparent),
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          switchInCurve: Curves.easeOutBack,
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: ScaleTransition(scale: anim, child: child),
          ),
          child: Row(
            key: ValueKey(joined),
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(joined ? Icons.check_rounded : Icons.group_add,
                  size: 17, color: fg),
              const SizedBox(width: 8),
              Text(joined ? 'Joined' : 'Join',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Community page (subreddit-style, in-memory: derived from the feed)
// ---------------------------------------------------------------------------

/// Tap a `r/<community>` tag anywhere → this. Prototype only: posts,
/// member count etc. are computed from the in-memory feed.
class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key, required this.community});
  final FeedCommunity community;

  @override
  ConsumerState<CommunityScreen> createState() =>
      _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  FeedSort _sort = FeedSort.hot;

  /// Sort — `BrandSegmented`, color-coded per mode like the main feed.
  Widget _sortSegmented() {
    const sorts = [FeedSort.hot, FeedSort.newest, FeedSort.top];
    const colors = [Tw.rose500, Tw.emerald500, Tw.amber500];
    final idx = sorts.indexOf(_sort);
    return BrandSegmented(
      color: colors[idx],
      labels: const ['Hot', 'New', 'Top'],
      selectedIndex: idx,
      onValueChanged: (i) => setState(() => _sort = sorts[i]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final community = widget.community;
    final tone =
        contentAccent(community.accent, Theme.of(context).brightness);
    final posts = ref
        .watch(feedProvider)
        .where((p) => p.community == community)
        .toList();
    switch (_sort) {
      case FeedSort.hot:
        posts.sort((a, b) => b.hotRank.compareTo(a.hotRank));
      case FeedSort.newest:
        posts.sort((a, b) => a.ageHours.compareTo(b.ageHours));
      case FeedSort.top:
        posts.sort((a, b) => b.score.compareTo(a.score));
    }
    // Deterministic, subreddit-ish "members": distinct posters plus a
    // stable base so it reads like a real community.
    final members = posts.map((p) => p.author).toSet().length +
        1200 +
        community.index * 430;

    void openPost(String id) =>
        Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => PostDetailScreen(postId: id),
        ));

    Widget stat(String label, String value) => Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: context.brandInk)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 11, color: context.brandMuted)),
          ],
        );

    return Scaffold(
      backgroundColor: brandBg(Theme.of(context).brightness),
      appBar: AppBar(
        backgroundColor: brandBg(Theme.of(context).brightness),
        title: Text(community.tag,
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: context.brandInk)),
      ),
      floatingActionButton: _PostFab(
        color: tone.dot,
        label: 'Post to ${community.label}',
        onTap: () => showModalBottomSheet<void>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _Composer(initialCommunity: community),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: tone.surfaceGradient),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tone.surfaceBorder),
            ),
            child: Column(children: [
              Row(children: [
                Container(
                  width: 56,
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: tone.iconCircleBg,
                      shape: BoxShape.circle),
                  child: Icon(community.icon,
                      color: tone.iconCircleFg, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(community.tag,
                          style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: context.brandInk)),
                      const SizedBox(height: 3),
                      Text(community.blurb,
                          style: TextStyle(
                              fontSize: 12,
                              height: 1.35,
                              color: context.brandMuted)),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 14),
              _JoinButton(community: community, tone: tone),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  stat('Posts', '${posts.length}'),
                  stat('Members', _compact(members)),
                ],
              ),
            ]),
          ),
          const SizedBox(height: 20),
          _sortSegmented(),
          const SizedBox(height: 14),
          if (posts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Subtitle('No posts yet — be the first.',
                  center: true),
            )
          else
            for (final p in posts)
              _PostCard(post: p, onOpen: () => openPost(p.id)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// User profile (in-memory: derived from the feed)
// ---------------------------------------------------------------------------

/// Tap a `u/<name>` anywhere → this. Prototype only: everything is
/// computed from the in-memory feed (their posts, karma, comments).
class UserProfileScreen extends ConsumerWidget {
  const UserProfileScreen({super.key, required this.username});
  final String username;

  ContentAccentName get _accent {
    const names = ContentAccentName.values;
    return names[username.hashCode.abs() % names.length];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final all = ref.watch(feedProvider);
    final posts =
        all.where((p) => p.author == username).toList()
          ..sort((a, b) => a.ageHours.compareTo(b.ageHours));
    final karma =
        posts.fold<int>(0, (s, p) => s + p.score);
    final commentsMade = all.fold<int>(
        0,
        (s, p) =>
            s + p.comments.where((c) => c.author == username).length);
    final tone =
        contentAccent(_accent, Theme.of(context).brightness);
    final isYou = username == 'you';

    Widget stat(String label, String value) => Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: context.brandInk)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 11, color: context.brandMuted)),
          ],
        );

    void openPost(String id) =>
        Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => PostDetailScreen(postId: id),
        ));

    return Scaffold(
      backgroundColor: brandBg(Theme.of(context).brightness),
      appBar: AppBar(
        backgroundColor: brandBg(Theme.of(context).brightness),
        title: Text('u/$username',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: context.brandInk)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: tone.surfaceGradient),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tone.surfaceBorder),
            ),
            child: Column(children: [
              Row(children: [
                Container(
                  width: 56,
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: tone.iconCircleBg,
                      shape: BoxShape.circle),
                  child: Text(
                      username.isEmpty
                          ? '?'
                          : username[0].toUpperCase(),
                      style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: tone.iconCircleFg)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('u/$username',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: context.brandInk)),
                      const SizedBox(height: 2),
                      Text(
                          isYou
                              ? 'This is you'
                              : 'Member of the community',
                          style: TextStyle(
                              fontSize: 12,
                              color: context.brandMuted)),
                    ],
                  ),
                ),
              ]),
              if (!isYou) ...[
                const SizedBox(height: 14),
                _FollowButton(username: username, tone: tone),
              ],
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment:
                    MainAxisAlignment.spaceAround,
                children: [
                  stat('Posts', '${posts.length}'),
                  stat('Karma', _compact(karma)),
                  stat('Comments', '$commentsMade'),
                ],
              ),
            ]),
          ),
          const SizedBox(height: 20),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Posts')),
          const SizedBox(height: 10),
          if (posts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Subtitle('No posts yet.', center: true),
            )
          else
            for (final p in posts)
              _PostCard(post: p, onOpen: () => openPost(p.id)),
        ],
      ),
    );
  }
}
