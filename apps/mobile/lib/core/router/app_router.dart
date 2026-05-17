import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/account/account_screen.dart';
import '../../features/account/mfa_setup_screen.dart';
import '../../features/auth/auth_providers.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/demo/demo_screen.dart';
import '../../features/group_quiz/screens/group_quiz_screen.dart';
import '../../features/group_quiz/screens/group_quiz_session_screen.dart';
import '../../features/history/history_screen.dart';
import '../../features/library/screens/library_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/maintenance/maintenance_screen.dart';
import '../../core/constants/app_constants.dart';
import '../../core/models/recommendation.dart';
import '../../features/onboarding/intro_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/recommendations/screens/recommendation_detail_screen.dart';
import '../../features/quiz/screens/quiz_screen.dart';
import '../../features/wrapped/wrapped_screen.dart';
import '../../features/shell/app_shell.dart';
import '../supabase/supabase_providers.dart';
import 'redirect.dart';

/// Bridges Riverpod auth/profile changes to GoRouter so redirects re-run.
class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authStateProvider, (_, _) => notifyListeners());
    _ref.listen(currentProfileProvider, (_, _) => notifyListeners());
    // Re-run redirects once SharedPreferences resolves so first-launch
    // users get sent to /intro after the prefs load.
    _ref.listen(sharedPreferencesProvider, (_, _) => notifyListeners());
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
      // Default to "seen" while prefs load so returning users never flash
      // the intro; a fresh install flips to false once prefs resolve and
      // the refresh listener re-runs this.
      final introSeen = ref
              .read(sharedPreferencesProvider)
              .asData
              ?.value
              .getBool(StorageKeys.introSeen) ??
          true;
      return resolveRedirect(
        location: state.matchedLocation,
        maintenance: maintenance,
        authenticated: authed,
        onboardingComplete: onboardingComplete,
        introSeen: introSeen,
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
      GoRoute(path: '/intro', builder: (_, _) => const IntroScreen()),
      GoRoute(
          path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(
          path: '/maintenance',
          builder: (_, _) => const MaintenanceScreen()),
      GoRoute(
          path: '/group-quiz',
          builder: (_, _) => const GroupQuizScreen(),
          routes: [
            GoRoute(
                path: ':code',
                builder: (_, s) => GroupQuizSessionScreen(
                    code: s.pathParameters['code']!)),
          ]),
      GoRoute(
        path: '/pick',
        builder: (_, s) => RecommendationDetailScreen(
            rec: s.extra as Recommendation),
      ),
      GoRoute(
          path: '/notifications',
          builder: (_, _) => const NotificationsScreen()),
      GoRoute(path: '/demo', builder: (_, _) => const DemoScreen()),
      GoRoute(path: '/wrapped', builder: (_, _) => const WrappedScreen()),
      // Quiz is full-screen (the PWA hides the bottom nav on it). The
      // Solo/Group choice is the bottom sheet from the Quiz nav item, so
      // /quiz (and /quiz/solo alias) go straight into the quiz.
      GoRoute(
        path: '/quiz',
        builder: (_, _) => const QuizScreen(),
        routes: [
          GoRoute(path: 'solo', builder: (_, _) => const QuizScreen()),
        ],
      ),
      GoRoute(
          path: '/account/mfa-setup',
          builder: (_, _) => const MfaSetupScreen()),
      ShellRoute(
        builder: (context, state, child) =>
            AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(
              path: '/', builder: (_, _) => const DashboardScreen()),
          GoRoute(
              path: '/library',
              builder: (_, _) => const LibraryScreen()),
          GoRoute(
              path: '/history', builder: (_, _) => const HistoryScreen()),
          GoRoute(
              path: '/account',
              builder: (_, _) => const AccountScreen()),
        ],
      ),
    ],
  );
});
