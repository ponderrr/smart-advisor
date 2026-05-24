import 'dart:io';

import 'package:home_widget/home_widget.dart';

/// Bridge between the Flutter app and the Android home-screen widget
/// (`LatestPickWidgetProvider`). Writes a title + subtitle into shared
/// prefs and pings the widget so it re-renders. No-op on iOS — the
/// iOS Widget Extension target is a separate Xcode follow-up.
class WidgetData {
  WidgetData._();

  static const _androidWidget = 'LatestPickWidgetProvider';
  static const _qualifiedAndroidWidget =
      'live.smartadvisor.smart_advisor.widget.LatestPickWidgetProvider';

  /// Updates the latest-pick cell with [title] (bold, 2 lines max) and
  /// [subtitle] (muted, 1 line max). Keep both short — RemoteViews
  /// don't auto-shrink. Failures are swallowed: a widget update should
  /// never surface as an error in-app.
  static Future<void> pushLatestPick({
    required String title,
    String? subtitle,
  }) async {
    if (!Platform.isAndroid) return;
    try {
      await HomeWidget.saveWidgetData('latest_pick_title', title);
      await HomeWidget.saveWidgetData(
          'latest_pick_subtitle', subtitle ?? '');
      await HomeWidget.updateWidget(
        androidName: _androidWidget,
        qualifiedAndroidName: _qualifiedAndroidWidget,
      );
    } catch (_) {/* widget not installed / unsupported — ignore */}
  }
}
