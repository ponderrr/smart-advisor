/// Pure route-gating decision, ported from the web middleware + auth-redirect
/// rules. Kept side-effect-free so it's unit-testable.
///
/// Returns the path to redirect to, or null to allow the current location.
String? resolveRedirect({
  required String location,
  required bool maintenance,
  required bool authenticated,
  required bool onboardingComplete,
}) {
  bool startsWith(String p) => location == p || location.startsWith('$p/');

  // 1. Maintenance gate (allowlist: the maintenance screen itself).
  if (maintenance) {
    return location == '/maintenance' ? null : '/maintenance';
  }
  if (location == '/maintenance') {
    return authenticated ? '/' : '/auth';
  }

  // Public, no-auth-required routes (web: /, /demo*, /auth*, /group-quiz*).
  final isPublic = location == '/' && !authenticated
      ? false // root is the authed shell home; unauth root falls through
      : startsWith('/auth') ||
          startsWith('/demo') ||
          startsWith('/group-quiz');

  // 2. Unauthenticated → must be on a public route.
  if (!authenticated) {
    if (isPublic) return null;
    return '/auth';
  }

  // 3. Authenticated but onboarding not finished → /onboarding
  //    (allow the onboarding screen and auth callback to proceed).
  if (!onboardingComplete &&
      location != '/onboarding' &&
      !startsWith('/auth')) {
    return '/onboarding';
  }

  // 4. Authenticated + done shouldn't sit on the auth screens.
  if (onboardingComplete &&
      (location == '/auth' || location == '/onboarding')) {
    return '/';
  }

  return null;
}
