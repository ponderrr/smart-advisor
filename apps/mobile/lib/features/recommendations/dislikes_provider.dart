import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';

/// Titles the user has marked "Not for me". Persisted per-device as a
/// JSON array under [StorageKeys.prefDislikedTitles]; recommendation_flow
/// threads the set into every generation prompt as a hard exclusion so
/// pick feedback actually compounds.
class DislikedTitles extends Notifier<List<String>> {
  @override
  List<String> build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return _decode(prefs?.getString(StorageKeys.prefDislikedTitles));
  }

  static List<String> _decode(String? raw) {
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = jsonDecode(raw);
      if (list is! List) return const [];
      return list
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  bool contains(String title) =>
      state.any((t) => t.toLowerCase() == title.toLowerCase());

  Future<void> add(String title) async {
    final t = title.trim();
    if (t.isEmpty || contains(t)) return;
    state = [...state, t];
    await _persist();
  }

  Future<void> remove(String title) async {
    state = state
        .where((t) => t.toLowerCase() != title.toLowerCase())
        .toList();
    await _persist();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        StorageKeys.prefDislikedTitles, jsonEncode(state));
  }
}

final dislikedTitlesProvider =
    NotifierProvider<DislikedTitles, List<String>>(DislikedTitles.new);
