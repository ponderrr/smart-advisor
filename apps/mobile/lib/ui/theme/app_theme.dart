import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Exposes the shadcn semantic tokens to widgets via
/// `Theme.of(context).extension<AppColorsExt>()`.
@immutable
class AppColorsExt extends ThemeExtension<AppColorsExt> {
  const AppColorsExt(this.c);
  final AppColors c;

  @override
  AppColorsExt copyWith({AppColors? c}) => AppColorsExt(c ?? this.c);

  @override
  AppColorsExt lerp(ThemeExtension<AppColorsExt>? other, double t) =>
      (other is AppColorsExt && t > 0.5) ? other : this;
}

extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColorsExt>()!.c;
}

class AppTheme {
  const AppTheme._();

  static ThemeData light() => _build(AppColors.light, Brightness.light);

  /// [amoled] swaps the dark palette for the true-black OLED variant.
  static ThemeData dark({bool amoled = false}) =>
      _build(amoled ? AppColors.amoled : AppColors.dark,
          Brightness.dark);

  static ThemeData _build(AppColors c, Brightness b) {
    final scheme = ColorScheme(
      brightness: b,
      primary: c.primary,
      onPrimary: c.primaryForeground,
      secondary: c.secondary,
      onSecondary: c.secondaryForeground,
      error: c.destructive,
      onError: c.destructiveForeground,
      surface: c.card,
      onSurface: c.cardForeground,
      outline: c.border,
    );

    final base = b == Brightness.dark ? ThemeData.dark() : ThemeData.light();
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      dividerColor: c.border,
      // Brand font is Inter. Applied as the family with a graceful system
      // fallback; the actual Inter files are bundled as an asset in Phase 7
      // (no runtime font fetching — avoids FOUT / offline failure).
      textTheme: base.textTheme.apply(
        fontFamily: 'Inter',
        bodyColor: c.foreground,
        displayColor: c.foreground,
      ),
      extensions: <ThemeExtension<dynamic>>[AppColorsExt(c)],
    );
  }
}
