import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/router/redirect.dart';

String? r({
  required String loc,
  bool maintenance = false,
  bool authed = false,
  bool onboarded = false,
}) =>
    resolveRedirect(
      location: loc,
      maintenance: maintenance,
      authenticated: authed,
      onboardingComplete: onboarded,
    );

void main() {
  group('maintenance gate', () {
    test('forces /maintenance when on', () {
      expect(r(loc: '/', maintenance: true), '/maintenance');
      expect(r(loc: '/maintenance', maintenance: true), isNull);
    });
    test('leaves /maintenance when off', () {
      expect(r(loc: '/maintenance', authed: true, onboarded: true), '/');
      expect(r(loc: '/maintenance'), '/auth');
    });
  });

  group('unauthenticated', () {
    test('protected routes bounce to /auth', () {
      expect(r(loc: '/'), '/auth');
      expect(r(loc: '/library'), '/auth');
    });
    test('public routes are allowed', () {
      expect(r(loc: '/auth'), isNull);
      expect(r(loc: '/auth/reset-password'), isNull);
      expect(r(loc: '/demo'), isNull);
      expect(r(loc: '/group-quiz/ABC'), isNull);
    });
  });

  group('authenticated', () {
    test('incomplete onboarding → /onboarding', () {
      expect(r(loc: '/', authed: true), '/onboarding');
      expect(r(loc: '/library', authed: true), '/onboarding');
      expect(r(loc: '/onboarding', authed: true), isNull);
    });
    test('completed onboarding leaves auth/onboarding screens', () {
      expect(r(loc: '/auth', authed: true, onboarded: true), '/');
      expect(r(loc: '/onboarding', authed: true, onboarded: true), '/');
      expect(r(loc: '/', authed: true, onboarded: true), isNull);
      expect(r(loc: '/library', authed: true, onboarded: true), isNull);
    });
  });
}
