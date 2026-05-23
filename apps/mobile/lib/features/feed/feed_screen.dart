import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../ui/ui.dart';
import '../notifications/notifications_center.dart';
import 'feed_providers.dart';
import 'models/feed_models.dart';
import 'widgets/ai_nudge_card.dart';
import 'widgets/composer.dart';
import 'widgets/feed_cards.dart';
import 'widgets/finished_nudge_card.dart';

/// Experimental Reddit-style social taste feed — the home/landing surface.
///
/// UI only: everything is in-memory seeded data (a [feedProvider] notifier
/// over [FeedService]); only per-device prefs/visibility persist
/// (SharedPreferences). The models/services/widgets/screens live in
/// sibling files — this file is just the list + segmented controls + FAB.
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  List<FeedPost> _visible(
      List<FeedPost> posts, Set<String> following, FeedPrefs prefs) {
    var filtered = prefs.community == null
        ? [...posts]
        : posts.where((p) => p.community == prefs.community).toList();
    // Scope = which posts make the cut.
    switch (prefs.scope) {
      case FeedScope.friends:
        filtered = filtered
            .where((p) => p.activity != FeedActivity.group)
            .where((p) =>
                following.isEmpty || following.contains(p.authorId))
            .toList();
      case FeedScope.discover:
        filtered = filtered
            .where((p) => p.activity != FeedActivity.group)
            .toList();
      case FeedScope.group:
        filtered = filtered
            .where((p) => p.activity == FeedActivity.group)
            .toList();
    }
    // Sort = how they're ordered (separate axis from scope).
    switch (prefs.sort) {
      case FeedSort.newest:
        filtered.sort((a, b) => a.ageHours.compareTo(b.ageHours));
      case FeedSort.top:
        filtered.sort((a, b) => b.score.compareTo(a.score));
      case FeedSort.hot:
        // Score / time-decay (FeedPost.hotRank).
        filtered.sort((a, b) => b.hotRank.compareTo(a.hotRank));
    }
    return filtered;
  }

  /// Pull-to-refresh — refetch the feed (and the follow graph it filters
  /// against) and wait for the result so the spinner times out cleanly.
  Future<void> _refresh() async {
    Haptics.impact(HapticImpactStyle.medium);
    ref.invalidate(feedProvider);
    ref.invalidate(followingProvider);
    await ref.read(feedProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(feedPrefsProvider);
    // visibleFeedProvider already filters out posts + comments authored
    // by blocked users; we re-apply scope/community/follow filters here.
    final feedAsync = ref.watch(visibleFeedProvider);
    final following =
        ref.watch(followingProvider).value?.toSet() ?? <String>{};
    final visibility = ref.watch(feedVisibilityProvider);
    final fabColor = prefs.community == null
        ? Tw.indigo500
        : contentAccent(
                prefs.community!.accent, Theme.of(context).brightness)
            .dot;
    return BrandScaffold(
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          Row(
            children: [
              const Expanded(child: BrandHeading('Feed', size: 32)),
              const _NotificationsBell(),
              _FriendsButton(
                  onTap: () => context.push('/feed/friends')),
              const SizedBox(width: 2),
              _VisibilityPill(visibility: visibility),
            ],
          ),
          const SizedBox(height: 4),
          Subtitle('What your people are into right now.'),
          const SizedBox(height: 14),
          const FinishedNudgeCard(),
          const AiNudgeCard(),
          _communitySegmented(prefs),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: _scopeSegmented(prefs)),
            const SizedBox(width: 8),
            FeedViewToggle(
              value: prefs.view,
              onChanged: (v) =>
                  ref.read(feedPrefsProvider.notifier).setView(v),
            ),
          ]),
          const SizedBox(height: 8),
          _sortSegmented(prefs),
          const SizedBox(height: 14),
          ...feedAsync.when(
            loading: () => [
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: LoaderFive('Loading feed')),
              ),
            ],
            error: (_, _) => [
              const MessageBanner.error(
                  'We couldn’t load the feed. Please try again.'),
            ],
            data: (all) {
              final posts = _visible(all, following, prefs);
              if (posts.isEmpty) {
                return [
                  BrandCard(
                    child: Column(children: [
                      Icon(Icons.forum_outlined,
                          size: 32, color: context.brandMuted),
                      const SizedBox(height: 10),
                      Subtitle(
                          'Nothing here yet — be the first to post.',
                          center: true),
                    ]),
                  ),
                ];
              }
              return [
                for (var i = 0; i < posts.length; i++)
                  _postFor(posts[i], prefs.view)
                      .animate()
                      .fadeIn(delay: (i * 60).ms, duration: 280.ms)
                      .slideY(begin: 0.05, curve: Curves.easeOut),
              ];
            },
          ),
        ],
          ),
          ),
          Positioned(
            right: 16,
            bottom: 16,
            child: PostFab(
              color: fabColor,
              label: prefs.community == null
                  ? 'Share a pick'
                  : 'Share to ${prefs.community!.label}',
              onTap: () => _openComposer(prefs.community),
            ),
          ),
        ],
      ),
    );
  }

  /// Community filter — `BrandSegmented`, color-coded to the selected
  /// community's content accent (All → indigo, Movies → amber, Books →
  /// emerald, Music → rose). Persisted via feed prefs.
  Widget _communitySegmented(FeedPrefs prefs) {
    const labels = ['All', 'Movies', 'Books', 'Music'];
    final idx =
        prefs.community == null ? 0 : prefs.community!.index + 1;
    return BrandSegmented(
      color: accentColorForLabel(labels[idx]),
      labels: labels,
      selectedIndex: idx,
      onValueChanged: (i) => ref
          .read(feedPrefsProvider.notifier)
          .setCommunity(
              i == 0 ? null : FeedCommunity.values[i - 1]),
    );
  }

  /// Sort axis (Reddit-style Trending / New / Top). Applied on top of
  /// the scope filter; color-coded to match the chosen sort.
  Widget _sortSegmented(FeedPrefs prefs) {
    const sorts = [FeedSort.hot, FeedSort.newest, FeedSort.top];
    const colors = [Tw.orange500, Tw.emerald500, Tw.violet500];
    final idx = sorts.indexOf(prefs.sort);
    return BrandSegmented(
      color: colors[idx],
      labels: const ['Trending', 'New', 'Top'],
      selectedIndex: idx,
      onValueChanged: (i) =>
          ref.read(feedPrefsProvider.notifier).setSort(sorts[i]),
    );
  }

  /// Scope — `BrandSegmented`, color-coded per tab (Friends → indigo,
  /// Discover → violet, Group → rose). Persisted via feed prefs.
  Widget _scopeSegmented(FeedPrefs prefs) {
    const scopes = [
      FeedScope.friends,
      FeedScope.discover,
      FeedScope.group
    ];
    const colors = [Tw.indigo500, Tw.violet500, Tw.rose500];
    final idx = scopes.indexOf(prefs.scope);
    return BrandSegmented(
      color: colors[idx],
      labels: const ['Friends', 'Discover', 'Group'],
      selectedIndex: idx,
      onValueChanged: (i) =>
          ref.read(feedPrefsProvider.notifier).setScope(scopes[i]),
    );
  }

  Widget _postFor(FeedPost p, FeedView view) {
    void onOpen() => openPost(context, p.id);
    return switch (view) {
      FeedView.card => PostCard(post: p, onOpen: onOpen),
      FeedView.compact => CompactPostRow(post: p, onOpen: onOpen),
      FeedView.media => MediaPostCard(post: p, onOpen: onOpen),
    };
  }

  void _openComposer(FeedCommunity? initial) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) =>
          Composer(initialCommunity: initial ?? FeedCommunity.movies),
    );
  }
}

