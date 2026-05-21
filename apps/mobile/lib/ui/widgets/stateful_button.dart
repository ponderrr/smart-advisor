import 'package:flutter/material.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../adaptive.dart';
import '../theme/app_theme.dart';
import '../theme/tailwind_palette.dart';

enum ButtonState { idle, loading, success, error }

/// State-machine button (idle → loading → success/error → idle after
/// [resetDelay]). adaptive_platform_ui has no equivalent, so it's kept
/// custom — but built on [AdaptiveButton] so the base still renders native
/// per platform.
class StatefulButton extends StatefulWidget {
  const StatefulButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.resetDelay = const Duration(milliseconds: 1500),
  });

  /// Returns true on success, false on failure.
  final Future<bool> Function() onPressed;
  final String label;
  final Duration resetDelay;

  @override
  State<StatefulButton> createState() => _StatefulButtonState();
}

class _StatefulButtonState extends State<StatefulButton> {
  ButtonState _state = ButtonState.idle;

  Future<void> _run() async {
    if (_state != ButtonState.idle) return;
    // Press → light tap; the result lands as a success/error notification.
    Haptics.impact(HapticImpactStyle.light);
    setState(() => _state = ButtonState.loading);
    bool ok;
    try {
      ok = await widget.onPressed();
    } catch (_) {
      ok = false;
    }
    if (!mounted) return;
    Haptics.notification(ok
        ? HapticNotificationStyle.success
        : HapticNotificationStyle.error);
    setState(() => _state = ok ? ButtonState.success : ButtonState.error);
    await Future<void>.delayed(widget.resetDelay);
    if (mounted) setState(() => _state = ButtonState.idle);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (Color color, Widget child) = switch (_state) {
      ButtonState.idle => (
          c.primary,
          Text(widget.label,
              style: TextStyle(
                  color: c.primaryForeground,
                  fontWeight: FontWeight.w500)),
        ),
      ButtonState.loading => (
          c.primary,
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: c.primaryForeground),
          ),
        ),
      ButtonState.success => (
          Tw.emerald500,
          const Icon(Icons.check, color: Colors.white, size: 18),
        ),
      ButtonState.error => (
          Tw.rose500,
          const Icon(Icons.close, color: Colors.white, size: 18),
        ),
    };

    return AdaptiveButton.child(
      onPressed: _state == ButtonState.idle ? _run : null,
      color: color,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: KeyedSubtree(key: ValueKey(_state), child: child),
      ),
    );
  }
}
