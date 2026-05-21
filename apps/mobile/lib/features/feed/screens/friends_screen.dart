import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../widgets/person_row.dart';

/// The current user's social circle — a two-tab list of the people they
/// follow ("Following") and the people who follow them ("Followers"),
/// backed by feed_follows. Each row links to the profile and carries the
/// shared FollowButton, so you can unfollow from Following or follow back
/// from Followers. Reachable from the feed header and the profile stats.
class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key, this.initialTab = 0});

  /// 0 = Following, 1 = Followers.
  final int initialTab;

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen> {
  late int _tab = widget.initialTab.clamp(0, 1);

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    if (me == null) {
      return BrandScaffold(
        title: 'Friends',
        body: Center(
          child: Subtitle('Sign in to see your friends.', center: true),
        ),
      );
    }

    final following = ref.watch(followingProfilesProvider(me));
    final followers = ref.watch(followerProfilesProvider(me));
    final followingCount = following.value?.length;
    final followerCount = followers.value?.length;
    final list = _tab == 0 ? following : followers;

    return BrandScaffold(
      title: 'Friends',
      actions: [
        AdaptiveAppBarAction(
          title: 'Find people',
          icon: Icons.person_add_alt,
          iosSymbol: 'person.badge.plus',
          onPressed: () => context.push('/feed/people'),
        ),
      ],
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          BrandSegmented(
            color: Tw.indigo500,
            labels: [
              followingCount == null
                  ? 'Following'
                  : 'Following · $followingCount',
              followerCount == null
                  ? 'Followers'
                  : 'Followers · $followerCount',
            ],
            selectedIndex: _tab,
            onValueChanged: (i) => setState(() => _tab = i),
          ),
          const SizedBox(height: 16),
          ...list.when(
            loading: () => [
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: LoaderFive('Loading')),
              ),
            ],
            error: (_, _) => [
              MessageBanner.error(_tab == 0
                  ? 'We couldn’t load who you follow.'
                  : 'We couldn’t load your followers.'),
            ],
            data: (people) {
              if (people.isEmpty) return [_EmptyState(following: _tab == 0)];
              return [
                for (final p in people)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PersonRow(
                      id: p.id,
                      name: p.name,
                      avatarUrl: p.avatarUrl,
                      tone: personTone(context, p.id),
                    ),
                  ),
              ];
            },
          ),
        ],
      ),
    );
  }
}

/// Empty state for either tab — Following also offers a jump to discover.
class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.following});
  final bool following;

  @override
  Widget build(BuildContext context) {
    return BrandCard(
      child: Column(children: [
        Icon(following ? Icons.group_outlined : Icons.favorite_outline,
            size: 32, color: context.brandMuted),
        const SizedBox(height: 10),
        Subtitle(
            following
                ? 'You’re not following anyone yet.'
                : 'No one follows you yet.',
            center: true),
        if (following) ...[
          const SizedBox(height: 14),
          AdaptiveButton(
            onPressed: () => context.push('/feed/people'),
            label: 'Find people to follow',
          ),
        ],
      ]),
    );
  }
}
