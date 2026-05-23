import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../notifications/notification_service.dart';
import '../../notifications/notifications_center.dart';
import 'settings_helpers.dart';

/// Notifications & your data — the weekly reminder toggle plus the
/// notifications / Wrapped shortcuts. Relocated verbatim from the old
/// AccountScreen ("Weekly quiz reminder" row + the whole "Your data" card).
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
                settingsTile(
                    context, Icons.auto_awesome, l.notificationsYearInReview,
                    onTap: () => context.push('/wrapped')),
                settingsDivider(context),
                settingsTile(
                    context, Icons.calendar_month, l.notificationsMonthInReview,
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
