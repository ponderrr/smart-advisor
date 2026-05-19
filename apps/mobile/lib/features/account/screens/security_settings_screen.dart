import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';
import '../../security/biometric.dart';
import '../../security/biometric_login.dart';
import 'settings_helpers.dart';

/// Security — biometric app lock, biometric sign-in (confirm dialog kept
/// verbatim), two-factor setup, and the AAL2-gated email/password changes.
/// All relocated verbatim from the old AccountScreen "Notifications &
/// security" card (the biometric/MFA rows + _ensureAal2 / _editField).
class SecuritySettingsScreen extends ConsumerStatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  ConsumerState<SecuritySettingsScreen> createState() =>
      _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState
    extends ConsumerState<SecuritySettingsScreen> {
  String? _msg;

  /// Ensures the session is AAL2 before an AAL2-gated change. Returns false
  /// (and explains why) if it can't be satisfied.
  Future<bool> _ensureAal2() async {
    final mfa = ref.read(mfaServiceProvider);
    if (mfa.isAal2) return true;

    final factorId = await mfa.verifiedTotpFactorId();
    if (factorId == null) {
      showBanner('Set up two-factor authentication first');
      if (mounted) context.push('/account/mfa-setup');
      return false;
    }
    if (!mounted) return false;
    final code = await AdaptiveAlertDialog.inputShow(
      context: context,
      title: 'Verify it\'s you',
      message: 'Enter the 6-digit code from your authenticator app.',
      icon: Icons.shield_outlined,
      input: const AdaptiveAlertDialogInput(
          placeholder: '6-digit code'),
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
            title: 'Verify',
            style: AlertActionStyle.primary,
            onPressed: () {}),
      ],
    );
    if (code == null || code.trim().isEmpty) return false;
    final r = await mfa.verify(factorId, code.trim());
    if (r.isError) {
      showBanner(toUserFriendlyError(
          r.error, 'That code didn’t work. Please try again.'));
      return false;
    }
    return true;
  }

  Future<void> _editField({
    required String title,
    required String hint,
    bool obscure = false,
    required Future<dynamic> Function(String) onSave,
  }) async {
    final value = await AdaptiveAlertDialog.inputShow(
      context: context,
      title: title,
      icon: Icons.edit_outlined,
      input: AdaptiveAlertDialogInput(
          placeholder: hint, obscureText: obscure),
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
            title: 'Save',
            style: AlertActionStyle.primary,
            onPressed: () {}),
      ],
    );
    if (value == null || value.trim().isEmpty) return;
    final r = await onSave(value.trim());
    showBanner(r.isError
        ? toUserFriendlyError(
            r.error, 'Couldn’t save that. Please try again.')
        : 'Saved');
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: 'Security',
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BrandCard(
              child: Column(children: [
                AdaptiveListTile(
                  padding: EdgeInsets.zero,
                  leading: const Icon(Icons.fingerprint),
                  title: const Text('App lock'),
                  subtitle: Text(PlatformInfo.isIOS
                      ? 'Require Face ID / Touch ID to open'
                      : 'Require fingerprint or face unlock to open'),
                  trailing: AdaptiveSwitch(
                    value: ref.watch(biometricLockProvider),
                    activeColor: Tw.indigo500,
                    onChanged: (v) async {
                      if (v && !await biometricAvailable()) {
                        if (!context.mounted) return;
                        setState(() => _msg =
                            'No biometrics enrolled on this device.');
                        return;
                      }
                      await ref
                          .read(biometricLockProvider.notifier)
                          .set(v);
                    },
                  ),
                ),
                AdaptiveListTile(
                  padding: EdgeInsets.zero,
                  leading: const Icon(Icons.fingerprint),
                  title: const Text('Biometric sign-in'),
                  subtitle: Text(PlatformInfo.isIOS
                      ? 'Sign in with Face ID / Touch ID after signing out'
                      : 'Sign in with fingerprint or face after signing out'),
                  trailing: AdaptiveSwitch(
                    value: ref.watch(biometricLoginProvider),
                    activeColor: Tw.indigo500,
                    onChanged: (v) async {
                    if (v) {
                      final ok = await ref
                          .read(biometricLoginProvider.notifier)
                          .enable();
                      if (!ok && context.mounted) {
                        setState(() => _msg =
                            'Could not enable biometric sign-in.');
                      }
                    } else {
                      await AdaptiveAlertDialog.show(
                        context: context,
                        title: 'Turn off biometric sign-in?',
                        message: 'You\'ll need your email and password '
                            'to sign in next time.',
                        icon: Icons.fingerprint,
                        actions: [
                          AlertAction(
                              title: 'Keep on',
                              style: AlertActionStyle.cancel,
                              onPressed: () {}),
                          AlertAction(
                            title: 'Turn off',
                            style: AlertActionStyle.destructive,
                            onPressed: () async {
                              await ref
                                  .read(biometricLoginProvider.notifier)
                                  .disable();
                              showBanner(
                                  'Biometric sign-in turned off',
                                  type: AdaptiveSnackBarType.info);
                            },
                          ),
                        ],
                      );
                    }
                  },
                  ),
                ),
                settingsDivider(context),
                settingsTile(context, Icons.security,
                    'Two-factor authentication',
                    onTap: () => context.push('/account/mfa-setup')),
                settingsTile(context, Icons.mail_outline,
                    'Change email',
                    subtitle: 'Requires 2FA',
                    onTap: () async {
                      if (!await _ensureAal2()) return;
                      await _editField(
                        title: 'New email',
                        hint: 'name@example.com',
                        onSave: (v) =>
                            ref.read(authServiceProvider).changeEmail(v),
                      );
                    }),
                settingsTile(context, Icons.lock_outline,
                    'Change password',
                    subtitle: 'Requires 2FA',
                    onTap: () async {
                      if (!await _ensureAal2()) return;
                      await _editField(
                        title: 'New password',
                        hint: '8+ chars, mixed case, number, symbol',
                        obscure: true,
                        onSave: (v) =>
                            ref.read(authServiceProvider).changePassword(v),
                      );
                    }),
              ]),
            ),
            if (_msg != null) ...[
              const SizedBox(height: 12),
              Center(child: Subtitle(_msg!)),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
