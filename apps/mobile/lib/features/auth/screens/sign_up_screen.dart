import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';
import '../../settings/settings_service.dart';
import '../auth_providers.dart';

/// Dedicated sign-up screen. Split out of the old combined AuthScreen so
/// the form focuses on one thing — create a new account. After a
/// successful submit the screen morphs into a verify-email confirmation
/// (resend + back-to-sign-in), so users never get bounced off mid-flow.
class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final _usernameRe = RegExp(r'^[a-zA-Z0-9._-]+$');

enum _Phase { form, verifyEmail }

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  _Phase _phase = _Phase.form;
  final _id = TextEditingController();
  final _pw = TextEditingController();
  final _pw2 = TextEditingController();
  final _displayName = TextEditingController();
  final _username = TextEditingController();
  final _age = TextEditingController();
  String? _error;
  String? _notice;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_id, _pw, _pw2, _displayName, _username, _age]) {
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
      _notice = null;
    });
    try {
      await op();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

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
        // Display name is optional — falls back to the handle so existing
        // call sites that greet by name still have something to render.
        final display = _displayName.text.trim();
        final username = _username.text.trim();
        final res = await ref.read(authServiceProvider).signUp(
              email: email,
              password: _pw.text,
              name: display.isEmpty ? username : display,
              username: username,
              age: age,
            );
        if (res.isError) {
          setState(() => _error = res.error);
          return;
        }
        setState(() => _phase = _Phase.verifyEmail);
      });

  Future<void> _resendVerification() => _run(() async {
        final r = await ref
            .read(authServiceProvider)
            .resendVerificationEmail(_id.text.trim());
        setState(() {
          if (r.isError) {
            _error = r.error;
          } else {
            _notice = 'Verification email resent.';
          }
        });
      });

  void _toggleTheme() {
    final dark = Theme.of(context).brightness == Brightness.dark;
    ref
        .read(themeModeProvider.notifier)
        .set(dark ? ThemeMode.light : ThemeMode.dark);
  }

  String get _heading => switch (_phase) {
        _Phase.form => 'Create account',
        _Phase.verifyEmail => 'Almost there',
      };

  String get _subhead => switch (_phase) {
        _Phase.form => 'Decide what to watch or read — in minutes.',
        _Phase.verifyEmail => 'One quick step to finish.',
      };

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      AdaptiveButton.child(
                        style: AdaptiveButtonStyle.plain,
                        onPressed: () => context.go('/intro'),
                        child: Icon(
                          Icons.arrow_back_ios_new,
                          size: 16,
                          color: context.colors.mutedForeground,
                        ),
                      ),
                      const Spacer(),
                      _ThemeToggle(onTap: _toggleTheme),
                    ],
                  ),
                  const SizedBox(height: 8),
                  BrandHeading('Smart Advisor', size: 28)
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .scaleXY(begin: 0.94, end: 1, curve: Curves.easeOutBack),
                  const SizedBox(height: 18),
                  BrandCard(
                    padding: const EdgeInsets.all(22),
                    child: _form(),
                  )
                      .animate()
                      .fadeIn(duration: 420.ms, delay: 100.ms)
                      .slideY(begin: 0.06, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 16),
                  if (_phase == _Phase.form)
                    _SwitchAuthLink(
                      leading: 'Already have an account?',
                      cta: 'Sign in',
                      onTap: () => context.go('/auth'),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _form() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandHeading(_heading, size: 22),
        const SizedBox(height: 6),
        Subtitle(_subhead),
        const SizedBox(height: 18),
        for (final (i, w) in _phaseBody().indexed)
          w
              .animate()
              .fadeIn(delay: (i * 55).ms, duration: 260.ms)
              .slideY(
                  begin: 0.12,
                  end: 0,
                  delay: (i * 55).ms,
                  duration: 280.ms,
                  curve: Curves.easeOut),
        if (_notice != null) ...[
          const SizedBox(height: 12),
          MessageBanner(message: _notice!)
              .animate()
              .fadeIn(duration: 220.ms)
              .slideY(begin: 0.4, end: 0, curve: Curves.easeOut),
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          MessageBanner.error(_error!)
              .animate()
              .fadeIn(duration: 220.ms)
              .slideY(begin: 0.4, end: 0, curve: Curves.easeOut),
        ],
      ],
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

  List<Widget> _phaseBody() {
    switch (_phase) {
      case _Phase.verifyEmail:
        return [
          Subtitle('We sent a verification link to ${_id.text.trim()}. '
              'Open it, then come back and sign in.'),
          const SizedBox(height: 16),
          AdaptiveButton(
              onPressed: _busy ? null : _resendVerification,
              label: 'Resend email'),
          const SizedBox(height: 10),
          AdaptiveButton(
              onPressed: () => context.go('/auth'),
              label: 'Back to sign in',
              style: AdaptiveButtonStyle.plain),
        ];
      case _Phase.form:
        return [
          _field(
              'Email',
              AdaptiveTextField(
                  controller: _id,
                  placeholder: 'name@example.com',
                  keyboardType: TextInputType.emailAddress)),
          _field(
              'Display name (optional)',
              AdaptiveTextField(
                  controller: _displayName,
                  placeholder: 'How we\'ll greet you')),
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
          const SizedBox(height: 10),
          Text(
            'By continuing you agree to our Terms and Privacy Policy.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 11,
                color: context.colors.mutedForeground.withValues(alpha: .9)),
          ),
        ];
    }
  }
}

class _ThemeToggle extends StatelessWidget {
  const _ThemeToggle({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AdaptiveButton.child(
      style: AdaptiveButtonStyle.plain,
      onPressed: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(dark ? Icons.dark_mode : Icons.light_mode,
              size: 14, color: context.colors.mutedForeground),
          const SizedBox(width: 6),
          Text(dark ? 'Dark' : 'Light',
              style: TextStyle(
                  color: context.colors.mutedForeground,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SwitchAuthLink extends StatelessWidget {
  const _SwitchAuthLink({
    required this.leading,
    required this.cta,
    required this.onTap,
  });

  final String leading;
  final String cta;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(leading,
            style: TextStyle(
                fontSize: 13, color: context.colors.mutedForeground)),
        const SizedBox(width: 6),
        GestureDetector(
          onTap: onTap,
          child: Text(cta,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: context.colors.primary)),
        ),
      ],
    );
  }
}
