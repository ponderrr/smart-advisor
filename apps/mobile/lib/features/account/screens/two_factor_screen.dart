import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart'
    show Factor, FactorStatus, FactorType, SignOutScope;

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';
import 'settings_helpers.dart';

/// Verified TOTP factors on the account.
final _factorsProvider = FutureProvider.autoDispose<List<Factor>>(
  (ref) async {
    final r = await ref.watch(mfaServiceProvider).listFactors();
    return (r.data ?? const <Factor>[])
        .where((f) => f.factorType == FactorType.totp)
        .toList();
  },
);

/// A signed-in device, from the app's `sessions` table.
typedef _Device = ({
  String id,
  String name,
  String? os,
  bool current,
});

final _devicesProvider =
    FutureProvider.autoDispose<List<_Device>>((ref) async {
  final c = ref.watch(supabaseClientProvider);
  final uid = c.auth.currentUser?.id;
  if (uid == null) return const [];
  final rows = await c
      .from('sessions')
      .select('id, device_name, device_type, os_name, '
          'is_current_device, last_activity')
      .eq('user_id', uid)
      .isFilter('revoked_at', null)
      .order('last_activity', ascending: false);
  return [
    for (final r in rows)
      (
        id: r['id'] as String,
        name: (r['device_name'] as String?) ??
            (r['device_type'] as String?) ??
            'Unknown device',
        os: r['os_name'] as String?,
        current: (r['is_current_device'] as bool?) ?? false,
      ),
  ];
});

/// Dedicated two-factor + devices section: manage the authenticator
/// factor and review / sign out other signed-in devices.
class TwoFactorScreen extends ConsumerWidget {
  const TwoFactorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final factors = ref.watch(_factorsProvider);
    final devices = ref.watch(_devicesProvider);
    final verified = (factors.value ?? const <Factor>[])
        .any((f) => f.status == FactorStatus.verified);

    return BrandScaffold(
      title: 'Two-factor & devices',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            settingsSection(context, 'Two-factor authentication'),
            BrandCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Icon(
                        verified
                            ? Icons.verified_user
                            : Icons.shield_outlined,
                        color: verified
                            ? Tw.emerald500
                            : context.brandMuted),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                          verified
                              ? 'Two-factor is on'
                              : 'Two-factor is off',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: context.brandInk)),
                    ),
                  ]),
                  const SizedBox(height: 6),
                  Subtitle(verified
                      ? 'An authenticator app code is required when you '
                          'sign in or change account settings.'
                      : 'Add an authenticator app for a second layer of '
                          'security on your account.'),
                  const SizedBox(height: 14),
                  AdaptiveButton(
                    onPressed: () => context.push('/account/mfa-setup'),
                    label: verified
                        ? 'Manage authenticator'
                        : 'Set up authenticator',
                  ),
                  if (verified) ...[
                    const SizedBox(height: 8),
                    AdaptiveButton(
                      style: AdaptiveButtonStyle.bordered,
                      label: 'Turn off two-factor',
                      onPressed: () =>
                          _removeFactors(context, ref, factors.value!),
                    ),
                  ],
                ],
              ),
            ),
            settingsSection(context, 'Devices'),
            ...devices.when(
              loading: () => [
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: LoaderFive('Loading')),
                ),
              ],
              error: (_, _) => [
                const MessageBanner.error(
                    'We couldn’t load your devices.'),
              ],
              data: (list) => [
                if (list.isEmpty)
                  BrandCard(
                    child: Subtitle(
                        'No other signed-in devices on record.',
                        center: true),
                  )
                else
                  BrandCard(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      children: [
                        for (final d in list)
                          AdaptiveListTile(
                            leading: Icon(d.current
                                ? Icons.smartphone
                                : Icons.devices_other),
                            title: Text(d.name),
                            subtitle: Text([
                              if (d.os != null) d.os!,
                              if (d.current) 'This device',
                            ].join(' · ')),
                          ),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),
                AdaptiveButton(
                  style: AdaptiveButtonStyle.bordered,
                  label: 'Sign out all other devices',
                  onPressed: () => _signOutOthers(context, ref),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _removeFactors(
      BuildContext context, WidgetRef ref, List<Factor> factors) async {
    await AdaptiveAlertDialog.show(
      context: context,
      title: 'Turn off two-factor?',
      message: 'Your account will no longer ask for an authenticator '
          'code. You can set it up again anytime.',
      icon: Icons.shield_outlined,
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Turn off',
          style: AlertActionStyle.destructive,
          onPressed: () async {
            final mfa = ref.read(mfaServiceProvider);
            for (final f in factors) {
              await mfa.unenroll(f.id);
            }
            ref.invalidate(_factorsProvider);
            showBanner('Two-factor turned off',
                type: AdaptiveSnackBarType.info);
          },
        ),
      ],
    );
  }

  Future<void> _signOutOthers(
      BuildContext context, WidgetRef ref) async {
    await AdaptiveAlertDialog.show(
      context: context,
      title: 'Sign out other devices?',
      message: 'Every other signed-in device will be signed out. This '
          'device stays signed in.',
      icon: Icons.devices_other,
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Sign out others',
          style: AlertActionStyle.destructive,
          onPressed: () async {
            final r = await ref
                .read(authServiceProvider)
                .signOut(scope: SignOutScope.others);
            if (r.isError) {
              showBanner(toUserFriendlyError(
                  r.error, 'Couldn’t sign out the other devices.'));
            } else {
              ref.invalidate(_devicesProvider);
              showBanner('Signed out all other devices',
                  type: AdaptiveSnackBarType.success);
            }
          },
        ),
      ],
    );
  }
}
