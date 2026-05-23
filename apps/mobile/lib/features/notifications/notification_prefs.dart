import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/supabase/supabase_providers.dart';

/// Per-device set of muted server-notification kinds. We default to
/// "everything on" — an empty set — so an existing install picks up
/// new kinds without the user having to discover the toggle. Stored
/// as a comma-separated string under `sa.notif_muted_kinds`.
class MutedNotificationKinds extends Notifier<Set<String>> {
  static const _key = 'sa.notif_muted_kinds';

  @override
  Set<String> build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    final raw = prefs?.getString(_key) ?? '';
    return raw.isEmpty ? <String>{} : raw.split(',').toSet();
  }

  /// Returns true when [kind] is currently muted (off in Settings).
  bool isMuted(String kind) => state.contains(kind);

  Future<void> setMuted(String kind, bool muted) async {
    final next = {...state};
    if (muted) {
      next.add(kind);
    } else {
      next.remove(kind);
    }
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, next.join(','));
  }
}

final mutedNotificationKindsProvider =
    NotifierProvider<MutedNotificationKinds, Set<String>>(
        MutedNotificationKinds.new);
