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
                  // Wrapped entries are seasonal — hide them outside
                  // their windows so the surface doesn't carry a
                  // mid-year "look at 2 months of activity" tile that
                  // most users will find anticlimactic. The route at
                  // /wrapped stays reachable for QA / sharing.
                  if (_yearWrappedInSeason()) ...[
                    settingsTile(context, Icons.auto_awesome,
                        l.notificationsYearInReview,
                        onTap: () => context.push('/wrapped')),
                    if (_monthWrappedInSeason()) settingsDivider(context),
                  ],
                  if (_monthWrappedInSeason())
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

/// Year wrapped is "in season" through December and January — that's
/// when the year's data is full or just-closed and the share moment
/// is most compelling. Outside that window the tile would either
/// summarise an empty year or a stale one, so we hide it. The route
/// itself stays reachable for QA and replay.
bool _yearWrappedInSeason([DateTime? now]) {
  final n = now ?? DateTime.now();
  return n.month == 12 || n.month == 1;
}

/// Month wrapped is "in season" over the wrap-up days of one month
/// and the first day of the next — a four-day shareable window
/// (28/29/30/31 → 1, depending on month length).
bool _monthWrappedInSeason([DateTime? now]) {
  final n = now ?? DateTime.now();
  if (n.day == 1) return true;
  // Days remaining in the current month, counting today.
  final lastDay = DateTime(n.year, n.month + 1, 0).day;
  return (lastDay - n.day) <= 2;
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
