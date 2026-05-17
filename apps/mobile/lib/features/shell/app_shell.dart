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
    final c = context.colors;
    final profile = ref.watch(currentProfileProvider).asData?.value;
    final bg = brandBg(Theme.of(context).brightness);

    return Scaffold(
      backgroundColor: bg,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(54),
        child: SafeArea(
          bottom: false,
          child: Container(
            height: 54,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: bg,
              border: Border(bottom: BorderSide(color: c.border)),
            ),
            child: Row(children: [
              const BrandHeading('Smart Advisor', size: 18),
              const Spacer(),
              PopupMenuButton<String>(
                offset: const Offset(0, 44),
                onSelected: (v) {
                  if (v == 'account') context.go('/account');
                  if (v == 'wrapped') context.push('/wrapped');
                  if (v == 'signout') {
                    ref.read(authServiceProvider).signOut();
                    context.go('/auth');
                  }
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'account', child: Text('Profile')),
                  PopupMenuItem(
                      value: 'wrapped', child: Text('Your Wrapped')),
                  PopupMenuItem(value: 'signout', child: Text('Sign out')),
                ],
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: c.muted,
                  backgroundImage: profile?.avatarUrl != null
                      ? NetworkImage(profile!.avatarUrl!)
                      : null,
                  child: profile?.avatarUrl == null
                      ? Icon(Icons.person,
                          size: 18, color: c.mutedForeground)
                      : null,
                ),
              ),
            ]),
          ),
        ),
      ),
      body: child,
      floatingActionButtonLocation:
          FloatingActionButtonLocation.centerDocked,
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
      bottomNavigationBar: _BottomNav(
        tabs: _tabs,
        index: _index,
        avatarUrl: profile?.avatarUrl,
        onTap: (i) => context.go(_tabs[i].path),
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.tabs,
    required this.index,
    required this.avatarUrl,
    required this.onTap,
  });

  final List<({String path, String label, IconData icon, IconData sel})>
      tabs;
  final int index;
  final String? avatarUrl;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // 4 tabs split around a center notch for the FAB.
    Widget slot(int i) {
      final t = tabs[i];
      final active = i == index;
      final color = active ? Tw.indigo500 : c.mutedForeground;
      final isProfile = t.path == '/account';
      return Expanded(
        child: InkWell(
          onTap: () => onTap(i),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (isProfile)
                CircleAvatar(
                  radius: 11,
                  backgroundColor: c.muted,
                  backgroundImage: avatarUrl != null
                      ? NetworkImage(avatarUrl!)
                      : null,
                  child: avatarUrl == null
                      ? Icon(active ? t.sel : t.icon,
                          size: 13, color: color)
                      : null,
                )
              else
                Icon(active ? t.sel : t.icon, size: 22, color: color),
              const SizedBox(height: 3),
              Text(t.label,
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight:
                          active ? FontWeight.w700 : FontWeight.w500,
                      color: color)),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: c.background,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(children: [
            slot(0),
            slot(1),
            const SizedBox(width: 64), // FAB notch
            slot(2),
            slot(3),
          ]),
        ),
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
