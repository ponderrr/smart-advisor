import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../models/feed_models.dart';
import '../feed_providers.dart';
import 'composer.dart';

/// Web URL for a post — used by Share + Copy link.
String _postUrl(String postId) => 'https://smartadvisor.live/feed/$postId';

/// Three-dot overflow for a feed post or comment.
///
/// On your own post: Edit · Share · Copy link · Delete.
/// On someone else's post: Share · Copy link · Report · Block.
/// On your own comment: Delete. On someone else's: Report · Block.
///
/// Pass [post] for a post menu or [commentId] for a comment menu.
/// Tap-propagation is stopped so the icon doesn't trigger an enclosing
/// tap target (e.g. a tappable post card behind it).
class BlockMenuButton extends ConsumerWidget {
  const BlockMenuButton({
    super.key,
    required this.authorId,
    required this.author,
    this.post,
    this.commentId,
    this.iconColor,
    this.iconSize = 18,
  });

  final String authorId;
  final String author;

  /// Set on a post menu — enables Edit / Share / Copy link / Delete.
  final FeedPost? post;

  /// Set on a comment menu — enables Delete (own) / Report.
  final String? commentId;
  final Color? iconColor;
  final double iconSize;

  Future<void> _confirmReport(
      BuildContext context, WidgetRef ref) async {
    await AdaptiveAlertDialog.show(
      context: context,
      title: 'Report this ${post != null ? 'post' : 'comment'}?',
      message: 'Our team will take a look. Thanks for helping keep '
          'the feed friendly.',
      icon: Icons.flag_outlined,
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Report',
          style: AlertActionStyle.destructive,
          onPressed: () async {
            final actions = ref.read(feedActionsProvider);
            try {
              if (post != null) {
                await actions.reportPost(post!.id);
              } else if (commentId != null) {
                await actions.reportComment(commentId!);
              }
              showBanner('Thanks — we’ll take a look.',
                  type: AdaptiveSnackBarType.success);
            } catch (_) {
              showBanner('Couldn’t send that report. Please try again.',
                  type: AdaptiveSnackBarType.error);
            }
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (authorId.isEmpty) return const SizedBox.shrink();
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    final isOwn = authorId == me;

    return GestureDetector(
      onTap: () {},
      behavior: HitTestBehavior.opaque,
      child: PopupMenuButton<String>(
        tooltip: 'More',
        padding: EdgeInsets.zero,
        offset: const Offset(0, 28),
        icon: Icon(Icons.more_horiz, size: iconSize, color: iconColor),
        onSelected: (action) async {
          switch (action) {
            case 'edit':
              showModalBottomSheet<void>(
                context: context,
                backgroundColor: Colors.transparent,
                isScrollControlled: true,
                builder: (_) => Composer(
                    initialCommunity: post!.community, editPost: post),
              );
            case 'share':
              await SharePlus.instance.share(ShareParams(
                  text: '${post!.title} — ${_postUrl(post!.id)}'));
            case 'copy':
              await Clipboard.setData(
                  ClipboardData(text: _postUrl(post!.id)));
              showBanner('Link copied',
                  type: AdaptiveSnackBarType.success);
            case 'delete':
              if (post != null) {
                await ref.read(feedActionsProvider).deletePost(post!.id);
                showBanner('Post deleted');
              } else if (commentId != null) {
                await ref
                    .read(feedActionsProvider)
                    .deleteComment(commentId!);
                showBanner('Comment deleted');
              }
            case 'report':
              if (context.mounted) await _confirmReport(context, ref);
            case 'block':
              await ref.read(feedActionsProvider).block(authorId);
              showBanner('Blocked @$author.');
          }
        },
        itemBuilder: (_) => [
          if (post != null) ...[
            if (isOwn)
              _item('edit', Icons.edit_outlined, 'Edit post'),
            _item('share', Icons.ios_share, 'Share'),
            _item('copy', Icons.link, 'Copy link'),
          ],
          if (isOwn && (post != null || commentId != null))
            _item('delete', Icons.delete_outline,
                post != null ? 'Delete post' : 'Delete comment',
                danger: true)
          else if (!isOwn) ...[
            _item('report', Icons.flag_outlined, 'Report', danger: true),
            _item('block', Icons.block, 'Block @$author', danger: true),
          ],
        ],
      ),
    );
  }

  PopupMenuItem<String> _item(String value, IconData icon, String label,
      {bool danger = false}) {
    return PopupMenuItem<String>(
      value: value,
      child: Row(children: [
        Icon(icon,
            size: 16, color: danger ? Colors.redAccent : null),
        const SizedBox(width: 8),
        Text(label),
      ]),
    );
  }
}
