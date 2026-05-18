import 'package:flutter/painting.dart';

/// shadcn HSL token: "H S% L%" → Color (alpha 1). Keeps the web globals.css
/// values verbatim so light/dark match exactly.
Color _h(double h, double s, double l) =>
    HSLColor.fromAHSL(1, h, s / 100, l / 100).toColor();

/// Semantic color tokens, ported verbatim from src/app/globals.css
/// (`:root` = light, `.dark` = dark).
class AppColors {
  const AppColors({
    required this.background,
    required this.foreground,
    required this.card,
    required this.cardForeground,
    required this.popover,
    required this.popoverForeground,
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.accent,
    required this.accentForeground,
    required this.destructive,
    required this.destructiveForeground,
    required this.border,
    required this.input,
    required this.ring,
  });

  final Color background;
  final Color foreground;
  final Color card;
  final Color cardForeground;
  final Color popover;
  final Color popoverForeground;
  final Color primary;
  final Color primaryForeground;
  final Color secondary;
  final Color secondaryForeground;
  final Color muted;
  final Color mutedForeground;
  final Color accent;
  final Color accentForeground;
  final Color destructive;
  final Color destructiveForeground;
  final Color border;
  final Color input;
  final Color ring;

  static final AppColors light = AppColors(
    background: _h(0, 0, 100),
    foreground: _h(222.2, 84, 4.9),
    card: _h(0, 0, 100),
    cardForeground: _h(222.2, 84, 4.9),
    popover: _h(0, 0, 100),
    popoverForeground: _h(222.2, 84, 4.9),
    primary: _h(222.2, 47.4, 11.2),
    primaryForeground: _h(210, 40, 98),
    secondary: _h(210, 40, 96.1),
    secondaryForeground: _h(222.2, 47.4, 11.2),
    muted: _h(210, 40, 96.1),
    mutedForeground: _h(215.4, 16.3, 46.9),
    accent: _h(210, 40, 96.1),
    accentForeground: _h(222.2, 47.4, 11.2),
    destructive: _h(0, 84.2, 60.2),
    destructiveForeground: _h(210, 40, 98),
    border: _h(214.3, 31.8, 91.4),
    input: _h(214.3, 31.8, 91.4),
    ring: _h(222.2, 84, 4.9),
  );

  static final AppColors dark = AppColors(
    background: _h(222.2, 84, 4.9),
    foreground: _h(210, 40, 98),
    card: _h(222.2, 84, 4.9),
    cardForeground: _h(210, 40, 98),
    popover: _h(222.2, 84, 4.9),
    popoverForeground: _h(210, 40, 98),
    primary: _h(210, 40, 98),
    primaryForeground: _h(222.2, 47.4, 11.2),
    secondary: _h(217.2, 32.6, 17.5),
    secondaryForeground: _h(210, 40, 98),
    muted: _h(217.2, 32.6, 17.5),
    mutedForeground: _h(215, 20.2, 65.1),
    accent: _h(217.2, 32.6, 17.5),
    accentForeground: _h(210, 40, 98),
    destructive: _h(0, 62.8, 30.6),
    destructiveForeground: _h(210, 40, 98),
    border: _h(217.2, 32.6, 17.5),
    input: _h(217.2, 32.6, 17.5),
    ring: _h(212.7, 26.8, 83.9),
  );

  /// OLED: true-black base, near-black elevated surfaces, bright text.
  static final AppColors amoled = AppColors(
    background: _h(0, 0, 0),
    foreground: _h(210, 40, 98),
    card: _h(0, 0, 0),
    cardForeground: _h(210, 40, 98),
    popover: _h(0, 0, 4),
    popoverForeground: _h(210, 40, 98),
    primary: _h(210, 40, 98),
    primaryForeground: _h(222.2, 47.4, 11.2),
    secondary: _h(0, 0, 9),
    secondaryForeground: _h(210, 40, 98),
    muted: _h(0, 0, 9),
    mutedForeground: _h(215, 20.2, 65.1),
    accent: _h(0, 0, 12),
    accentForeground: _h(210, 40, 98),
    destructive: _h(0, 62.8, 30.6),
    destructiveForeground: _h(210, 40, 98),
    border: _h(0, 0, 15),
    input: _h(0, 0, 15),
    ring: _h(212.7, 26.8, 83.9),
  );
}

/// `--radius: 0.5rem` (8px) and the md/sm derivations from tailwind.config.ts.
class AppRadius {
  const AppRadius._();
  static const double lg = 8;
  static const double md = 6;
  static const double sm = 4;
}