/// Feed-header bell → the notification center, with an unread-count
/// badge. Tinted to match the other header chrome.
class _NotificationsBell extends ConsumerWidget {
  const _NotificationsBell();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadCountProvider);
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    return Semantics(
      button: true,
      label: unread > 0
          ? 'Notifications, $unread unread'
          : 'Notifications',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => context.push('/notifications'),
        child: ExcludeSemantics(
          child: SizedBox(
            width: 44,
            height: 44,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                      color: tone.iconCircleBg,
                      shape: BoxShape.circle),
                  child: Icon(Icons.notifications_none,
                      size: 18, color: tone.iconCircleFg),
                ),
                if (unread > 0)
                  Positioned(
                    top: 3,
                    right: 3,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 1),
                      constraints:
                          const BoxConstraints(minWidth: 16),
                      decoration: BoxDecoration(
                        color: Tw.rose500,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                            color: brandBg(
                                Theme.of(context).brightness),
                            width: 1.5),
                      ),
                      child: Text(
                        unread > 9 ? '9+' : '$unread',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.35),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Small icon button in the feed header that opens the Friends list (your
/// follow graph; discover-people is one tap further in). Tinted to match
/// the Public/Private pill's chrome.
class _FriendsButton extends StatelessWidget {
  const _FriendsButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    return Semantics(
      button: true,
      label: 'Your friends',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(Icons.people_alt_rounded,
                size: 18, color: tone.iconCircleFg),
          ),
        ),
      ),
    );
  }
}

