import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Tiny last-good-snapshot cache for list screens. After a successful
/// fetch the rows are stashed as JSON in SharedPreferences; when a later
/// fetch fails (cold launch offline, flaky network) the screen can fall
/// back to the snapshot instead of showing an empty/error state.
class OfflineCache {
  const OfflineCache._();

  static String _k(String name) => 'sa.offline_cache.$name';

  /// Stash a list of JSON rows under [name].
  static Future<void> writeList(
      String name, List<Map<String, dynamic>> rows) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_k(name), jsonEncode(rows));
    } catch (_) {
      // Cache writes are best-effort — never let them break a fetch.
    }
  }

  /// Read back the rows stashed under [name]; empty list if none / bad.
  static Future<List<Map<String, dynamic>>> readList(String name) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_k(name));
      if (raw == null || raw.isEmpty) return const [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    } catch (_) {
      return const [];
    }
  }
}
