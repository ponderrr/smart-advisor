import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/models/app_user.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';

/// One sheet per this many days at most — the prompt should feel like a
/// gentle nudge that returns occasionally, not a wall hit on every visit.
const _minDaysBetweenShows = 3;

const _lastShownKey = 'sa.finish_setup_last_shown';

/// Returns true when the user finished onboarding but skipped through it
/// — `setup_completed_at` is stamped while the customisable fields are
/// all still untouched (no avatar, no bio, no interests/tags, no
/// recommendation filters). Once they fill any of those in (either by
/// re-running the flow or by editing settings), the nudge disappears.
bool _looksBare(AppUser p) {
  if (p.setupCompletedAt == null) return false;
  final hasBio = (p.bio ?? '').trim().isNotEmpty;
  final hasInterests = (p.interests ?? const <String>[]).isNotEmpty;
  final hasTags = (p.tags ?? const <String>[]).isNotEmpty;
  final hasAvatar = (p.avatarUrl ?? '').isNotEmpty;
  final hasFilters =
      (p.recommendationFilters ?? const <String, dynamic>{}).isNotEmpty;
  return !hasBio &&
      !hasInterests &&
      !hasTags &&
      !hasAvatar &&
      !hasFilters;
}

DateTime? _parseIso(String? s) =>
    s == null ? null : DateTime.tryParse(s);

/// Decides whether the nudge should fire on this feed visit and shows
/// the bottom sheet if so. Safe to call unconditionally on every feed
/// mount — the throttle + profile check no-op when it shouldn't fire.
///
/// Triggers when:
/// 1. The user finished onboarding but the profile looks bare (see
///    [_looksBare]).
/// 2. At least [_minDaysBetweenShows] have passed since the last show
///    (or there's no record yet).
///
/// We deliberately fire from the feed (not from `main.dart`'s authState
/// listener) so the sheet appears after the user is settled on a real
/// screen rather than mid-redirect.
Future<void> maybeShowFinishSetupSheet(
    BuildContext context, WidgetRef ref) async {
  final profile =
      await ref.read(currentProfileProvider.future).catchError((_) => null);
  if (profile == null || !_looksBare(profile)) return;

  final prefs = await SharedPreferences.getInstance();
  final lastShown = _parseIso(prefs.getString(_lastShownKey));
  if (lastShown != null) {
    final daysSince = DateTime.now().difference(lastShown).inDays;
    if (daysSince < _minDaysBetweenShows) return;
  }
  if (!context.mounted) return;

  // Fire-and-forget the timestamp write so we don't introduce another
  // async gap before opening the sheet (use_build_context_synchronously).
  // SharedPreferences caches in memory, so a subsequent read in this
  // session already sees the new value.
  unawaited(prefs.setString(
      _lastShownKey, DateTime.now().toIso8601String()));
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => const _FinishSetupSheet(),
  );
}

class _FinishSetupSheet extends StatelessWidget {
  const _FinishSetupSheet();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
        decoration: BoxDecoration(
          color: c.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: c.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.10),
              blurRadius: 24,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Tw.indigo500.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.tune,
                    size: 22, color: Tw.indigo500),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: BrandHeading('Finish setting up your account',
                    size: 19),
              ),
            ]),
            const SizedBox(height: 12),
            Text(
              "You skipped the setup. Pick your interests and tune your "
              "picks so the feed gets smarter — it takes a minute.",
              style: TextStyle(
                  fontSize: 14, height: 1.45, color: c.mutedForeground),
            ),
            const SizedBox(height: 18),
            Row(children: [
              Expanded(
                child: AdaptiveButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.push('/account/finish-setup');
                  },
                  label: 'Continue setup',
                  color: Tw.indigo500,
                ),
              ),
              const SizedBox(width: 10),
              AdaptiveButton(
                onPressed: () => Navigator.of(context).pop(),
                label: 'Not now',
                style: AdaptiveButtonStyle.plain,
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
