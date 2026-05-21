/// Pure route-gating decision, ported from the web middleware + auth-redirect
/// rules. Kept side-effect-free so it's unit-testable.
///
/// Returns the path to redirect to, or null to allow the current location.
String? resolveRedirect({
  required String location,
  required bool maintenance,
  required bool authenticated,
  required bool onboardingComplete,

  /// Whether the pre-auth intro carousel has been seen. First-launch
  /// unauthenticated users are sent to `/intro` before anything else.
  required bool introSeen,
}) {
  bool startsWith(String p) => location == p || location.startsWith('$p/');

  // 1. Maintenance gate (allowlist: the maintenance screen itself).
  if (maintenance) {
    return location == '/maintenance' ? null : '/maintenance';
  }
  if (location == '/maintenance') {
    return authenticated ? '/' : '/auth';
  }

  final isIntro = location == '/intro';

  // Share / deep-link entrypoints that bypass the intro even on a fresh
  // install (web: /demo*, /group-quiz*).
  final isPublicDeepLink =
      startsWith('/demo') || startsWith('/group-quiz');

  // 2. Unauthenticated.
  if (!authenticated) {
    // The intro is always reachable pre-auth — first launch is forced
    // here, and the auth screen's back arrow navigates here on purpose.
    if (isIntro) return null;
    if (isPublicDeepLink) return null;
    // First launch: show the pitch before sign in / sign up.
    if (!introSeen) return '/intro';
    if (startsWith('/auth')) return null;
    return '/auth';
  }

  // Authenticated users never sit on the pre-auth intro.
  if (isIntro) return onboardingComplete ? '/' : '/onboarding';

  // 3. Authenticated but onboarding not finished → /onboarding
  //    (allow the onboarding screen and auth callback to proceed).
  if (!onboardingComplete &&
      location != '/onboarding' &&
      !startsWith('/auth')) {
    return '/onboarding';
  }

  // 4. Authenticated + done shouldn't sit on the auth/onboarding screens.
  if (onboardingComplete &&
      (location == '/auth' || location == '/onboarding')) {
    return '/';
  }

  return null;
}
