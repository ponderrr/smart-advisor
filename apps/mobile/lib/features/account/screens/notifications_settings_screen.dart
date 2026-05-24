import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../feed/feed_providers.dart';
import '../../notifications/notification_prefs.dart';
import '../../notifications/notification_service.dart';
import '../../notifications/notifications_center.dart';
import 'settings_helpers.dart';

/// Notifications hub. The flat list of toggles got long enough to be
/// hard to scan, so the toggles moved into dedicated sub-screens
/// (Activity / Reminders) and this surface is just three tiles + the
/// inbox / Wrapped shortcuts.
class NotificationsSettingsScreen extends ConsumerWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    final unreadLocal = ref.watch(unreadCountProvider);
    final unreadServer = ref.watch(feedNotificationsUnreadCountProvider);
    final unread = unreadLocal + unreadServer;
    final muted = ref.watch(mutedNotificationKindsProvider);
    final remindersOn = ref.watch(remindersOnCountProvider);
    return BrandScaffold(
      title: l.notificationsTitle,
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BrandCard(
                child: Column(children: [
                  settingsTile(
                    context,
                    Icons.podcasts,
                    'Activity',
                    subtitle: _activitySubtitle(muted),
                    onTap: () =>
                        context.push('/account/notifications/activity'),
                  ),
                  settingsDivider(context),
                  settingsTile(
                    context,
                    Icons.alarm,
                    'Reminders',
                    subtitle: _remindersSubtitle(remindersOn),
                    onTap: () =>
                        context.push('/account/notifications/reminders'),
                  ),
                ]),
              ),
              settingsSection(context, l.notificationsYourDataSection),
              BrandCard(
                child: Column(children: [
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading: AdaptiveBadge(
                      count: unread,
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

  /// All activity kinds; we count what's currently un-muted so the
  /// row tells the user "All on" / "X of N on" / "All off" at a glance.
  /// Keep in sync with the toggles in NotificationsActivityScreen.
  static const _activityKinds = {
    'follow',
    'friend_post',
    'comment_on_post',
    'reply_to_comment',
    'post_upvote',
    'comment_upvote',
    'pick_sent',
  };

  String _activitySubtitle(Set<String> muted) {
    final on = _activityKinds.difference(muted).length;
    if (on == 0) return 'All off';
    if (on == _activityKinds.length) return 'All on';
    return '$on of ${_activityKinds.length} on';
  }

  String _remindersSubtitle(int on) {
    const total = 3;
    if (on == 0) return 'All off';
    if (on == total) return 'All on';
    return '$on of $total on';
  }
}

/// How many of the three local reminder toggles are currently on —
/// used only by the hub subtitle, so we don't have to inline the
/// three watches there.
final remindersOnCountProvider = Provider.autoDispose<int>((ref) {
  // Each reminder notifier exposes a bool; sum the trues.
  var n = 0;
  if (ref.watch(remindersProvider)) n++;
  if (ref.watch(groupQuizRemindersProvider)) n++;
  if (ref.watch(inProgressRemindersProvider)) n++;
  return n;
});
