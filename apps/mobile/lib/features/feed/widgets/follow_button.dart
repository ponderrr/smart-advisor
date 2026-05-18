import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';

/// Animated Follow / Following toggle. Color + icon + label morph with a
/// scale-fade switch and an animated background; in-memory only.
///
/// Parity with the web `follow-button.tsx`: you can't follow yourself
/// (`author == 'you'` renders nothing), and [showCount] appends the
/// deterministic mock follower count after the label.
class FollowButton extends ConsumerWidget {
  const FollowButton({
    super.key,
    required this.username,
    required this.tone,
    this.showCount = false,
  });

  final String username;
  final ContentAccentTone tone;
  final bool showCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (username == 'you') return const SizedBox.shrink();

    final following = ref.watch(followingProvider).contains(username);
    final fg = following ? tone.iconCircleFg : Colors.white;
    final count = mockFollowerCount(username) + (following ? 1 : 0);

    return GestureDetector(
      onTap: () {
        final nowFollowing =
            ref.read(followingProvider.notifier).toggle(username);
        showBanner(
          nowFollowing ? 'Following u/$username' : 'Unfollowed u/$username',
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
              color:
                  following ? tone.surfaceBorder : Colors.transparent),
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          switchInCurve: Curves.easeOutBack,
          transitionBuilder: (child, anim) => FadeTransition(
            opacity: anim,
            child: ScaleTransition(scale: anim, child: child),
          ),
          child: Row(
            key: ValueKey('$following$showCount'),
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                  following ? Icons.check_rounded : Icons.person_add_alt_1,
                  size: 17,
                  color: fg),
              const SizedBox(width: 8),
              Text(following ? 'Following' : 'Follow',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: fg)),
              if (showCount) ...[
                const SizedBox(width: 6),
                Text('· $count',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: fg.withValues(alpha: 0.6))),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Animated Join / Joined toggle for a community (mirrors [FollowButton]).
class JoinButton extends ConsumerWidget {
  const JoinButton({
    super.key,
    required this.community,
    required this.tone,
  });
  final FeedCommunity community;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final joined =
        ref.watch(joinedCommunitiesProvider).contains(community);
    final fg = joined ? tone.iconCircleFg : Colors.white;
    return GestureDetector(
      onTap: () {
        final nowJoined = ref
            .read(joinedCommunitiesProvider.notifier)
            .toggle(community);
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
