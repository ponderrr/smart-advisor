import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Streams `true` while at least one connectivity transport (wifi /
/// mobile / ethernet / vpn) is up. Replaces the old last-good-snapshot
/// OfflineCache — list providers now throw on a failed fetch and the
/// shell renders a "You're offline" banner from this value so the
/// user knows which screens are stale vs live.
///
/// connectivity_plus reports a *transport* state, not real reachability
/// — a phone connected to a captive-portal wifi will read as online
/// here even though no requests succeed. That's intentional: catching
/// captive portals would need a probe-per-period (cost) and false
/// negatives are worse than missed positives for this UX.
final connectivityProvider = StreamProvider<bool>((ref) async* {
  final c = Connectivity();
  // Seed: the stream only emits on change, so the first read could
  // sit on the loading state for several seconds otherwise.
  final initial = await c.checkConnectivity();
  yield _isOnline(initial);
  yield* c.onConnectivityChanged.map(_isOnline);
});

bool _isOnline(List<ConnectivityResult> results) {
  return results.any((r) =>
      r == ConnectivityResult.wifi ||
      r == ConnectivityResult.mobile ||
      r == ConnectivityResult.ethernet ||
      r == ConnectivityResult.vpn);
}
