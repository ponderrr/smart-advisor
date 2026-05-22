import 'package:flutter/widgets.dart';
import 'package:adaptive_platform_ui/adaptive_platform_ui.dart' as a;

/// App-wide [a.AdaptiveButton] wrapper. Same API as the package widget,
/// but the visual style defaults to (and forces) [AdaptiveButtonStyle.tinted]
/// — a muted tonal fill — instead of the package's bright `filled`. So every
/// button across the app reads as muted and consistent; a call site can
/// still opt into `bordered` / `plain` / `gray` / `glass` explicitly.
///
/// Swapped in for the package widget via `lib/ui/adaptive.dart`, so no call
/// site needs to change.
class AdaptiveButton extends StatelessWidget {
  const AdaptiveButton({
    super.key,
    required this.onPressed,
    required this.label,
    this.color,
    this.textColor,
    this.style,
    this.size = a.AdaptiveButtonSize.medium,
    this.padding,
    this.borderRadius,
    this.minSize,
    this.enabled = true,
    this.useSmoothRectangleBorder = true,
    this.useNative = true,
  })  : child = null,
        icon = null,
        iconColor = null,
        sfSymbol = null,
        _kind = _Kind.label;

  const AdaptiveButton.child({
    super.key,
    required this.onPressed,
    required this.child,
    this.color,
    this.style,
    this.size = a.AdaptiveButtonSize.medium,
    this.padding,
    this.borderRadius,
    this.minSize,
    this.enabled = true,
    this.useSmoothRectangleBorder = true,
    this.useNative = true,
  })  : label = null,
        textColor = null,
        icon = null,
        iconColor = null,
        sfSymbol = null,
        _kind = _Kind.child;

  const AdaptiveButton.icon({
    super.key,
    required this.onPressed,
    required this.icon,
    this.color,
    this.iconColor,
    this.style,
    this.size = a.AdaptiveButtonSize.medium,
    this.padding,
    this.borderRadius,
    this.minSize,
    this.enabled = true,
    this.useSmoothRectangleBorder = true,
    this.useNative = true,
  })  : label = null,
        textColor = null,
        child = null,
        sfSymbol = null,
        _kind = _Kind.icon;

  const AdaptiveButton.sfSymbol({
    super.key,
    required this.onPressed,
    required this.sfSymbol,
    this.color,
    this.style,
    this.size = a.AdaptiveButtonSize.medium,
    this.padding,
    this.borderRadius,
    this.minSize,
    this.enabled = true,
    this.useSmoothRectangleBorder = true,
    this.useNative = true,
  })  : label = null,
        textColor = null,
        child = null,
        icon = null,
        iconColor = null,
        _kind = _Kind.sfSymbol;

  final VoidCallback? onPressed;
  final String? label;
  final Widget? child;
  final IconData? icon;
  final a.SFSymbol? sfSymbol;
  final Color? color;
  final Color? textColor;
  final Color? iconColor;
  final a.AdaptiveButtonStyle? style;
  final a.AdaptiveButtonSize size;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final Size? minSize;
  final bool enabled;
  final bool useSmoothRectangleBorder;
  final bool useNative;
  final _Kind _kind;

  /// Muted by default: an unset style — and an explicit `filled` — both
  /// resolve to `tinted` so no button renders as a bright solid fill.
  a.AdaptiveButtonStyle get _style =>
      (style == null || style == a.AdaptiveButtonStyle.filled)
          ? a.AdaptiveButtonStyle.tinted
          : style!;

  @override
  Widget build(BuildContext context) {
    switch (_kind) {
      case _Kind.label:
        return a.AdaptiveButton(
          onPressed: onPressed,
          label: label!,
          color: color,
          textColor: textColor,
          style: _style,
          size: size,
          padding: padding,
          borderRadius: borderRadius,
          minSize: minSize,
          enabled: enabled,
          useSmoothRectangleBorder: useSmoothRectangleBorder,
          useNative: useNative,
        );
      case _Kind.child:
        return a.AdaptiveButton.child(
          onPressed: onPressed,
          color: color,
          style: _style,
          size: size,
          padding: padding,
          borderRadius: borderRadius,
          minSize: minSize,
          enabled: enabled,
          useSmoothRectangleBorder: useSmoothRectangleBorder,
          useNative: useNative,
          child: child!,
        );
      case _Kind.icon:
        return a.AdaptiveButton.icon(
          onPressed: onPressed,
          icon: icon!,
          color: color,
          iconColor: iconColor,
          style: _style,
          size: size,
          padding: padding,
          borderRadius: borderRadius,
          minSize: minSize,
          enabled: enabled,
          useSmoothRectangleBorder: useSmoothRectangleBorder,
          useNative: useNative,
        );
      case _Kind.sfSymbol:
        return a.AdaptiveButton.sfSymbol(
          onPressed: onPressed,
          sfSymbol: sfSymbol!,
          color: color,
          // sfSymbol's own default is `glass`; keep that when unset.
          style: style ?? a.AdaptiveButtonStyle.glass,
          size: size,
          padding: padding,
          borderRadius: borderRadius,
          minSize: minSize,
          enabled: enabled,
          useSmoothRectangleBorder: useSmoothRectangleBorder,
          useNative: useNative,
        );
    }
  }
}

enum _Kind { label, child, icon, sfSymbol }
