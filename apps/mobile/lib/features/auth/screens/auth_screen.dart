import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FactorType;

import '../../../ui/ui.dart';
import '../../security/biometric_login.dart';
import '../../settings/settings_service.dart';
import '../auth_providers.dart';

enum AuthMode { signin, signup, forgot, verifyEmail, mfaChallenge }

final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final _usernameRe = RegExp(r'^[a-zA-Z0-9._-]+$');

/// Tablet / landscape breakpoint where the two-pane layout (form +
/// testimonial showcase) replaces the single card.
const _wideBreakpoint = 760.0;

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

  Future<void> _biometricSignIn() => _run(() async {
        final err =
            await ref.read(biometricLoginProvider.notifier).restore();
        if (err != null) {
          setState(() => _error = err);
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

  String get _tagline => switch (_mode) {
        AuthMode.signin => 'Pick up where you left off.',
        AuthMode.signup => 'Decide what to watch or read — in minutes.',
        AuthMode.forgot => 'We\'ll help you back in.',
        AuthMode.verifyEmail => 'One quick step to finish.',
        AuthMode.mfaChallenge => 'Confirm it\'s really you.',
      };

  /// Animated brand wordmark — scales/fades in once on first load.
  Widget _wordmark(double size) => BrandHeading('Smart Advisor', size: size)
      .animate()
      .fadeIn(duration: 550.ms)
      .scaleXY(begin: 0.92, end: 1, curve: Curves.easeOutBack);

  void _toggleTheme() {
    final dark = Theme.of(context).brightness == Brightness.dark;
    ref
        .read(themeModeProvider.notifier)
        .set(dark ? ThemeMode.light : ThemeMode.dark);
  }

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, cons) {
            final wide = cons.maxWidth >= _wideBreakpoint;
            return wide ? _wide(cons) : _narrow();
          },
        ),
      ),
    );
  }

  // ── Phone: single centered card ──────────────────────────────────────
  Widget _narrow() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: _ThemeToggle(onTap: _toggleTheme),
              ),
              const SizedBox(height: 4),
              _wordmark(32),
              const SizedBox(height: 14),
              BrandCard(
                padding: const EdgeInsets.all(22),
                child: _formColumn(),
              ).animate().fadeIn(duration: 450.ms, delay: 120.ms).slideY(
                  begin: 0.05, end: 0, curve: Curves.easeOut),
            ],
          ),
        ),
      ),
    );
  }

  // ── Tablet / landscape: two-pane split ───────────────────────────────
  Widget _wide(BoxConstraints cons) {
    final h = (cons.maxHeight - 48).clamp(520.0, 720.0);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1040),
          child: BrandCard(
            padding: EdgeInsets.zero,
            radius: 28,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: SizedBox(
                height: h,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(36, 28, 36, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                _wordmark(24),
                                _ThemeToggle(onTap: _toggleTheme),
                              ],
                            ),
                            Expanded(
                              child: Center(
                                child: SingleChildScrollView(
                                  child: _formColumn(),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Expanded(child: _ShowcasePanel()),
                  ],
                ),
              ),
            ),
          ).animate().fadeIn(duration: 500.ms).slideY(
              begin: 0.04, end: 0, curve: Curves.easeOut),
        ),
      ),
    );
  }

  /// Cross-fade + slide used for both the eyebrow/tagline and the body
  /// when [_mode] changes.
  Widget _modeSwitch(Widget child) => AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (c, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position:
                Tween(begin: const Offset(0, 0.05), end: Offset.zero)
                    .animate(anim),
            child: c,
          ),
        ),
        layoutBuilder: (current, previous) => Stack(
          alignment: Alignment.topCenter,
          children: [
            ...previous,
            ?current,
          ],
        ),
        child: child,
      );

  /// The form body shared by both layouts (toggle + fields + error).
  Widget _formColumn() {
    final showToggle =
        _mode == AuthMode.signin || _mode == AuthMode.signup;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        _modeSwitch(
          Column(
            key: ValueKey('hdr_$_mode'),
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              BrandHeading(_eyebrow, size: 22),
              const SizedBox(height: 6),
              Subtitle(_tagline),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (showToggle) ...[
          BrandSegmented(
            color: Tw.indigo500,
            labels: const ['Sign in', 'Create account'],
            selectedIndex: _mode == AuthMode.signin ? 0 : 1,
            onValueChanged: (i) => setState(() {
              _mode = i == 0 ? AuthMode.signin : AuthMode.signup;
              _error = null;
            }),
          ),
          const SizedBox(height: 20),
        ],
        _modeSwitch(
          Column(
            key: ValueKey('body_$_mode'),
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final (i, w) in _body().indexed)
                w
                    .animate()
                    .fadeIn(delay: (i * 55).ms, duration: 280.ms)
                    .slideY(
                        begin: 0.12,
                        end: 0,
                        delay: (i * 55).ms,
                        duration: 300.ms,
                        curve: Curves.easeOut),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          KeyedSubtree(
            key: ValueKey(_error),
            child: MessageBanner.error(_error!)
                .animate()
                .fadeIn(duration: 220.ms)
                .slideY(begin: 0.4, end: 0, curve: Curves.easeOut),
          ),
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
          if (ref.watch(biometricLoginProvider) &&
              (ref.watch(biometricAvailableProvider).asData?.value ??
                  false)) ...[
            const SizedBox(height: 10),
            AdaptiveButton(
                onPressed: _busy ? null : _biometricSignIn,
                label: PlatformInfo.isIOS
                    ? 'Sign in with Face ID / Touch ID'
                    : 'Sign in with biometrics',
                style: AdaptiveButtonStyle.bordered),
          ],
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

/// Small light/dark toggle, mirroring the web `ThemeToggle` in the auth
/// header.
class _ThemeToggle extends StatelessWidget {
  const _ThemeToggle({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AdaptiveButton.icon(
      onPressed: onTap,
      icon: dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
      iconColor: dark ? Tw.slate400 : Tw.slate500,
      style: AdaptiveButtonStyle.plain,
    );
  }
}

// ── Showcase panel (rotating heading + testimonial card stack) ─────────

const _authHeadings = [
  'People use Smart Advisor to decide faster',
  'Stop scrolling. Start watching.',
  'Find your next favorite in minutes',
  'Made for indecisive nights',
  'Better picks, less doom-scrolling',
];

/// One testimonial. [spans] pairs text with an emphasis flag.
class _Review {
  const _Review(this.name, this.role, this.spans);
  final String name;
  final String role;
  final List<(String, bool)> spans;
}

const _reviews = [
  _Review('Ari', 'Movie + Book Fan', [
    ('I stopped doom-scrolling review sites. ', false),
    ('Smart Advisor', true),
    (' gave me a movie and book pair that matched my mood ', false),
    ('in minutes', true),
    ('.', false),
  ]),
  _Review('Mila', 'Weekend Reader', [
    ('The ', false),
    ('why this fits', true),
    (' explanation is the best part. It helps me trust the pick ', false),
    ('right away', true),
    (' instead of second-guessing.', false),
  ]),
  _Review('Noah', 'Casual Viewer', [
    ('Setup is ', false),
    ('quick', true),
    (', and recommendations feel personal. It\'s become my ', false),
    ('default', true),
    (' before I start any movie night.', false),
  ]),
  _Review('Kai', 'Thriller Fan', [
    ('Asked for a slow-burn thriller I hadn\'t seen and got ', false),
    ('three', true),
    (' solid picks — one of them ended up being my ', false),
    ('favorite of the year', true),
    ('.', false),
  ]),
  _Review('Tara', 'Series Bingewatcher', [
    ('It actually ', false),
    ('remembers what I like', true),
    (' between sessions. No more restarting the conversation from '
        'scratch every time.', false),
  ]),
  _Review('Jordan', 'Book Club Organizer', [
    ('Pitched it to my book club and everyone was surprised — ', false),
    ('six people', true),
    (', six different tastes, and the picks ', false),
    ('actually landed', true),
    ('.', false),
  ]),
  _Review('Sam', 'Tired Parent', [
    ('I have ', false),
    ('twenty minutes', true),
    (' after the kids are asleep. Smart Advisor skips the decision '
        'fatigue and gets me straight to something I\'ll enjoy.', false),
  ]),
];

class _ShowcasePanel extends StatefulWidget {
  const _ShowcasePanel();

  @override
  State<_ShowcasePanel> createState() => _ShowcasePanelState();
}

class _ShowcasePanelState extends State<_ShowcasePanel> {
  Timer? _timer;
  int _step = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() => _step++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final heading = _authHeadings[_step % _authHeadings.length];
    return Container(
      color: dark ? Tw.slate950 : Tw.slate100,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'User Reviews',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
              color: dark ? Tw.slate400 : Tw.slate500,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 350),
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween(
                          begin: const Offset(0, 0.25),
                          end: Offset.zero)
                      .animate(anim),
                  child: child,
                ),
              ),
              child: Padding(
                key: ValueKey(heading),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  heading,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: dark ? Tw.slate100 : Tw.slate900,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          Expanded(
            child: Center(
              child: _CardStack(step: _step, dark: dark),
            ),
          ),
        ],
      ),
    );
  }
}

