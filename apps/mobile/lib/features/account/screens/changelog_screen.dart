import 'package:flutter/material.dart';

import '../../../ui/ui.dart';
import 'settings_helpers.dart';

/// In-app "What's new" — abridged per-prerelease notes for the
/// `feat/flutter-app` Flutter port. The long-form developer record
/// lives in `apps/mobile/CHANGELOG.md`; this file is the user-facing
/// condensation. Write the markdown first when shipping a new build,
/// then add a matching entry at the TOP of [_kReleases].
///
/// Reachable from Account → Help → What's new — not auto-popped on
/// upgrade because the prerelease cadence is fast enough that an
/// upgrade modal every couple of hours would get noisy.
class _Release {
  const _Release({
    required this.label,
    required this.date,
    required this.headline,
    required this.bullets,
  });

  /// Display title, e.g. "test.21".
  final String label;

  /// Human date like "May 23, 2026".
  final String date;

  /// One-line summary under the title.
  final String headline;

  /// 3-6 short bullet items.
  final List<String> bullets;
}

const _kReleases = <_Release>[
  _Release(
    label: 'test.23',
    date: 'May 24, 2026',
    headline:
        "You're offline banner, color-coded report pills, scan "
        'inside import, more haptics + polish.',
    bullets: [
      "You're offline banner — feed auto-refreshes when the "
          'network comes back.',
      'Profile Block button now confirms before blocking.',
      'Haptic ticks on overflow-menu picks (feed / library / '
          'comment sort).',
      'Scan moved inside Import so the Library heading stays '
          'aligned.',
      'Barcode scanner gained a flashlight + camera-flip strip.',
      'Reports filter pills carry the status semantic — '
          'Open=amber, Resolved=emerald, All=slate.',
      'Group-quiz async summary reads "Async · respond within '
          '24 hours".',
    ],
  ),
  _Release(
    label: 'test.22',
    date: 'May 24, 2026',
    headline:
        'Send a pick to a friend, offline feed cache, book-barcode '
        'scan, Android home-screen widget, in-app changelog, push '
        'rails.',
    bullets: [
      'Send to a friend — share any pick as a lightweight DM from '
          'the post menu.',
      'Offline feed cache — flaky network now serves the last good '
          'feed instead of an error.',
      'Scan a book barcode to add it to your library (Library → '
          'Scan).',
      'Android home-screen widget shows the latest friend pick.',
      "Account → Help → What's new — per-build highlights in-app.",
      'device_tokens registry + foreground push hybrid (FCM/APNs '
          'rails for later).',
    ],
  ),
  _Release(
    label: 'test.21',
    date: 'May 23, 2026',
    headline:
        'Reactions, @mentions, search, taste-graph follow suggestions, '
        'app-icon shortcuts, inbound share-target.',
    bullets: [
      'Emoji reactions on posts and comments (❤️ 🔥 😂 😢 🤔 👏).',
      '@mention links — tap a handle to open that profile.',
      'Global search across people and picks, from the bell row.',
      '"People you may know" rail, ranked by mutual follows.',
      'Long-press the app icon: Take a quiz / Open feed / Group quiz.',
      'Share a link from another app — composer opens with it prefilled.',
    ],
  ),
  _Release(
    label: 'test.20',
    date: 'May 23, 2026',
    headline:
        'Notification settings split into Activity / Reminders / Your data.',
    bullets: [
      'Six per-kind toggles under Activity, each muting the bell badge '
          'and inbox in lockstep.',
      'Reminders keeps the weekly / group-quiz expiring / in-progress '
          'schedules separate.',
      'Hub tile subtitles show "All on" / "X of N on" / "All off" at a '
          'glance.',
    ],
  ),
  _Release(
    label: 'test.19',
    date: 'May 23, 2026',
    headline:
        'Server notifications, block confirm, reports moderation, faster '
        'post detail.',
    bullets: [
      'Server notifications: followers, friend posts, comments, replies, '
          'post + comment upvotes.',
      'Block confirm dialog; blocked-people list scales with avatars + '
          'search.',
      'Reports moderation: open / reviewed / dismissed status visible '
          'to reporters too.',
      'Faster post detail — deep-links no longer wait on the whole feed.',
      'Biometric sign-in scoped per account; auto-disables on a different '
          'sign-in.',
      '"Finish setting up" nudge for skipped onboarding.',
    ],
  ),
  _Release(
    label: 'test.18',
    date: 'May 23, 2026',
    headline:
        'MFA safety net, smart AI nudge, in-app admin reports moderation.',
    bullets: [
      'MFA challenge now fires even when the JWT AAL hint lags.',
      'Sign-up back arrow returns to Get Started instead of Sign In.',
      'AI nudge only shows when you actually run out of things to look at.',
      'Admin-only Reports screen, gated on profiles.is_admin.',
    ],
  ),
  _Release(
    label: 'test.17',
    date: 'May 23, 2026',
    headline:
        'profiles_public view, dedicated report screen, notification '
        'toggle split.',
    bullets: [
      'Profile cross-account hydration — no more "Someone" display name.',
      'Dedicated report screen with reason radios + details textarea.',
      'Notifications split into three independent toggles.',
      'Localized Contact / Appearance / Notifications / Blocked / '
          'Filed reports.',
    ],
  ),
];

class ChangelogScreen extends StatelessWidget {
  const ChangelogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      title: "What's new",
      body: ResponsiveCenter(
        maxWidth: 760,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Subtitle(
                'Recent prereleases of the mobile app. Tap a build to '
                'expand its highlights.'),
            const SizedBox(height: 14),
            for (final r in _kReleases) ...[
              settingsSection(context, r.label),
              BrandCard(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: _ReleaseTile(release: r),
              ),
              const SizedBox(height: 14),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReleaseTile extends StatelessWidget {
  const _ReleaseTile({required this.release});
  final _Release release;

  @override
  Widget build(BuildContext context) {
    return Theme(
      // Strip the default ExpansionTile divider — BrandCard already
      // provides its own visual frame (same pattern as FAQ).
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        // First release expands by default so the most-recent build
        // is visible without a tap.
        initiallyExpanded: identical(release, _kReleases.first),
        tilePadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(release.headline,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: context.brandInk,
                    height: 1.35)),
            const SizedBox(height: 2),
            Text(release.date,
                style: TextStyle(
                    fontSize: 11, color: context.brandMuted)),
          ],
        ),
        expandedAlignment: Alignment.centerLeft,
        children: [
          for (final b in release.bullets)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 6, right: 8),
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: context.brandMuted,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(b,
                        style: TextStyle(
                            fontSize: 13,
                            color: context.brandInk,
                            height: 1.4)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
