import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/env.dart';
import 'core/router/app_router.dart';
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

  runApp(const ProviderScope(child: SmartAdvisorApp()));
}

class SmartAdvisorApp extends ConsumerWidget {
  const SmartAdvisorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    // Adaptive-first root: Material theming on Android, native iOS 26 on
    // iOS. Both themes use our ported tokens so the brand colors are
    // consistent across the platform-native chrome.
    return AdaptiveApp.router(
      title: 'Smart Advisor',
      routerConfig: router,
      themeMode: ThemeMode.system,
      materialLightTheme: AppTheme.light(),
      materialDarkTheme: AppTheme.dark(),
    );
  }
}
