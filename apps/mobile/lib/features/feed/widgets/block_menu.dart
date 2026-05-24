import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../models/feed_models.dart';
import '../feed_providers.dart';
import 'composer.dart';
import 'send_pick_sheet.dart';

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

  /// Two-tap block: tapping "Block" from the overflow menu opens a
  /// confirm dialog (Cancel / Block @author) before the mutation runs.
  /// The motivation is symmetry with unblocking — unblock is one tap
  /// from Settings, but blocking is a destructive change to what the
  /// user sees, so we don't want it triggered by a misfired tap.
  Future<void> _confirmBlock(BuildContext context, WidgetRef ref) async {
    await AdaptiveAlertDialog.show(
      context: context,
      title: 'Block @$author?',
      message: "You won't see their posts or comments anymore. You "
          'can unblock them from Settings → Feed → Blocked people.',
      icon: Icons.block,
      actions: [
        AlertAction(
            title: 'Cancel',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Block',
          style: AlertActionStyle.destructive,
          onPressed: () async {
            await ref.read(feedActionsProvider).block(authorId);
            showBanner('Blocked @$author.');
          },
        ),
      ],
    );
  }

  /// Open the dedicated report screen — supersedes the old inline
  /// confirm dialog so the reporter can pick a reason category and
  /// add an optional note. Carries the target author through so the
  /// report screen can offer an "Also block @author" toggle without
  /// having to re-fetch it.
  void _openReportScreen(BuildContext context) {
    final qp = <String, String>{
      'postId': ?post?.id,
      'commentId': ?commentId,
      'authorId': authorId,
      'author': author,
    };
    final qs = qp.entries
        .map((e) =>
            '${e.key}=${Uri.encodeQueryComponent(e.value)}')
        .join('&');
    context.push('/feed/report?$qs');
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
          // Tactile feedback on any overflow-menu choice — the menu
          // is otherwise silent between the tap and the action firing.
          Haptics.selection();
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
            case 'send_to_friend':
              if (context.mounted) {
                await showModalBottomSheet<void>(
                  context: context,
                  backgroundColor: Colors.transparent,
                  isScrollControlled: true,
                  builder: (_) => SendPickSheet(post: post!),
                );
              }
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
              if (context.mounted) _openReportScreen(context);
            case 'block':
              if (context.mounted) await _confirmBlock(context, ref);
          }
        },
        itemBuilder: (_) => [
          if (post != null) ...[
            if (isOwn)
              _item('edit', Icons.edit_outlined, 'Edit post'),
            _item('share', Icons.ios_share, 'Share'),
            _item('send_to_friend', Icons.send_outlined,
                'Send to a friend'),
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
