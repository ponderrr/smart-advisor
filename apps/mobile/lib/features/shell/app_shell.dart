import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';

/// Tab destinations for the authed app. Real screens land in P4/P5; these
/// are placeholders so navigation + the native shell can be exercised now.
const _tabs = [
  (path: '/', label: 'Home', icon: Icons.home_outlined, sel: Icons.home),
  (
    path: '/quiz',
    label: 'Quiz',
    icon: Icons.psychology_outlined,
    sel: Icons.psychology
  ),
  (
    path: '/library',
    label: 'Library',
    icon: Icons.video_library_outlined,
    sel: Icons.video_library
  ),
  (
    path: '/account',
    label: 'Account',
    icon: Icons.person_outline,
    sel: Icons.person
  ),
];

/// Adaptive shell: native iOS 26 tab bar / Material on Android via
/// AdaptiveScaffold. Responsive — a NavigationRail replaces the bottom bar
/// on wide screens (tablets), since adaptive_platform_ui themes widgets but
/// not layout.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, required this.location});

  final Widget child;
  final String location;

  int get _index {
    final i = _tabs.indexWhere((t) =>
        t.path == '/' ? location == '/' : location.startsWith(t.path));
    return i < 0 ? 0 : i;
  }

  void _go(BuildContext context, int i) => context.go(_tabs[i].path);

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 720;

    // The PWA renders every page on the slate-50/950 background; the tab
    // screens are plain lists, so the shell provides it here.
    final bg = brandBg(Theme.of(context).brightness);
    final tinted = Container(color: bg, child: child);

    if (wide) {
      return Scaffold(
        backgroundColor: bg,
        body: Row(
          children: [
            NavigationRail(
              backgroundColor: bg,
              selectedIndex: _index,
              onDestinationSelected: (i) => _go(context, i),
              labelType: NavigationRailLabelType.all,
              destinations: [
                for (final t in _tabs)
                  NavigationRailDestination(
                    icon: Icon(t.icon),
                    selectedIcon: Icon(t.sel),
                    label: Text(t.label),
                  ),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: tinted),
          ],
        ),
      );
    }

    return AdaptiveScaffold(
      body: tinted,
      bottomNavigationBar: AdaptiveBottomNavigationBar(
        selectedIndex: _index,
        onTap: (i) => _go(context, i),
        items: [
          for (final t in _tabs)
            AdaptiveNavigationDestination(
              icon: Icon(t.icon),
              selectedIcon: Icon(t.sel),
              label: t.label,
            ),
        ],
      ),
    );
  }
}

/// Placeholder tab body until the real feature screens land.
class PlaceholderTab extends StatelessWidget {
  const PlaceholderTab(this.title, {super.key});
  final String title;

  @override
  Widget build(BuildContext context) => Center(
        child: Text('$title — coming in a later phase',
            style: TextStyle(color: context.colors.mutedForeground)),
      );
}
