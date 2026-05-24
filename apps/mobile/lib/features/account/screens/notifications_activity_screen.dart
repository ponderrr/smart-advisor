import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../ui/ui.dart';
import '../../notifications/notification_prefs.dart';

/// Settings → Notifications → Activity. One toggle per
/// `feed_notification_kind` enum value (see the
/// 20260523040000_feed_notifications migration). Muted kinds are
/// filtered out at [feedNotificationsProvider] so the inbox + the
/// bell badge match these toggles without each surface tracking its
/// own state.
class NotificationsActivityScreen extends ConsumerWidget {
  const NotificationsActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BrandScaffold(
      title: 'Activity',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Subtitle(
                  "What other people do — pick which of these show up "
                  "in your inbox and the bell badge."),
              SizedBox(height: 14),
              BrandCard(
                child: Column(children: [
                  _ActivityToggle(
                    kind: 'follow',
                    icon: Icons.person_add_alt_1,
                    title: 'New followers',
                    subtitle: 'When someone follows you.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'friend_post',
                    icon: Icons.forum,
                    title: 'Posts from friends',
                    subtitle:
                        'When someone you follow shares something new.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'comment_on_post',
                    icon: Icons.chat_bubble_outline,
                    title: 'Comments on your posts',
                    subtitle: 'When someone comments on a post you wrote.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'reply_to_comment',
                    icon: Icons.subdirectory_arrow_right,
                    title: 'Replies to your comments',
                    subtitle:
                        'When someone replies to a comment you left.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'post_upvote',
                    icon: Icons.thumb_up_alt_outlined,
                    title: 'Upvotes on your posts',
                    subtitle: 'When someone upvotes a post you wrote.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'comment_upvote',
                    icon: Icons.thumb_up_off_alt,
                    title: 'Upvotes on your comments',
                    subtitle:
                        'When someone upvotes a comment you left.',
                  ),
                  _Divider(),
                  _ActivityToggle(
                    kind: 'pick_sent',
                    icon: Icons.send,
                    title: 'Picks sent to you',
                    subtitle:
                        'When a friend sends you a specific post to check out.',
                  ),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) =>
      Divider(height: 28, color: context.colors.border);
}

class _ActivityToggle extends ConsumerWidget {
  const _ActivityToggle({
    required this.kind,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final String kind;
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final muted = ref.watch(mutedNotificationKindsProvider);
    final on = !muted.contains(kind);
    return AdaptiveListTile(
      padding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: AdaptiveSwitch(
        value: on,
        activeColor: Tw.indigo500,
        onChanged: (v) async {
          Haptics.selection();
          await ref
              .read(mutedNotificationKindsProvider.notifier)
              .setMuted(kind, !v);
        },
      ),
    );
  }
}
