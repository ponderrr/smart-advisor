import 'dart:async';

import 'package:go_router/go_router.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';

/// Inbound share-target. When another app (YouTube, IMDb, Spotify,
/// Safari, the system share sheet) hands us a URL or text, route to
/// the composer with a `share=` query param so the user lands on a
/// pre-filled "share a pick" form.
///
/// Two entry points cover the iOS/Android lifecycles:
///   * Cold start: getInitialMedia() resolves the launch payload (if any).
///   * Foreground: getMediaStream() emits while the app is open.
class ShareIntake {
  ShareIntake._();

  static StreamSubscription<List<SharedMediaFile>>? _sub;

  static Future<void> setup(GoRouter router) async {
    // 1) Cold start.
    final initial = await ReceiveSharingIntent.instance.getInitialMedia();
    _handle(initial, router);

    // 2) While running. Replaces any prior subscription so a hot
    // reload doesn't stack handlers.
    await _sub?.cancel();
    _sub = ReceiveSharingIntent.instance.getMediaStream().listen((files) {
      _handle(files, router);
    });
  }

  static void _handle(List<SharedMediaFile> files, GoRouter router) {
    if (files.isEmpty) return;
    // Pick the first usable payload — text or URL. Image / video
    // shares aren't part of the share-a-pick flow yet (no host for
    // user uploads), so we ignore them rather than crash.
    String? payload;
    for (final f in files) {
      final p = f.path.trim();
      if (p.isEmpty) continue;
      payload = p;
      break;
    }
    if (payload == null) return;
    final encoded = Uri.encodeQueryComponent(payload);
    router.go('/?share=$encoded');
    // Tell the plugin we consumed the payload so a back-and-forth
    // app switch doesn't re-fire it.
    ReceiveSharingIntent.instance.reset();
  }
}
