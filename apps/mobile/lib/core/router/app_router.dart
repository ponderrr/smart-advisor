import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/account/account_screen.dart';
import '../../features/account/mfa_setup_screen.dart';
import '../../features/account/screens/appearance_settings_screen.dart';
import '../../features/account/screens/change_credential_screen.dart';
import '../../features/account/screens/feed_settings_screen.dart';
import '../../features/account/screens/contact_screen.dart';
import '../../features/account/screens/faq_screen.dart';
import '../../features/account/screens/notifications_settings_screen.dart';
import '../../features/account/screens/profile_settings_screen.dart';
import '../../features/account/screens/recommendations_settings_screen.dart';
import '../../features/account/screens/reports_screen.dart';
import '../../features/account/screens/security_settings_screen.dart';
import '../../features/account/screens/two_factor_screen.dart';
import '../../features/auth/auth_providers.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/auth/screens/sign_in_screen.dart';
import '../../features/auth/screens/sign_up_screen.dart';
import '../../features/dashboard/milestones_screen.dart';
import '../../features/demo/demo_screen.dart';
import '../../features/feed/feed_screen.dart';
import '../../features/feed/models/feed_models.dart';
import '../../features/feed/screens/add_friends_screen.dart';
import '../../features/feed/screens/community_screen.dart';
import '../../features/feed/screens/friends_screen.dart';
import '../../features/feed/screens/post_detail_screen.dart';
import '../../features/feed/screens/report_screen.dart';
import '../../features/feed/screens/user_profile_screen.dart';
import '../../features/group_quiz/screens/group_quiz_screen.dart';
import '../../features/group_quiz/screens/group_quiz_session_screen.dart';
import '../../features/history/history_screen.dart';
import '../../features/library/screens/import_screen.dart';
import '../../features/library/screens/library_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/maintenance/maintenance_screen.dart';
import '../../core/constants/app_constants.dart';
import '../../core/models/recommendation.dart';
import '../../features/onboarding/get_started_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/onboarding/tutorial_screen.dart';
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

