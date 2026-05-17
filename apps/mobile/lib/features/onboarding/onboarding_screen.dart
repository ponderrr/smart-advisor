import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';

/// Post-auth profile setup (display name + locale). The pre-auth product
/// pitch lives in [IntroScreen]; this is gated by `setup_completed_at`.
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
        : (_name.text.trim().isEmpty
            ? (profile?.name ?? 'there')
            : _name.text.trim());
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

    return BrandScaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [Tw.indigo500, Tw.violet500],
                        ),
                        boxShadow: [
                          BoxShadow(
                              color: Tw.indigo500.withValues(alpha: .35),
                              blurRadius: 24,
                              spreadRadius: -4),
                        ],
                      ),
                      child: const Icon(Icons.waving_hand_outlined,
                          color: Colors.white, size: 30),
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 450.ms)
                      .scaleXY(begin: 0.85, end: 1, curve: Curves.easeOutBack),
                  const SizedBox(height: 26),
                  const Center(child: Eyebrow('Last step')),
                  const SizedBox(height: 10),
                  Center(
                    child: const BrandHeading('Make it yours', size: 30)
                        .animateFadeUp(),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${profile?.email ?? ''}'
                    '${profile?.age != null ? ' · age ${profile!.age}' : ''}'
                    '\nYou can change these later in settings.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14, color: c.mutedForeground),
                  ).animateFadeUp(delay: 120),
                  const SizedBox(height: 26),
                  BrandCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('Display name',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: c.foreground)),
                        const SizedBox(height: 8),
                        AdaptiveTextField(
                            controller: _name,
                            placeholder: 'What should we call you?'),
                        const SizedBox(height: 18),
                        Text('Language',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: c.foreground)),
                        const SizedBox(height: 8),
                        BrandSegmented(
                          color: Tw.indigo500,
                          labels: const ['English', 'Español'],
                          selectedIndex: _locale,
                          onValueChanged: (i) =>
                              setState(() => _locale = i),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 420.ms).slideY(
                      begin: 0.1, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 20),
                  AdaptiveButton(
                      onPressed: _busy ? null : () => _finish(skip: false),
                      label: 'Continue'),
                  const SizedBox(height: 8),
                  AdaptiveButton(
                      onPressed: _busy ? null : () => _finish(skip: true),
                      label: 'Skip for now',
                      style: AdaptiveButtonStyle.plain),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!,
                        textAlign: TextAlign.center,
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

extension _FadeUp on Widget {
  Widget animateFadeUp({int delay = 100}) => animate()
      .fadeIn(delay: delay.ms, duration: 420.ms)
      .slideY(begin: 0.18, end: 0, curve: Curves.easeOut);
}
