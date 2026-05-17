import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _S();
}

class _S extends ConsumerState<OnboardingScreen> {
  final _name = TextEditingController();
  int _locale = 0; // 0=en, 1=es
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _finish({required bool skip}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final profile = ref.read(currentProfileProvider).asData?.value;
    final name = skip
        ? (profile?.name ?? 'there')
        : (_name.text.trim().isEmpty ? (profile?.name ?? 'there') : _name.text.trim());
    final locale = _locale == 1 ? 'es' : 'en';
    final res = await ref
        .read(authServiceProvider)
        .completeOnboarding(name: name, locale: locale);
    if (!mounted) return;
    if (res.isError) {
      setState(() {
        _busy = false;
        _error = res.error;
      });
      return;
    }
    // Hot-cache the derived content tone for the AI service (parity w/ web).
    final prefs = await SharedPreferences.getInstance();
    final age = profile?.age ?? 0;
    await prefs.setString(StorageKeys.prefContentTone,
        age > 0 && age < 18 ? 'family' : 'standard');
    ref.invalidate(currentProfileProvider);
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final profile = ref.watch(currentProfileProvider).asData?.value;
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
                  Text('Welcome 👋',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: c.foreground)),
                  const SizedBox(height: 8),
                  Text(
                      '${profile?.email ?? ''}'
                      '${profile?.age != null ? ' · age ${profile!.age}' : ''}'
                      '\nEdit these later in settings.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: c.mutedForeground)),
                  const SizedBox(height: 24),
                  AdaptiveTextField(
                      controller: _name, placeholder: 'Display name'),
                  const SizedBox(height: 16),
                  AdaptiveSegmentedControl(
            color: Tw.indigo500,
                    labels: const ['English', 'Español'],
                    selectedIndex: _locale,
                    onValueChanged: (i) => setState(() => _locale = i),
                  ),
                  const SizedBox(height: 24),
                  AdaptiveButton(
                      onPressed: _busy ? null : () => _finish(skip: false),
                      label: 'Continue'),
                  const SizedBox(height: 8),
                  AdaptiveButton(
                      onPressed: _busy ? null : () => _finish(skip: true),
                      label: 'Skip',
                      style: AdaptiveButtonStyle.plain),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!,
                        style:
                            TextStyle(color: c.destructive, fontSize: 13)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
