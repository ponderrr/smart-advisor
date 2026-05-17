import 'package:flutter/material.dart';

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
}) {
  final ctx = messengerContextKey.currentContext;
  if (ctx == null || !ctx.mounted) return;
  AdaptiveSnackBar.show(
    ctx,
    message: message,
    type: type,
    action: action,
    onActionPressed: onAction,
  );
}
