import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/constants/app_constants.dart';
import '../../core/result.dart';
import '../../core/supabase/supabase_providers.dart';

const _themeKey = 'smart_advisor_theme_mode';

/// Theme mode persisted in SharedPreferences; AdaptiveApp watches this.
class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return switch (prefs?.getString(_themeKey)) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> set(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
  }
}

final themeModeProvider =
    NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);

const _amoledKey = 'smart_advisor_amoled';

/// Pure-black surfaces in dark mode (OLED). Persisted.
class AmoledController extends Notifier<bool> {
  @override
  bool build() =>
      ref
          .watch(sharedPreferencesProvider)
          .asData
          ?.value
          .getBool(_amoledKey) ??
      false;

  Future<void> set(bool on) async {
    state = on;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_amoledKey, on);
  }
}

final amoledProvider =
    NotifierProvider<AmoledController, bool>(AmoledController.new);

/// Writes content preferences. Tone is also hot-cached in SharedPreferences
/// for the AI service (parity with the web localStorage cache). Content tone
/// is age-locked to "family" for under-18 (server still enforces).
class SettingsService {
  SettingsService(this._c);
  final SupabaseClient _c;

  Future<ServiceResult<void>> updateContentPreferences({
    String? contentFocus,
    String? contentTone,
    int? questionCount,
  }) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    final updates = <String, dynamic>{
      'content_focus': ?contentFocus,
      'content_tone': ?contentTone,
      'preferred_question_count': ?questionCount,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    };
    try {
      await _c.from('profiles').update(updates).eq('id', uid);
      if (contentTone != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(StorageKeys.prefContentTone, contentTone);
      }
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  /// Persists the taste-tuning / hard filters blob to the profile row and
  /// mirrors it into SharedPreferences for the AI service (parity with the
  /// content-tone hot cache). Shape:
  /// `{ avoidGenres: string[], maxRuntimeMinutes: int|null,
  ///    language: string|null, avoidNote: string|null }`.
  Future<ServiceResult<void>> updateRecommendationFilters(
      Map<String, dynamic> filters) async {
    final uid = _c.auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    try {
      await _c.from('profiles').update(<String, dynamic>{
        'recommendation_filters': filters,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', uid);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
          StorageKeys.prefRecommendationFilters, jsonEncode(filters));
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }
}

final settingsServiceProvider = Provider<SettingsService>(
    (ref) => SettingsService(ref.watch(supabaseClientProvider)));
