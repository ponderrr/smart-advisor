import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../auth_providers.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _S();
}

class _S extends ConsumerState<ResetPasswordScreen> {
  final _pw = TextEditingController();
  final _pw2 = TextEditingController();
  String? _msg;
  bool _busy = false;

  @override
  void dispose() {
    _pw.dispose();
    _pw2.dispose();
    super.dispose();
  }

  List<String> _problems(String p) => [
        if (p.length < 8) '8+ characters',
        if (!p.contains(RegExp(r'[A-Z]'))) 'an uppercase letter',
        if (!p.contains(RegExp(r'[a-z]'))) 'a lowercase letter',
        if (!p.contains(RegExp(r'[0-9]'))) 'a digit',
        if (!p.contains(RegExp(r'[^A-Za-z0-9]'))) 'a special character',
      ];

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // A recovery session must exist (set by the reset deep link).
    final hasSession = ref.watch(currentSessionProvider) != null;

    return BrandScaffold(
      title: 'Reset password',
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: !hasSession
                ? Column(mainAxisSize: MainAxisSize.min, children: [
                    Text(
                        'That link is invalid or expired. Please request a new password reset.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: c.mutedForeground)),
                    const SizedBox(height: 16),
                    AdaptiveButton(
                        onPressed: () => context.go('/auth'),
                        label: 'Back to sign in'),
                  ])
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AdaptiveTextField(
                          controller: _pw,
                          placeholder: 'New password',
                          obscureText: true),
                      const SizedBox(height: 12),
                      AdaptiveTextField(
                          controller: _pw2,
                          placeholder: 'Confirm password',
                          obscureText: true),
                      const SizedBox(height: 16),
                      AdaptiveButton(
                        onPressed: _busy
                            ? null
                            : () async {
                                final probs = _problems(_pw.text);
                                if (probs.isNotEmpty) {
                                  setState(() => _msg =
                                      'Password needs ${probs.join(', ')}.');
                                  return;
                                }
                                if (_pw.text != _pw2.text) {
                                  setState(
                                      () => _msg = 'Passwords do not match.');
                                  return;
                                }
                                setState(() {
                                  _busy = true;
                                  _msg = null;
                                });
                                final router = GoRouter.of(context);
                                final r = await ref
                                    .read(authServiceProvider)
                                    .updatePasswordWithTicket(_pw.text);
                                if (!mounted) return;
                                if (r.isError) {
                                  setState(() {
                                    _busy = false;
                                    _msg = r.error;
                                  });
                                } else {
                                  setState(() =>
                                      _msg = 'Password updated. Redirecting…');
                                  await Future<void>.delayed(
                                      const Duration(seconds: 2));
                                  if (mounted) router.go('/auth');
                                }
                              },
                        label: 'Update password',
                      ),
                      if (_msg != null) ...[
                        const SizedBox(height: 12),
                        Text(_msg!,
                            style: TextStyle(
                                color: c.mutedForeground, fontSize: 13)),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
