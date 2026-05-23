import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/models/app_user.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';

/// `YYYY-MM-DD` for today — the nudge is snoozed a day at a time, same
/// cadence as the AI nudge so the feed never piles up dismissible cards.
String _today() {
  final d = DateTime.now();
  return '${d.year}-${d.month}-${d.day}';
}

class _FinishSetupDismiss extends Notifier<String?> {
  static const _key = 'sa.finish_setup_dismissed';

  @override
  String? build() => ref
      .watch(sharedPreferencesProvider)
      .asData
      ?.value
      .getString(_key);

  Future<void> dismissToday() async {
    state = _today();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, state!);
  }
}

final _finishSetupDismissProvider =
    NotifierProvider<_FinishSetupDismiss, String?>(_FinishSetupDismiss.new);

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

/// Inline "Finish setting up your account" prompt that surfaces on the
/// feed when the user blew through onboarding with Skip and hasn't
/// personalised their profile since. Tapping the CTA re-runs the
/// onboarding flow (`/account/finish-setup`) so they can fill in the
/// fields they bypassed; dismissing snoozes the card for the rest of
/// the day, same as the AI nudge.
class FinishSetupCard extends ConsumerWidget {
  const FinishSetupCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    if (profile == null || !_looksBare(profile)) {
      return const SizedBox.shrink();
    }
    if (ref.watch(_finishSetupDismissProvider) == _today()) {
      return const SizedBox.shrink();
    }
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: BrandCard(
        padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Tw.indigo500.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.tune,
                  size: 20, color: Tw.indigo500),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Finish setting up your account',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: c.foreground)),
                  const SizedBox(height: 2),
                  Text(
                      "You skipped the setup. Pick your interests and "
                      "tune your picks so the feed gets smarter.",
                      style: TextStyle(
                          fontSize: 12,
                          height: 1.4,
                          color: c.mutedForeground)),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 4, children: [
                    AdaptiveButton(
                      onPressed: () =>
                          context.push('/account/finish-setup'),
                      label: 'Continue setup',
                      color: Tw.indigo500,
                    ),
                    AdaptiveButton(
                      onPressed: () => ref
                          .read(_finishSetupDismissProvider.notifier)
                          .dismissToday(),
                      label: 'Not now',
                      style: AdaptiveButtonStyle.plain,
                    ),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
