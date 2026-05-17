import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/app_user.dart';
import '../../../core/result.dart';
import 'error_messages.dart';

/// Port of web auth-service.ts (client-callable surface). AAL2-gated
/// operations that the web routes through Next.js /api/account/* (change
/// email/password, delete/disable account, factor rename/unenroll-via-API)
/// are deferred — they need Supabase Edge Functions, same blocker as the
/// other /api routes. Client MFA (supabase.auth.mfa.*) is handled in
/// MfaService and works without those endpoints.
class AuthService {
  AuthService(this._c);

  final SupabaseClient _c;

  GoTrueClient get _auth => _c.auth;

  String _norm(String email) => email.trim().toLowerCase();

  Future<ServiceResult<void>> signUp({
    required String email,
    required String password,
    required String name,
    required String username,
    required int age,
  }) async {
    try {
      final res = await _auth.signUp(
        email: _norm(email),
        password: password,
        data: {
          'name': name,
          'full_name': name,
          'first_name': name,
          'age': age,
        },
        emailRedirectTo: 'live.smartadvisor://auth/callback',
      );
      // Supabase returns an empty identities list when the email already
      // exists (obfuscated duplicate).
      if (res.user?.identities?.isEmpty ?? false) {
        return ServiceResult.fail(
            'An account already exists for this email. Try signing in instead.');
      }
      final uid = res.user?.id;
      if (uid != null) {
        await _c.from('profiles').upsert({
          'id': uid,
          'name': name,
          'username': username,
          'age': age,
          'email': _norm(email),
        });
      }
      // Clear the transient session pending email verification.
      await _auth.signOut();
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not create your account.'));
    }
  }

  Future<String?> _resolveIdentifierToEmail(String identifier) async {
    if (identifier.contains('@')) return _norm(identifier);
    final email = await _c.rpc('get_email_for_username',
        params: {'p_username': identifier.trim()});
    return email is String && email.isNotEmpty ? email : null;
  }

  /// Returns `mfaRequired: true` when the session is AAL1 but AAL2 is
  /// available (caller must run the MFA challenge before proceeding).
  Future<ServiceResult<bool>> signIn(
      String identifier, String password) async {
    try {
      final email = await _resolveIdentifierToEmail(identifier);
      if (email == null) {
        return ServiceResult.fail('Invalid email or password. Please try again.');
      }
      await _auth.signInWithPassword(email: email, password: password);
      final uid = _auth.currentUser?.id;
      if (uid != null) {
        final existing = await _c
            .from('profiles')
            .select('id')
            .eq('id', uid)
            .maybeSingle();
        if (existing == null) {
          final meta = _auth.currentUser?.userMetadata ?? const {};
          await _c.from('profiles').insert({
            'id': uid,
            'name': meta['name'] ?? meta['full_name'] ?? '',
            'email': _auth.currentUser?.email,
            'age': meta['age'] ?? 0,
          });
        } else {
          await _c.from('profiles').update({
            'last_login': DateTime.now().toUtc().toIso8601String(),
          }).eq('id', uid);
        }
      }
      final aal = _auth.mfa.getAuthenticatorAssuranceLevel();
      final mfaRequired =
          aal.currentLevel == AuthenticatorAssuranceLevels.aal1 &&
              aal.nextLevel == AuthenticatorAssuranceLevels.aal2;
      return ServiceResult.ok(mfaRequired);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not sign you in.'));
    }
  }

  Future<ServiceResult<void>> resetPassword(String email) async {
    try {
      await _auth.resetPasswordForEmail(_norm(email),
          redirectTo: 'live.smartadvisor://auth/reset-password');
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not send the reset email.'));
    }
  }

  Future<ServiceResult<void>> resendVerificationEmail(String email) async {
    try {
      await _auth.resend(
        type: OtpType.signup,
        email: _norm(email),
        emailRedirectTo: 'live.smartadvisor://auth/callback',
      );
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not resend the email.'));
    }
  }

  /// Used by the password-reset screen once a recovery session exists.
  Future<ServiceResult<void>> updatePasswordWithTicket(
      String password) async {
    try {
      await _auth.updateUser(UserAttributes(password: password));
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not update your password.'));
    }
  }

  /// AAL2-gated account ops via the Edge Functions (account-*). The
  /// function verifies the token's aal claim; a 403 means the user must
  /// step up (re-verify 2FA) first.
  Future<ServiceResult<void>> _invokeAccount(
      String fn, Map<String, dynamic>? body) async {
    try {
      final res = await _c.functions.invoke(fn, body: body ?? {});
      final data = res.data;
      if (data is Map && (data['ok'] == true || data['success'] == true)) {
        return ServiceResult.ok(null);
      }
      final msg = (data is Map ? data['error'] : null) as String?;
      return ServiceResult.fail(msg ?? 'Request failed.');
    } on FunctionException catch (e) {
      final d = e.details;
      if (e.status == 403) {
        return ServiceResult.fail(
            'Verify your second factor (2FA) before changing this.');
      }
      return ServiceResult.fail(
          (d is Map && d['error'] is String) ? d['error'] as String
              : 'Request failed (${e.status}).');
    }
  }

  Future<ServiceResult<void>> changeEmail(String email) =>
      _invokeAccount('account-email', {'email': email.trim().toLowerCase()});

  Future<ServiceResult<void>> changePassword(String password) =>
      _invokeAccount('account-password', {'password': password});

  Future<ServiceResult<void>> disableAccount() =>
      _invokeAccount('account-disable', null);

  Future<ServiceResult<void>> deleteAccount() async {
    final r = await _invokeAccount('account-delete', null);
    if (!r.isError) await _auth.signOut();
    return r;
  }

  Future<ServiceResult<void>> signOut() async {
    try {
      await _auth.signOut();
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<AppUser>> getCurrentUser() async {
    final uid = _auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    try {
      final row =
          await _c.from('profiles').select().eq('id', uid).single();
      return ServiceResult.ok(
          AppUser.fromJson(Map<String, dynamic>.from(row)));
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> updateProfile(
      {required String name, required int age}) async {
    final uid = _auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    try {
      await _c.from('profiles').update({
        'name': name,
        'age': age,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', uid);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  /// Onboarding completion — writes the columns that gate the
  /// onboarding-incomplete redirect (setup_completed_at) plus the
  /// age-derived content tone and locale.
  Future<ServiceResult<void>> completeOnboarding({
    required String name,
    required String locale,
  }) async {
    final uid = _auth.currentUser?.id;
    if (uid == null) return ServiceResult.fail('Not authenticated');
    final ageRow = await _c
        .from('profiles')
        .select('age')
        .eq('id', uid)
        .maybeSingle();
    final age = (ageRow?['age'] as num?)?.toInt() ?? 0;
    final tone = age > 0 && age < 18 ? 'family' : 'standard';
    try {
      await _c.from('profiles').update({
        'name': name,
        'content_tone': tone,
        'locale': locale,
        'setup_completed_at': DateTime.now().toUtc().toIso8601String(),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', uid);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }
}
