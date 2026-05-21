import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../feed_providers.dart';

/// Three-dot overflow for a feed author. On content you own it offers
/// "Delete post" / "Delete comment"; on anyone else's it offers
/// "Block @name". Pass [postId] for a post menu or [commentId] for a
/// comment menu — that's what enables the delete affordance on your own.
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
    this.commentId,
    this.iconColor,
    this.iconSize = 18,
  });

  final String authorId;
  final String author;
  final String? postId;
  final String? postTitle;

  /// Set on a comment menu — enables "Delete comment" on your own comment.
  final String? commentId;
  final Color? iconColor;
  final double iconSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (authorId.isEmpty) return const SizedBox.shrink();
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    final isOwn = authorId == me;
    final canDeletePost = postId != null && isOwn;
    final canDeleteComment = commentId != null && isOwn;
    final canDelete = canDeletePost || canDeleteComment;
    // Your own content with no delete affordance — nothing to offer, so
    // render nothing.
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
          if (action == 'delete') {
            if (postId != null) {
              await ref.read(feedActionsProvider).deletePost(postId!);
              showBanner('Post deleted');
            } else if (commentId != null) {
              await ref
                  .read(feedActionsProvider)
                  .deleteComment(commentId!);
              showBanner('Comment deleted');
            }
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
                  Text(canDeletePost
                      ? 'Delete post'
                      : 'Delete comment'),
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
