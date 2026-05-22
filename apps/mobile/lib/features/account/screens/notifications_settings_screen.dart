import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';

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
    return BrandScaffold(
      title: 'Notifications',
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
                  title: const Text('Weekly quiz reminder'),
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
                            .add('Weekly reminder on',
                                'We\'ll nudge you weekly to discover something.',
                                type: AppNotificationType.reminder);
                      }
                    },
                  ),
                ),
              ]),
            ),
            settingsSection(context, 'Your data'),
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
                  title: const Text('Notifications'),
                  trailing: Icon(Icons.chevron_right,
                      color: context.colors.mutedForeground),
                  onTap: () => context.push('/notifications'),
                ),
                settingsTile(
                    context, Icons.auto_awesome, 'Your year in review',
                    onTap: () => context.push('/wrapped')),
                settingsDivider(context),
                settingsTile(
                    context, Icons.calendar_month, 'This month in review',
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
