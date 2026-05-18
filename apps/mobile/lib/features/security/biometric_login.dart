import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_providers.dart';
import '../auth/services/error_messages.dart';
import 'biometric.dart';

/// "Sign in with Face ID / fingerprint".
///
/// On opt-in we stash the **full Supabase session** (never the password)
/// in the OS keystore, and keep it fresh as the SDK rotates tokens. On the
/// auth screen the user biometric-prompts and we `recoverSession()` from
/// it — which restores directly (no network) while the access token is
/// still valid, so it doesn't depend on the rotating refresh token being
/// the latest. Sign-out uses a *local* scope so the session isn't revoked
/// server-side (see AccountScreen).
class BiometricLogin extends Notifier<bool> {
  static const _enabledKey = 'sa.biometric_login_enabled';
  static const _sessionKey = 'sa.biometric_session';

  // v10 uses secure ciphers by default on Android (Keychain on iOS).
  final _store = const FlutterSecureStorage();

  @override
  bool build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return prefs?.getBool(_enabledKey) ?? false;
  }

  String? get _currentSessionJson {
    final s = ref.read(supabaseClientProvider).auth.currentSession;
    return s == null ? null : jsonEncode(s.toJson());
  }

  /// Enable from a signed-in context (Settings). Requires hardware + a
  /// live session, and a biometric confirmation.
  Future<bool> enable() async {
    if (!await biometricAvailable()) return false;
    final session = _currentSessionJson;
    if (session == null) return false;
    if (!await biometricAuthenticate(
        reason: 'Enable biometric sign-in')) {
      return false;
    }
    await _store.write(key: _sessionKey, value: session);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_enabledKey, true);
    state = true;
    return true;
  }

  Future<void> disable() async {
    await _store.delete(key: _sessionKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_enabledKey, false);
    state = false;
  }

  /// Persist the current session — call on sign-in / token refresh so the
  /// stored copy never goes stale (no-op when disabled or signed out).
  Future<void> saveSession() async {
    if (!state) return;
    final session = _currentSessionJson;
    if (session != null) {
      await _store.write(key: _sessionKey, value: session);
    }
  }

  /// Biometric prompt → restore the Supabase session from the stored
  /// copy. Returns `null` on success, otherwise a message to show the
  /// user. Only clears the saved session when it's genuinely unusable.
  Future<String?> restore() async {
    final saved = await _store.read(key: _sessionKey);
    if (saved == null) {
      await disable();
      return 'No saved login — sign in with your password.';
    }
    if (!await biometricAuthenticate(
        reason: 'Sign in to Smart Advisor')) {
      return 'Biometric check cancelled.';
    }
    try {
      await ref.read(supabaseClientProvider).auth.recoverSession(saved);
      await saveSession(); // persist the (possibly refreshed) session
      return null;
    } on AuthException catch (e) {
      // Saved session is no longer valid (expired + refresh revoked).
      // Don't surface Supabase's raw "Invalid Refresh Token: …" — map it
      // to friendly copy and, since biometric just turned itself off,
      // tell the user how to get it back.
      await disable();
      final friendly = toUserFriendlyError(
          e.message, 'Your saved sign-in is no longer valid.');
      return '$friendly You can set up biometric sign-in again from '
          'Settings afterwards.';
    } catch (_) {
      // Transient (e.g. offline) — keep the feature on so it can retry.
      return "Couldn't reach the server. Check your connection and "
          'try again.';
    }
  }
}

final biometricLoginProvider =
    NotifierProvider<BiometricLogin, bool>(BiometricLogin.new);

/// Whether the device can do biometric auth (async hardware probe).
final biometricAvailableProvider =
    FutureProvider<bool>((ref) => biometricAvailable());
