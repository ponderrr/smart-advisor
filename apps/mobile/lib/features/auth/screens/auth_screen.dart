import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FactorType;

import '../../../ui/ui.dart';
import '../auth_providers.dart';

enum AuthMode { signin, signup, forgot, verifyEmail, mfaChallenge }

final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final _usernameRe = RegExp(r'^[a-zA-Z0-9._-]+$');

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  AuthMode _mode = AuthMode.signin;
  final _id = TextEditingController();
  final _pw = TextEditingController();
  final _pw2 = TextEditingController();
  final _username = TextEditingController();
  final _age = TextEditingController();
  final _code = TextEditingController();
  String? _factorId;
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_id, _pw, _pw2, _username, _age, _code]) {
      c.dispose();
    }
    super.dispose();
  }

  List<String> _passwordProblems(String p) => [
        if (p.length < 8) '8+ characters',
        if (!p.contains(RegExp(r'[A-Z]'))) 'an uppercase letter',
        if (!p.contains(RegExp(r'[a-z]'))) 'a lowercase letter',
        if (!p.contains(RegExp(r'[0-9]'))) 'a digit',
        if (!p.contains(RegExp(r'[^A-Za-z0-9]'))) 'a special character',
      ];

  Future<void> _run(Future<void> Function() op) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await op();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitSignIn() => _run(() async {
        if (_id.text.trim().isEmpty || _pw.text.isEmpty) {
          setState(() => _error = 'Enter your email/username and password.');
          return;
        }
        final res = await ref
            .read(authServiceProvider)
            .signIn(_id.text.trim(), _pw.text);
        if (res.isError) {
          setState(() => _error = res.error);
          return;
        }
        if (res.data == true) {
          final factors =
              await ref.read(mfaServiceProvider).listFactors();
          _factorId = factors.data
              ?.where((f) => f.factorType == FactorType.totp)
              .map((f) => f.id)
              .cast<String?>()
              .firstWhere((_) => true, orElse: () => null);
          setState(() => _mode = AuthMode.mfaChallenge);
          return;
        }
        if (mounted) context.go('/');
      });

  Future<void> _submitSignUp() => _run(() async {
        final email = _id.text.trim();
        final age = int.tryParse(_age.text.trim());
        if (!_emailRe.hasMatch(email)) {
          setState(() => _error = 'Enter a valid email.');
          return;
        }
        if (_username.text.trim().length < 2 ||
            _username.text.trim().length > 24 ||
            !_usernameRe.hasMatch(_username.text.trim())) {
          setState(() => _error =
              'Username must be 2–24 chars (letters, numbers, . _ -).');
          return;
        }
        if (age == null || age < 13 || age > 120) {
          setState(() => _error = 'Age must be between 13 and 120.');
          return;
        }
        final probs = _passwordProblems(_pw.text);
        if (probs.isNotEmpty) {
          setState(() => _error = 'Password needs ${probs.join(', ')}.');
          return;
        }
        if (_pw.text != _pw2.text) {
          setState(() => _error = 'Passwords do not match.');
          return;
        }
        final res = await ref.read(authServiceProvider).signUp(
              email: email,
              password: _pw.text,
              name: _username.text.trim(),
              username: _username.text.trim(),
              age: age,
            );
        if (res.isError) {
          setState(() => _error = res.error);
          return;
        }
        setState(() => _mode = AuthMode.verifyEmail);
      });

  Future<void> _submitForgot() => _run(() async {
        if (!_emailRe.hasMatch(_id.text.trim())) {
          setState(() => _error = 'Enter a valid email.');
          return;
        }
        final res =
            await ref.read(authServiceProvider).resetPassword(_id.text.trim());
        setState(() => _error =
            res.isError ? res.error : 'Check your email for a reset link.');
      });

  Future<void> _submitMfa() => _run(() async {
        if (_factorId == null) {
          setState(() => _error = 'No authenticator found.');
          return;
        }
        final res = await ref
            .read(mfaServiceProvider)
            .verify(_factorId!, _code.text.trim());
        if (res.isError) {
          setState(() => _error = res.error);
          return;
        }
        if (mounted) context.go('/');
      });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Smart Advisor',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: c.foreground)),
                  const SizedBox(height: 24),
                  ..._body(),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!,
                        style: TextStyle(color: c.destructive, fontSize: 13)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _body() {
    switch (_mode) {
      case AuthMode.verifyEmail:
        return [
          Text('Check your email',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: context.colors.foreground)),
          const SizedBox(height: 8),
          Text('We sent a verification link to ${_id.text.trim()}.',
              style: TextStyle(color: context.colors.mutedForeground)),
          const SizedBox(height: 16),
          AdaptiveButton(
              onPressed: _busy
                  ? null
                  : () => _run(() async {
                        final r = await ref
                            .read(authServiceProvider)
                            .resendVerificationEmail(_id.text.trim());
                        setState(() => _error =
                            r.isError ? r.error : 'Verification email resent.');
                      }),
              label: 'Resend email'),
          const SizedBox(height: 8),
          _switchLink('Back to sign in', AuthMode.signin),
        ];
      case AuthMode.mfaChallenge:
        return [
          Text('Two-factor verification',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: context.colors.foreground)),
          const SizedBox(height: 12),
          AdaptiveTextField(
              controller: _code,
              placeholder: '6-digit code',
              keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          AdaptiveButton(
              onPressed: _busy ? null : _submitMfa, label: 'Verify'),
        ];
      case AuthMode.forgot:
        return [
          AdaptiveTextField(
              controller: _id,
              placeholder: 'Email',
              keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 12),
          AdaptiveButton(
              onPressed: _busy ? null : _submitForgot,
              label: 'Send reset link'),
          const SizedBox(height: 8),
          _switchLink('Back to sign in', AuthMode.signin),
        ];
      case AuthMode.signup:
        return [
          AdaptiveTextField(
              controller: _id,
              placeholder: 'Email',
              keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 12),
          AdaptiveTextField(controller: _username, placeholder: 'Username'),
          const SizedBox(height: 12),
          AdaptiveTextField(
              controller: _age,
              placeholder: 'Age',
              keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          AdaptiveTextField(
              controller: _pw, placeholder: 'Password', obscureText: true),
          const SizedBox(height: 12),
          AdaptiveTextField(
              controller: _pw2,
              placeholder: 'Confirm password',
              obscureText: true),
          const SizedBox(height: 16),
          AdaptiveButton(
              onPressed: _busy ? null : _submitSignUp,
              label: 'Create account'),
          const SizedBox(height: 8),
          _switchLink('Have an account? Sign in', AuthMode.signin),
        ];
      case AuthMode.signin:
        return [
          AdaptiveTextField(
              controller: _id, placeholder: 'Email or username'),
          const SizedBox(height: 12),
          AdaptiveTextField(
              controller: _pw, placeholder: 'Password', obscureText: true),
          const SizedBox(height: 16),
          AdaptiveButton(
              onPressed: _busy ? null : _submitSignIn, label: 'Sign in'),
          const SizedBox(height: 8),
          AdaptiveButton(
              onPressed: _busy
                  ? null
                  : () => _run(() async {
                        final r = await ref
                            .read(authServiceProvider)
                            .signInWithGoogle();
                        if (r.isError) setState(() => _error = r.error);
                      }),
              label: 'Continue with Google',
              style: AdaptiveButtonStyle.bordered),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            _switchLink('Create account', AuthMode.signup),
            _switchLink('Forgot password?', AuthMode.forgot),
          ]),
        ];
    }
  }

  Widget _switchLink(String label, AuthMode mode) => GestureDetector(
        onTap: () => setState(() {
          _mode = mode;
          _error = null;
        }),
        child: Text(label,
            style: TextStyle(
                color: context.colors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w500)),
      );
}
