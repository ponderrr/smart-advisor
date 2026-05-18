import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/composer.dart';
import '../widgets/feed_cards.dart';
import '../widgets/follow_button.dart';

/// Subreddit-style community page. Prototype-only and a mobile extra (not on
/// the web): posts/member count etc. are computed from the in-memory feed.
class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key, required this.community});
  final FeedCommunity community;

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  FeedSort _sort = FeedSort.hot;

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
    final members = posts.map((p) => p.author).toSet().length +
        1200 +
        community.index * 430;

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
      floatingActionButton: PostFab(
        color: tone.dot,
        label: 'Share to ${community.label}',
        onTap: () => showModalBottomSheet<void>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => Composer(initialCommunity: community),
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
              JoinButton(community: community, tone: tone),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  stat('Posts', '${posts.length}'),
                  stat('Members', compactCount(members)),
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
              PostCard(
                  post: p,
                  onOpen: () => openPost(context, p.id)),
        ],
      ),
    );
  }
}
