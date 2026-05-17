import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../../core/supabase/supabase_providers.dart';

const _key = 'sa.reminders_enabled';

/// Local notifications only. Remote push (new banners, group-quiz events)
/// needs FCM/APNs + a server — flagged as a backend/native follow-up, not
/// done here.
class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  static Future<void> init() async {
    if (_ready) return;
    try {
      tzdata.initializeTimeZones();
      await _plugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(),
          linux:
              LinuxInitializationSettings(defaultActionName: 'Open'),
        ),
      );
      _ready = true;
    } catch (_) {
      // Notifications unavailable on this platform — never crash startup.
    }
  }

  static Future<bool> requestPermission() async {
    await init();
    if (!_ready) return false;
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    final a = await android?.requestNotificationsPermission();
    final i = await ios?.requestPermissions(alert: true, badge: true);
    return (a ?? i ?? true);
  }

  /// A gentle weekly "come back and discover something" reminder.
  static Future<void> scheduleWeeklyReminder() async {
    await init();
    if (!_ready) return;
    try {
      await _plugin.zonedSchedule(
      id: 42,
      title: 'Discover something new',
      body: 'Take a 2-minute quiz and get a fresh pick.',
      scheduledDate:
          tz.TZDateTime.now(tz.local).add(const Duration(days: 7)),
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
            'reminders', 'Reminders',
            channelDescription: 'Weekly quiz reminders',
            importance: Importance.defaultImportance),
        iOS: DarwinNotificationDetails(),
      ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
      );
    } catch (_) {/* unsupported platform — ignore */}
  }

  static Future<void> cancelAll() async {
    await init();
    if (!_ready) return;
    await _plugin.cancelAll();
  }
}

/// Persisted reminder toggle.
class Reminders extends Notifier<bool> {
  @override
  bool build() =>
      ref.watch(sharedPreferencesProvider).asData?.value.getBool(_key) ??
      false;

  Future<void> set(bool v) async {
    state = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, v);
    if (v) {
      await NotificationService.requestPermission();
      await NotificationService.scheduleWeeklyReminder();
    } else {
      await NotificationService.cancelAll();
    }
  }
}

final remindersProvider =
    NotifierProvider<Reminders, bool>(Reminders.new);
