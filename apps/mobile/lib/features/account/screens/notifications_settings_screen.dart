import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../notifications/notification_prefs.dart';
import '../../notifications/notification_service.dart';
import '../../notifications/notifications_center.dart';
import 'settings_helpers.dart';

/// Notifications settings — toggles grouped into sections so the page
/// stays readable as the list grows. Three buckets:
///
///   1. Activity (server)   — what other people do (follow, comment,
///                            reply, friend posts, upvotes).
///   2. Reminders (local)   — what the app schedules for itself
///                            (weekly quiz, group quiz, in-progress).
///   3. Your data           — links into the inbox + the Wrapped screens.
///
/// Activity toggles are mirrored by [MutedNotificationKinds]: muting a
/// kind hides matching `feed_notifications` rows from the inbox and
/// strips them out of the bell badge count, but the server still
/// records them so flipping a kind back on shows everything that
/// happened while it was off.
class NotificationsSettingsScreen extends ConsumerWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    return BrandScaffold(
      title: l.notificationsTitle,
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              settingsSection(context, 'Activity'),
              BrandCard(
                child: Column(children: [
                  _ActivityToggle(
                    kind: 'follow',
                    icon: Icons.person_add_alt_1,
                    title: 'New followers',
                    subtitle: 'When someone follows you.',
                  ),
                  settingsDivider(context),
                  _ActivityToggle(
                    kind: 'friend_post',
                    icon: Icons.forum,
                    title: 'Posts from friends',
                    subtitle:
                        'When someone you follow shares something new.',
                  ),
                  settingsDivider(context),
                  _ActivityToggle(
                    kind: 'comment_on_post',
                    icon: Icons.chat_bubble_outline,
                    title: 'Comments on your posts',
                    subtitle: 'When someone comments on a post you wrote.',
                  ),
                  settingsDivider(context),
                  _ActivityToggle(
                    kind: 'reply_to_comment',
                    icon: Icons.subdirectory_arrow_right,
                    title: 'Replies to your comments',
                    subtitle:
                        'When someone replies to a comment you left.',
                  ),
                  settingsDivider(context),
                  _ActivityToggle(
                    kind: 'post_upvote',
                    icon: Icons.thumb_up_alt_outlined,
                    title: 'Upvotes on your posts',
                    subtitle: 'When someone upvotes a post you wrote.',
                  ),
                  settingsDivider(context),
                  _ActivityToggle(
                    kind: 'comment_upvote',
                    icon: Icons.thumb_up_off_alt,
                    title: 'Upvotes on your comments',
                    subtitle:
                        'When someone upvotes a comment you left.',
                  ),
                ]),
              ),

              settingsSection(context, 'Reminders'),
              BrandCard(
                child: Column(children: [
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading: const Icon(Icons.notifications_none),
                    title: Text(l.notificationsWeeklyReminder),
                    trailing: AdaptiveSwitch(
                      value: ref.watch(remindersProvider),
                      activeColor: Tw.indigo500,
                      onChanged: (v) async {
                        Haptics.selection();
                        await ref
                            .read(remindersProvider.notifier)
                            .set(v);
                        if (v) {
                          await ref
                              .read(notificationsCenterProvider.notifier)
                              .add(l.notificationsWeeklyOnHeading,
                                  l.notificationsWeeklyOnBody,
                                  type: AppNotificationType.reminder);
                        }
                      },
                    ),
                  ),
                  settingsDivider(context),
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading: const Icon(Icons.hourglass_bottom_outlined),
                    title: Text(l.notificationsGroupQuizExpiringTitle),
                    subtitle: Text(l.notificationsGroupQuizExpiringSub),
                    trailing: AdaptiveSwitch(
                      value: ref.watch(groupQuizRemindersProvider),
                      activeColor: Tw.indigo500,
                      onChanged: (v) async {
                        Haptics.selection();
                        await ref
                            .read(groupQuizRemindersProvider.notifier)
                            .set(v);
                      },
                    ),
                  ),
                  settingsDivider(context),
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading: const Icon(Icons.menu_book_outlined),
                    title: Text(l.notificationsInProgressTitle),
                    subtitle: Text(l.notificationsInProgressSub),
                    trailing: AdaptiveSwitch(
                      value: ref.watch(inProgressRemindersProvider),
                      activeColor: Tw.indigo500,
                      onChanged: (v) async {
                        Haptics.selection();
                        await ref
                            .read(inProgressRemindersProvider.notifier)
                            .set(v);
                      },
                    ),
                  ),
                ]),
              ),

              settingsSection(context, l.notificationsYourDataSection),
              BrandCard(
                child: Column(children: [
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading: AdaptiveBadge(
                      count: ref.watch(unreadCountProvider),
                      backgroundColor: Tw.indigo500,
                      child: Icon(Icons.notifications_none,
                          color: context.colors.foreground),
                    ),
                    title: Text(l.notificationsTitle),
                    trailing: Icon(Icons.chevron_right,
                        color: context.colors.mutedForeground),
                    onTap: () => context.push('/notifications'),
                  ),
                  settingsTile(context, Icons.auto_awesome,
                      l.notificationsYearInReview,
                      onTap: () => context.push('/wrapped')),
                  settingsDivider(context),
                  settingsTile(context, Icons.calendar_month,
                      l.notificationsMonthInReview,
                      onTap: () => context.push('/wrapped/month')),
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

/// Single per-kind activity toggle. Reading/writing
/// `mutedNotificationKindsProvider` keeps the inbox + bell badge +
/// settings in sync without each surface having its own state.
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
