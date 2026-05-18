import 'package:flutter/material.dart';

import '../adaptive.dart';
import '../theme/tailwind_palette.dart';

/// Compact destructive "Clear all" affordance for collection screens
/// (Library, History). Confirms via the platform-adaptive alert dialog
/// before invoking [onConfirm].
class ClearAllButton extends StatelessWidget {
  const ClearAllButton({
    super.key,
    required this.onConfirm,
    this.title = 'Clear everything?',
    this.message =
        'This permanently removes every item here and can’t be undone.',
    this.confirmLabel = 'Clear all',
  });

  final Future<void> Function() onConfirm;
  final String title;
  final String message;
  final String confirmLabel;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => AdaptiveAlertDialog.show(
        context: context,
        title: title,
        message: message,
        icon: Icons.delete_sweep_outlined,
        actions: [
          AlertAction(
              title: 'Cancel',
              style: AlertActionStyle.cancel,
              onPressed: () {}),
          AlertAction(
            title: confirmLabel,
            style: AlertActionStyle.destructive,
            onPressed: onConfirm,
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Tw.rose500.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Tw.rose500.withValues(alpha: 0.4)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.delete_sweep_outlined,
              size: 16, color: Tw.rose500),
          const SizedBox(width: 6),
          const Text('Clear all',
              style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: Tw.rose500)),
        ]),
      ),
    );
  }
}
