import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/auth/services/error_messages.dart';

void main() {
  test('maps known Supabase auth errors (order-sensitive)', () {
    expect(toUserFriendlyError('Invalid login credentials', 'x'),
        'Invalid email or password. Please try again.');
    expect(toUserFriendlyError('Email not confirmed', 'x'),
        'Please verify your email before signing in.');
    expect(toUserFriendlyError('User already registered', 'x'),
        'An account already exists for this email. Try signing in instead.');
    expect(toUserFriendlyError('JWT expired', 'x'),
        'Your session expired. Please sign in again.');
    expect(toUserFriendlyError('rate limit exceeded', 'x'),
        'Too many attempts right now. Please wait a moment and try again.');
    expect(toUserFriendlyError('Invalid TOTP code', 'x'),
        'Invalid authentication code. Please try again.');
  });

  test('falls back when unmapped or empty', () {
    expect(toUserFriendlyError('some weird error', 'fallback'), 'fallback');
    expect(toUserFriendlyError(null, 'fallback'), 'fallback');
    expect(toUserFriendlyError('', 'fallback'), 'fallback');
  });
}
