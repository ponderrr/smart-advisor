import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show SignOutScope;

import '../../core/ui_messenger.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../auth/services/error_messages.dart';
import '../notifications/notification_service.dart';
import '../notifications/notifications_center.dart';
import '../feed/feed_providers.dart';
import '../feed/models/feed_models.dart';
import '../security/biometric.dart';
import '../security/biometric_login.dart';
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
    setState(() => _msg = r.isError
        ? toUserFriendlyError(
            r.error, 'Couldn’t update your photo. Please try again.')
        : 'Photo updated');
  }

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

  Future<void> _editField({
    required String title,
    required String hint,
    bool obscure = false,
    required Future<dynamic> Function(String) onSave,
  }) async {
    final value = await AdaptiveAlertDialog.inputShow(
      context: context,
      title: title,
      icon: Icons.edit_outlined,
      input: AdaptiveAlertDialogInput(
          placeholder: hint, obscureText: obscure),
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
            title: 'Save',
            style: AlertActionStyle.primary,
            onPressed: () {}),
      ],
    );
    if (value == null || value.trim().isEmpty) return;
    final r = await onSave(value.trim());
    showBanner(r.isError
        ? toUserFriendlyError(
            r.error, 'Couldn’t save that. Please try again.')
        : 'Saved');
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

  Widget _section(String t, {bool destructive = false}) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 22, 4, 8),
        child: Eyebrow(t,
            color: destructive ? context.colors.destructive : null),
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
    return AdaptiveListTile(
      padding: EdgeInsets.zero,
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
    final amoled = ref.watch(amoledProvider);
    final under18 = (profile?.age ?? 99) < 18;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const BrandHeading('Settings', size: 32),
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
                      onPressed: () => _confirmDanger(
                            'Remove profile photo?',
                            'Your avatar will be removed. You can '
                                'add a new one anytime.',
                            () async {
                              final r = await ref
                                  .read(authServiceProvider)
                                  .removeAvatar();
                              if (r.error == null) {
                                ref.invalidate(
                                    currentProfileProvider);
                                showBanner('Profile photo removed',
                                    type: AdaptiveSnackBarType
                                        .success);
                              }
                              return r.error;
                            },
                          ),
                      label: 'Remove',
                      style: AdaptiveButtonStyle.plain),
              ]),
              const SizedBox(height: 8),
              Subtitle('JPG, PNG, GIF or WebP.'),
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
                  showBanner(r.isError
                      ? toUserFriendlyError(r.error,
                          'Couldn’t save your profile. Please try again.')
                      : 'Profile saved');
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
              BrandSegmented(
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
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _rowLabel('AMOLED dark'),
                      const SizedBox(height: 2),
                      Subtitle('True-black surfaces in dark mode.'),
                    ],
                  ),
                ),
                AdaptiveSwitch(
                  value: amoled,
                  onChanged: (v) =>
                      ref.read(amoledProvider.notifier).set(v),
                ),
              ]),
              _divider(context),
              _rowLabel('Content tone'),
              const SizedBox(height: 2),
              Subtitle(under18
                  ? 'Family-friendly is locked for under-18.'
                  : 'Applied to your next quiz.'),
              const SizedBox(height: 8),
              BrandSegmented(
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

        _section('Recommendation filters'),
        _RecommendationFiltersCard(rowLabel: _rowLabel, divider: _divider),

        _section('Feed'),
        _FeedSettingsCard(rowLabel: _rowLabel, divider: _divider),

        _section('Notifications & security'),
        BrandCard(
          child: Column(children: [
            AdaptiveListTile(
              padding: EdgeInsets.zero,
              leading: const Icon(Icons.fingerprint),
              title: const Text('App lock'),
              subtitle: Text(PlatformInfo.isIOS
                  ? 'Require Face ID / Touch ID to open'
                  : 'Require fingerprint or face unlock to open'),
              trailing: AdaptiveSwitch(
                value: ref.watch(biometricLockProvider),
                activeColor: Tw.indigo500,
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
            ),
            AdaptiveListTile(
              padding: EdgeInsets.zero,
              leading: const Icon(Icons.fingerprint),
              title: const Text('Biometric sign-in'),
              subtitle: Text(PlatformInfo.isIOS
                  ? 'Sign in with Face ID / Touch ID after signing out'
                  : 'Sign in with fingerprint or face after signing out'),
              trailing: AdaptiveSwitch(
                value: ref.watch(biometricLoginProvider),
                activeColor: Tw.indigo500,
                onChanged: (v) async {
                if (v) {
                  final ok = await ref
                      .read(biometricLoginProvider.notifier)
                      .enable();
                  if (!ok && context.mounted) {
                    setState(() => _msg =
                        'Could not enable biometric sign-in.');
                  }
                } else {
                  await AdaptiveAlertDialog.show(
                    context: context,
                    title: 'Turn off biometric sign-in?',
                    message: 'You\'ll need your email and password '
                        'to sign in next time.',
                    icon: Icons.fingerprint,
                    actions: [
                      AlertAction(
                          title: 'Keep on',
                          style: AlertActionStyle.cancel,
                          onPressed: () {}),
                      AlertAction(
                        title: 'Turn off',
                        style: AlertActionStyle.destructive,
                        onPressed: () async {
                          await ref
                              .read(biometricLoginProvider.notifier)
                              .disable();
                          showBanner(
                              'Biometric sign-in turned off',
                              type: AdaptiveSnackBarType.info);
                        },
                      ),
                    ],
                  );
                }
              },
              ),
            ),
            AdaptiveListTile(
              padding: EdgeInsets.zero,
              leading: const Icon(Icons.notifications_none),
              title: const Text('Weekly quiz reminder'),
              trailing: AdaptiveSwitch(
                value: ref.watch(remindersProvider),
                activeColor: Tw.indigo500,
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
            ),
            _divider(context),
            _tile(Icons.security, 'Two-factor authentication',
                onTap: () => context.push('/account/mfa-setup')),
            _tile(Icons.mail_outline, 'Change email',
                subtitle: 'Requires 2FA',
                onTap: () async {
                  if (!await _ensureAal2()) return;
                  await _editField(
                    title: 'New email',
                    hint: 'name@example.com',
                    onSave: (v) =>
                        ref.read(authServiceProvider).changeEmail(v),
                  );
                }),
            _tile(Icons.lock_outline, 'Change password',
                subtitle: 'Requires 2FA',
                onTap: () async {
                  if (!await _ensureAal2()) return;
                  await _editField(
                    title: 'New password',
                    hint: '8+ chars, mixed case, number, symbol',
                    obscure: true,
                    onSave: (v) =>
                        ref.read(authServiceProvider).changePassword(v),
                  );
                }),
          ]),
        ),

        _section('Your data'),
        BrandCard(
          child: Column(children: [
            AdaptiveListTile(
              padding: EdgeInsets.zero,
              leading: AdaptiveBadge(
                count: ref.watch(unreadCountProvider),
                backgroundColor: Tw.indigo500,
                child: Icon(Icons.notifications_none,
                    color: context.colors.foreground),
              ),
              title: const Text('Notifications'),
              trailing: Icon(Icons.chevron_right,
                  color: context.colors.mutedForeground),
              onTap: () => context.push('/notifications'),
            ),
            _tile(Icons.auto_awesome, 'Your Wrapped',
                onTap: () => context.push('/wrapped')),
          ]),
        ),

        _section('Danger zone', destructive: true),
        BrandCard(
          child: Column(children: [
            _tile(Icons.pause_circle_outline, 'Disable account',
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
            _tile(Icons.delete_forever_outlined, 'Delete account',
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
        if (_msg != null) ...[
          const SizedBox(height: 12),
          Center(child: Subtitle(_msg!)),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

/// Feed section — port of the web settings/page.tsx "Feed" block.
/// Visibility (Public/Private) bound to [feedVisibilityProvider] with the
/// web hint copy; default view/scope/community + comment sort bound to
/// [feedPrefsProvider]. All per-device (no backend), matching the web.
class _FeedSettingsCard extends ConsumerWidget {
  const _FeedSettingsCard(
      {required this.rowLabel, required this.divider});
  final Widget Function(String) rowLabel;
  final Widget Function(BuildContext) divider;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visibility = ref.watch(feedVisibilityProvider);
    final prefs = ref.watch(feedPrefsProvider);
    final isPrivate = visibility == FeedVisibility.private;

    const communityLabels = ['All', 'Movies', 'Books', 'Music'];
    final communityIdx =
        prefs.community == null ? 0 : prefs.community!.index + 1;
    const scopes = [
      FeedScope.friends,
      FeedScope.discover,
      FeedScope.group
    ];
    const views = [FeedView.card, FeedView.compact, FeedView.media];

    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          rowLabel('Profile visibility'),
          const SizedBox(height: 2),
          Subtitle(isPrivate
              ? 'You still browse and post normally, but your '
                  'activity isn’t broadcast and follows are '
                  'request-only.'
              : 'Your finished / rated / shared picks appear in '
                  'others’ feeds and people can follow you directly.'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: isPrivate ? Tw.rose500 : Tw.emerald500,
            labels: const ['Public', 'Private'],
            selectedIndex: isPrivate ? 1 : 0,
            onValueChanged: (i) => ref
                .read(feedVisibilityProvider.notifier)
                .set(i == 1
                    ? FeedVisibility.private
                    : FeedVisibility.public),
          ),
          divider(context),
          rowLabel('Default view'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: Tw.indigo500,
            labels: const ['Cards', 'Compact', 'Media'],
            selectedIndex: views.indexOf(prefs.view),
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setView(views[i]),
          ),
          const SizedBox(height: 12),
          rowLabel('Default scope'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: const [
              Tw.indigo500,
              Tw.violet500,
              Tw.rose500
            ][scopes.indexOf(prefs.scope)],
            labels: const ['Friends', 'Discover', 'Group'],
            selectedIndex: scopes.indexOf(prefs.scope),
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setScope(scopes[i]),
          ),
          const SizedBox(height: 12),
          rowLabel('Default community'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: accentColorForLabel(communityLabels[communityIdx]),
            labels: communityLabels,
            selectedIndex: communityIdx,
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setCommunity(i == 0
                    ? null
                    : FeedCommunity.values[i - 1]),
          ),
          const SizedBox(height: 12),
          rowLabel('Comment sort'),
          const SizedBox(height: 8),
          BrandSegmented(
            color: Tw.amber500,
            labels: const ['Top', 'New'],
            selectedIndex:
                prefs.commentSort == CommentSort.newest ? 1 : 0,
            onValueChanged: (i) => ref
                .read(feedPrefsProvider.notifier)
                .setCommentSort(i == 1
                    ? CommentSort.newest
                    : CommentSort.top),
          ),
        ],
      ),
    );
  }
}

/// Taste tuning / hard filters — explicit dislikes + content constraints
/// threaded into the AI recommendation prompt so picks respect them across
/// every rec path (quiz, surprise). Persisted to the profile row (+ a
/// SharedPreferences mirror) as one JSON blob via [SettingsService]. Seeded
/// once from [currentProfileProvider]; saved on the explicit Save button to
/// match the "Save profile" pattern.
class _RecommendationFiltersCard extends ConsumerStatefulWidget {
  const _RecommendationFiltersCard(
      {required this.rowLabel, required this.divider});
  final Widget Function(String) rowLabel;
  final Widget Function(BuildContext) divider;

  @override
  ConsumerState<_RecommendationFiltersCard> createState() =>
      _RecommendationFiltersCardState();
}

class _RecommendationFiltersCardState
    extends ConsumerState<_RecommendationFiltersCard> {
  static const _commonGenres = [
    'Horror',
    'Romance',
    'Musical',
    'Documentary',
    'Anime',
    'Reality',
    'War',
    'Western',
    'Thriller',
    'Comedy',
  ];
  // Off / 90 / 120 / 150 / 180 — index 0 means "no cap".
  static const _runtimeStops = [0, 90, 120, 150, 180];

  final _language = TextEditingController();
  final _avoidNote = TextEditingController();
  final _avoidGenres = <String>{};
  int _runtimeIdx = 0;
  bool _seeded = false;
  bool _saving = false;

  @override
  void dispose() {
    _language.dispose();
    _avoidNote.dispose();
    super.dispose();
  }

  void _seed(Map<String, dynamic>? f) {
    if (_seeded) return;
    _seeded = true;
    if (f == null) return;
    final genres = (f['avoidGenres'] as List?) ?? const [];
    _avoidGenres
      ..clear()
      ..addAll(genres.map((e) => e.toString()));
    _language.text = (f['language'] as String?) ?? '';
    _avoidNote.text = (f['avoidNote'] as String?) ?? '';
    final rt = f['maxRuntimeMinutes'];
    if (rt is int) {
      final i = _runtimeStops.indexOf(rt);
      _runtimeIdx = i < 0 ? 0 : i;
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final lang = _language.text.trim();
    final note = _avoidNote.text.trim();
    final filters = <String, dynamic>{
      'avoidGenres': _avoidGenres.toList(),
      'maxRuntimeMinutes':
          _runtimeIdx == 0 ? null : _runtimeStops[_runtimeIdx],
      'language': lang.isEmpty ? null : lang,
      'avoidNote': note.isEmpty ? null : note,
    };
    final r = await ref
        .read(settingsServiceProvider)
        .updateRecommendationFilters(filters);
    if (!mounted) return;
    setState(() => _saving = false);
    if (r.isError) {
      showBanner(toUserFriendlyError(
          r.error, 'Couldn’t save your filters. Please try again.'));
    } else {
      ref.invalidate(currentProfileProvider);
      showBanner('Recommendation filters saved',
          type: AdaptiveSnackBarType.success);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    _seed(profile?.recommendationFilters);
    final rt = _runtimeStops[_runtimeIdx];

    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          widget.rowLabel('Avoid genres'),
          const SizedBox(height: 2),
          Subtitle('Picks will steer clear of anything you tap.'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final g in _commonGenres)
                _GenreChip(
                  label: g,
                  selected: _avoidGenres.contains(g),
                  onTap: () => setState(() => _avoidGenres.contains(g)
                      ? _avoidGenres.remove(g)
                      : _avoidGenres.add(g)),
                ),
            ],
          ),
          widget.divider(context),
          widget.rowLabel('Max movie runtime'),
          const SizedBox(height: 2),
          Subtitle(_runtimeIdx == 0
              ? 'No runtime cap.'
              : 'Movies over $rt min won’t be suggested.'),
          const SizedBox(height: 8),
          AdaptiveSlider(
            value: _runtimeIdx.toDouble(),
            min: 0,
            max: (_runtimeStops.length - 1).toDouble(),
            divisions: _runtimeStops.length - 1,
            activeColor: Tw.indigo500,
            label: _runtimeIdx == 0 ? 'Off' : '$rt min',
            onChanged: (v) =>
                setState(() => _runtimeIdx = v.round()),
          ),
          widget.divider(context),
          widget.rowLabel('Preferred language'),
          const SizedBox(height: 6),
          AdaptiveTextField(
            controller: _language,
            placeholder: 'e.g. English, any',
          ),
          const SizedBox(height: 12),
          widget.rowLabel('Never recommend'),
          const SizedBox(height: 2),
          Subtitle('Anything here is a hard "no" for the AI.'),
          const SizedBox(height: 6),
          AdaptiveTextField(
            controller: _avoidNote,
            placeholder: 'e.g. graphic horror, anything by X',
            minLines: 2,
            maxLines: 4,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.newline,
          ),
          const SizedBox(height: 14),
          AdaptiveButton(
            onPressed: _saving ? null : _save,
            label: _saving ? 'Saving…' : 'Save filters',
          ),
        ],
      ),
    );
  }
}

/// Small toggleable pill for the avoid-genres list — on-brand muted chip
/// that fills with the destructive hue when active (it's an exclusion).
class _GenreChip extends StatelessWidget {
  const _GenreChip(
      {required this.label,
      required this.selected,
      required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? c.destructive.withValues(alpha: 0.14)
              : c.muted,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? c.destructive : c.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? c.destructive : c.mutedForeground,
          ),
        ),
      ),
    );
  }
}
