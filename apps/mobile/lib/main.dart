import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/env.dart';
import 'core/router/app_router.dart';
import 'core/supabase/supabase_providers.dart';
import 'core/ui_messenger.dart';
import 'features/notifications/notification_service.dart';
import 'features/security/biometric.dart';
import 'features/security/biometric_login.dart';
import 'features/settings/settings_service.dart';
import 'ui/adaptive.dart';
import 'ui/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Env.load();
  Env.assertValid();

  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );
  await NotificationService.init();

  runApp(const ProviderScope(child: SmartAdvisorApp()));
}

class SmartAdvisorApp extends ConsumerWidget {
  const SmartAdvisorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    // supabase_flutter auto-exchanges the auth deep link and emits an
    // event. For password-reset links, send the user to the reset screen
    // (the recovery session is already established by then).
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (_, next) {
      final event = next.asData?.value.event;
      if (event == AuthChangeEvent.passwordRecovery) {
        router.go('/auth/reset-password');
      }
      // Supabase rotates the refresh token on sign-in and every refresh;
      // keep the biometric-login copy current (no-op if not enabled).
      if (event == AuthChangeEvent.signedIn ||
          event == AuthChangeEvent.tokenRefreshed) {
        ref.read(biometricLoginProvider.notifier).saveSession();
      }
    });
    return AdaptiveApp.router(
      title: 'Smart Advisor',
      routerConfig: router,
      themeMode: ref.watch(themeModeProvider),
      materialLightTheme: AppTheme.light(),
      materialDarkTheme: AppTheme.dark(),
      scaffoldMessengerKey: scaffoldMessengerKey,
      // Wrap the app in an Overlay and mark a context beneath both it and
      // the MaterialApp ScaffoldMessenger. AdaptiveSnackBar needs an
      // Overlay ancestor (iOS banner) or a ScaffoldMessenger ancestor
      // (Android snackbar); the bare global-key context has neither, which
      // crashed showBanner. This gives it a valid context on both.
      builder: (context, child) => Overlay(
        initialEntries: [
          OverlayEntry(
            builder: (_) => KeyedSubtree(
              key: messengerContextKey,
              child: BiometricGate(child: child ?? const SizedBox.shrink()),
            ),
          ),
        ],
      ),
    );
  }
}
