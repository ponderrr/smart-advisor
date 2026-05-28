import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/tailwind_palette.dart';

/// Outlined text field with a floating label, used by the auth screens.
///
/// AdaptiveTextField is the default everywhere else — this one exists for
/// the auth surfaces where the form *is* the page and a more modern, brand-
/// styled input reads better than the platform default. Material's
/// floating-label outlined `TextField` underneath, restyled to the brand
/// palette so it looks the same on Android and iOS.
class BrandTextField extends StatefulWidget {
  const BrandTextField({
    super.key,
    required this.label,
    this.controller,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.suffixIcon,
    this.autofillHints,
    this.onSubmitted,
    this.textCapitalization = TextCapitalization.none,
    this.autofocus = false,
    this.enabled = true,
  });

  final String label;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;

  /// When true a built-in eye toggle is added as the suffix.
  final bool obscureText;

  /// Custom suffix; ignored if [obscureText] is true (the eye toggle wins).
  final Widget? suffixIcon;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;
  final TextCapitalization textCapitalization;
  final bool autofocus;
  final bool enabled;

  @override
  State<BrandTextField> createState() => _BrandTextFieldState();
}

class _BrandTextFieldState extends State<BrandTextField> {
  bool _hidden = true;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final fg = dark ? Tw.slate100 : Tw.slate900;
    final muted = dark ? Tw.slate400 : Tw.slate600;
    final border = dark
        ? Tw.slate100.withValues(alpha: .12)
        : Tw.slate900.withValues(alpha: .12);
    final fill = dark
        ? Tw.slate900.withValues(alpha: .55)
        : Tw.white.withValues(alpha: .85);
    final accent = dark ? Tw.violet400 : Tw.violet500;

    Widget? suffix = widget.suffixIcon;
    if (widget.obscureText) {
      suffix = IconButton(
        icon: Icon(
          _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
          size: 20,
          color: muted,
        ),
        splashRadius: 20,
        onPressed: () => setState(() => _hidden = !_hidden),
      );
    }

    return TextField(
      controller: widget.controller,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      textCapitalization: widget.textCapitalization,
      obscureText: widget.obscureText && _hidden,
      autofillHints: widget.autofillHints,
      onSubmitted: widget.onSubmitted,
      autofocus: widget.autofocus,
      enabled: widget.enabled,
      style: TextStyle(fontSize: 15, color: fg, fontWeight: FontWeight.w500),
      cursorColor: accent,
      decoration: InputDecoration(
        labelText: widget.label,
        labelStyle: TextStyle(color: muted, fontSize: 15),
        floatingLabelStyle:
            TextStyle(color: accent, fontWeight: FontWeight.w700),
        floatingLabelBehavior: FloatingLabelBehavior.auto,
        filled: true,
        fillColor: fill,
        suffixIcon: suffix,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg + 4),
          borderSide: BorderSide(color: border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg + 4),
          borderSide: BorderSide(color: border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg + 4),
          borderSide: BorderSide(color: accent, width: 1.6),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg + 4),
          borderSide: BorderSide(color: border.withValues(alpha: .6), width: 1),
        ),
      ),
    );
  }
}
