import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/constants/app_constants.dart';
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
  String _focus = 'mix'; // movie | book | music | mix

  @override
  void initState() {
    super.initState();
    // Hydrate content focus from the hot-cache prefs (the canonical
    // mirror the AI service reads); profile.content_focus is the
    // server-side truth but isn't exposed on AppUser yet.
    SharedPreferences.getInstance().then((p) {
      final v = p.getString(StorageKeys.prefContentFocus);
      if (v == null || !mounted) return;
      if (const ['movie', 'book', 'music', 'mix'].contains(v)) {
        setState(() => _focus = v);
      }
    });
  }

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
        maxWidth: 760,
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
            settingsSection(context, 'Default content'),
            BrandCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  settingsRowLabel(context, 'What you want picks for'),
                  const SizedBox(height: 2),
                  Subtitle(
                      'Pre-selects the content type on every quiz; you '
                      'can still change it per quiz.'),
                  const SizedBox(height: 8),
                  Builder(builder: (context) {
                    const values = ['movie', 'book', 'music', 'mix'];
                    const labels = ['Movies', 'Books', 'Music', 'Mix'];
                    const colors = [
                      Tw.amber500,
                      Tw.emerald500,
                      Tw.rose500,
                      Tw.violet500,
                    ];
                    final idx = values.indexOf(_focus);
                    final active = idx < 0 ? 3 : idx;
                    return BrandSegmented(
                      color: colors[active],
                      labels: labels,
                      selectedIndex: active,
                      onValueChanged: (i) async {
                        setState(() => _focus = values[i]);
                        await ref
                            .read(settingsServiceProvider)
                            .updateContentPreferences(
                                contentFocus: values[i]);
                        final p = await SharedPreferences.getInstance();
                        await p.setString(
                            StorageKeys.prefContentFocus, values[i]);
                      },
                    );
                  }),
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

/// Per-format taste-tuning state — each slice owns its own avoid-genres,
/// runtime (Movies only), preferred language and free-text avoid note.
class _FormatSlice {
  final avoidGenres = <String>{};
  final language = TextEditingController();
  final avoidNote = TextEditingController();
  int runtimeIdx = 0; // Movies-only; ignored elsewhere.

  void dispose() {
    language.dispose();
    avoidNote.dispose();
  }
}

