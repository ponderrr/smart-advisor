import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/router/redirect.dart';

String? r({
  required String loc,
  bool maintenance = false,
  bool authed = false,
  bool onboarded = false,
  bool introSeen = true,
}) =>
    resolveRedirect(
      location: loc,
      maintenance: maintenance,
      authenticated: authed,
      onboardingComplete: onboarded,
      introSeen: introSeen,
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

  group('pre-auth intro', () {
    test('first launch forces /intro before auth', () {
      expect(r(loc: '/', introSeen: false), '/intro');
      expect(r(loc: '/auth', introSeen: false), '/intro');
      expect(r(loc: '/library', introSeen: false), '/intro');
      expect(r(loc: '/intro', introSeen: false), isNull);
    });
    test('deep links still bypass the intro', () {
      expect(r(loc: '/demo', introSeen: false), isNull);
      expect(r(loc: '/group-quiz/ABC', introSeen: false), isNull);
    });
    test('/intro stays reachable pre-auth once seen (back-arrow target)',
        () {
      expect(r(loc: '/intro'), isNull);
    });
    test('authenticated users never sit on /intro', () {
      expect(r(loc: '/intro', authed: true), '/onboarding');
      expect(r(loc: '/intro', authed: true, onboarded: true), '/');
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
