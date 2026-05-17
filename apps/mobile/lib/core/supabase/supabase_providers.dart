import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../constants/app_constants.dart';

/// The initialized Supabase client (Supabase.initialize runs in main()).
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

/// Auth state stream — drives router redirects and session-gated providers.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(supabaseClientProvider).auth.onAuthStateChange;
});

/// Current session (synchronous snapshot), or null when signed out.
final currentSessionProvider = Provider<Session?>((ref) {
  ref.watch(authStateProvider);
  return ref.watch(supabaseClientProvider).auth.currentSession;
});

final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) {
  return SharedPreferences.getInstance();
});

/// Content tone sent to the anthropic-* Edge Functions: "standard" | "family".
/// Web reads this from localStorage; mobile uses SharedPreferences. Defaults
/// to "standard" when unset (matches web behavior).
final contentToneProvider = Provider<String>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
  final tone = prefs?.getString(StorageKeys.prefContentTone);
  return tone == 'family' ? 'family' : 'standard';
});
