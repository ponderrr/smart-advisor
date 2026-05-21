import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../feed_providers.dart';

/// Three-dot overflow for a feed author. On a post you own it offers
/// "Delete post"; on anyone else's post/comment it offers "Block @name".
/// Pass [postId] to mark this as a post menu (enables delete on your own
/// posts). Without it the menu is comment-scoped (block only).
///
/// Tap-propagation is stopped so the icon doesn't trigger an enclosing
/// tap target (e.g. a tappable post card behind it).
class BlockMenuButton extends ConsumerWidget {
  const BlockMenuButton({
    super.key,
    required this.authorId,
    required this.author,
    this.postId,
    this.postTitle,
    this.iconColor,
    this.iconSize = 18,
  });

  final String authorId;
  final String author;
  final String? postId;
  final String? postTitle;
  final Color? iconColor;
  final double iconSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (authorId.isEmpty) return const SizedBox.shrink();
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    final isOwn = authorId == me;
    final canDelete = postId != null && isOwn;
    // Your own comment / your own post with no delete affordance — nothing
    // to offer, so render nothing.
    if (isOwn && !canDelete) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {},
      behavior: HitTestBehavior.opaque,
      child: PopupMenuButton<String>(
        tooltip: 'More',
        padding: EdgeInsets.zero,
        offset: const Offset(0, 28),
        icon: Icon(Icons.more_horiz, size: iconSize, color: iconColor),
        onSelected: (action) async {
          if (action == 'delete' && postId != null) {
            await ref.read(feedActionsProvider).deletePost(postId!);
            showBanner('Post deleted');
          } else if (action == 'block') {
            await ref.read(feedActionsProvider).block(authorId);
            showBanner('Blocked @$author.');
          }
        },
        itemBuilder: (_) => [
          if (canDelete)
            PopupMenuItem<String>(
              value: 'delete',
              child: Row(
                children: [
                  const Icon(Icons.delete_outline,
                      size: 16, color: Colors.redAccent),
                  const SizedBox(width: 8),
                  const Text('Delete post'),
                ],
              ),
            )
          else
            PopupMenuItem<String>(
              value: 'block',
              child: Row(
                children: [
                  const Icon(Icons.block,
                      size: 16, color: Colors.redAccent),
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
