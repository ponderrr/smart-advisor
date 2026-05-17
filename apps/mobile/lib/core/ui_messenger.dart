import 'package:flutter/material.dart';

import '../ui/adaptive.dart';

/// App-wide messenger so any change can surface a native snackbar, even
/// from screens without a local Scaffold in scope.
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Shows a native AdaptiveSnackBar (iOS top banner / Android Material
/// snackbar). Optional [action] + [onAction] enable an Undo affordance.
void showBanner(
  String message, {
  AdaptiveSnackBarType type = AdaptiveSnackBarType.info,
  String? action,
  VoidCallback? onAction,
}) {
  final ctx = scaffoldMessengerKey.currentContext;
  if (ctx == null) return;
  AdaptiveSnackBar.show(
    ctx,
    message: message,
    type: type,
    action: action,
    onActionPressed: onAction,
  );
}
