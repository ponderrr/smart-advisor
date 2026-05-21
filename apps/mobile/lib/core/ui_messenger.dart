import 'package:flutter/material.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../ui/adaptive.dart';

export '../ui/adaptive.dart' show AdaptiveSnackBarType;

/// App-wide messenger so any change can surface a native snackbar, even
/// from screens without a local Scaffold in scope.
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Marks a point in the tree that sits beneath BOTH the [ScaffoldMessenger]
/// (Android snackbar path) and an [Overlay] (iOS top-banner path), so
/// `AdaptiveSnackBar.show` can resolve either. See `main.dart` where this
/// key is mounted inside an Overlay in the app builder.
final messengerContextKey = GlobalKey();

/// Shows a native AdaptiveSnackBar (iOS top banner / Android Material
/// snackbar). Optional [action] + [onAction] enable an Undo affordance.
void showBanner(
  String message, {
  AdaptiveSnackBarType type = AdaptiveSnackBarType.info,
  String? action,
  VoidCallback? onAction,
  Duration duration = const Duration(seconds: 3),
}) {
  final ctx = messengerContextKey.currentContext;
  if (ctx == null || !ctx.mounted) return;
  // Semantic haptic to match the banner's tone. `info` is intentionally
  // silent — it fires too often (and its triggers usually buzz already).
  switch (type) {
    case AdaptiveSnackBarType.success:
      Haptics.notification(HapticNotificationStyle.success);
    case AdaptiveSnackBarType.warning:
      Haptics.notification(HapticNotificationStyle.warning);
    case AdaptiveSnackBarType.error:
      Haptics.notification(HapticNotificationStyle.error);
    case AdaptiveSnackBarType.info:
      break;
  }
  AdaptiveSnackBar.show(
    ctx,
    message: message,
    type: type,
    duration: duration,
    action: action,
    onActionPressed: onAction,
  );
}
