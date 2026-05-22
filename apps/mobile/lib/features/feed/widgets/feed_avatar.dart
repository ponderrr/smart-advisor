import 'package:flutter/material.dart';

import '../../../ui/ui.dart';

/// Deterministic, backend-free avatar for feed authors — a port of the web
/// `feed-avatar.tsx`. Seed authors have no uploaded image, so we render
/// initials on a hue picked by hashing the name (stable per person). Pass
/// [url] to use a real picture when one exists.
class FeedAvatar extends StatelessWidget {
  const FeedAvatar({
    super.key,
    required this.name,
    this.url,
    this.size = 32,
    this.semanticLabel,
  });

  final String name;
  final String? url;
  final double size;

  /// Accessible label for screen readers. Defaults to the author's name so
  /// the avatar isn't announced as a bare image.
  final String? semanticLabel;

  /// Same six hues + order as the web PALETTE. Each entry is a single base
  /// hue; the tinted background and readable initials colour are derived
  /// per theme (mirrors the web `bg-x-500/15 text-x-700 dark:...` recipe).
  static const _palette = <Color>[
    Tw.violet500,
    Tw.indigo500,
    Tw.rose500,
    Tw.amber500,
    Tw.emerald500,
    Tw.pink500,
  ];

  static int _hueIndex(String name) {
    var h = 0;
    for (var i = 0; i < name.length; i += 1) {
      h = (h * 31 + name.codeUnitAt(i)) & 0xFFFFFFFF;
    }
    return h % _palette.length;
  }

  static String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      final p = parts[0];
      return (p.length >= 2 ? p.substring(0, 2) : p).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final label = semanticLabel ?? name;
    if (url != null && url!.trim().isNotEmpty) {
      return Semantics(
        image: true,
        label: label,
        child: ClipOval(
          child: Image.network(
            url!,
            width: size,
            height: size,
            fit: BoxFit.cover,
            // Decode at display size × pixel ratio, not full resolution.
            cacheWidth:
                (size * MediaQuery.devicePixelRatioOf(context)).ceil(),
            errorBuilder: (_, _, _) => _initialsBox(context),
          ),
        ),
      );
    }
    return Semantics(
      image: true,
      label: label,
      child: _initialsBox(context),
    );
  }

  Widget _initialsBox(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final base = _palette[_hueIndex(name)];
    final hsl = HSLColor.fromColor(base);
    // bg-x-500/15 (light) / dark:bg-x-400/20 — a soft tint of the hue.
    final bg = base.withValues(alpha: dark ? 0.20 : 0.15);
    // text-x-700 (light) / dark:text-x-200 — readable on the tint.
    final fg = (dark
            ? hsl.withLightness((hsl.lightness + 0.32).clamp(0.0, 1.0))
            : hsl.withLightness((hsl.lightness - 0.22).clamp(0.0, 1.0)))
        .toColor();
    final fontSize = size <= 24
        ? 10.0
        : size <= 36
            ? 12.0
            : 14.0;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Text(
        _initials(name),
        style: TextStyle(
            fontSize: fontSize, fontWeight: FontWeight.w900, color: fg),
      ),
    );
  }
}
