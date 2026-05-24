import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'supabase/supabase_providers.dart';

/// Per-device push-token registry. Transport-agnostic: the underlying
/// `device_tokens` table stores FCM tokens today (when Firebase is
/// wired), APNs tokens for iOS, or anything else. The Dart side here
/// is the seam — when `firebase_messaging` lands, call [register]
/// with the token returned by `FirebaseMessaging.instance.getToken()`
/// and again from its `onTokenRefresh` stream.
///
/// Until Firebase is configured (no google-services.json yet), there
/// is nothing to register and these methods are intentionally idle;
/// the table itself is ready for the server-side sender (an Edge
/// Function that watches `feed_notifications` AFTER-INSERT and posts
/// to FCM HTTP v1).
class PushService {
  PushService(this._ref);
  final Ref _ref;

  /// Upserts the token row for the current signed-in user. Idempotent
  /// — calling on every signedIn / token-refresh is the right cadence.
  Future<void> register(String token) async {
    final c = _ref.read(supabaseClientProvider);
    final uid = c.auth.currentUser?.id;
    if (uid == null || token.isEmpty) return;
    await c.from('device_tokens').upsert({
      'token': token,
      'user_id': uid,
      'platform': _platform,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    }, onConflict: 'token');
  }

  /// Drops the token row — call on sign-out so a shared device doesn't
  /// keep delivering pushes for the previous account.
  Future<void> unregister(String token) async {
    final c = _ref.read(supabaseClientProvider);
    if (token.isEmpty) return;
    await c.from('device_tokens').delete().eq('token', token);
  }

  static String get _platform {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    return 'web';
  }
}

final pushServiceProvider = Provider<PushService>(PushService.new);
