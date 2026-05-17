/// Design-system barrel.
///
/// Adaptive-first: controls come from [adaptive] (native iOS 26 / Material 3
/// per platform). What stays custom is brand-only — design tokens, theme,
/// the accent system, and the few widgets with no adaptive equivalent
/// (branded loader, state-machine button).
library;

export 'adaptive.dart';
export 'theme/accents.dart';
export 'theme/app_colors.dart';
export 'theme/app_theme.dart';
export 'theme/tailwind_palette.dart';
export 'widgets/app_loader.dart';
export 'widgets/stateful_button.dart';
