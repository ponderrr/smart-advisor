/// Single import chokepoint for the adaptive_platform_ui package.
///
/// adaptive_platform_ui is pre-1.0 (0.1.x) and the project is adaptive-first
/// (native iOS 26 / Material 3 per platform). ALL app code must import the
/// adaptive widgets from here — never `package:adaptive_platform_ui/...`
/// directly — so any breaking API churn is contained to this one file.
library;

export 'package:adaptive_platform_ui/adaptive_platform_ui.dart';
