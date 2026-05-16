import 'package:flutter_dotenv/flutter_dotenv.dart';

/// App configuration.
///
/// Resolution order for each value:
///   1. --dart-define (compile-time) — used by tool/run.sh and CI.
///   2. bundled .env asset (runtime)  — lets a bare `flutter run` work.
///
/// Secrets are never hardcoded in source. The .env is git-ignored and
/// generated from the repo-root .env.local via tool/sync-env.sh. The two
/// values are client-public (the web app already ships them in the browser
/// bundle; RLS protects the data), so bundling them is the same posture.
class Env {
  const Env._();

  static const String _defineUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const String _defineAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  static String get supabaseUrl =>
      _defineUrl.isNotEmpty ? _defineUrl : (dotenv.maybeGet('SUPABASE_URL') ?? '');

  static String get supabaseAnonKey => _defineAnonKey.isNotEmpty
      ? _defineAnonKey
      : (dotenv.maybeGet('SUPABASE_ANON_KEY') ?? '');

  /// Loads the .env asset. Safe if it's absent (e.g. when values come from
  /// --dart-define instead) — resolution simply falls through to defines.
  static Future<void> load() async {
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {
      // No .env bundled; rely on --dart-define.
    }
  }

  /// Fails fast at startup if config is missing, so a misconfigured build
  /// surfaces immediately instead of as an opaque network error later.
  static void assertValid() {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw StateError(
        'Missing Supabase config. Either run tool/sync-env.sh to create '
        'apps/mobile/.env, or pass --dart-define=SUPABASE_URL=... and '
        '--dart-define=SUPABASE_ANON_KEY=... (see tool/run.sh).',
      );
    }
  }
}
