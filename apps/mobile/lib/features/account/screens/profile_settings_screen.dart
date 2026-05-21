import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/l10n/language_picker_card.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';
import 'settings_helpers.dart';

/// Profile section — name / age / avatar. Relocated verbatim from the old
/// single-scroll AccountScreen (the Profile BrandCard + its save logic).
class ProfileSettingsScreen extends ConsumerStatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  ConsumerState<ProfileSettingsScreen> createState() =>
      _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState
    extends ConsumerState<ProfileSettingsScreen> {
  final _name = TextEditingController();
  final _age = TextEditingController();
  bool _seeded = false;
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
    if (!_seeded && profile != null) {
      _name.text = profile.name;
      _age.text = profile.age.toString();
      _seeded = true;
    }

    return BrandScaffold(
      title: 'Profile',
      body: ResponsiveCenter(
        maxWidth: 760,
        child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          AdaptiveButton(
                              onPressed: _pickAvatar,
                              label: 'Change photo',
                              style: AdaptiveButtonStyle.bordered),
                          if (profile?.avatarUrl != null)
                            AdaptiveButton(
                                onPressed: () => _confirmDanger(
                                      'Remove profile photo?',
                                      'Your avatar will be removed. '
                                          'You can add a new one '
                                          'anytime.',
                                      () async {
                                        final r = await ref
                                            .read(authServiceProvider)
                                            .removeAvatar();
                                        if (r.error == null) {
                                          ref.invalidate(
                                              currentProfileProvider);
                                          showBanner(
                                              'Profile photo removed',
                                              type: AdaptiveSnackBarType
                                                  .success);
                                        }
                                        return r.error;
                                      },
                                    ),
                                label: 'Remove',
                                style: AdaptiveButtonStyle.plain),
                        ],
                      ),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Subtitle('JPG, PNG, GIF or WebP.'),
                  const SizedBox(height: 16),
                  settingsRowLabel(context, 'Display name'),
                  const SizedBox(height: 6),
                  AdaptiveTextField(
                      controller: _name, placeholder: 'Your name'),
                  const SizedBox(height: 12),
                  settingsRowLabel(context, 'Age'),
                  const SizedBox(height: 6),
                  AdaptiveTextField(
                      controller: _age,
                      placeholder: 'Your age',
                      keyboardType: TextInputType.number),
                  const SizedBox(height: 14),
                  AdaptiveButton(
                    onPressed: () async {
                      final age =
                          int.tryParse(_age.text.trim()) ?? 0;
                      final r = await ref
                          .read(authServiceProvider)
                          .updateProfile(
                              name: _name.text.trim(), age: age);
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
            if (_msg != null) ...[
              const SizedBox(height: 12),
              Center(child: Subtitle(_msg!)),
            ],
            const SizedBox(height: 16),
            const LanguagePickerCard(),
            const SizedBox(height: 24),
          ],
        ),
      ),
      ),
    );
  }
}
