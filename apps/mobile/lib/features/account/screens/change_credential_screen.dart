import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';

/// Which credential a [ChangeCredentialScreen] edits.
enum CredentialKind { email, password }

/// Change-email / change-password screen. Both verify the user first:
/// email shows the current address; password takes the current password
/// (re-auth checked) before the new one — the "current → new" pattern.
class ChangeCredentialScreen extends ConsumerStatefulWidget {
  const ChangeCredentialScreen({super.key, required this.kind});

  final CredentialKind kind;

  @override
  ConsumerState<ChangeCredentialScreen> createState() =>
      _ChangeCredentialScreenState();
}

class _ChangeCredentialScreenState
    extends ConsumerState<ChangeCredentialScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  String? _error;

  bool get _isPassword => widget.kind == CredentialKind.password;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String? get _currentEmail =>
      ref.read(supabaseClientProvider).auth.currentUser?.email;

  /// Returns true on success (banner shown, screen popped).
  Future<bool> _submit() async {
    setState(() => _error = null);
    final auth = ref.read(authServiceProvider);

    if (_isPassword) {
      final current = _current.text;
      final next = _next.text;
      if (current.isEmpty) {
        setState(() => _error = 'Enter your current password.');
        return false;
      }
      if (next.length < 8) {
        setState(() =>
            _error = 'New password must be at least 8 characters.');
        return false;
      }
      if (next != _confirm.text) {
        setState(() => _error = 'New passwords don’t match.');
        return false;
      }
      // Verify the current password by re-authenticating.
      final email = _currentEmail;
      if (email == null) {
        setState(() => _error = 'Couldn’t confirm your account.');
        return false;
      }
      final check = await auth.signIn(email, current);
      if (check.isError) {
        setState(() => _error = 'Your current password is incorrect.');
        return false;
      }
      final r = await auth.changePassword(next);
      if (r.isError) {
        setState(() => _error = toUserFriendlyError(
            r.error, 'Couldn’t change your password.'));
        return false;
      }
      showBanner('Password changed',
          type: AdaptiveSnackBarType.success);
      return true;
    }

    // Email.
    final next = _next.text.trim();
    final emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRe.hasMatch(next)) {
      setState(() => _error = 'Enter a valid email address.');
      return false;
    }
    if (next.toLowerCase() == (_currentEmail ?? '').toLowerCase()) {
      setState(() => _error = 'That’s already your email.');
      return false;
    }
    final r = await auth.changeEmail(next);
    if (r.isError) {
      setState(() =>
          _error = toUserFriendlyError(r.error, 'Couldn’t change your email.'));
      return false;
    }
    showBanner('Check your new inbox to confirm the change',
        type: AdaptiveSnackBarType.success);
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: _isPassword ? 'Change password' : 'Change email',
      body: ResponsiveCenter(
        maxWidth: 520,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            BrandCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_isPassword) ...[
                    _label('Current password'),
                    AdaptiveTextField(
                        controller: _current,
                        placeholder: 'Your current password',
                        obscureText: true),
                    const SizedBox(height: 14),
                    _label('New password'),
                    AdaptiveTextField(
                        controller: _next,
                        placeholder: '8+ characters',
                        obscureText: true),
                    const SizedBox(height: 14),
                    _label('Confirm new password'),
                    AdaptiveTextField(
                        controller: _confirm,
                        placeholder: 'Re-enter the new password',
                        obscureText: true),
                  ] else ...[
                    _label('Current email'),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: context.colors.muted,
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: context.colors.border),
                      ),
                      child: Text(_currentEmail ?? '—',
                          style: TextStyle(
                              fontSize: 14,
                              color: context.colors.mutedForeground)),
                    ),
                    const SizedBox(height: 14),
                    _label('New email'),
                    AdaptiveTextField(
                        controller: _next,
                        placeholder: 'name@example.com',
                        keyboardType: TextInputType.emailAddress),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    MessageBanner.error(_error!),
                  ],
                  const SizedBox(height: 18),
                  StatefulButton(
                    label: _isPassword
                        ? 'Change password'
                        : 'Change email',
                    onPressed: () async {
                      final ok = await _submit();
                      if (ok && context.mounted) context.pop();
                      return ok;
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6, left: 2),
        child: Text(text,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: context.colors.foreground)),
      );
}
