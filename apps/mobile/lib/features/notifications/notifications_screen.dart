import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';
import 'notifications_center.dart';

/// Per-type icon + accent for a notification card.
({IconData icon, Color color}) _typeStyle(AppNotificationType t) =>
    switch (t) {
      AppNotificationType.quiz =>
        (icon: Icons.psychology_alt, color: Tw.violet500),
      AppNotificationType.library =>
        (icon: Icons.bookmark_added, color: Tw.emerald500),
      AppNotificationType.feed =>
        (icon: Icons.forum, color: Tw.indigo500),
      AppNotificationType.reminder =>
        (icon: Icons.alarm, color: Tw.amber500),
      AppNotificationType.milestone =>
        (icon: Icons.emoji_events, color: Tw.rose500),
      AppNotificationType.system =>
        (icon: Icons.auto_awesome, color: Tw.slate500),
    };

/// Short relative age, e.g. "just now", "12m ago", "3d ago".
String _ago(DateTime t) {
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return 'just now';
  if (d.inMinutes < 60) return '${d.inMinutes}m ago';
  if (d.inHours < 24) return '${d.inHours}h ago';
  if (d.inDays < 7) return '${d.inDays}d ago';
  if (d.inDays < 365) return '${d.inDays ~/ 7}w ago';
  return '${d.inDays ~/ 365}y ago';
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  // When true, cards play a staggered slide-out before the list is emptied.
  bool _clearing = false;

  void _clearAll(int count) {
    if (_clearing) return;
    setState(() => _clearing = true);
    // Match the longest staggered exit: last card delay + its duration.
    final total = Duration(milliseconds: (count - 1) * 50 + 280);
    Future.delayed(total, () {
      if (!mounted) return;
      ref.read(notificationsCenterProvider.notifier).clear();
      setState(() => _clearing = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(notificationsCenterProvider);
    final unread = items.where((n) => !n.read).length;
    if (unread > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) =>
          ref.read(notificationsCenterProvider.notifier).markAllRead());
    }
    return BrandScaffold(
      title: 'Notifications',
      actions: [
        if (items.isNotEmpty)
          AdaptiveAppBarAction(
            title: 'Clear',
            icon: Icons.delete_outline,
            iosSymbol: 'trash',
            onPressed: () => _clearAll(items.length),
          ),
      ],
      body: items.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.notifications_none,
                        size: 40, color: context.brandMuted),
                    const SizedBox(height: 12),
                    Subtitle(
                        'You’re all caught up — no notifications.',
                        center: true),
                  ],
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Subtitle(items.length == 1
                      ? '1 notification'
                      : '${items.length} notifications'),
                ),
                for (final entry in items.asMap().entries)
                  _buildCard(context, entry.value)
                      .animate(target: _clearing ? 1 : 0)
                      .slideX(
                        delay: (entry.key * 50).ms,
                        duration: 280.ms,
                        begin: 0,
                        end: 1.05,
                        curve: Curves.easeInCubic,
                      )
                      .fadeOut(
                        delay: (entry.key * 50).ms,
                        duration: 240.ms,
                      ),
              ],
            ),
    );
  }

  Widget _buildCard(BuildContext context, AppNotification n) {
    final style = _typeStyle(n.type);
    return Dismissible(
      key: ValueKey(n.id),
      // Swipe left→right to clear a single notification.
      direction: DismissDirection.startToEnd,
      onDismissed: (_) =>
          ref.read(notificationsCenterProvider.notifier).remove(n.id),
      background: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 22),
        alignment: Alignment.centerLeft,
        decoration: BoxDecoration(
          color: context.colors.destructive,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: n.route == null
              ? null
              : () {
                  ref
                      .read(notificationsCenterProvider.notifier)
                      .markRead(n.id);
                  context.push(n.route!);
                },
          child: BrandCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type icon — a tinted circle so the inbox skims by kind.
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: style.color.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(style.icon, size: 19, color: style.color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(n.title,
                                style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: context.brandInk)),
                          ),
                          if (!n.read)
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(
                                  top: 5, left: 8),
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Tw.indigo500,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(n.body,
                          style: TextStyle(
                              fontSize: 13,
                              height: 1.35,
                              color: context.brandMuted)),
                      const SizedBox(height: 6),
                      Row(children: [
                        Text(_ago(n.createdAt),
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: context.brandMuted)),
                        if (n.route != null) ...[
                          const Spacer(),
                          Icon(Icons.chevron_right,
                              size: 16, color: context.brandMuted),
                        ],
                      ]),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
