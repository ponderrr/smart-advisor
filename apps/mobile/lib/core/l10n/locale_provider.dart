import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';
import '../supabase/supabase_providers.dart';

/// Every locale the app ships `.arb` translations for. Keep this in sync
/// with the files under lib/l10n/ and MaterialApp.supportedLocales.
const kSupportedLocales = <Locale>[
  Locale('en'),
  Locale('es'),
  Locale('fr'),
  Locale('de'),
  Locale('pt'),
  Locale('it'),
  Locale('nl'),
  Locale('ja'),
  Locale('zh'),
  Locale('ko'),
];

/// Native display names, keyed by language code — used by the language
/// picker so each option reads in its own language.
const kLanguageNames = <String, String>{
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'pt': 'Português',
  'it': 'Italiano',
  'nl': 'Nederlands',
  'ja': '日本語',
  'zh': '中文',
  'ko': '한국어',
};

/// App UI locale. Hydrates from the per-device [StorageKeys.prefLocale]
/// pref; [set] persists the choice and flips the live MaterialApp locale.
class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return _resolve(prefs?.getString(StorageKeys.prefLocale));
  }

  static Locale _resolve(String? code) {
    if (code == null) return const Locale('en');
    for (final l in kSupportedLocales) {
      if (l.languageCode == code) return l;
    }
    return const Locale('en');
  }

  Future<void> set(String code) async {
    state = _resolve(code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.prefLocale, state.languageCode);
  }
}

final localeProvider =
    NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);
