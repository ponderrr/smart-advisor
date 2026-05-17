/// Port of web src/features/auth/services/error-messages.ts.
/// Ordered, case-insensitive substring matching — keep the order; earlier
/// rules win.
String toUserFriendlyError(String? rawMessage, String fallback) {
  final m = (rawMessage ?? '').toLowerCase();
  if (m.isEmpty) return fallback;

  bool has(String s) => m.contains(s);

  if (has('user from sub claim in jwt does not exist')) {
    return 'Your session is no longer valid. Please sign in again.';
  }
  if (has('jwt') && has('expired')) {
    return 'Your session expired. Please sign in again.';
  }
  if (has('invalid refresh token') || has('refresh token')) {
    return 'Your session expired. Please sign in again.';
  }
  if (has('otp_expired') || has('email link is invalid') || has('expired')) {
    return 'That email link has expired. Please request a new one.';
  }
  if (has('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (has('user already registered') || has('already been registered')) {
    return 'An account already exists for this email. Try signing in instead.';
  }
  if (has('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (has('too many requests') || has('rate limit')) {
    return 'Too many attempts right now. Please wait a moment and try again.';
  }
  if (has('network') || has('fetch')) {
    return 'A network error occurred. Please check your connection and try again.';
  }
  if (has('for security purposes') && has('after')) {
    return 'Please wait about a minute before requesting another email.';
  }
  if (has('mfa required')) {
    return 'MFA verification required. Please enter your code.';
  }
  if (has('invalid totp') || has('invalid otp')) {
    return 'Invalid authentication code. Please try again.';
  }
  if (has('friendly_name') &&
      (has('already') || has('duplicate') || has('conflict'))) {
    return 'You already have an authenticator with that name.';
  }
  return fallback;
}
