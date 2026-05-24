import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/connectivity.dart';
import '../theme/tailwind_palette.dart';

/// Slim top strip rendered when [connectivityProvider] reports the
/// device has no network transport up. Replaces the old last-good
/// snapshot OfflineCache — the screens now surface fetch failures
/// directly and this banner tells the user *why* a screen is empty
/// or stuck on a loader instead of leaving them guessing.
///
/// Returns `SizedBox.shrink()` while online so the row collapses to
/// zero height — drop it at the top of any screen body without
/// re-layout when the connection is fine.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(connectivityProvider).value ?? true;
    if (online) return const SizedBox.shrink();
    return Material(
      color: Tw.amber500.withValues(alpha: 0.16),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.wifi_off_rounded,
                  size: 14, color: Tw.amber700),
              const SizedBox(width: 8),
              Text("You're offline",
                  style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                      color: Tw.amber700)),
            ],
          ),
        ),
      ),
    );
  }
}
