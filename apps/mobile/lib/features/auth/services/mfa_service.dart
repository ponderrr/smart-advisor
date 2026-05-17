import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/result.dart';
import 'error_messages.dart';

class MfaEnrollment {
  const MfaEnrollment({
    required this.factorId,
    required this.qrCodeSvg,
    required this.secret,
    required this.uri,
  });
  final String factorId;
  final String qrCodeSvg;
  final String secret;
  final String uri;
}

/// Port of web mfa-service.ts using the client MFA API. The web routed
/// enroll/rename/unenroll through Next.js /api for service-role mirroring;
/// on mobile the supabase.auth.mfa.* client API is sufficient and needs no
/// extra backend.
class MfaService {
  MfaService(this._c);

  final SupabaseClient _c;
  GoTrueClient get _auth => _c.auth;

  Future<ServiceResult<MfaEnrollment>> enroll({String? friendlyName}) async {
    try {
      // Clear unverified factors left by aborted attempts.
      final existing = await _auth.mfa.listFactors();
      for (final f in existing.totp) {
        if (f.status != FactorStatus.verified) {
          await _auth.mfa.unenroll(f.id);
        }
      }
      final label =
          '${friendlyName ?? 'Authenticator'} · ${DateTime.now().toIso8601String().split('T').first}';
      final res = await _auth.mfa.enroll(
        factorType: FactorType.totp,
        // gotrue requires an issuer for TOTP — shown in the auth app.
        issuer: 'Smart Advisor',
        friendlyName: label,
      );
      return ServiceResult.ok(MfaEnrollment(
        factorId: res.id,
        qrCodeSvg: res.totp?.qrCode ?? '',
        secret: res.totp?.secret ?? '',
        uri: res.totp?.uri ?? '',
      ));
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not start MFA setup.'));
    }
  }

  Future<ServiceResult<void>> verify(String factorId, String code) async {
    if (code.length != 6) {
      return ServiceResult.fail('Enter the 6-digit code.');
    }
    try {
      await _auth.mfa.challengeAndVerify(factorId: factorId, code: code);
      final uid = _auth.currentUser?.id;
      if (uid != null) {
        await _c.from('profiles').update({
          'mfa_enabled': true,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }).eq('id', uid);
      }
      await _auth.refreshSession();
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Invalid authentication code.'));
    }
  }

  Future<ServiceResult<void>> unenroll(String factorId) async {
    try {
      await _auth.mfa.unenroll(factorId);
      final remaining = await _auth.mfa.listFactors();
      final uid = _auth.currentUser?.id;
      if (uid != null && remaining.totp.every((f) => f.status != FactorStatus.verified)) {
        await _c.from('profiles').update({
          'mfa_enabled': false,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }).eq('id', uid);
      }
      await _auth.refreshSession();
      return ServiceResult.ok(null);
    } on AuthException catch (e) {
      return ServiceResult.fail(
          toUserFriendlyError(e.message, 'Could not remove the authenticator.'));
    }
  }

  Future<ServiceResult<List<Factor>>> listFactors() async {
    try {
      final res = await _auth.mfa.listFactors();
      return ServiceResult.ok(res.all);
    } on AuthException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  AuthMFAGetAuthenticatorAssuranceLevelResponse aalLevel() =>
      _auth.mfa.getAuthenticatorAssuranceLevel();
}
