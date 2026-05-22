import 'dart:io' show Platform;

import 'package:supabase_flutter/supabase_flutter.dart';

/// Writes / refreshes the current device's row in `public.sessions` so the
/// user's "Two-factor & devices" list reflects every signed-in device,
/// not just the web one.
///
/// Mirrors the web `SessionManagementService.createSessionRecord` shape —
/// we use the access token as `session_id` (same convention web uses) and
/// derive device fields from `Platform` instead of the browser UA. Failures
/// are swallowed: sign-in must succeed even if this housekeeping write
/// fails (e.g. before the migration is deployed, or with a stale RLS).
class SessionRecordService {
  SessionRecordService(this._c);
  final SupabaseClient _c;

  Future<void> recordCurrent() async {
    final user = _c.auth.currentUser;
    final session = _c.auth.currentSession;
    if (user == null || session == null) return;

    final info = _deviceInfo();
    try {
      // Match the web pattern: collapse repeat sign-ins from the same
      // (browser/OS) into one row. On mobile we use (os_name) because
      // there's no browser; this keeps a phone's row stable even after
      // a token rotation.
      final existing = await _c
          .from('sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('device_type', info.deviceType)
          .eq('os_name', info.osName)
          .isFilter('revoked_at', null)
          .limit(1);

      final now = DateTime.now().toUtc().toIso8601String();
      if (existing.isNotEmpty) {
        await _c.from('sessions').update({
          'session_id': session.accessToken,
          'user_agent': info.userAgent,
          'os_version': info.osVersion,
          'is_current_device': true,
          'last_activity': now,
        }).eq('id', (existing.first as Map)['id'] as String);
        return;
      }

      await _c.from('sessions').insert({
        'user_id': user.id,
        'session_id': session.accessToken,
        'user_agent': info.userAgent,
        'device_name': info.deviceName,
        'device_type': info.deviceType,
        'os_name': info.osName,
        'os_version': info.osVersion,
        'is_current_device': true,
        'last_activity': now,
      });
    } catch (_) {
      // Best-effort: don't break auth on a sessions-table hiccup.
    }
  }

  /// Cheap device summary built from `dart:io` — keeps us off
  /// `device_info_plus` until we genuinely need model strings.
  _DeviceInfo _deviceInfo() {
    final os = Platform.operatingSystem;
    final osName = switch (os) {
      'android' => 'Android',
      'ios' => 'iOS',
      'macos' => 'macOS',
      'linux' => 'Linux',
      'windows' => 'Windows',
      _ => os,
    };
    final deviceType =
        (os == 'android' || os == 'ios') ? 'mobile' : 'desktop';
    final deviceName = switch (os) {
      'android' => 'Android phone',
      'ios' => 'iPhone',
      'macos' => 'Mac',
      'linux' => 'Linux desktop',
      'windows' => 'Windows PC',
      _ => 'Smart Advisor app',
    };
    return _DeviceInfo(
      deviceName: deviceName,
      deviceType: deviceType,
      osName: osName,
      osVersion: Platform.operatingSystemVersion,
      userAgent: 'SmartAdvisorMobile/$osName',
    );
  }
}

class _DeviceInfo {
  const _DeviceInfo({
    required this.deviceName,
    required this.deviceType,
    required this.osName,
    required this.osVersion,
    required this.userAgent,
  });
  final String deviceName;
  final String deviceType;
  final String osName;
  final String osVersion;
  final String userAgent;
}