class _RecommendationFiltersCardState
    extends ConsumerState<_RecommendationFiltersCard> {
  /// Per-format curated genre lists so the chip set matches the format
  /// you're tuning (avoiding "Romance" on Movies doesn't also block
  /// romance novels — that was the whole point of the per-format split).
  static const _genresByFormat = <String, List<String>>{
    'movie': [
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
    ],
    'book': [
      'Sci-Fi',
      'Fantasy',
      'Romance',
      'Mystery',
      'Horror',
      'Historical',
      'Literary',
      'Young Adult',
      'Memoir',
      'Self-Help',
    ],
    'music': [
      'Pop',
      'Rock',
      'Hip-Hop',
      'Country',
      'Jazz',
      'Classical',
      'Electronic',
      'R&B',
      'Metal',
      'Indie',
    ],
  };
  static const _formats = ['movie', 'book', 'music'];
  static const _formatLabels = ['Movies', 'Books', 'Music'];
  static const _formatColors = [Tw.amber500, Tw.emerald500, Tw.rose500];

  /// Per-format-tab avoid-note placeholders so the field reads naturally
  /// for the format you're tuning.
  static const _avoidNotePlaceholders = <String, String>{
    'movie': 'e.g. franchises, directors, themes…',
    'book': 'e.g. series, authors, themes…',
    'music': 'e.g. artists, sub-genres, themes…',
  };

  // Off / 90 / 120 / 150 / 180 — index 0 means "no cap". Movies-only.
  static const _runtimeStops = [0, 90, 120, 150, 180];

  late final Map<String, _FormatSlice> _slices = {
    for (final f in _formats) f: _FormatSlice(),
  };
  int _activeIdx = 0;
  bool _seeded = false;
  bool _saving = false;

  String get _activeFormat => _formats[_activeIdx];
  _FormatSlice get _active => _slices[_activeFormat]!;

  @override
  void dispose() {
    for (final s in _slices.values) {
      s.dispose();
    }
    super.dispose();
  }

  /// Seed every slice from the stored blob. Accepts BOTH the new
  /// per-format shape `{ movie: {…}, book: {…}, music: {…} }` and the
  /// legacy single-bucket shape (which gets applied to every slice, with
  /// maxRuntimeMinutes kept only on Movies — same as the EF reader).
  void _seed(Map<String, dynamic>? blob) {
    if (_seeded) return;
    _seeded = true;
    if (blob == null) return;
    final hasPerFormat = _formats.any((f) => blob[f] is Map);
    if (hasPerFormat) {
      for (final f in _formats) {
        final slice = blob[f];
        if (slice is Map) _seedSlice(f, slice.cast<String, dynamic>());
      }
    } else {
      // Legacy: apply the bucket to every slice; runtime stays on movies.
      for (final f in _formats) {
        _seedSlice(f, blob, dropRuntime: f != 'movie');
      }
    }
  }

  void _seedSlice(String format, Map<String, dynamic> f,
      {bool dropRuntime = false}) {
    final s = _slices[format]!;
    final genres = (f['avoidGenres'] as List?) ?? const [];
    s.avoidGenres
      ..clear()
      ..addAll(genres.map((e) => e.toString()));
    s.language.text = (f['language'] as String?) ?? '';
    s.avoidNote.text = (f['avoidNote'] as String?) ?? '';
    if (!dropRuntime) {
      final rt = f['maxRuntimeMinutes'];
      if (rt is int) {
        final i = _runtimeStops.indexOf(rt);
        s.runtimeIdx = i < 0 ? 0 : i;
      }
    }
  }

  Map<String, dynamic> _sliceToBlob(String format) {
    final s = _slices[format]!;
    final out = <String, dynamic>{
      'avoidGenres': s.avoidGenres.toList(),
    };
    if (format == 'movie' && s.runtimeIdx != 0) {
      out['maxRuntimeMinutes'] = _runtimeStops[s.runtimeIdx];
    }
    final lang = s.language.text.trim();
    if (lang.isNotEmpty) out['language'] = lang;
    final note = s.avoidNote.text.trim();
    if (note.isNotEmpty) out['avoidNote'] = note;
    // Drop the list if it's empty so the cleaned blob doesn't carry it.
    if ((out['avoidGenres'] as List).isEmpty) out.remove('avoidGenres');
    return out;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final blob = <String, dynamic>{};
    for (final f in _formats) {
      final slice = _sliceToBlob(f);
      if (slice.isNotEmpty) blob[f] = slice;
    }
    final r = await ref
        .read(settingsServiceProvider)
        .updateRecommendationFilters(blob);
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
    final active = _active;
    final formatColor = _formatColors[_activeIdx];
    final rt = _runtimeStops[active.runtimeIdx];
    final isMovie = _activeFormat == 'movie';
    final genres = _genresByFormat[_activeFormat]!;

    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          widget.rowLabel('Filter for'),
          const SizedBox(height: 2),
          Subtitle(
              'Avoiding a genre on one format won\'t affect the others.'),
          const SizedBox(height: 10),
          BrandSegmented(
            color: formatColor,
            labels: _formatLabels,
            selectedIndex: _activeIdx,
            onValueChanged: (i) => setState(() => _activeIdx = i),
          ),
          widget.divider(context),
          widget.rowLabel('Avoid genres'),
          const SizedBox(height: 2),
          Subtitle('Picks will steer clear of anything you tap.'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final g in genres)
                _GenreChip(
                  label: g,
                  selected: active.avoidGenres.contains(g),
                  onTap: () => setState(() => active.avoidGenres.contains(g)
                      ? active.avoidGenres.remove(g)
                      : active.avoidGenres.add(g)),
                ),
            ],
          ),
          if (isMovie) ...[
            widget.divider(context),
            widget.rowLabel('Max movie runtime'),
            const SizedBox(height: 2),
            Subtitle(active.runtimeIdx == 0
                ? 'No runtime cap.'
                : 'Movies over $rt min won’t be suggested.'),
            const SizedBox(height: 8),
            AdaptiveSlider(
              value: active.runtimeIdx.toDouble(),
              min: 0,
              max: (_runtimeStops.length - 1).toDouble(),
              divisions: _runtimeStops.length - 1,
              activeColor: Tw.indigo500,
              label: active.runtimeIdx == 0 ? 'Off' : '$rt min',
              onChanged: (v) {
                final r = v.round();
                if (r != active.runtimeIdx) Haptics.selection();
                setState(() => active.runtimeIdx = r);
              },
            ),
          ],
          widget.divider(context),
          widget.rowLabel('Preferred language'),
          const SizedBox(height: 6),
          AdaptiveTextField(
            controller: active.language,
            placeholder: 'e.g. English, any',
          ),
          const SizedBox(height: 12),
          widget.rowLabel('Never recommend'),
          const SizedBox(height: 2),
          Subtitle('Anything here is a hard "no" for the AI.'),
          const SizedBox(height: 6),
          AdaptiveTextField(
            controller: active.avoidNote,
            placeholder: _avoidNotePlaceholders[_activeFormat]!,
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
