import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui_messenger.dart';
import '../feed_providers.dart';

/// Reusable three-dot overflow menu that surfaces the "Block @handle"
/// action. Drop this anywhere a feed author is visible (post header,
/// comment row, user profile) to expose blocking from that surface —
/// writes go to [blockedProvider] which the feed already filters
/// through.
///
/// Hides itself entirely for "you" so users can't block themselves.
/// Tap-propagation is stopped so the menu icon doesn't trigger an
/// enclosing tap target (e.g. a tappable post card behind it).
class BlockMenuButton extends ConsumerWidget {
  const BlockMenuButton({
    super.key,
    required this.author,
    this.iconColor,
    this.iconSize = 18,
  });

  final String author;
  final Color? iconColor;
  final double iconSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (author == 'you') return const SizedBox.shrink();
    return GestureDetector(
      onTap: () {},
      behavior: HitTestBehavior.opaque,
      child: PopupMenuButton<String>(
        tooltip: 'More',
        padding: EdgeInsets.zero,
        offset: const Offset(0, 28),
        icon: Icon(Icons.more_horiz, size: iconSize, color: iconColor),
        onSelected: (action) {
          if (action == 'block') {
            final blocked =
                ref.read(blockedProvider.notifier).block(author);
            showBanner(
              blocked
                  ? 'Blocked @$author.'
                  : '@$author is already blocked.',
            );
          }
        },
        itemBuilder: (_) => [
          PopupMenuItem<String>(
            value: 'block',
            child: Row(
              children: [
                const Icon(Icons.block, size: 16, color: Colors.redAccent),
                const SizedBox(width: 8),
                Text('Block @$author'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
