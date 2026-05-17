import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

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

  Future<void> _pickAvatar() async {
    final picked = await ImagePicker()
        .pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    final r = await ref.read(authServiceProvider).uploadAvatar(
        bytes, picked.mimeType ?? 'image/jpeg');
    if (!mounted) return;
    ref.invalidate(currentProfileProvider);
    setState(() => _msg = r.isError ? r.error : 'Photo updated');
  }

  Future<void> _editField({
    required String title,
    required String hint,
    bool obscure = false,
    required Future<dynamic> Function(String) onSave,
  }) async {
    final ctrl = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: AdaptiveTextField(
            controller: ctrl, placeholder: hint, obscureText: obscure),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final r = await onSave(ctrl.text.trim());
              if (!ctx.mounted) return;
              Navigator.pop(ctx);
              setState(() => _msg = r.isError ? r.error : 'Saved');
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    ctrl.dispose();
  }

  Future<void> _confirmDanger(
      String title, String body, Future<String?> Function() run) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final err = await run();
              if (!ctx.mounted) return;
              Navigator.pop(ctx);
              if (err != null) setState(() => _msg = err);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
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
              Row(children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: context.colors.muted,
                  backgroundImage: (profile?.avatarUrl != null)
                      ? NetworkImage(profile!.avatarUrl!)
                      : null,
                  child: profile?.avatarUrl == null
                      ? Icon(Icons.person,
                          color: context.colors.mutedForeground)
                      : null,
                ),
                const SizedBox(width: 12),
                AdaptiveButton(
                    onPressed: _pickAvatar,
                    label: 'Change photo',
                    style: AdaptiveButtonStyle.bordered),
                const SizedBox(width: 8),
                if (profile?.avatarUrl != null)
                  AdaptiveButton(
                      onPressed: () async {
                        await ref
                            .read(authServiceProvider)
                            .removeAvatar();
                        ref.invalidate(currentProfileProvider);
                      },
                      label: 'Remove',
                      style: AdaptiveButtonStyle.plain),
              ]),
              const SizedBox(height: 12),
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
            color: Tw.indigo500,
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
            color: Tw.indigo500,
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
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.auto_awesome),
              title: const Text('Your Wrapped'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/wrapped'),
            ),
          ]),
        ),
        const SizedBox(height: 12),

        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Security'),
              const SizedBox(height: 6),
              Subtitle('These require 2FA verification (AAL2).'),
              const SizedBox(height: 10),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.mail_outline),
                title: const Text('Change email'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _editField(
                  title: 'New email',
                  hint: 'name@example.com',
                  onSave: (v) =>
                      ref.read(authServiceProvider).changeEmail(v),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.lock_outline),
                title: const Text('Change password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _editField(
                  title: 'New password',
                  hint: '8+ chars, mixed case, number, symbol',
                  obscure: true,
                  onSave: (v) =>
                      ref.read(authServiceProvider).changePassword(v),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.pause_circle_outline),
                title: const Text('Disable account'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _confirmDanger(
                  'Disable account?',
                  'You will be signed out and locked out until re-enabled.',
                  () async {
                    final r = await ref
                        .read(authServiceProvider)
                        .disableAccount();
                    if (!r.isError && context.mounted) context.go('/auth');
                    return r.error;
                  },
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(Icons.delete_forever_outlined,
                    color: context.colors.destructive),
                title: Text('Delete account',
                    style: TextStyle(color: context.colors.destructive)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _confirmDanger(
                  'Delete account?',
                  'This permanently erases your data. Cannot be undone.',
                  () async {
                    final r =
                        await ref.read(authServiceProvider).deleteAccount();
                    if (!r.isError && context.mounted) context.go('/auth');
                    return r.error;
                  },
                ),
              ),
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
