import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FactorType;

import '../../../ui/ui.dart';
import '../../security/biometric_login.dart';
import '../../settings/settings_service.dart';
import '../auth_providers.dart';

/// Dedicated sign-in screen. Split out of the old combined AuthScreen so
/// the page does one thing — Welcome back, sign in. Sign up lives at its
/// own route (/auth/signup). Forgot-password + MFA-challenge stay inline
/// as flow extensions: they're sign-in continuations, not destinations.
///
/// Visual treatment: spacious, no card-in-card. The form sits directly on
/// the scaffold with generous spacing, big heading typography, and
/// floating-label inputs (BrandTextField). Biometric is a compact icon
/// button next to the primary action so the primary CTA stays the visual
/// anchor.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

enum _Phase { signin, forgot, mfaChallenge }

class _SignInScreenState extends ConsumerState<SignInScreen> {
  _Phase _phase = _Phase.signin;
  final _id = TextEditingController();
  final _pw = TextEditingController();
  final _code = TextEditingController();
  String? _factorId;
  String? _error;
  String? _notice;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_id, _pw, _code]) {
      c.dispose();
    }
    super.dispose();
  }

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
          setState(() => _phase = _Phase.mfaChallenge);
          return;
        }
        if (mounted) context.go('/');
      });

  Future<void> _submitForgot() => _run(() async {
        final emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
        if (!emailRe.hasMatch(_id.text.trim())) {
          setState(() => _error = 'Enter a valid email.');
          return;
        }
        final res = await ref
            .read(authServiceProvider)
            .resetPassword(_id.text.trim());
        setState(() {
          if (res.isError) {
            _error = res.error;
          } else {
            _notice = 'Check your email for a reset link.';
          }
        });
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

  Future<void> _biometricSignIn() => _run(() async {
        final err =
            await ref.read(biometricLoginProvider.notifier).restore();
        if (err != null) {
          setState(() => _error = err);
          return;
        }
        if (mounted) context.go('/');
      });

  void _toggleTheme() {
    final dark = Theme.of(context).brightness == Brightness.dark;
    ref
        .read(themeModeProvider.notifier)
        .set(dark ? ThemeMode.light : ThemeMode.dark);
  }

  String get _heading => switch (_phase) {
        _Phase.signin => 'Welcome back',
        _Phase.forgot => 'Reset password',
        _Phase.mfaChallenge => 'One more step',
      };

  String get _subhead => switch (_phase) {
        _Phase.signin => 'Pick up where you left off.',
        _Phase.forgot => 'We\'ll email you a link to reset your password.',
        _Phase.mfaChallenge => 'Enter the code from your authenticator app.',
      };

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
                  const SizedBox(height: 24),
                  Text(
                    'Smart Advisor',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.6,
                      color: context.colors.mutedForeground,
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: -0.2, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 32),
                  _form(),
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
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          switchInCurve: Curves.easeOut,
          switchOutCurve: Curves.easeIn,
          transitionBuilder: (c, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween(begin: const Offset(0, 0.04), end: Offset.zero)
                  .animate(anim),
              child: c,
            ),
          ),
          layoutBuilder: (current, previous) => Stack(
            alignment: Alignment.topLeft,
            children: [
              ...previous,
              ?current,
            ],
          ),
          child: Column(
            key: ValueKey('hdr_$_phase'),
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _heading,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                  letterSpacing: -0.5,
                  color: context.brandInk,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _subhead,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  color: context.brandMuted,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
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
          const SizedBox(height: 16),
          MessageBanner(message: _notice!)
              .animate()
              .fadeIn(duration: 220.ms)
              .slideY(begin: 0.4, end: 0, curve: Curves.easeOut),
        ],
        if (_error != null) ...[
          const SizedBox(height: 16),
          MessageBanner.error(_error!)
              .animate()
              .fadeIn(duration: 220.ms)
              .slideY(begin: 0.4, end: 0, curve: Curves.easeOut),
        ],
      ],
    );
  }

  List<Widget> _phaseBody() {
    final biometricOn = ref.watch(biometricLoginProvider) &&
        (ref.watch(biometricAvailableProvider).asData?.value ?? false);
    switch (_phase) {
      case _Phase.mfaChallenge:
        return [
          BrandTextField(
            label: 'Authentication code',
            controller: _code,
            keyboardType: TextInputType.number,
            autofocus: true,
          ),
          const SizedBox(height: 20),
          AdaptiveButton(
              onPressed: _busy ? null : _submitMfa, label: 'Verify'),
          const SizedBox(height: 6),
          AdaptiveButton(
              onPressed: () => setState(() {
                    _phase = _Phase.signin;
                    _error = null;
                  }),
              label: 'Back to sign in',
              style: AdaptiveButtonStyle.plain),
        ];
      case _Phase.forgot:
        return [
          BrandTextField(
            label: 'Email',
            controller: _id,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            autofocus: true,
          ),
          const SizedBox(height: 20),
          AdaptiveButton(
              onPressed: _busy ? null : _submitForgot,
              label: 'Send reset link'),
          const SizedBox(height: 6),
          AdaptiveButton(
              onPressed: () => setState(() {
                    _phase = _Phase.signin;
                    _error = null;
                    _notice = null;
                  }),
              label: 'Back to sign in',
              style: AdaptiveButtonStyle.plain),
        ];
      case _Phase.signin:
        return [
          BrandTextField(
            label: 'Email or username',
            controller: _id,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username],
          ),
          const SizedBox(height: 14),
          BrandTextField(
            label: 'Password',
            controller: _pw,
            obscureText: true,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            onSubmitted: (_) => _busy ? null : _submitSignIn(),
          ),
          const SizedBox(height: 24),
          if (biometricOn)
            Row(
              children: [
                Expanded(
                  child: AdaptiveButton(
                      onPressed: _busy ? null : _submitSignIn,
                      label: 'Sign in'),
                ),
                const SizedBox(width: 10),
                AdaptiveButton.icon(
                  onPressed: _busy ? null : _biometricSignIn,
                  icon: PlatformInfo.isIOS
                      ? Icons.face_outlined
                      : Icons.fingerprint,
                  style: AdaptiveButtonStyle.bordered,
                ),
              ],
            )
          else
            AdaptiveButton(
                onPressed: _busy ? null : _submitSignIn, label: 'Sign in'),
          const SizedBox(height: 18),
          Center(
            child: GestureDetector(
              onTap: () => setState(() {
                _phase = _Phase.forgot;
                _error = null;
                _notice = null;
              }),
              child: Text('Forgot password?',
                  style: TextStyle(
                      color: context.colors.primary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 28),
          _SwitchAuthLink(
            leading: 'Don\'t have an account?',
            cta: 'Create one',
            onTap: () => context.go('/auth/signup'),
          ),
        ];
    }
  }
}

/// Small theme toggle pill, lifted unchanged from the old AuthScreen so the
/// brand's existing affordance stays consistent across both auth surfaces.
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

/// Footer cross-link to the other auth screen.
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
                fontSize: 14, color: context.colors.mutedForeground)),
        const SizedBox(width: 6),
        GestureDetector(
          onTap: onTap,
          child: Text(cta,
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: context.colors.primary)),
        ),
      ],
    );
  }
}
