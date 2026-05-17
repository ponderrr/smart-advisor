import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_providers.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/maintenance/maintenance_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/shell/app_shell.dart';
import '../supabase/supabase_providers.dart';
import 'redirect.dart';

/// Bridges Riverpod auth/profile changes to GoRouter so redirects re-run.
class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authStateProvider, (_, _) => notifyListeners());
    _ref.listen(currentProfileProvider, (_, _) => notifyListeners());
  }
  final Ref _ref;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefresh(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final maintenance = ref.read(maintenanceModeProvider);
      final authed = ref.read(currentSessionProvider) != null;
      final profile = ref.read(currentProfileProvider);
      // While the profile loads for an authed user, don't bounce — avoids
      // a redirect flicker before setup_completed_at is known.
      if (authed && profile.isLoading) return null;
      final onboardingComplete =
          profile.asData?.value?.setupCompletedAt != null;
      return resolveRedirect(
        location: state.matchedLocation,
        maintenance: maintenance,
        authenticated: authed,
        onboardingComplete: onboardingComplete,
      );
    },
    routes: [
      GoRoute(
          path: '/auth',
          builder: (_, _) => const AuthScreen(),
          routes: [
            GoRoute(
                path: 'reset-password',
                builder: (_, _) => const ResetPasswordScreen()),
            GoRoute(
                path: 'verified',
                builder: (_, _) => const VerifiedScreen()),
          ]),
      GoRoute(
          path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(
          path: '/maintenance',
          builder: (_, _) => const MaintenanceScreen()),
      ShellRoute(
        builder: (context, state, child) =>
            AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(
              path: '/',
              builder: (_, _) => const PlaceholderTab('Home')),
          GoRoute(
              path: '/quiz',
              builder: (_, _) => const PlaceholderTab('Quiz')),
          GoRoute(
              path: '/library',
              builder: (_, _) => const PlaceholderTab('Library')),
          GoRoute(
              path: '/account',
              builder: (_, _) => const PlaceholderTab('Account')),
        ],
      ),
    ],
  );
});
