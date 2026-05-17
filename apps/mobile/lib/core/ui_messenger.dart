import 'dart:async';

import 'package:flutter/material.dart';

/// App-wide messenger so any change can surface a top banner, even from
/// screens without a local Scaffold in scope.
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

Timer? _bannerTimer;

/// Shows a brief top MaterialBanner ("X added to favorites", etc.) that
/// auto-dismisses.
void showBanner(String message) {
  final m = scaffoldMessengerKey.currentState;
  if (m == null) return;
  m.clearMaterialBanners();
  m.showMaterialBanner(
    MaterialBanner(
      content: Text(message),
      leading: const Icon(Icons.notifications_active_outlined, size: 20),
      actions: [
        TextButton(
          onPressed: m.clearMaterialBanners,
          child: const Text('Dismiss'),
        ),
      ],
    ),
  );
  _bannerTimer?.cancel();
  _bannerTimer = Timer(const Duration(seconds: 3), () {
    scaffoldMessengerKey.currentState?.clearMaterialBanners();
  });
}
