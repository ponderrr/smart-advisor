import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/l10n/language_picker_card.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';
import 'settings_helpers.dart';

/// Curated interest tags offered as chips in the "About me" editor.
const _kInterests = <String>[
  'Sci-Fi',
  'Fantasy',
  'Horror',
  'Thrillers',
  'Comedy',
  'Drama',
  'Romance',
  'Mystery',
  'Action',
  'Documentary',
  'Animation',
  'Indie',
  'Classics',
  'Non-fiction',
  'True crime',
];

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
  final _bio = TextEditingController();
  final _tagDraft = TextEditingController();
  final _interests = <String>[];
  final _tags = <String>[];
  bool _seeded = false;
  String? _msg;

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    _bio.dispose();
    _tagDraft.dispose();
    super.dispose();
  }

  void _addTag() {
    final v =
        _tagDraft.text.trim().toLowerCase().replaceAll(RegExp(r'^#+'), '');
    if (v.isNotEmpty && !_tags.contains(v) && _tags.length < 10) {
      setState(() {
        _tags.add(v);
        _tagDraft.clear();
      });
    } else {
      _tagDraft.clear();
    }
  }

  Future<void> _saveAbout() async {
    final r = await ref.read(authServiceProvider).updateAbout(
          bio: _bio.text.trim().isEmpty ? null : _bio.text.trim(),
          interests: _interests,
          tags: _tags,
        );
    if (!mounted) return;
    showBanner(r.isError
        ? toUserFriendlyError(
            r.error, 'Couldn’t save your About me. Please try again.')
        : 'About me saved');
    ref.invalidate(currentProfileProvider);
  }

  Widget _interestChip(String label) {
    final on = _interests.contains(label);
    return GestureDetector(
      onTap: () => setState(
          () => on ? _interests.remove(label) : _interests.add(label)),
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: on
              ? Tw.indigo500.withValues(alpha: 0.14)
              : context.colors.muted,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color: on
                  ? Tw.indigo500.withValues(alpha: 0.5)
                  : Colors.transparent),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: on ? Tw.indigo500 : context.brandMuted)),
      ),
    );
  }

  Widget _tagChip(String tag) => Container(
        padding:
            const EdgeInsets.only(left: 12, right: 6, top: 6, bottom: 6),
        decoration: BoxDecoration(
          color: context.colors.muted,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('#$tag',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: context.brandInk)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => setState(() => _tags.remove(tag)),
            child: Icon(Icons.close,
                size: 14, color: context.brandMuted),
          ),
        ]),
      );

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
      _bio.text = profile.bio ?? '';
      _interests
        ..clear()
        ..addAll(profile.interests ?? const []);
      _tags
        ..clear()
        ..addAll(profile.tags ?? const []);
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
            BrandCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('About me'),
                  const SizedBox(height: 4),
                  Subtitle('A short bio and tags shown on your profile.'),
                  const SizedBox(height: 12),
                  settingsRowLabel(context, 'Bio'),
                  const SizedBox(height: 6),
                  AdaptiveTextField(
                    controller: _bio,
                    placeholder: 'Tell people what you’re into…',
                    minLines: 3,
                    maxLines: 5,
                  ),
                  const SizedBox(height: 12),
                  settingsRowLabel(context, 'Interests'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final it in _kInterests) _interestChip(it),
                    ],
                  ),
                  const SizedBox(height: 12),
                  settingsRowLabel(context, 'Your tags'),
                  const SizedBox(height: 8),
                  if (_tags.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [for (final t in _tags) _tagChip(t)],
                    ),
                    const SizedBox(height: 8),
                  ],
                  Row(children: [
                    Expanded(
                      child: AdaptiveTextField(
                        controller: _tagDraft,
                        placeholder: 'Add a tag…',
                        onSubmitted: (_) => _addTag(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    AdaptiveButton(
                        onPressed: _addTag,
                        label: 'Add',
                        style: AdaptiveButtonStyle.bordered),
                  ]),
                  const SizedBox(height: 14),
                  AdaptiveButton(
                      onPressed: _saveAbout, label: 'Save About me'),
                ],
              ),
            ),
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
