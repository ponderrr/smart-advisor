import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/l10n/locale_provider.dart';
import '../../l10n/app_localizations.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../notifications/notification_service.dart';
import '../settings/settings_service.dart';

/// Multi-step post-auth profile setup. Captures the things that make
/// every later screen smarter on day one: display name, app language,
/// content focus, avoid-genre baseline, and notifications opt-in. Each
/// step is a single decision so it doesn't feel like a form. The
/// pre-auth product pitch lives in [GetStartedScreen]; this is gated by
/// `setup_completed_at`.
///
/// "Skip" at any step finalises with safe defaults (existing profile
/// name + en + mix focus + no filters + reminders off) so a user who
/// just wants to use the app can be done in one tap.
///
/// [previewMode] is for the "Show onboarding" entry in Settings →
/// Help — signed-in users can replay the visuals, but the final button
/// pops the preview without re-running [completeOnboarding] / writing
/// filters / toggling reminders (any of which would clobber the real
/// configuration they've already tuned).
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key, this.previewMode = false});

  final bool previewMode;

  @override
  ConsumerState<OnboardingScreen> createState() => _S();
}

/// Exact parity with the Settings → Recommendations chip list, so the
/// baseline a user sets here matches what they'd see later.
const _commonGenres = <String>[
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

class _S extends ConsumerState<OnboardingScreen> {
  static const _steps = 6;

  final _pc = PageController();
  int _page = 0;

  // Step state.
  final _name = TextEditingController();
  String _localeCode = 'en'; // BCP-47 language code
  String _contentFocus = 'mix'; // movie | book | music | mix
  final _avoidGenres = <String>{};
  bool _reminders = false;

  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Pre-select the language already in effect — a concrete locale, or
    // the "system default" sentinel when the app is following the device.
    _localeCode = ref.read(localeProvider)?.languageCode ?? kSystemLocaleCode;
  }

  @override
  void dispose() {
    _name.dispose();
    _pc.dispose();
    super.dispose();
  }

  void _next() {
    if (_page < _steps - 1) {
      _pc.nextPage(
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOutCubic);
    } else {
      _finish(skip: false);
    }
  }

  /// Jump straight to a step — used by the review step's Edit buttons.
  void _jumpTo(int page) {
    _pc.animateToPage(page,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic);
  }

  void _back() {
    if (_page > 0) {
      _pc.previousPage(
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOut);
    }
  }

  /// Persists every step's value, derives content_tone from age (parity
  /// with the old single-screen onboarding), and routes home. In
  /// `skip == true` mode the per-step preferences are dropped — only
  /// the existing name + locale + setup_completed_at fields are written.
  Future<void> _finish({required bool skip}) async {
    if (widget.previewMode) {
      Navigator.of(context).pop();
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });

    final profile = ref.read(currentProfileProvider).asData?.value;
    final name = skip
        ? (profile?.name ?? 'there')
        : (_name.text.trim().isEmpty
            ? (profile?.name ?? 'there')
            : _name.text.trim());
    // The per-device pref carries the "system default" sentinel, but the
    // profile.locale column wants a concrete BCP-47 code (the web client
    // reads it). Resolve the device language when the user is on system.
    final localePref = skip ? kSystemLocaleCode : _localeCode;
    final profileLocale = localePref == kSystemLocaleCode
        ? _deviceLanguageCode()
        : localePref;

    final res = await ref
        .read(authServiceProvider)
        .completeOnboarding(name: name, locale: profileLocale);
    if (!mounted) return;
    if (res.isError) {
      setState(() {
        _busy = false;
        _error = res.error;
      });
      return;
    }

    // Persist the language choice (the live switch already happened on
    // tap via _pickLocale; this also covers the skip path). The sentinel
    // is kept as-is so "system default" keeps following the device.
    await ref.read(localeProvider.notifier).set(localePref);

    final prefs = await SharedPreferences.getInstance();

    if (!skip) {
      // Content focus — profile column + per-device hot cache (matches
      // the web's localStorage convention so the quiz reads it on first
      // launch without an extra round-trip).
      try {
        await ref
            .read(settingsServiceProvider)
            .updateContentPreferences(contentFocus: _contentFocus);
        await prefs.setString(StorageKeys.prefContentFocus, _contentFocus);
      } catch (_) {/* non-fatal — user can re-pick from Settings */}

      // Avoid-genre baseline — only write when the user actually picked
      // at least one chip, so an untouched step doesn't paper-over the
      // existing null filters blob.
      if (_avoidGenres.isNotEmpty) {
        try {
          await ref.read(settingsServiceProvider).updateRecommendationFilters({
            'avoidGenres': _avoidGenres.toList(),
            'maxRuntimeMinutes': null,
            'language': null,
            'avoidNote': null,
          });
        } catch (_) {/* non-fatal */}
      }

      // Weekly fresh-picks reminder — only flip when the user opted in
      // (notification permission prompt fires inside Reminders.set).
      if (_reminders) {
        try {
          await ref.read(remindersProvider.notifier).set(true);
        } catch (_) {/* non-fatal */}
      }
    }

    // Derive content_tone from age, same as the old _finish.
    final age = profile?.age ?? 0;
    await prefs.setString(
        StorageKeys.prefContentTone, age > 0 && age < 18 ? 'family' : 'standard');

    ref.invalidate(currentProfileProvider);
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BrandScaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top bar: skip on the right (only for the real flow — the
            // preview always pops via the bottom CTA).
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 12, 0),
              child: Row(
                children: [
                  const Expanded(child: SizedBox()),
                  if (!widget.previewMode)
                    AdaptiveButton.child(
                      style: AdaptiveButtonStyle.plain,
                      onPressed: _busy ? null : () => _finish(skip: true),
                      child: Text(AppLocalizations.of(context).skipForNow,
                          style: TextStyle(
                              color: c.mutedForeground,
                              fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
            ),

            // Progress dots — same Tw.indigo500 active pill as the old
            // intro carousel.
            const SizedBox(height: 4),
            _ProgressDots(active: _page, total: _steps),
            const SizedBox(height: 8),

            Expanded(
              child: PageView(
                controller: _pc,
                onPageChanged: (i) => setState(() => _page = i),
                children: [
                  _StepShell(child: _stepName(c)),
                  _StepShell(child: _stepLocale()),
                  _StepShell(child: _stepFocus()),
                  _StepShell(child: _stepAvoidGenres()),
                  _StepShell(child: _stepReminders(c)),
                  _StepShell(child: _stepReview()),
                ],
              ),
            ),

            if (_error != null) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 0, 28, 8),
                child: Text(_error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: c.destructive, fontSize: 13)),
              ),
            ],

            _controls(c),
          ],
        ),
      ),
    );
  }

  /// Bottom control bar: Back · Next/Finish. Back fades out on step 0;
  /// the right button label flips to "Finish" on the last step. In
  /// preview mode every step's primary button is "Close preview" so
  /// the user can pop out at any time.
  Widget _controls(AppColors c) {
    final l = AppLocalizations.of(context);
    final isLast = _page == _steps - 1;
    // Right CTA: advance to the next step, OR — on the last step —
    // call _finish (real flow → persist + go home; preview → pop). The
    // _finish method internally short-circuits to pop in previewMode,
    // so we don't need a separate handler here.
    final rightLabel = isLast
        ? (widget.previewMode ? l.closePreview : l.finish)
        : l.next;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: _page == 0 ? 0 : 1,
              child: AdaptiveButton.child(
                style: AdaptiveButtonStyle.plain,
                onPressed: _page == 0 ? null : _back,
                child: Text(l.back,
                    style: TextStyle(
                        color: c.foreground,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ),
          const Spacer(),
          SizedBox(
            width: 140,
            child: AdaptiveButton(
              onPressed: _busy ? null : _next,
              label: rightLabel,
            ),
          ),
        ],
      ),
    );
  }

  // ── Step 1: name ────────────────────────────────────────────────────
  Widget _stepName(AppColors c) {
    final l = AppLocalizations.of(context);
    final placeholder =
        ref.watch(currentProfileProvider).asData?.value?.name ?? 'Jane';
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.onboardingNameEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.onboardingNameTitle, size: 24, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Text(
          l.onboardingNameSubtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
              fontSize: 14, height: 1.4, color: c.mutedForeground),
        ).animateFadeUp(delay: 240),
        const SizedBox(height: 28),
        // Cap the input width so it doesn't stretch across the full
        // 460-wide shell on tablets / wider screens.
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: AdaptiveTextField(
            controller: _name,
            placeholder: placeholder,
          ),
        ).animateFadeUp(delay: 320),
      ],
    );
  }

  // ── Step 2: locale ──────────────────────────────────────────────────
  Widget _stepLocale() {
    // The app switches language live on tap (see _pickLocale), so the
    // whole step is already rendering in the chosen language — no
    // Localizations.override needed.
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.languageStepEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.languageStepTitle, size: 26, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Subtitle(l.languageStepSubtitle, center: true)
            .animateFadeUp(delay: 220),
        const SizedBox(height: 24),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            _LanguageChip(
              label: l.languageSystemDefault,
              selected: _localeCode == kSystemLocaleCode,
              onTap: () => _pickLocale(kSystemLocaleCode),
            ),
            for (final entry in kLanguageNames.entries)
              _LanguageChip(
                label: entry.value,
                selected: _localeCode == entry.key,
                onTap: () => _pickLocale(entry.key),
              ),
          ],
        ).animateFadeUp(delay: 300),
      ],
    );
  }

  /// Records the choice AND switches the live app language immediately, so
  /// the rest of onboarding is already in the picked language.
  void _pickLocale(String code) {
    setState(() => _localeCode = code);
    ref.read(localeProvider.notifier).set(code);
  }

  /// The device's language code if the app ships translations for it,
  /// else English — used to fill profile.locale when the user is on
  /// "system default" (that column wants a concrete code).
  String _deviceLanguageCode() {
    final device = View.of(context).platformDispatcher.locale.languageCode;
    final supported =
        kSupportedLocales.any((l) => l.languageCode == device);
    return supported ? device : 'en';
  }

  // ── Step 3: content focus ──────────────────────────────────────────
  Widget _stepFocus() {
    final l = AppLocalizations.of(context);
    const focusValues = ['movie', 'book', 'music', 'mix'];
    final focusLabels = [
      l.contentMovies,
      l.contentBooks,
      l.contentMusic,
      l.contentMix,
    ];
    // Color-coded per the active selection — matches the rest of the app
    // where movie = amber, book = emerald, music = rose, mix = violet.
    const focusColors = [
      Tw.amber500,
      Tw.emerald500,
      Tw.rose500,
      Tw.violet500,
    ];
    final idx = focusValues.indexOf(_contentFocus);
    final activeIdx = idx < 0 ? 3 : idx;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.onboardingFocusEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.onboardingFocusTitle, size: 24, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Subtitle(l.onboardingFocusSubtitle, center: true)
            .animateFadeUp(delay: 240),
        const SizedBox(height: 24),
        BrandSegmented(
          color: focusColors[activeIdx],
          labels: focusLabels,
          selectedIndex: activeIdx,
          onValueChanged: (i) =>
              setState(() => _contentFocus = focusValues[i]),
        ).animateFadeUp(delay: 320),
      ],
    );
  }

  // ── Step 4: avoid genres ───────────────────────────────────────────
  Widget _stepAvoidGenres() {
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.onboardingAvoidEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.onboardingAvoidTitle, size: 24, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Subtitle(l.onboardingAvoidSubtitle, center: true)
            .animateFadeUp(delay: 240),
        const SizedBox(height: 22),
        Wrap(
          alignment: WrapAlignment.center,
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
        ).animateFadeUp(delay: 320),
      ],
    );
  }

  // ── Step 5: reminders ──────────────────────────────────────────────
  Widget _stepReminders(AppColors c) {
    final l = AppLocalizations.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.onboardingRemindersEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.onboardingRemindersTitle, size: 24, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Subtitle(l.onboardingRemindersSubtitle, center: true)
            .animateFadeUp(delay: 240),
        const SizedBox(height: 24),
        BrandSegmented(
          // Emerald when on (positive opt-in), neutral slate when off.
          color: _reminders ? Tw.emerald500 : Tw.slate500,
          labels: [l.remindersOff, l.remindersWeekly],
          selectedIndex: _reminders ? 1 : 0,
          onValueChanged: (i) => setState(() => _reminders = i == 1),
        ).animateFadeUp(delay: 320),
        const SizedBox(height: 12),
        Text(
          _reminders
              ? l.onboardingRemindersOnHint
              : l.onboardingRemindersOffHint,
          textAlign: TextAlign.center,
          style: TextStyle(
              fontSize: 12, color: c.mutedForeground),
        ).animateFadeUp(delay: 400),
      ],
    );
  }

  // ── Step 6: review ─────────────────────────────────────────────────
  Widget _stepReview() {
    final l = AppLocalizations.of(context);
    final profileName =
        ref.watch(currentProfileProvider).asData?.value?.name;
    final name = _name.text.trim().isNotEmpty
        ? _name.text.trim()
        : (profileName ?? 'Jane');
    final language = _localeCode == kSystemLocaleCode
        ? l.languageSystemDefault
        : (kLanguageNames[_localeCode] ?? _localeCode);
    final focus = switch (_contentFocus) {
      'movie' => l.contentMovies,
      'book' => l.contentBooks,
      'music' => l.contentMusic,
      _ => l.contentMix,
    };
    final avoid = _avoidGenres.isEmpty
        ? l.reviewNone
        : (_avoidGenres.toList()..sort()).join(', ');
    final reminders = _reminders ? l.remindersWeekly : l.remindersOff;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Eyebrow(l.onboardingReviewEyebrow).animateFadeUp(delay: 80),
        const SizedBox(height: 10),
        BrandHeading(l.onboardingReviewTitle, size: 24, center: true)
            .animateFadeUp(delay: 160),
        const SizedBox(height: 12),
        Subtitle(l.onboardingReviewSubtitle, center: true)
            .animateFadeUp(delay: 240),
        const SizedBox(height: 20),
        _ReviewRow(
          label: l.onboardingNameTitle,
          value: name,
          editLabel: l.reviewEdit,
          onEdit: () => _jumpTo(0),
        ).animateFadeUp(delay: 300),
        const SizedBox(height: 8),
        _ReviewRow(
          label: l.languageStepEyebrow,
          value: language,
          editLabel: l.reviewEdit,
          onEdit: () => _jumpTo(1),
        ).animateFadeUp(delay: 340),
        const SizedBox(height: 8),
        _ReviewRow(
          label: l.onboardingFocusEyebrow,
          value: focus,
          editLabel: l.reviewEdit,
          onEdit: () => _jumpTo(2),
        ).animateFadeUp(delay: 380),
        const SizedBox(height: 8),
        _ReviewRow(
          label: l.onboardingAvoidEyebrow,
          value: avoid,
          editLabel: l.reviewEdit,
          onEdit: () => _jumpTo(3),
        ).animateFadeUp(delay: 420),
        const SizedBox(height: 8),
        _ReviewRow(
          label: l.onboardingRemindersEyebrow,
          value: reminders,
          editLabel: l.reviewEdit,
          onEdit: () => _jumpTo(4),
        ).animateFadeUp(delay: 460),
      ],
    );
  }
}

