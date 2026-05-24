import 'package:go_router/go_router.dart';
import 'package:quick_actions/quick_actions.dart';

/// Long-press app icon shortcuts: "Take a quiz", "Open feed",
/// "Group quiz". Wired once on app boot — taps route through
/// the existing GoRouter.
///
/// Icon assets: we deliberately omit per-shortcut icons so we don't
/// have to ship platform drawable / asset bundles. Both Android and
/// iOS fall back to a generic system icon, which is what the user
/// sees in the long-press menu.
class QuickActionsInit {
  QuickActionsInit._();

  static const _kQuiz = 'quiz';
  static const _kFeed = 'feed';
  static const _kGroup = 'group';

  static const _qa = QuickActions();

  /// Registers handlers + items. Safe to call after the router is
  /// available — taps fire `router.go(...)` directly.
  static Future<void> setup(GoRouter router) async {
    _qa.initialize((type) {
      switch (type) {
        case _kQuiz:
          router.go('/quiz');
        case _kFeed:
          router.go('/');
        case _kGroup:
          router.go('/group-quiz');
      }
    });
    await _qa.setShortcutItems(const [
      ShortcutItem(type: _kQuiz, localizedTitle: 'Take a quiz'),
      ShortcutItem(type: _kFeed, localizedTitle: 'Open feed'),
      ShortcutItem(type: _kGroup, localizedTitle: 'Group quiz'),
    ]);
  }
}
