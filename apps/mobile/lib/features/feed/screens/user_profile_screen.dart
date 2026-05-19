import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../ui/ui.dart';
import '../../dashboard/dashboard_screen.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/feed_cards.dart';
import '../widgets/follow_button.dart';

/// Public profile — port of the web `src/app/feed/u/[name]/page.tsx`.
/// FeedAvatar 64, "followers · picks · comments" (via mockFollowerCount),
/// FollowButton when it isn't you, and an authored-picks list linking to
/// `/feed/:id`. Everything is derived from the in-memory feed.
///
/// Mobile divergence (intentional, see project memory): your *own* profile
/// is your taste dashboard — the old Home screen, reused here.
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
    final following = ref.watch(followingProvider).contains(username);
    final posts = all.where((p) => p.author == username).toList();
    final commentsMade = all.fold<int>(
        0,
        (s, p) =>
            s + p.comments.where((c) => c.author == username).length);
    final tone = contentAccent(_accent, Theme.of(context).brightness);
    final isYou = username == 'you';

    if (isYou) {
      return const BrandScaffold(
        title: 'Your taste',
        body: DashboardScreen(),
      );
    }

    final followers =
        mockFollowerCount(username) + (following ? 1 : 0);

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

    return BrandScaffold(
      title: 'u/$username',
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
                FeedAvatar(name: username, size: 64),
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
                      const SizedBox(height: 4),
                      Text(
                          '$followers followers · '
                          '${posts.length} ${posts.length == 1 ? 'pick' : 'picks'} · '
                          '$commentsMade ${commentsMade == 1 ? 'comment' : 'comments'}',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: tone.text)),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 14),
              FollowButton(
                  username: username, tone: tone, showCount: true),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  stat('Picks', '${posts.length}'),
                  stat('Followers', compactCount(followers)),
                  stat('Comments', '$commentsMade'),
                ],
              ),
            ]),
          ),
          const SizedBox(height: 20),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow("$username's picks")),
          const SizedBox(height: 10),
          if (posts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Subtitle('Nothing shared yet.', center: true),
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