/// Stacked review cards; the front card cycles to the back every tick.
/// Each card keeps a [ValueKey] so position/scale tween smoothly when its
/// depth changes.
class _CardStack extends StatelessWidget {
  const _CardStack({required this.step, required this.dark});
  final int step;
  final bool dark;

  static const _maxVisible = 3;
  static const _offset = 16.0;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, cons) {
        final cardW = cons.maxWidth.clamp(220.0, 360.0);
        const cardH = 220.0;
        final front = step % _reviews.length;

        // Order card indices back → front so the front card paints on top.
        // Keys are stable per review, so Animated* tween across reorders.
        final order = List<int>.generate(_reviews.length, (i) => i)
          ..sort((a, b) {
            int depth(int i) => (i - front) % _reviews.length;
            return depth(b).compareTo(depth(a));
          });

        return SizedBox(
          width: cardW,
          height: cardH + (_maxVisible - 1) * _offset,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              for (final i in order)
                () {
                  final depth = (i - front) % _reviews.length;
                  final hidden = depth >= _maxVisible;
                  final d = hidden ? _maxVisible - 1 : depth;
                  return AnimatedPositioned(
                    key: ValueKey(_reviews[i].name),
                    duration: const Duration(milliseconds: 450),
                    curve: Curves.easeOut,
                    top: (_maxVisible - 1 - d) * _offset,
                    left: 0,
                    right: 0,
                    child: AnimatedScale(
                      duration: const Duration(milliseconds: 450),
                      curve: Curves.easeOut,
                      scale: 1 - d * 0.05,
                      child: AnimatedOpacity(
                        duration: const Duration(milliseconds: 450),
                        opacity: hidden ? 0 : 1,
                        child: Center(
                          child: SizedBox(
                            width: cardW,
                            height: cardH,
                            child: _reviewCard(_reviews[i]),
                          ),
                        ),
                      ),
                    ),
                  );
                }(),
            ],
          ),
        );
      },
    );
  }

  Widget _reviewCard(_Review r) {
    final base = dark ? Tw.slate200 : Tw.slate700;
    final accent = dark ? Tw.indigo400 : Tw.indigo500;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: dark ? Tw.slate900 : Tw.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: dark
                ? Colors.white.withValues(alpha: .1)
                : Tw.slate200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: dark ? .4 : .1),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                    fontSize: 15, height: 1.4, color: base),
                children: [
                  for (final (text, emph) in r.spans)
                    TextSpan(
                      text: text,
                      style: emph
                          ? TextStyle(
                              color: accent,
                              fontWeight: FontWeight.w600)
                          : null,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(r.name,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: dark ? Tw.white : Tw.slate500)),
          Text(r.role,
              style: const TextStyle(
                  fontSize: 13, color: Tw.slate400)),
        ],
      ),
    );
  }
}
