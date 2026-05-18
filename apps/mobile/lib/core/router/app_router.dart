import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/account/account_screen.dart';
import '../../features/account/mfa_setup_screen.dart';
import '../../features/auth/auth_providers.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/dashboard/milestones_screen.dart';
import '../../features/demo/demo_screen.dart';
import '../../features/feed/feed_screen.dart';
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

/// Slide-up modal page for focused tasks (solo + group quiz): dimmed,
/// non-dismissible barrier so the only way out is the screen's confirmed
/// close. Enter = fade + slide up; leave (pop) = the same reversed, so it
/// fades + slides back down with no shell re-animation.
CustomTransitionPage<void> _modalPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    opaque: false,
    barrierColor: const Color(0x99000000),
    barrierDismissible: false,
    fullscreenDialog: true,
    transitionDuration: const Duration(milliseconds: 320),
    reverseTransitionDuration: const Duration(milliseconds: 260),
    child: child,
    transitionsBuilder: (_, animation, _, c) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 1),
            end: Offset.zero,
          ).animate(curved),
          child: c,
        ),
      );
    },
  );
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
      // Group quiz is a focused modal task too (same chrome/transition as
      // the solo quiz): slides up over a dimmed barrier, pops back down.
      GoRoute(
          path: '/group-quiz',
          pageBuilder: (_, state) =>
              _modalPage(state, const GroupQuizScreen()),
          routes: [
            GoRoute(
                path: ':code',
                pageBuilder: (_, s) => _modalPage(
                    s,
                    GroupQuizSessionScreen(
                        code: s.pathParameters['code']!))),
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
      GoRoute(
          path: '/milestones',
          builder: (_, _) => const MilestonesScreen()),
      GoRoute(
          path: '/account/mfa-setup',
          builder: (_, _) => const MfaSetupScreen()),
      // Quiz is a focused modal task: it slides up over the shell with a
      // dimmed barrier and a single confirmed exit (no bottom nav). The
      // Solo/Group choice is the sheet from the Quiz nav item; /quiz and
      // the /quiz/solo alias go straight into the quiz.
      GoRoute(
        path: '/quiz',
        pageBuilder: (_, state) =>
            _modalPage(state, const QuizScreen()),
        routes: [
          GoRoute(
              path: 'solo',
              pageBuilder: (_, state) =>
                  _modalPage(state, const QuizScreen())),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) =>
            AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(
              path: '/', builder: (_, _) => const DashboardScreen()),
          GoRoute(
              path: '/feed', builder: (_, _) => const FeedScreen()),
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
