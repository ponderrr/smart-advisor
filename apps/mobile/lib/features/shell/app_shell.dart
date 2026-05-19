import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';
import '../auth/auth_providers.dart';

/// App shell: native adaptive bottom bar (Feed · Library · Quiz · History ·
/// Profile). Feed is the home/landing surface; Quiz (center) opens the
/// Solo/Group sheet; Profile shows the account avatar.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child, required this.location});

  final Widget child;
  final String location;

  void _openQuizSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _QuizSheet(
        onSolo: () {
          Navigator.pop(ctx);
          // push (not go) so the shell stays mounted underneath and the
          // quiz pops back down on exit instead of replacing the stack.
          context.push('/quiz/solo');
        },
        onGroup: () {
          Navigator.pop(ctx);
          context.push('/group-quiz');
        },
        onSurprise: () {
          Navigator.pop(ctx);
          context.push('/quiz/surprise');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(currentProfileProvider).asData?.value;
    final bg = brandBg(Theme.of(context).brightness);

    // Native bottom bar. Quiz lives as the center nav item (opens the
    // Solo/Group sheet) instead of a floating button.
    const quizSlot = 2;
    int navIndexFromLocation() {
      if (location.startsWith('/library')) return 1;
      if (location.startsWith('/history')) return 3;
      if (location.startsWith('/account')) return 4;
      return 0; // '/' (Feed) and anything else
    }

    void onNav(int i) {
      if (i == quizSlot) {
        _openQuizSheet(context);
        return;
      }
      context.go(switch (i) {
        1 => '/library',
        3 => '/history',
        4 => '/account',
        _ => '/',
      });
    }

    // Tablet / wide: side NavigationRail + centered, max-width content.
    if (MediaQuery.sizeOf(context).width >= 720) {
      const labels = [
        'Feed',
        'Library',
        'Quiz',
        'History',
        'Profile'
      ];
      const icons = [
        Icons.forum_outlined,
        Icons.bookmark_border,
        Icons.auto_awesome,
        Icons.history,
        Icons.person_outline,
      ];
      return BrandScaffold(
        body: SafeArea(
          child: Row(
            children: [
              NavigationRail(
                backgroundColor: bg,
                selectedIndex: navIndexFromLocation(),
                onDestinationSelected: onNav,
                labelType: NavigationRailLabelType.all,
                destinations: [
                  for (var i = 0; i < labels.length; i++)
                    NavigationRailDestination(
                      icon: i == 4
                          ? _avatarIcon(context, profile?.avatarUrl, false)
                          : Icon(icons[i]),
                      label: Text(labels[i]),
                    ),
                ],
              ),
              Expanded(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 760),
                    child: child,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return AdaptiveScaffold(
      body: ColoredBox(
        color: bg,
        child: SafeArea(bottom: false, child: child),
      ),
      bottomNavigationBar: AdaptiveBottomNavigationBar(
        selectedIndex: navIndexFromLocation(),
        onTap: onNav,
        items: [
          const AdaptiveNavigationDestination(
              label: 'Feed', icon: Icon(Icons.forum_outlined)),
          const AdaptiveNavigationDestination(
              label: 'Library', icon: Icon(Icons.bookmark_border)),
          const AdaptiveNavigationDestination(
              label: 'Quiz', icon: Icon(Icons.auto_awesome)),
          const AdaptiveNavigationDestination(
              label: 'History', icon: Icon(Icons.history)),
          AdaptiveNavigationDestination(
            label: 'Profile',
            icon: _avatarIcon(context, profile?.avatarUrl, false),
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
  const _QuizSheet({
    required this.onSolo,
    required this.onGroup,
    required this.onSurprise,
  });
  final VoidCallback onSolo;
  final VoidCallback onGroup;
  final VoidCallback onSurprise;

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
        tile(ContentAccentName.amber, Icons.auto_awesome, 'Surprise me',
            'Skip the questions — one tap, one unexpected pick.',
            onSurprise),
      ]),
    );
  }
}