/// One summary row on the review step — label + value + an Edit pill
/// that jumps back to the relevant step.
class _ReviewRow extends StatelessWidget {
  const _ReviewRow({
    required this.label,
    required this.value,
    required this.editLabel,
    required this.onEdit,
  });
  final String label;
  final String value;
  final String editLabel;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.border),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(),
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.6,
                      color: c.mutedForeground)),
              const SizedBox(height: 2),
              Text(value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: c.foreground)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: onEdit,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Tw.indigo500.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(editLabel,
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Tw.indigo500)),
          ),
        ),
      ]),
    );
  }
}

/// Centred, max-width-capped page frame used by every step.
class _StepShell extends StatelessWidget {
  const _StepShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // Wrap in a LayoutBuilder + ConstrainedBox(minHeight: viewport) so the
    // child Column's MainAxisAlignment.center actually takes effect — a
    // bare SingleChildScrollView shrink-wraps and pins content to the top.
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight - 32),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ProgressDots extends StatelessWidget {
  const _ProgressDots({required this.active, required this.total});
  final int active;
  final int total;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < total; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOut,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            height: 6,
            width: i == active ? 22 : 6,
            decoration: BoxDecoration(
              color: i == active
                  ? Tw.indigo500
                  : c.mutedForeground.withValues(alpha: .3),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
      ],
    );
  }
}

/// Tap-to-toggle avoid-genre chip — matches the Settings →
/// Recommendations card so the UI is the same control in both places.
class _GenreChip extends StatelessWidget {
  const _GenreChip(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? Tw.rose500 : c.background,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected
                ? Colors.transparent
                : c.mutedForeground.withValues(alpha: .35),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.1,
            color: selected ? Colors.white : c.foreground,
          ),
        ),
      ),
    );
  }
}

/// Tap-to-select language chip — single-select, so the active one fills
/// with the indigo accent (a positive choice, not an exclusion).
class _LanguageChip extends StatelessWidget {
  const _LanguageChip(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? Tw.indigo500 : c.background,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected
                ? Colors.transparent
                : c.mutedForeground.withValues(alpha: .35),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.1,
            color: selected ? Colors.white : c.foreground,
          ),
        ),
      ),
    );
  }
}

extension _FadeUp on Widget {
  Widget animateFadeUp({int delay = 100}) => animate()
      .fadeIn(delay: delay.ms, duration: 420.ms)
      .slideY(begin: 0.18, end: 0, curve: Curves.easeOut);
}