/// Horizontal slide page for the auth screens — sign-in ↔ sign-up slide
/// the card left/right (an iOS-style push) instead of the default
/// fade-up. The covered screen eases partway off-screen for depth.
CustomTransitionPage<void> _authPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 320),
    reverseTransitionDuration: const Duration(milliseconds: 300),
    child: child,
    transitionsBuilder: (_, animation, secondaryAnimation, child) {
      const curve = Curves.easeOutCubic;
      final enter = Tween<Offset>(
        begin: const Offset(1, 0),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: animation, curve: curve));
      final cover = Tween<Offset>(
        begin: Offset.zero,
        end: const Offset(-0.25, 0),
      ).animate(
          CurvedAnimation(parent: secondaryAnimation, curve: curve));
      return SlideTransition(
        position: cover,
        child: SlideTransition(position: enter, child: child),
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
      // While prefs are still loading, assume "seen" so returning users
      // never flash the intro. Once loaded, an *unset* flag is a genuine
      // first launch → show the intro. (The refresh listener re-runs this
      // when SharedPreferences resolves.)
      final prefsValue =
          ref.read(sharedPreferencesProvider).asData?.value;
      final introSeen = prefsValue == null
          ? true
          : prefsValue.getBool(StorageKeys.introSeen) ?? false;
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
          pageBuilder: (_, s) => _authPage(s, const SignInScreen()),
          routes: [
            GoRoute(
                path: 'signup',
                pageBuilder: (_, s) =>
                    _authPage(s, const SignUpScreen())),
            GoRoute(
                path: 'reset-password',
                builder: (_, _) => const ResetPasswordScreen()),
            GoRoute(
                path: 'verified',
                builder: (_, _) => const VerifiedScreen()),
          ]),
      GoRoute(path: '/intro', builder: (_, _) => const GetStartedScreen()),
      GoRoute(
          path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
      GoRoute(
          path: '/tutorial', builder: (_, _) => const TutorialScreen()),
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
      GoRoute(
          path: '/demo',
          pageBuilder: (_, state) =>
              _modalPage(state, const DemoScreen())),
      GoRoute(
          path: '/wrapped',
          builder: (_, _) => const WrappedScreen(),
          routes: [
            GoRoute(
                path: 'month',
                builder: (_, _) => const WrappedScreen(
                    period: WrappedPeriod.month)),
          ]),
      GoRoute(
          path: '/milestones',
          builder: (_, _) => const MilestonesScreen()),
      GoRoute(
          path: '/account/mfa-setup',
          builder: (_, _) => const MfaSetupScreen()),
      // Settings hub sub-screens: full-page pushes outside the shell
      // (same registration pattern as /account/mfa-setup above).
      GoRoute(
          path: '/account/profile',
          builder: (_, _) => const ProfileSettingsScreen()),
      GoRoute(
          path: '/account/appearance',
          builder: (_, _) => const AppearanceSettingsScreen()),
      GoRoute(
          path: '/account/recommendations',
          builder: (_, _) => const RecommendationsSettingsScreen()),
      GoRoute(
          path: '/account/feed',
          builder: (_, _) => const FeedSettingsScreen()),
      GoRoute(
          path: '/account/notifications',
          builder: (_, _) => const NotificationsSettingsScreen()),
      GoRoute(
          path: '/account/security',
          builder: (_, _) => const SecuritySettingsScreen()),
      GoRoute(
          path: '/account/two-factor',
          builder: (_, _) => const TwoFactorScreen()),
      GoRoute(
          path: '/account/faq',
          builder: (_, _) => const FaqScreen()),
      GoRoute(
          path: '/account/contact',
          builder: (_, _) => const ContactScreen()),
      GoRoute(
          path: '/account/reports',
          builder: (_, _) => const ReportsScreen()),
      GoRoute(
          path: '/account/change-email',
          builder: (_, _) => const ChangeCredentialScreen(
              kind: CredentialKind.email)),
      GoRoute(
          path: '/account/change-password',
          builder: (_, _) => const ChangeCredentialScreen(
              kind: CredentialKind.password)),
      // Library bulk-import (Letterboxd / Goodreads CSV): a full-page
      // push outside the shell, same pattern as the /account/* screens.
      GoRoute(
          path: '/library/import',
          builder: (_, _) => const ImportScreen()),
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
          // One-tap: skips content/questions, generates straight away
          // from a "no constraints, surprise me" prompt.
          GoRoute(
              path: 'surprise',
              pageBuilder: (_, state) =>
                  _modalPage(state, const QuizScreen(surprise: true))),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) =>
            AppShell(location: state.matchedLocation, child: child),
        routes: [
          // Feed is the home/landing surface (social-first).
          GoRoute(
              path: '/',
              builder: (_, _) => const FeedScreen(),
              // Feed sub-pages: full-page pushes that keep the 5-tab nav
              // (web parity — /feed/[id], /feed/u/[id], /feed/c/[community]).
              // Cold deep-links here while unauthenticated already route to
              // /auth via resolveRedirect's !authenticated branch.
              routes: [
                GoRoute(
                    path: 'feed/people',
                    builder: (_, _) => const AddFriendsScreen()),
                // Friends list — your follow graph. ?tab=followers opens
                // straight to the Followers tab (used by the profile stats).
                GoRoute(
                    path: 'feed/friends',
                    builder: (_, s) => FriendsScreen(
                        initialTab:
                            s.uri.queryParameters['tab'] == 'followers'
                                ? 1
                                : 0)),
                GoRoute(
                    path: 'feed/report',
                    builder: (_, s) => ReportScreen(
                          postId: s.uri.queryParameters['postId'],
                          commentId: s.uri.queryParameters['commentId'],
                        )),
                GoRoute(
                    path: 'feed/:id',
                    builder: (_, s) => PostDetailScreen(
                        postId: s.pathParameters['id']!)),
                GoRoute(
                    path: 'feed/u/:id',
                    builder: (_, s) => UserProfileScreen(
                        profileId: s.pathParameters['id']!)),
                GoRoute(
                    path: 'feed/c/:community',
                    builder: (_, s) => CommunityScreen(
                        community: feedCommunityFromWire(
                            s.pathParameters['community']!))),
              ]),
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
