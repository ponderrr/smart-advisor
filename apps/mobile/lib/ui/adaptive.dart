/// Single import chokepoint for adaptive_platform_ui (pre-1.0 — churn
/// contained to this file). All app code imports Adaptive* from here.
library;

// AdaptiveButton is hidden and replaced by the app wrapper, which mutes
// the default style app-wide (tinted instead of bright filled).
export 'package:adaptive_platform_ui/adaptive_platform_ui.dart'
    hide AdaptiveButton;
export 'widgets/adaptive_button.dart';
