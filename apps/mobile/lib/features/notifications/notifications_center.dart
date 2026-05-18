import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/supabase/supabase_providers.dart';

const _key = 'sa.inapp_notifications';
const _seededKey = 'sa.inapp_seeded';

class AppNotification {
  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    this.read = false,
  });

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'ts': createdAt.toIso8601String(),
        'read': read,
      };

  factory AppNotification.fromJson(Map<String, dynamic> j) =>
      AppNotification(
        id: j['id'] as String,
        title: j['title'] as String,
        body: j['body'] as String,
        createdAt: DateTime.parse(j['ts'] as String),
        read: j['read'] as bool? ?? false,
      );

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        title: title,
        body: body,
        createdAt: createdAt,
        read: read ?? this.read,
      );
}

/// Local in-app notification inbox (persisted). Not server push — those
/// (FCM/APNs) remain a flagged backend follow-up.
class NotificationsCenter extends Notifier<List<AppNotification>> {
  @override
  List<AppNotification> build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    if (prefs == null) return const [];
    if (prefs.getBool(_seededKey) != true) {
      // Seed a welcome on first run.
      final welcome = AppNotification(
        id: 'welcome',
        title: 'Welcome to Smart Advisor 👋',
        body: 'Take the quiz to get your first pick.',
        createdAt: DateTime.now(),
      );
      prefs.setBool(_seededKey, true);
      prefs.setString(_key, jsonEncode([welcome.toJson()]));
      return [welcome];
    }
    final raw = prefs.getString(_key);
    if (raw == null) return const [];
    return (jsonDecode(raw) as List)
        .map((e) => AppNotification.fromJson(
            Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> _persist(List<AppNotification> list) async {
    state = list;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _key, jsonEncode(list.map((e) => e.toJson()).toList()));
  }

  Future<void> add(String title, String body) async {
    await _persist([
      AppNotification(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          title: title,
          body: body,
          createdAt: DateTime.now()),
      ...state,
    ]);
  }

  Future<void> markAllRead() async =>
      _persist([for (final n in state) n.copyWith(read: true)]);

  /// Remove a single notification (swipe-to-dismiss).
  Future<void> remove(String id) async =>
      _persist([for (final n in state) if (n.id != id) n]);

  Future<void> clear() async => _persist(const []);
}

final notificationsCenterProvider =
    NotifierProvider<NotificationsCenter, List<AppNotification>>(
        NotificationsCenter.new);

final unreadCountProvider = Provider<int>((ref) =>
    ref.watch(notificationsCenterProvider).where((n) => !n.read).length);