/// Public/Private profile pill near the feed header — mirrors the web
/// `/feed` top pill. Tapping opens an inline visibility sheet so the user
/// can flip Public/Private without leaving the feed.
class _VisibilityPill extends ConsumerWidget {
  const _VisibilityPill({required this.visibility});
  final FeedVisibility visibility;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPrivate = visibility == FeedVisibility.private;
    final tone = contentAccent(
        isPrivate ? ContentAccentName.rose : ContentAccentName.emerald,
        Theme.of(context).brightness);
    return Semantics(
      button: true,
      label: isPrivate
          ? 'Profile is private. Change feed visibility'
          : 'Profile is public. Change feed visibility',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _showVisibilitySheet(context, ref, visibility),
        child: ExcludeSemantics(
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: tone.iconCircleBg,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(isPrivate ? Icons.lock_outline : Icons.public,
                  size: 14, color: tone.iconCircleFg),
              const SizedBox(width: 6),
              Text(isPrivate ? 'Private' : 'Public',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: tone.iconCircleFg)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Inline bottom sheet for flipping feed visibility — the pill used to
/// deep-link into Settings, which was a heavy detour for a one-tap toggle.
void _showVisibilitySheet(
    BuildContext context, WidgetRef ref, FeedVisibility current) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final c = sheetContext.colors;
      return SafeArea(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
          decoration: BoxDecoration(
            color: c.background,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: c.border),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Feed visibility',
                  style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: c.foreground)),
              const SizedBox(height: 14),
              _VisibilityOption(
                icon: Icons.public,
                accent: ContentAccentName.emerald,
                title: 'Public',
                body: 'Your finished, rated and shared picks appear in '
                    'other people\'s feeds, and people can follow you '
                    'directly.',
                selected: current == FeedVisibility.public,
                onTap: () {
                  ref
                      .read(feedVisibilityProvider.notifier)
                      .set(FeedVisibility.public);
                  Navigator.of(sheetContext).pop();
                },
              ),
              const SizedBox(height: 10),
              _VisibilityOption(
                icon: Icons.lock_outline,
                accent: ContentAccentName.rose,
                title: 'Private',
                body: 'You can still browse and post normally, but your '
                    'activity isn\'t broadcast and new followers are '
                    'request-only.',
                selected: current == FeedVisibility.private,
                onTap: () {
                  ref
                      .read(feedVisibilityProvider.notifier)
                      .set(FeedVisibility.private);
                  Navigator.of(sheetContext).pop();
                },
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _VisibilityOption extends StatelessWidget {
  const _VisibilityOption({
    required this.icon,
    required this.accent,
    required this.title,
    required this.body,
    required this.selected,
    required this.onTap,
  });
  final IconData icon;
  final ContentAccentName accent;
  final String title;
  final String body;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final tone = contentAccent(accent, Theme.of(context).brightness);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? tone.iconCircleBg : c.muted,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: selected ? tone.iconCircleFg : c.border),
        ),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(icon, size: 18, color: tone.iconCircleFg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: c.foreground)),
                const SizedBox(height: 2),
                Text(body,
                    style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: c.mutedForeground)),
              ],
            ),
          ),
          if (selected) ...[
            const SizedBox(width: 8),
            Icon(Icons.check_circle, size: 20, color: tone.iconCircleFg),
          ],
        ]),
      ),
    );
  }
}

