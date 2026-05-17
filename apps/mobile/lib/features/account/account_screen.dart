import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/ui_messenger.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../notifications/notification_service.dart';
import '../notifications/notifications_center.dart';
import '../security/biometric.dart';
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

  Widget _section(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 22, 4, 8),
        child: Eyebrow(t),
      );

  Widget _rowLabel(String t) => Text(t,
      style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: context.colors.foreground));

  Widget _divider(BuildContext c) =>
      Divider(height: 28, color: c.colors.border);

  Widget _tile(IconData icon, String title,
      {String? subtitle, bool destructive = false, VoidCallback? onTap}) {
    final col =
        destructive ? context.colors.destructive : context.colors.foreground;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: col),
      title: Text(title, style: TextStyle(color: col)),
      subtitle: subtitle == null ? null : Text(subtitle),
      trailing: Icon(Icons.chevron_right, color: context.colors.mutedForeground),
      onTap: onTap,
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
              const SizedBox(height: 16),
              _rowLabel('Display name'),
              const SizedBox(height: 6),
              AdaptiveTextField(
                  controller: _name, placeholder: 'Your name'),
              const SizedBox(height: 12),
              _rowLabel('Age'),
              const SizedBox(height: 6),
              AdaptiveTextField(
                  controller: _age,
                  placeholder: 'Your age',
                  keyboardType: TextInputType.number),
              const SizedBox(height: 14),
              AdaptiveButton(
                onPressed: () async {
                  final age = int.tryParse(_age.text.trim()) ?? 0;
                  final r = await ref
                      .read(authServiceProvider)
                      .updateProfile(name: _name.text.trim(), age: age);
                  showBanner(r.isError ? r.error! : 'Profile saved');
                  ref.invalidate(currentProfileProvider);
                },
                label: 'Save profile',
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        _section('Preferences'),
        BrandCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _rowLabel('Theme'),
              const SizedBox(height: 8),
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
              _divider(context),
              _rowLabel('Content tone'),
              const SizedBox(height: 2),
              Subtitle(under18
                  ? 'Family-friendly is locked for under-18.'
                  : 'Applied to your next quiz.'),
              const SizedBox(height: 8),
              AdaptiveSegmentedControl(
                color: (under18 || _tone == 1)
                    ? Tw.emerald500
                    : Tw.indigo500,
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

        _section('Notifications & security'),
        BrandCard(
          child: Column(children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              secondary: const Icon(Icons.fingerprint),
              title: const Text('App lock'),
              subtitle: const Text('Face ID / Touch ID / fingerprint'),
              value: ref.watch(biometricLockProvider),
              activeThumbColor: Tw.indigo500,
              onChanged: (v) async {
                if (v && !await biometricAvailable()) {
                  if (!context.mounted) return;
                  setState(() => _msg =
                      'No biometrics enrolled on this device.');
                  return;
                }
                await ref.read(biometricLockProvider.notifier).set(v);
              },
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              secondary: const Icon(Icons.notifications_none),
              title: const Text('Weekly quiz reminder'),
              value: ref.watch(remindersProvider),
              activeThumbColor: Tw.indigo500,
              onChanged: (v) async {
                await ref.read(remindersProvider.notifier).set(v);
                if (v) {
                  await ref
                      .read(notificationsCenterProvider.notifier)
                      .add('Weekly reminder on',
                          'We\'ll nudge you weekly to discover something.');
                }
              },
            ),
            _divider(context),
            _tile(Icons.security, 'Two-factor authentication',
                onTap: () => context.push('/account/mfa-setup')),
            _tile(Icons.mail_outline, 'Change email',
                subtitle: 'Requires 2FA',
                onTap: () => _editField(
                      title: 'New email',
                      hint: 'name@example.com',
                      onSave: (v) =>
                          ref.read(authServiceProvider).changeEmail(v),
                    )),
            _tile(Icons.lock_outline, 'Change password',
                subtitle: 'Requires 2FA',
                onTap: () => _editField(
                      title: 'New password',
                      hint: '8+ chars, mixed case, number, symbol',
                      obscure: true,
                      onSave: (v) => ref
                          .read(authServiceProvider)
                          .changePassword(v),
                    )),
          ]),
        ),

        _section('Your data'),
        BrandCard(
          child: Column(children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.notifications_none,
                  color: context.colors.foreground),
              title: const Text('Notifications'),
              trailing: Builder(builder: (_) {
                final unread = ref.watch(unreadCountProvider);
                return Row(mainAxisSize: MainAxisSize.min, children: [
                  if (unread > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: const BoxDecoration(
                          color: Tw.indigo500,
                          shape: BoxShape.circle),
                      child: Text('$unread',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700)),
                    ),
                  Icon(Icons.chevron_right,
                      color: context.colors.mutedForeground),
                ]);
              }),
              onTap: () => context.push('/notifications'),
            ),
            _tile(Icons.history, 'Recommendation history',
                onTap: () => context.push('/history')),
            _tile(Icons.auto_awesome, 'Your Wrapped',
                onTap: () => context.push('/wrapped')),
          ]),
        ),

        _section('Danger zone'),
        BrandCard(
          child: Column(children: [
            _tile(Icons.pause_circle_outline, 'Disable account',
                onTap: () => _confirmDanger(
                      'Disable account?',
                      'You will be signed out and locked out until '
                          're-enabled.',
                      () async {
                        final r = await ref
                            .read(authServiceProvider)
                            .disableAccount();
                        if (!r.isError && context.mounted) {
                          context.go('/auth');
                        }
                        return r.error;
                      },
                    )),
            _tile(Icons.delete_forever_outlined, 'Delete account',
                destructive: true,
                onTap: () => _confirmDanger(
                      'Delete account?',
                      'This permanently erases your data. Cannot be '
                          'undone.',
                      () async {
                        final r = await ref
                            .read(authServiceProvider)
                            .deleteAccount();
                        if (!r.isError && context.mounted) {
                          context.go('/auth');
                        }
                        return r.error;
                      },
                    )),
          ]),
        ),
        const SizedBox(height: 20),

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
