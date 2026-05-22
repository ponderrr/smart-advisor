import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/feed_cards.dart';
import '../widgets/follow_button.dart';

/// A profile's library — RLS returns rows only when it's public or yours.
final _userLibraryProvider = FutureProvider.autoDispose
    .family<List<LibraryItem>, String>((ref, id) async {
  final r = await ref.watch(libraryServiceProvider).listForUser(id);
  return r.data ?? const <LibraryItem>[];
});

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
    final followingCount =
        ref.watch(followingProfilesProvider(profileId)).value?.length ?? 0;

    final profile = profileAsync.value;
    final name = profile?.name ?? 'Someone';
    final posts = postsAsync.value ?? const <FeedPost>[];

    // Library + plan-to-watch — gated by the profile's library privacy.
    final libraryPublic =
        ref.watch(libraryPublicProvider(profileId)).value ?? true;
    final library = ref.watch(_userLibraryProvider(profileId)).value ??
        const <LibraryItem>[];
    final logged = [
      for (final i in library)
        if (i.status != LibraryStatus.wishlist) i
    ];
    final watchlist = [
      for (final i in library)
        if (i.status == LibraryStatus.wishlist) i
    ];
    final showLibrary = isYou || libraryPublic;

    Widget stat(String label, String value, {VoidCallback? onTap}) {
      final column = Column(
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
      if (onTap == null) return column;
      // Tappable stat → the friends list. Padded so it has a comfortable
      // tap target inside the spaced-around row.
      return Semantics(
        button: true,
        label: '$value $label',
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: column,
          ),
        ),
      );
    }

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
                        // Following / Followers open the friends list —
                        // only your own, since the list is the signed-in
                        // user's follow graph.
                        stat('Following', compactCount(followingCount),
                            onTap: isYou
                                ? () => context.push('/feed/friends')
                                : null),
                        stat('Followers', compactCount(followers),
                            onTap: isYou
                                ? () => context
                                    .push('/feed/friends?tab=followers')
                                : null),
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
                const SizedBox(height: 22),
                if (!showLibrary)
                  BrandCard(
                    child: Row(children: [
                      Icon(Icons.lock_outline,
                          size: 18, color: context.brandMuted),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Subtitle(
                            '$name keeps their library private.'),
                      ),
                    ]),
                  )
                else ...[
                  Align(
                      alignment: Alignment.centerLeft,
                      child: Eyebrow('Library')),
                  const SizedBox(height: 10),
                  if (logged.isEmpty)
                    Subtitle('Nothing logged yet.')
                  else
                    _PosterStrip(items: logged),
                  if (watchlist.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Align(
                        alignment: Alignment.centerLeft,
                        child: Eyebrow('Plan to watch')),
                    const SizedBox(height: 10),
                    _PosterStrip(items: watchlist),
                  ],
                ],
              ],
            ),
    );
  }
}

/// Horizontal strip of library poster thumbnails for a profile section.
class _PosterStrip extends StatelessWidget {
  const _PosterStrip({required this.items});
  final List<LibraryItem> items;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 164,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final it = items[i];
          return SizedBox(
            width: 84,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: PosterThumb(
                    url: it.posterUrl,
                    square: it.medium == LibraryMedium.music,
                    w: 84,
                    semanticLabel: '${it.title} cover',
                  ),
                ),
                const SizedBox(height: 4),
                Text(it.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                        color: context.brandInk)),
              ],
            ),
          );
        },
      ),
    );
  }
}
