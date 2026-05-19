import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../auth/services/error_messages.dart';
import '../../settings/settings_service.dart';
import 'settings_helpers.dart';

/// Content tone + recommendation filters — these belong together (both shape
/// what the AI suggests). Relocated verbatim from the old AccountScreen: the
/// "Content tone" half of the Preferences card and the whole
/// "Recommendation filters" section.
class RecommendationsSettingsScreen extends ConsumerStatefulWidget {
  const RecommendationsSettingsScreen({super.key});

  @override
  ConsumerState<RecommendationsSettingsScreen> createState() =>
      _RecommendationsSettingsScreenState();
}

class _RecommendationsSettingsScreenState
    extends ConsumerState<RecommendationsSettingsScreen> {
  bool _seeded = false;
  int _tone = 0; // 0 standard, 1 family

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    if (!_seeded && profile != null) {
      _tone = profile.contentTone == 'family' ? 1 : 0;
      _seeded = true;
    }
    final under18 = (profile?.age ?? 99) < 18;

    return BrandScaffold(
      title: 'Recommendations',
      body: ResponsiveCenter(
        child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            settingsSection(context, 'Content tone'),
            BrandCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  settingsRowLabel(context, 'Content tone'),
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
            settingsSection(context, 'Recommendation filters'),
            _RecommendationFiltersCard(
              rowLabel: (t) => settingsRowLabel(context, t),
              divider: settingsDivider,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
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
