import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../settings/settings_service.dart';

/// Port of web /settings (buildable sections). Profile name/age, theme,
/// content prefs, MFA + history links, sign out. AAL2-gated ops
/// (email/password change, delete/disable, sessions) are shown but deferred
/// — they need the Next.js /api routes moved to Edge Functions.
class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final _name = TextEditingController();
  final _age = TextEditingController();
  bool _seeded = false;
  int _tone = 0; // 0 standard, 1 family
  String? _msg;

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    if (!_seeded && profile != null) {
      _name.text = profile.name;
      _age.text = profile.age.toString();
      _tone = profile.contentTone == 'family' ? 1 : 0;
      _seeded = true;
    }
    final themeMode = ref.watch(themeModeProvider);
    final under18 = (profile?.age ?? 99) < 18;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const Eyebrow('Account'),
        const SizedBox(height: 4),
        const BrandHeading('Settings', size: 24),
        const SizedBox(height: 16),

        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Profile'),
              const SizedBox(height: 10),
              AdaptiveTextField(controller: _name, placeholder: 'Name'),
              const SizedBox(height: 8),
              AdaptiveTextField(
                  controller: _age,
                  placeholder: 'Age',
                  keyboardType: TextInputType.number),
              const SizedBox(height: 10),
              AdaptiveButton(
                onPressed: () async {
                  final age = int.tryParse(_age.text.trim()) ?? 0;
                  final r = await ref
                      .read(authServiceProvider)
                      .updateProfile(name: _name.text.trim(), age: age);
                  setState(() =>
                      _msg = r.isError ? r.error : 'Profile saved');
                },
                label: 'Save profile',
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Appearance'),
              const SizedBox(height: 10),
              AdaptiveSegmentedControl(
                labels: const ['System', 'Light', 'Dark'],
                selectedIndex: switch (themeMode) {
                  ThemeMode.system => 0,
                  ThemeMode.light => 1,
                  ThemeMode.dark => 2,
                },
                onValueChanged: (i) => ref
                    .read(themeModeProvider.notifier)
                    .set(switch (i) {
                      1 => ThemeMode.light,
                      2 => ThemeMode.dark,
                      _ => ThemeMode.system,
                    }),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Content tone'),
              const SizedBox(height: 6),
              Subtitle(under18
                  ? 'Family-friendly is locked for under-18.'
                  : 'Applied to your next quiz.'),
              const SizedBox(height: 10),
              AdaptiveSegmentedControl(
                labels: const ['Standard', 'Family'],
                selectedIndex: under18 ? 1 : _tone,
                onValueChanged: under18
                    ? (_) {}
                    : (i) async {
                        setState(() => _tone = i);
                        await ref
                            .read(settingsServiceProvider)
                            .updateContentPreferences(
                                contentTone:
                                    i == 1 ? 'family' : 'standard');
                      },
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        BrandCard(
          child: Column(children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.security),
              title: const Text('Two-factor authentication'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/account/mfa-setup'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.history),
              title: const Text('Recommendation history'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/history'),
            ),
          ]),
        ),
        const SizedBox(height: 12),

        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Managed on the web'),
              const SizedBox(height: 6),
              Subtitle(
                  'Email/password changes, account deletion, and session '
                  'management require extra verification and are handled on '
                  'smartadvisor.live for now.'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        AdaptiveButton(
          onPressed: () async {
            await ref.read(authServiceProvider).signOut();
            if (context.mounted) context.go('/auth');
          },
          label: 'Sign out',
          style: AdaptiveButtonStyle.bordered,
        ),
        if (_msg != null) ...[
          const SizedBox(height: 12),
          Center(child: Subtitle(_msg!)),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}
