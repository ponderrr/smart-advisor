import 'dart:io';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../../core/config/env.dart';
import '../../core/models/enums.dart';
import '../../core/models/library_item.dart';
import '../../core/services/service_providers.dart';
import '../../core/supabase/supabase_providers.dart';
import 'live_update.dart';

// Weekly toggle key kept for backward-compat — existing installs that
// flipped this on stay on for the weekly reminder.
const _key = 'sa.reminders_enabled';
const _inProgressKey = 'sa.reminders_in_progress_enabled';
const _groupQuizKey = 'sa.reminders_group_quiz_enabled';

// Notification ids: 42 = weekly fresh-picks, 43 = finish-what-you-started,
// 71 = the group-quiz live activity (ongoing), 72 = group-quiz deadline.
const _weeklyId = 42;
const _inProgressId = 43;
const _groupQuizLiveId = 71;
const _groupQuizDeadlineId = 72;

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

  static Future<void> cancelWeeklyReminder() async {
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _weeklyId);
  }

  static Future<void> cancelInProgressReminder() async {
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _inProgressId);
  }

  static Future<void> cancelGroupQuizDeadline() async {
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _groupQuizDeadlineId);
  }

  static Future<void> cancelAll() async {
    await init();
    if (!_ready) return;
    await _plugin.cancelAll();
  }

  // ── Group-quiz live activity ───────────────────────────────────
  // A "live" status surface for an active group quiz. On Android a
  // foreground service (GroupQuizLiveService) polls the session and
  // keeps a promoted Android 16 Live Update fresh even while the app is
  // backgrounded. On iOS it's a standard notification today, with a true
  // ActivityKit Live Activity scaffolded under ios/LiveActivity/.

  /// Starts the group-quiz live activity. Android — the foreground
  /// service that refreshes itself; iOS — a no-op (the first
  /// [updateGroupQuizLive] posts the notification).
  static Future<void> startGroupQuizLive({
    required String sessionId,
    required String code,
  }) async {
    if (Platform.isAndroid) {
      await LiveUpdate.startService(
        sessionId: sessionId,
        code: code,
        supabaseUrl: Env.supabaseUrl,
        anonKey: Env.supabaseAnonKey,
      );
    }
  }

  /// Surfaces a server-side `feed_notifications` row as a system
  /// notification while the app is foregrounded (the only time the
  /// 60s poll is running). Title / body shape mirrors the inbox card.
  /// Tap-routing isn't wired here — that's a follow-up when true FCM
  /// push lands; tapping a local notification today just opens the app.
  ///
  /// Caller is responsible for de-dup; we never look up whether the
  /// notification id already fired. Use a hash of the id as the
  /// notification id so the same row never stacks.
  static Future<void> showFeedActivity({
    required String id,
    required String title,
    required String body,
  }) async {
    await init();
    if (!_ready) return;
    try {
      await _plugin.show(
        // Mask the sign bit — flutter_local_notifications requires a
        // positive 32-bit int and Dart hashCode can go negative.
        id: id.hashCode & 0x7fffffff,
        title: title,
        body: body,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            'feed_activity',
            'Activity',
            channelDescription: 'Follows, comments, replies, upvotes',
            importance: Importance.defaultImportance,
            priority: Priority.defaultPriority,
          ),
          iOS: DarwinNotificationDetails(),
        ),
      );
    } catch (_) {/* unsupported platform — ignore */}
  }

  /// Refreshes the live activity's status line. The Android service polls
  /// on its own, so this only updates the iOS notification.
  static Future<void> updateGroupQuizLive({
    required String code,
    required String line,
  }) async {
    if (Platform.isAndroid) return;
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

  /// Schedules a reminder ~3h before an async group-quiz [deadline] —
  /// "your responses are about to expire". A fixed id, so re-scheduling
  /// on a later visit just replaces it. Skipped if the reminder time is
  /// already past (or too close).
  static Future<void> scheduleGroupQuizDeadline({
    required DateTime deadline,
    required String code,
  }) async {
    await init();
    if (!_ready) return;
    final fireAt = tz.TZDateTime.from(deadline, tz.local)
        .subtract(const Duration(hours: 3));
    if (!fireAt.isAfter(
        tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5)))) {
      return;
    }
    try {
      await _plugin.zonedSchedule(
        id: _groupQuizDeadlineId,
        title: 'Group quiz · $code',
        body: 'Your responses are due soon — finish before the deadline.',
        scheduledDate: fireAt,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails('reminders', 'Reminders',
              channelDescription: 'Group quiz reminders',
              importance: Importance.defaultImportance),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
    } catch (_) {/* unsupported platform — ignore */}
  }

  /// Ends the group-quiz live activity (session over / screen left).
  static Future<void> stopGroupQuizLive() async {
    if (Platform.isAndroid) {
      await LiveUpdate.stopService();
      return;
    }
    await init();
    if (!_ready) return;
    await _plugin.cancel(id: _groupQuizLiveId);
  }
}

/// Persisted weekly-quiz reminder toggle.
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
      await NotificationService.cancelWeeklyReminder();
    }
  }
}

final remindersProvider =
    NotifierProvider<Reminders, bool>(Reminders.new);

/// Persisted "finish what you started" reminder toggle. Migrates from
/// the legacy bundled [_key] so existing installs that had reminders on
/// keep the in-progress nudge until they explicitly turn it off.
class InProgressReminders extends Notifier<bool> {
  @override
  bool build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    if (prefs == null) return false;
    final explicit = prefs.getBool(_inProgressKey);
    if (explicit != null) return explicit;
    // Legacy bundled toggle controlled both. Inherit weekly state.
    return prefs.getBool(_key) ?? false;
  }

  Future<void> set(bool v) async {
    state = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_inProgressKey, v);
    if (v) {
      await NotificationService.requestPermission();
      final res = await ref
          .read(libraryServiceProvider)
          .list(status: LibraryStatus.inProgress);
      await _apply(res.data ?? const []);
    } else {
      await NotificationService.cancelInProgressReminder();
    }
  }

  /// Re-evaluate the in-progress reminder against [items] (any status).
  /// No-op while the toggle is off. Cheap to call whenever the library
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

final inProgressRemindersProvider =
    NotifierProvider<InProgressReminders, bool>(InProgressReminders.new);

/// Persisted "group quiz answer expiring" reminder toggle. Default on —
/// the deadline nudge is what makes async group quizzes work, so we opt
/// users in unless they turn it off explicitly. Gates the scheduling
/// call in group_quiz_session_screen.
class GroupQuizReminders extends Notifier<bool> {
  @override
  bool build() =>
      ref
          .watch(sharedPreferencesProvider)
          .asData
          ?.value
          .getBool(_groupQuizKey) ??
      true;

  Future<void> set(bool v) async {
    state = v;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_groupQuizKey, v);
    if (v) {
      await NotificationService.requestPermission();
    } else {
      await NotificationService.cancelGroupQuizDeadline();
    }
  }
}

final groupQuizRemindersProvider =
    NotifierProvider<GroupQuizReminders, bool>(GroupQuizReminders.new);
