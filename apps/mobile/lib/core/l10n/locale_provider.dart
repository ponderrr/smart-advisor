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

/// Sentinel pref value meaning "follow the device language" — the app
/// then passes a null locale to MaterialApp and Flutter resolves the
/// platform locale against [kSupportedLocales].
const kSystemLocaleCode = 'system';

/// App UI locale. `null` state == follow the device / OS language (incl.
/// Android's per-app language setting). A concrete [Locale] pins the app
/// to that language regardless of the device. Hydrates from the
/// per-device [StorageKeys.prefLocale] pref.
class LocaleNotifier extends Notifier<Locale?> {
  @override
  Locale? build() {
    final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
    return _resolve(prefs?.getString(StorageKeys.prefLocale));
  }

  /// null / "system" / unknown → null (system default); a supported code
  /// → that Locale.
  static Locale? _resolve(String? code) {
    if (code == null || code == kSystemLocaleCode) return null;
    for (final l in kSupportedLocales) {
      if (l.languageCode == code) return l;
    }
    return null;
  }

  /// Persist + apply a language choice. Pass [kSystemLocaleCode] (or null)
  /// to fall back to the device language.
  Future<void> set(String? code) async {
    final next = code ?? kSystemLocaleCode;
    state = _resolve(next);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.prefLocale, next);
  }
}

final localeProvider =
    NotifierProvider<LocaleNotifier, Locale?>(LocaleNotifier.new);
