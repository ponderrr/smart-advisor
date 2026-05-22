import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show SignOutScope;

import '../../core/ui_messenger.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../auth/services/error_messages.dart';
import '../onboarding/get_started_screen.dart';
import '../onboarding/onboarding_screen.dart';
import '../onboarding/tutorial_screen.dart';
import '../security/biometric_login.dart';
import 'screens/settings_helpers.dart';

/// Settings hub. Profile summary header, then grouped navigable rows that
/// push focused sub-screens (Profile, Appearance, Recommendations, Feed,
/// Notifications, Security). The Danger zone (disable/delete account) and
/// Sign out stay here on purpose — high-stakes actions kept visible rather
/// than buried a level deep. The heavy sections were relocated verbatim to
/// lib/features/account/screens/* (no wired behaviour changed).
class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  /// Ensures the session is AAL2 before an AAL2-gated change. Returns false
  /// (and explains why) if it can't be satisfied.
  Future<bool> _ensureAal2() async {
    final mfa = ref.read(mfaServiceProvider);
    if (mfa.isAal2) return true;

    final factorId = await mfa.verifiedTotpFactorId();
    if (factorId == null) {
      showBanner('Set up two-factor authentication first');
      if (mounted) context.push('/account/mfa-setup');
      return false;
    }
    if (!mounted) return false;
    final code = await AdaptiveAlertDialog.inputShow(
      context: context,
      title: 'Verify it\'s you',
      message: 'Enter the 6-digit code from your authenticator app.',
      icon: Icons.shield_outlined,
      input: const AdaptiveAlertDialogInput(
          placeholder: '6-digit code'),
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
            title: 'Verify',
            style: AlertActionStyle.primary,
            onPressed: () {}),
      ],
    );
    if (code == null || code.trim().isEmpty) return false;
    final r = await mfa.verify(factorId, code.trim());
    if (r.isError) {
      showBanner(toUserFriendlyError(
          r.error, 'That code didn’t work. Please try again.'));
      return false;
    }
    return true;
  }

  Future<void> _confirmDanger(
      String title, String body, Future<String?> Function() run) async {
    await AdaptiveAlertDialog.show(
      context: context,
      title: title,
      message: body,
      icon: Icons.warning_amber_rounded,
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Confirm',
          style: AlertActionStyle.destructive,
          onPressed: () async {
            final err = await run();
            if (err != null) showBanner(err);
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentProfileProvider).asData?.value;

    // A shell tab like Home/Library/History — the app shell already caps
    // it to the same content width, so no extra ResponsiveCenter here.
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const BrandHeading('Settings', size: 32),
        const SizedBox(height: 16),

        // Profile summary header — taps through to the Profile sub-screen.
        BrandCard(
          child: AdaptiveListTile(
            padding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 26,
              backgroundColor: context.colors.muted,
              backgroundImage: (profile?.avatarUrl != null)
                  ? NetworkImage(profile!.avatarUrl!)
                  : null,
              child: profile?.avatarUrl == null
                  ? Icon(Icons.person,
                      color: context.colors.mutedForeground)
                  : null,
            ),
            title: Text(
                profile?.name.isNotEmpty == true
                    ? profile!.name
                    : 'Your profile',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: context.colors.foreground)),
            subtitle: const Text('Name, age and photo'),
            trailing: Icon(Icons.chevron_right,
                color: context.colors.mutedForeground),
            onTap: () => context.push('/account/profile'),
          ),
        ),

        settingsSection(context, 'Preferences'),
        BrandCard(
          child: Column(children: [
            settingsTile(context, Icons.palette_outlined, 'Appearance',
                subtitle: 'Theme and AMOLED dark',
                onTap: () => context.push('/account/appearance')),
            settingsTile(
                context, Icons.tune, 'Recommendations',
                subtitle: 'Content tone and filters',
                onTap: () => context.push('/account/recommendations')),
            settingsTile(context, Icons.dynamic_feed, 'Feed',
                subtitle: 'Visibility, defaults, add friends',
                onTap: () => context.push('/account/feed')),
          ]),
        ),

        settingsSection(context, 'Account'),
        BrandCard(
          child: Column(children: [
            settingsTile(context, Icons.notifications_none,
                'Notifications',
                subtitle: 'Reminders and your data',
                onTap: () => context.push('/account/notifications')),
            settingsTile(context, Icons.lock_outline, 'Security',
                subtitle: 'Biometrics, 2FA, email and password',
                onTap: () => context.push('/account/security')),
          ]),
        ),

        settingsSection(context, 'Help'),
        BrandCard(
          child: Column(children: [
            settingsTile(context, Icons.celebration_outlined,
                'Replay welcome',
                subtitle: 'Re-see the Get Started screen',
                // Push via Navigator (not GoRouter) so we bypass the
                // /intro authed-user gate — preview mode pops back here.
                onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) =>
                              const GetStartedScreen(previewMode: true)),
                    )),
            settingsTile(context, Icons.account_circle_outlined,
                'Show onboarding',
                subtitle: 'Re-see the profile-setup screen',
                // Same Navigator.push pattern — preview mode disables
                // the save buttons so a replay can't clobber the real
                // profile name / locale.
                onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) =>
                              const OnboardingScreen(previewMode: true)),
                    )),
            settingsTile(context, Icons.auto_awesome_outlined,
                'Replay tutorial',
                subtitle: 'Re-see the how-it-works walkthrough',
                onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) =>
                              const TutorialScreen(replay: true)),
                    )),
          ]),
        ),

        settingsSection(context, 'Danger zone', destructive: true),
        BrandCard(
          child: Column(children: [
            settingsTile(context, Icons.pause_circle_outline,
                'Disable account',
                destructive: true,
                onTap: () async {
                  if (!await _ensureAal2()) return;
                  await _confirmDanger(
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
                    );
                }),
            settingsTile(context, Icons.delete_forever_outlined,
                'Delete account',
                destructive: true,
                onTap: () async {
                  if (!await _ensureAal2()) return;
                  await _confirmDanger(
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
                    );
                }),
          ]),
        ),
        const SizedBox(height: 20),

        AdaptiveButton(
          onPressed: () => AdaptiveAlertDialog.show(
            context: context,
            title: 'Sign out?',
            message: 'You can sign back in anytime.',
            icon: Icons.logout,
            actions: [
              AlertAction(
                  title: 'Cancel',
                  style: AlertActionStyle.cancel,
                  onPressed: () {}),
              AlertAction(
                title: 'Sign out',
                style: AlertActionStyle.destructive,
                onPressed: () async {
                  // Keep the biometric refresh token usable: a local
                  // sign-out clears the session without revoking it.
                  if (ref.read(biometricLoginProvider)) {
                    await ref
                        .read(biometricLoginProvider.notifier)
                        .saveSession();
                    await ref
                        .read(authServiceProvider)
                        .signOut(scope: SignOutScope.local);
                  } else {
                    await ref.read(authServiceProvider).signOut();
                  }
                  if (context.mounted) context.go('/auth');
                },
              ),
            ],
          ),
          label: 'Sign out',
          style: AdaptiveButtonStyle.bordered,
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
