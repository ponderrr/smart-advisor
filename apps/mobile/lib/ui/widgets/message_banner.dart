import 'package:flutter/material.dart';

import '../theme/accents.dart';
import 'brand.dart';

/// Inline notice styled like the "Clear all" affordance (tinted surface +
/// border + icon), color-coded to a content accent so it matches the
/// surrounding screen. Pass an explicit [tone] (when a screen already has
/// one) or just an [accent] name; defaults to violet for generic use.
class MessageBanner extends StatelessWidget {
  const MessageBanner({
    super.key,
    required this.message,
    this.tone,
    this.accent = ContentAccentName.violet,
    this.icon = Icons.info_outline,
  });

  /// Convenience for error states: rose accent + an error icon.
  const MessageBanner.error(this.message, {super.key})
      : tone = null,
        accent = ContentAccentName.rose,
        icon = Icons.error_outline;

  final String message;
  final ContentAccentTone? tone;
  final ContentAccentName accent;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final t =
        tone ?? contentAccent(accent, Theme.of(context).brightness);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: t.iconCircleBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: t.surfaceBorder),
      ),
      child: Row(children: [
        Icon(icon, size: 18, color: t.iconCircleFg),
        const SizedBox(width: 10),
        Expanded(
          child: Text(message,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: context.brandInk)),
        ),
      ]),
    );
  }
}
