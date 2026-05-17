import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/env.dart';
import 'core/router/app_router.dart';
import 'core/supabase/supabase_providers.dart';
import 'core/ui_messenger.dart';
import 'features/notifications/notification_service.dart';
import 'features/security/biometric.dart';
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
      if (next.asData?.value.event == AuthChangeEvent.passwordRecovery) {
        router.go('/auth/reset-password');
      }
    });
    return AdaptiveApp.router(
      title: 'Smart Advisor',
      routerConfig: router,
      themeMode: ref.watch(themeModeProvider),
      materialLightTheme: AppTheme.light(),
      materialDarkTheme: AppTheme.dark(),
      scaffoldMessengerKey: scaffoldMessengerKey,
      builder: (context, child) =>
          BiometricGate(child: child ?? const SizedBox.shrink()),
    );
  }
}
