import 'package:flutter/services.dart';

/// Dart bridge to the native Android 16 "Live Update" notification channel
/// (see android/.../LiveUpdateChannel.kt). Android-only — calls are
/// wrapped so an unregistered channel (e.g. on iOS) simply no-ops.
class LiveUpdate {
  LiveUpdate._();

  static const _channel =
      MethodChannel('live.smartadvisor.smart_advisor/live_update');

  /// Posts or updates the promoted ongoing notification with [id].
  /// [chip] is the short status-bar text shown while it's off-screen.
  static Future<void> post({
    required int id,
    required String title,
    required String text,
    String? chip,
  }) async {
    try {
      await _channel.invokeMethod<void>('post', {
        'id': id,
        'title': title,
        'text': text,
        'chip': chip,
      });
    } catch (_) {/* channel unavailable (e.g. iOS) — ignore */}
  }

  /// Clears the live update with [id].
  static Future<void> cancel(int id) async {
    try {
      await _channel.invokeMethod<void>('cancel', {'id': id});
    } catch (_) {/* ignore */}
  }
}
