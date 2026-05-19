import 'package:flutter/material.dart';

import '../../../ui/ui.dart';

/// Shared layout helpers for the Settings hub and its sub-screens. These were
/// previously private methods on `_AccountScreenState`; extracted verbatim so
/// every relocated section keeps the exact same chrome (eyebrow section
/// headers, bold row labels, dividers, chevron rows) without duplicating the
/// code across the six sub-screens.

Widget settingsSection(BuildContext context, String t,
        {bool destructive = false}) =>
    Padding(
      padding: const EdgeInsets.fromLTRB(4, 22, 4, 8),
      child: Eyebrow(t,
          color: destructive ? context.colors.destructive : null),
    );

Widget settingsRowLabel(BuildContext context, String t) => Text(t,
    style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: context.colors.foreground));

Widget settingsDivider(BuildContext c) =>
    Divider(height: 28, color: c.colors.border);

Widget settingsTile(BuildContext context, IconData icon, String title,
    {String? subtitle, bool destructive = false, VoidCallback? onTap}) {
  final col =
      destructive ? context.colors.destructive : context.colors.foreground;
  return AdaptiveListTile(
    padding: EdgeInsets.zero,
    leading: Icon(icon, color: col),
    title: Text(title, style: TextStyle(color: col)),
    subtitle: subtitle == null ? null : Text(subtitle),
    trailing:
        Icon(Icons.chevron_right, color: context.colors.mutedForeground),
    onTap: onTap,
  );
}
