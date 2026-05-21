import 'package:flutter/material.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../theme/accents.dart';
import 'brand.dart';

/// Inline notice styled like the "Clear all" affordance (tinted surface +
/// border + icon), color-coded to a content accent so it matches the
/// surrounding screen. Pass an explicit [tone] (when a screen already has
/// one) or just an [accent] name; defaults to violet for generic use.
///
/// The [MessageBanner.error] variant also fires an error haptic when it
/// first appears, so a failure is felt as well as seen.
class MessageBanner extends StatefulWidget {
  const MessageBanner({
    super.key,
    required this.message,
    this.tone,
    this.accent = ContentAccentName.violet,
    this.icon = Icons.info_outline,
  }) : _isError = false;

  /// Convenience for error states: rose accent + an error icon.
  const MessageBanner.error(this.message, {super.key})
      : tone = null,
        accent = ContentAccentName.rose,
        icon = Icons.error_outline,
        _isError = true;

  final String message;
  final ContentAccentTone? tone;
  final ContentAccentName accent;
  final IconData icon;
  final bool _isError;

  @override
  State<MessageBanner> createState() => _MessageBannerState();
}

class _MessageBannerState extends State<MessageBanner> {
  @override
  void initState() {
    super.initState();
    // An error banner appearing is a failure signal — buzz to match the
    // error-typed snackbar haptic (see showBanner in ui_messenger.dart).
    if (widget._isError) {
      Haptics.notification(HapticNotificationStyle.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.tone ??
        contentAccent(widget.accent, Theme.of(context).brightness);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: t.iconCircleBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: t.surfaceBorder),
      ),
      child: Row(children: [
        Icon(widget.icon, size: 18, color: t.iconCircleFg),
        const SizedBox(width: 10),
        Expanded(
          child: Text(widget.message,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: context.brandInk)),
        ),
      ]),
    );
  }
}
