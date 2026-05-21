import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/feed_cards.dart';
import '../widgets/follow_button.dart';

/// Public profile — port of the web `src/app/feed/u/[id]/page.tsx`.
/// FeedAvatar 64, "followers · picks", a [FollowButton] + Block toggle when
/// it isn't you, and an authored-picks list linking to `/feed/:id`.
/// Everything is backend-backed: identified by profile id.
///
/// Your own profile uses the same layout, minus the Follow / Block
/// controls (you can't follow or block yourself).
class UserProfileScreen extends ConsumerWidget {
  const UserProfileScreen({super.key, required this.profileId});
  final String profileId;

  ContentAccentName get _accent {
    const names = ContentAccentName.values;
    return names[profileId.hashCode.abs() % names.length];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    final isYou = profileId == me;
    final tone = contentAccent(_accent, Theme.of(context).brightness);

    final profileAsync = ref.watch(feedProfileProvider(profileId));
    final postsAsync = ref.watch(userPostsProvider(profileId));
    final isFollowing =
        ref.watch(followingProvider).value?.contains(profileId) ?? false;
    final followerCount =
        ref.watch(followerCountProvider(profileId)).value ?? 0;
    final followers = followerCount + (isFollowing ? 1 : 0);

    final profile = profileAsync.value;
    final name = profile?.name ?? 'Someone';
    final posts = postsAsync.value ?? const <FeedPost>[];

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
      title: isYou ? 'Your profile' : name,
      body: profileAsync.isLoading && profile == null
          ? const Center(child: LoaderFive('Loading'))
          : ListView(
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
                      FeedAvatar(
                          name: name,
                          url: profile?.avatarUrl,
                          size: 64),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(isYou ? 'You' : name,
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: context.brandInk)),
                            const SizedBox(height: 4),
                            Text(
                                '$followers followers · '
                                '${posts.length} ${posts.length == 1 ? 'pick' : 'picks'}',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: tone.text)),
                          ],
                        ),
                      ),
                    ]),
                    // Follow / Block only make sense on someone else's
                    // profile.
                    if (!isYou) ...[
                      const SizedBox(height: 14),
                      FollowButton(
                          authorId: profileId,
                          authorName: name,
                          tone: tone,
                          showCount: true),
                      const SizedBox(height: 8),
                      // Block toggle on the profile page — labelled, not
                      // hidden behind a menu, since blocking from a profile
                      // is a deliberate action and discoverability matters.
                      Builder(builder: (context) {
                        final blocked = ref
                                .watch(blockedProvider)
                                .value
                                ?.contains(profileId) ??
                            false;
                        return AdaptiveButton(
                          onPressed: () {
                            if (blocked) {
                              ref
                                  .read(feedActionsProvider)
                                  .unblock(profileId);
                              showBanner('@$name unblocked.');
                            } else {
                              ref
                                  .read(feedActionsProvider)
                                  .block(profileId);
                              showBanner('Blocked @$name.');
                            }
                          },
                          label: blocked ? 'Unblock' : 'Block',
                          style: AdaptiveButtonStyle.bordered,
                        );
                      }),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        stat('Picks', '${posts.length}'),
                        stat('Followers', compactCount(followers)),
                      ],
                    ),
                  ]),
                ),
                const SizedBox(height: 20),
                Align(
                    alignment: Alignment.centerLeft,
                    child: Eyebrow(isYou ? 'Your picks' : "$name's picks")),
                const SizedBox(height: 10),
                if (postsAsync.isLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: LoaderFive('Loading')),
                  )
                else if (posts.isEmpty)
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
