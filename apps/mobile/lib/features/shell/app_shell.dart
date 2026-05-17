import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';
import '../auth/auth_providers.dart';

/// Mirrors the web mobile PWA shell: a top bar (wordmark + avatar menu) and
/// a fixed bottom nav of 4 tabs around a raised center Quiz FAB that opens a
/// Solo/Group bottom sheet. adaptive_platform_ui still drives in-page
/// controls; the shell chrome is custom to match the PWA.
const _tabs = [
  (path: '/', label: 'Home', icon: Icons.dashboard_outlined,
      sel: Icons.dashboard),
  (path: '/library', label: 'Library', icon: Icons.bookmark_border,
      sel: Icons.bookmark),
  (path: '/history', label: 'History', icon: Icons.history,
      sel: Icons.history),
  (path: '/account', label: 'Profile', icon: Icons.person_outline,
      sel: Icons.person),
];

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child, required this.location});

  final Widget child;
  final String location;

  int get _index {
    final i = _tabs.indexWhere((t) =>
        t.path == '/' ? location == '/' : location.startsWith(t.path));
    return i < 0 ? 0 : i;
  }

  void _openQuizSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _QuizSheet(
        onSolo: () {
          Navigator.pop(ctx);
          context.go('/quiz/solo');
        },
        onGroup: () {
          Navigator.pop(ctx);
          context.go('/group-quiz');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    final bg = brandBg(Theme.of(context).brightness);

    return AdaptiveScaffold(
      body: ColoredBox(
        color: bg,
        child: SafeArea(bottom: false, child: child),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: bg, width: 4),
        ),
        child: FloatingActionButton(
          onPressed: () => _openQuizSheet(context),
          backgroundColor: Tw.indigo500,
          elevation: 4,
          shape: const CircleBorder(),
          child: const Icon(Icons.auto_awesome, color: Colors.white),
        ),
      ),
      bottomNavigationBar: AdaptiveBottomNavigationBar(
        selectedIndex: _index,
        onTap: (i) => context.go(_tabs[i].path),
        items: [
          for (final t in _tabs)
            AdaptiveNavigationDestination(
              label: t.label,
              icon: t.path == '/account'
                  ? _avatarIcon(context, profile?.avatarUrl, false)
                  : Icon(t.icon),
              selectedIcon: t.path == '/account'
                  ? _avatarIcon(context, profile?.avatarUrl, true)
                  : Icon(t.sel),
            ),
        ],
      ),
    );
  }

  Widget _avatarIcon(BuildContext context, String? url, bool selected) {
    final c = context.colors;
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
            color: selected ? Tw.indigo500 : Colors.transparent,
            width: 2),
      ),
      child: CircleAvatar(
        radius: 12,
        backgroundColor: c.muted,
        backgroundImage: url != null ? NetworkImage(url) : null,
        child: url == null
            ? Icon(Icons.person, size: 14, color: c.mutedForeground)
            : null,
      ),
    );
  }
}

class _QuizSheet extends StatelessWidget {
  const _QuizSheet({required this.onSolo, required this.onGroup});
  final VoidCallback onSolo;
  final VoidCallback onGroup;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    Widget tile(ContentAccentName a, IconData icon, String title,
        String body, VoidCallback onTap) {
      final tone = contentAccent(a, Theme.of(context).brightness);
      return GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: tone.surfaceGradient),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: tone.surfaceBorder),
          ),
          child: Row(children: [
            CircleAvatar(
                radius: 22,
                backgroundColor: tone.iconCircleBg,
                child: Icon(icon, color: tone.iconCircleFg)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: context.brandInk)),
                  Text(body,
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
                ],
              ),
            ),
          ]),
        ),
      );
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        color: brandBg(Theme.of(context).brightness),
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 44,
          height: 4,
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
              color: c.border,
              borderRadius: BorderRadius.circular(999)),
        ),
        const Align(
            alignment: Alignment.centerLeft,
            child: BrandHeading('Start a quiz', size: 20)),
        const SizedBox(height: 14),
        tile(ContentAccentName.violet, Icons.person_outline, 'Solo Quiz',
            'A short personality quiz, just for you.', onSolo),
        tile(ContentAccentName.rose, Icons.groups_outlined, 'Group Quiz',
            'Take it together with friends in a shared room.', onGroup),
      ]),
    );
  }
}
