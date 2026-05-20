import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';
import '../../feed/feed_providers.dart';
import '../../feed/models/feed_models.dart';
import '../../feed/screens/blocked_people_screen.dart';
import 'settings_helpers.dart';

/// Feed settings — the relocated `_FeedSettingsCard`, plus a navigable
/// "Add friends" row that pushes the discover-people screen.
class FeedSettingsScreen extends ConsumerWidget {
  const FeedSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BrandScaffold(
      title: 'Feed',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _FeedSettingsCard(
              rowLabel: (t) => settingsRowLabel(context, t),
              divider: settingsDivider,
            ),
            settingsSection(context, 'People'),
            BrandCard(
              padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 6),
              child: Column(children: [
                settingsTile(context, Icons.person_add_alt, 'Add friends',
                    subtitle: 'Find people to follow',
                    onTap: () => context.push('/feed/people')),
                settingsDivider(context),
                Consumer(builder: (context, ref, _) {
                  final blocked = ref.watch(blockedProvider);
                  return settingsTile(context, Icons.block, 'Blocked people',
                      subtitle: blocked.isEmpty
                          ? 'Nobody blocked'
                          : '${blocked.length} blocked',
                      onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) =>
                                    const BlockedPeopleScreen()),
                          ));
                }),
              ]),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      ),
    );
  }
}

/// Feed section — port of the web settings/page.tsx "Feed" block.
/// Visibility (Public/Private) bound to [feedVisibilityProvider] with the
/// web hint copy; default view/scope/community + comment sort bound to
/// [feedPrefsProvider]. All per-device (no backend), matching the web.
class _FeedSettingsCard extends ConsumerWidget {
  const _FeedSettingsCard(
      {required this.rowLabel, required this.divider});
  final Widget Function(String) rowLabel;
  final Widget Function(BuildContext) divider;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visibility = ref.watch(feedVisibilityProvider);
    final prefs = ref.watch(feedPrefsProvider);
    final isPrivate = visibility == FeedVisibility.private;

    const communityLabels = ['All', 'Movies', 'Books', 'Music'];
    final communityIdx =
        prefs.community == null ? 0 : prefs.community!.index + 1;
    const scopes = [
      FeedScope.friends,
      FeedScope.discover,
      FeedScope.group
    ];
    const views = [FeedView.card, FeedView.compact, FeedView.media];

    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          rowLabel('Profile visibility'),
          const SizedBox(height: 2),
          Subtitle(isPrivate
              ? 'You still browse and post normally, but your '
                  'activity isn’t broadcast and follows are '
                  'request-only.'
              : 'Your finished / rated / shared picks appear in '
                  'others’ feeds and people can follow you directly.'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: isPrivate ? Tw.rose500 : Tw.emerald500,
            labels: const ['Public', 'Private'],
            selectedIndex: isPrivate ? 1 : 0,
            onValueChanged: (i) => ref
                .read(feedVisibilityProvider.notifier)
                .set(i == 1
                    ? FeedVisibility.private
                    : FeedVisibility.public),
          ),
          divider(context),
          rowLabel('Default view'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: Tw.indigo500,
            labels: const ['Cards', 'Compact', 'Media'],
            selectedIndex: views.indexOf(prefs.view),
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setView(views[i]),
          ),
          const SizedBox(height: 12),
          rowLabel('Default scope'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: const [
              Tw.indigo500,
              Tw.violet500,
              Tw.rose500
            ][scopes.indexOf(prefs.scope)],
            labels: const ['Friends', 'Discover', 'Group'],
            selectedIndex: scopes.indexOf(prefs.scope),
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setScope(scopes[i]),
          ),
          const SizedBox(height: 12),
          rowLabel('Default community'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: accentColorForLabel(communityLabels[communityIdx]),
            labels: communityLabels,
            selectedIndex: communityIdx,
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setCommunity(i == 0
                    ? null
                    : FeedCommunity.values[i - 1]),
          ),
          const SizedBox(height: 12),
          rowLabel('Comment sort'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: Tw.amber500,
            labels: const ['Top', 'New'],
            selectedIndex:
                prefs.commentSort == CommentSort.newest ? 1 : 0,
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setCommentSort(i == 1
                    ? CommentSort.newest
                    : CommentSort.top),
          ),
        ],
      ),
    );
  }
}
