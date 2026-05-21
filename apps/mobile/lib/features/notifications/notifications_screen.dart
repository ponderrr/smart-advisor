import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ui/ui.dart';
import 'notifications_center.dart';

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
    if (items.any((n) => !n.read)) {
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
                padding: const EdgeInsets.all(20),
                child: BrandCard(
                  child: Column(children: [
                    Icon(Icons.notifications_none,
                        size: 32, color: context.brandMuted),
                    const SizedBox(height: 10),
                    Subtitle('No notifications yet.', center: true),
                  ]),
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
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
        child: BrandCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 6, right: 12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: n.read ? Colors.transparent : Tw.indigo500,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.title,
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: context.brandInk)),
                    const SizedBox(height: 2),
                    Text(n.body,
                        style: TextStyle(
                            fontSize: 13, color: context.brandMuted)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
