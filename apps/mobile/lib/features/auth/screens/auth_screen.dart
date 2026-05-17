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

  String get _eyebrow => switch (_mode) {
        AuthMode.signin => 'Welcome back',
        AuthMode.signup => 'Get started',
        AuthMode.forgot => 'Reset password',
        AuthMode.verifyEmail => 'Almost there',
        AuthMode.mfaChallenge => 'One more step',
      };

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final showToggle =
        _mode == AuthMode.signin || _mode == AuthMode.signup;
    return BrandScaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: BrandCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const BrandHeading('Smart Advisor', size: 28),
                    const SizedBox(height: 12),
                    Eyebrow(_eyebrow),
                    const SizedBox(height: 16),
                    if (showToggle) ...[
                      BrandSegmented(
                        color: Tw.indigo500,
                        labels: const ['Sign in', 'Create account'],
                        selectedIndex: _mode == AuthMode.signin ? 0 : 1,
                        onValueChanged: (i) => setState(() {
                          _mode =
                              i == 0 ? AuthMode.signin : AuthMode.signup;
                          _error = null;
                        }),
                      ),
                      const SizedBox(height: 20),
                    ],
                    ..._body(),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!,
                          style: TextStyle(
                              color: c.destructive, fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(String label, Widget input) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 6, left: 2),
              child: Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: context.colors.foreground)),
            ),
            input,
          ],
        ),
      );

  List<Widget> _body() {
    switch (_mode) {
      case AuthMode.verifyEmail:
        return [
          Subtitle('We sent a verification link to ${_id.text.trim()}. '
              'Open it, then come back and sign in.'),
          const SizedBox(height: 16),
          AdaptiveButton(
              onPressed: _busy
                  ? null
                  : () => _run(() async {
                        final r = await ref
                            .read(authServiceProvider)
                            .resendVerificationEmail(_id.text.trim());
                        setState(() => _error = r.isError
                            ? r.error
                            : 'Verification email resent.');
                      }),
              label: 'Resend email'),
          const SizedBox(height: 10),
          AdaptiveButton(
              onPressed: () => setState(() => _mode = AuthMode.signin),
              label: 'Back to sign in',
              style: AdaptiveButtonStyle.plain),
        ];
      case AuthMode.mfaChallenge:
        return [
          Subtitle('Enter the 6-digit code from your authenticator app.'),
          const SizedBox(height: 14),
          _field(
              'Authentication code',
              AdaptiveTextField(
                  controller: _code,
                  placeholder: '123456',
                  keyboardType: TextInputType.number)),
          AdaptiveButton(
              onPressed: _busy ? null : _submitMfa, label: 'Verify'),
        ];
      case AuthMode.forgot:
        return [
          Subtitle('We\'ll email you a link to reset your password.'),
          const SizedBox(height: 14),
          _field(
              'Email',
              AdaptiveTextField(
                  controller: _id,
                  placeholder: 'name@example.com',
                  keyboardType: TextInputType.emailAddress)),
          AdaptiveButton(
              onPressed: _busy ? null : _submitForgot,
              label: 'Send reset link'),
          const SizedBox(height: 10),
          AdaptiveButton(
              onPressed: () => setState(() => _mode = AuthMode.signin),
              label: 'Back to sign in',
              style: AdaptiveButtonStyle.plain),
        ];
      case AuthMode.signup:
        return [
          _field(
              'Email',
              AdaptiveTextField(
                  controller: _id,
                  placeholder: 'name@example.com',
                  keyboardType: TextInputType.emailAddress)),
          _field('Username',
              AdaptiveTextField(controller: _username, placeholder: 'jane')),
          _field(
              'Age',
              AdaptiveTextField(
                  controller: _age,
                  placeholder: '18',
                  keyboardType: TextInputType.number)),
          _field(
              'Password',
              AdaptiveTextField(
                  controller: _pw,
                  placeholder: '8+ chars, mixed case, number, symbol',
                  obscureText: true)),
          _field(
              'Confirm password',
              AdaptiveTextField(
                  controller: _pw2,
                  placeholder: 'Re-enter password',
                  obscureText: true)),
          const SizedBox(height: 4),
          AdaptiveButton(
              onPressed: _busy ? null : _submitSignUp,
              label: 'Create account'),
        ];
      case AuthMode.signin:
        return [
          _field(
              'Email or username',
              AdaptiveTextField(
                  controller: _id, placeholder: 'name@example.com')),
          _field(
              'Password',
              AdaptiveTextField(
                  controller: _pw,
                  placeholder: 'Your password',
                  obscureText: true)),
          AdaptiveButton(
              onPressed: _busy ? null : _submitSignIn, label: 'Sign in'),
          const SizedBox(height: 8),
          Center(
            child: GestureDetector(
              onTap: () => setState(() => _mode = AuthMode.forgot),
              child: Text('Forgot password?',
                  style: TextStyle(
                      color: context.colors.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
          ),
          const Divider(height: 28),
          AdaptiveButton(
              onPressed: () => context.go('/demo'),
              label: 'Try the demo — no account',
              style: AdaptiveButtonStyle.bordered),
        ];
    }
  }
}
