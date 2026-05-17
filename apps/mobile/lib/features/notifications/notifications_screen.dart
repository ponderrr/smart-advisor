import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ui/ui.dart';
import 'notifications_center.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsCenterProvider);
    if (items.any((n) => !n.read)) {
      WidgetsBinding.instance.addPostFrameCallback((_) =>
          ref.read(notificationsCenterProvider.notifier).markAllRead());
    }
    return BrandScaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (items.isNotEmpty)
            TextButton(
              onPressed: () =>
                  ref.read(notificationsCenterProvider.notifier).clear(),
              child: const Text('Clear'),
            ),
        ],
      ),
      body: items.isEmpty
          ? Center(child: Subtitle('No notifications yet.'))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                for (final n in items)
                  BrandCard(
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
                            color: n.read
                                ? Colors.transparent
                                : Tw.indigo500,
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
                                      fontSize: 13,
                                      color: context.brandMuted)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}
