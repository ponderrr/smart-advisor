import 'package:flutter/services.dart';

/// Dart bridge to the native group-quiz live-update foreground service
/// (see android/.../GroupQuizLiveService.kt). Android-only — calls are
/// wrapped so an unregistered channel (e.g. on iOS) simply no-ops.
class LiveUpdate {
  LiveUpdate._();

  static const _channel =
      MethodChannel('live.smartadvisor.smart_advisor/live_update');

  /// Starts the foreground service that polls the session and keeps the
  /// promoted Live Update notification fresh while the app is
  /// backgrounded.
  static Future<void> startService({
    required String sessionId,
    required String code,
    required String supabaseUrl,
    required String anonKey,
  }) async {
    try {
      await _channel.invokeMethod<void>('startService', {
        'sessionId': sessionId,
        'code': code,
        'supabaseUrl': supabaseUrl,
        'anonKey': anonKey,
      });
    } catch (_) {/* channel unavailable (e.g. iOS) — ignore */}
  }

  /// Stops the service and clears the live update.
  static Future<void> stopService() async {
    try {
      await _channel.invokeMethod<void>('stopService');
    } catch (_) {/* ignore */}
  }
}
