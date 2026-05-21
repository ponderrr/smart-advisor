import 'dart:io';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../../core/models/enums.dart';
import '../../core/models/library_item.dart';
import '../../core/services/service_providers.dart';
import '../../core/supabase/supabase_providers.dart';
import 'live_update.dart';

const _key = 'sa.reminders_enabled';

// Notification ids: 42 = weekly fresh-picks, 43 = finish-what-you-started,
// 71 = the group-quiz live activity (ongoing).
const _weeklyId = 42;
const _inProgressId = 43;
const _groupQuizLiveId = 71;

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

  /// The next Saturday at 11:00 local time — a calm weekend slot for the
  /// weekly nudge, instead of "whatever time the user toggled it on".
  static tz.TZDateTime _nextSaturdayLateMorning() {
    final now = tz.TZDateTime.now(tz.local);
    var when = tz.TZDateTime(tz.local, now.year, now.month, now.day, 11);
    // DateTime.weekday: Mon=1 … Sat=6, Sun=7.
    var daysUntilSat = (DateTime.saturday - when.weekday) % 7;
    // If it's already Saturday but past 11:00, jump to next week.
    if (daysUntilSat == 0 && !when.isAfter(now)) daysUntilSat = 7;
    return when.add(Duration(days: daysUntilSat));
  }

  /// A gentle weekly "come back and discover something" reminder. Recurs
  /// every Saturday ~11:00 local (matchDateTimeComponents weekly repeat).
  static Future<void> scheduleWeeklyReminder() async {
    await init();
    if (!_ready) return;
    try {
      await _plugin.zonedSchedule(
      id: _weeklyId,
      title: 'Discover something new',
      body: 'Take a 2-minute quiz and get a fresh pick.',
      scheduledDate: _nextSaturdayLateMorning(),
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

  // ── Group-quiz live activity ───────────────────────────────────
  // A "live" status surface for an in-progress group quiz. On Android
  // this is an ongoing progress notification (the basis of Android 16's
  // Live Updates); on iOS it shows as a standard notification today, with
  // a true ActivityKit Live Activity scaffolded under ios/LiveActivity/
  // (see ios/LiveActivity/SETUP.md). Re-calling [showGroupQuizLive] with
  // the same id updates the existing notification in place.

  /// Shows / updates the group-quiz live activity. [progress] +
  /// [maxProgress] supply the status-bar chip text (e.g. players joined).
  static Future<void> showGroupQuizLive({
    required String code,
    required String line,
    int? progress,
    int? maxProgress,
  }) async {
    final hasBar =
        progress != null && maxProgress != null && maxProgress > 0;
    // Android — a true promoted "Live Update" (Android 16) via the native
    // channel; it degrades to a plain ongoing notification on older
    // Android, where setRequestPromotedOngoing is a no-op.
    if (Platform.isAndroid) {
      await LiveUpdate.post(
        id: _groupQuizLiveId,
        title: 'Group quiz · $code',
        text: line,
        chip: hasBar ? '$progress/$maxProgress' : null,
      );
      return;
    }
    // iOS — standard notification fallback (the ActivityKit Live Activity
    // is scaffolded under ios/LiveActivity/).
    await init();
    if (!_ready) return;
    try {
      await _plugin.show(
        id: _groupQuizLiveId,
        title: 'Group quiz · $code',
        body: line,
        notificationDetails: const NotificationDetails(
          iOS: DarwinNotificationDetails(presentBanner: false),
        ),
      );
    } catch (_) {/* unsupported platform — ignore */}
  }

  /// Ends the group-quiz live activity (session completed / left).
  static Future<void> cancelGroupQuizLive() async {
    if (Platform.isAndroid) {
      await LiveUpdate.cancel(_groupQuizLiveId);
      return;
    }
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _groupQuizLiveId);
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
