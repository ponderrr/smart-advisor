import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../l10n/app_localizations.dart';
import '../../../ui/ui.dart';
import '../../notifications/notification_service.dart';
import '../../notifications/notifications_center.dart';

/// Settings → Notifications → Reminders. Locally-scheduled
/// flutter_local_notifications — the weekly fresh-picks reminder,
/// the group-quiz deadline ping, and the "finish-what-you-started"
/// nudge. No server involvement; each toggle reads/writes its own
/// Notifier defined in `notification_service.dart`.
class NotificationsRemindersScreen extends ConsumerWidget {
  const NotificationsRemindersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = AppLocalizations.of(context);
    return BrandScaffold(
      title: 'Reminders',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Subtitle(
                  'Scheduled nudges from the app itself — independent '
                  'of social activity.'),
              const SizedBox(height: 14),
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
                  Divider(height: 28, color: context.colors.border),
                  AdaptiveListTile(
                    padding: EdgeInsets.zero,
                    leading:
                        const Icon(Icons.hourglass_bottom_outlined),
                    title:
                        Text(l.notificationsGroupQuizExpiringTitle),
                    subtitle:
                        Text(l.notificationsGroupQuizExpiringSub),
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
                  Divider(height: 28, color: context.colors.border),
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
            ],
          ),
        ),
      ),
    );
  }
}
