import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../../core/models/enums.dart';
import '../../core/models/library_item.dart';
import '../../core/services/service_providers.dart';
import '../../core/supabase/supabase_providers.dart';

const _key = 'sa.reminders_enabled';

// Notification ids: 42 = weekly fresh-picks, 43 = finish-what-you-started.
const _weeklyId = 42;
const _inProgressId = 43;

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
      id: _weeklyId,
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

  /// A gentle weekly "finish what you started" nudge for items still
  /// in progress. [count] == 0 cancels it instead.
  static Future<void> scheduleInProgressReminder({
    required int count,
    String? sampleTitle,
  }) async {
    await init();
    if (!_ready) return;
    if (count <= 0) {
      await cancelInProgressReminder();
      return;
    }
    final body = (count == 1 && sampleTitle != null)
        ? 'Pick up “$sampleTitle” where you left off.'
        : 'You have $count things in progress — finish one?';
    try {
      await _plugin.zonedSchedule(
        id: _inProgressId,
        title: 'Finish what you started',
        body: body,
        scheduledDate:
            tz.TZDateTime.now(tz.local).add(const Duration(days: 3)),
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
              'reminders', 'Reminders',
              channelDescription: 'Library & quiz reminders',
              importance: Importance.defaultImportance),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
      );
    } catch (_) {/* unsupported platform — ignore */}
  }

  static Future<void> cancelInProgressReminder() async {
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _inProgressId);
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
      // Seed the "finish what you started" reminder from the library.
      final res = await ref
          .read(libraryServiceProvider)
          .list(status: LibraryStatus.inProgress);
      await _apply(res.data ?? const []);
    } else {
      await NotificationService.cancelAll();
    }
  }

  /// Re-evaluate the in-progress reminder against [items] (any status).
  /// No-op while reminders are off. Cheap to call whenever the library
  /// is (re)loaded so the nudge stays accurate after status changes.
  Future<void> syncInProgress(List<LibraryItem> items) async {
    if (!state) return;
    await _apply(
        items.where((i) => i.status == LibraryStatus.inProgress).toList());
  }

  Future<void> _apply(List<LibraryItem> inProgress) async {
    await NotificationService.scheduleInProgressReminder(
      count: inProgress.length,
      sampleTitle: inProgress.isNotEmpty ? inProgress.first.title : null,
    );
  }
}

final remindersProvider =
    NotifierProvider<Reminders, bool>(Reminders.new);
