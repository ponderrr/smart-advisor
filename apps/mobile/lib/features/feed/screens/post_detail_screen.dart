import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import '../widgets/feed_avatar.dart';
import '../widgets/feed_cards.dart';
import '../widgets/follow_button.dart';

/// Reddit-style thread page — a full page on the persistent shell (not a
/// modal). Faithful port of the web `src/app/feed/[id]/page.tsx`:
/// nested comments with collapse, inline reply, per-comment vote, sort from
/// the feed prefs, a FollowButton on the post header, and a graceful
/// "This post isn't available" state for cold deep-links (in-memory store).
class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.postId});
  final String postId;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submitTopLevel() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    ref
        .read(feedProvider.notifier)
        .addComment(widget.postId, text, parentId: null);
    _ctrl.clear();
    FocusScope.of(context).unfocus();
    showBanner('Comment added',
        type: AdaptiveSnackBarType.success,
        duration: const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    final matches =
        ref.watch(feedProvider).where((p) => p.id == widget.postId);

    if (matches.isEmpty) return _unavailable(context);

    final post = matches.first;
    final tone =
        contentAccent(post.community.accent, Theme.of(context).brightness);
    final tree = ref.watch(commentTreeProvider(post.id));
    final meta = [
      if (post.creator != null) post.creator!,
      if (post.year != null) '${post.year}',
    ].join(' · ');

    return BrandScaffold(
      title: post.community.tag,
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: tone.surfaceGradient),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: tone.surfaceBorder),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SaveRail(post: post),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () => openUserProfile(
                                    context, post.author),
                                child: FeedAvatar(
                                    name: post.author, size: 28),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: AuthorTag(
                                  author: post.author,
                                  trailing:
                                      ' ${post.activity.verb} · ${ago(post.ageHours)}',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: context.brandMuted),
                                ),
                              ),
                            ]),
                            const SizedBox(height: 10),
                            // "you" returns nothing (web parity).
                            FollowButton(
                                username: post.author, tone: tone),
                            const SizedBox(height: 10),
                            Text(post.title,
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    height: 1.25,
                                    color: context.brandInk)),
                            if (post.posterUrl != null) ...[
                              const SizedBox(height: 12),
                              Row(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  PosterThumb(
                                      url: post.posterUrl,
                                      square: post.square,
                                      w: 64),
                                  const SizedBox(width: 12),
                                  if (meta.isNotEmpty)
                                    Expanded(
                                      child: Text(meta,
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight:
                                                  FontWeight.w600,
                                              color: context
                                                  .brandMuted)),
                                    ),
                                ],
                              ),
                            ],
                            if (post.body != null) ...[
                              const SizedBox(height: 12),
                              Text(post.body!,
                                  style: TextStyle(
                                      fontSize: 14,
                                      height: 1.5,
                                      fontStyle: FontStyle.italic,
                                      color: context.brandInk)),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Row(children: [
                  Expanded(
                    child: Eyebrow('${post.comments.length} comments'),
                  ),
                  _CommentSortMenu(
                    value: ref.watch(feedPrefsProvider).commentSort,
                    onChanged: (s) => ref
                        .read(feedPrefsProvider.notifier)
                        .setCommentSort(s),
                  ),
                ]),
                const SizedBox(height: 12),
                if (tree.isEmpty)
                  Subtitle('No comments yet — start the thread.')
                else
                  for (final node in tree)
                    _CommentNode(
                        node: node, postId: post.id, depth: 0),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: Row(children: [
                Expanded(
                  child: AdaptiveTextField(
                    controller: _ctrl,
                    placeholder: 'Add to the discussion…',
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _submitTopLevel(),
                  ),
                ),
                AdaptiveButton.icon(
                  onPressed: _submitTopLevel,
                  icon: Icons.send_rounded,
                  iconColor: tone.dot,
                  style: AdaptiveButtonStyle.plain,
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _unavailable(BuildContext context) {
    return BrandScaffold(
      title: 'Post',
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inbox_outlined,
                  size: 44, color: context.brandMuted),
              const SizedBox(height: 14),
              const BrandHeading("This post isn't available",
                  size: 22),
              const SizedBox(height: 8),
              Subtitle(
                  'It may have been removed, or you opened the link '
                  'directly before the feed loaded.',
                  center: true),
              const SizedBox(height: 20),
              AdaptiveButton(
                onPressed: () => context.go('/'),
                label: 'Back to feed',
                color: Tw.violet500,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A single threaded comment + its replies (recursive). Port of the web
/// `CommentNode`: collapse `[+]`/`[−]`, "· N more" when collapsed, inline
/// reply box, up/down vote, an indentation rail per nesting level.
class _CommentNode extends ConsumerStatefulWidget {
  const _CommentNode({
    required this.node,
    required this.postId,
    required this.depth,
  });
  final FeedCommentNode node;
  final String postId;
  final int depth;

  @override
  ConsumerState<_CommentNode> createState() => _CommentNodeState();
}

class _CommentNodeState extends ConsumerState<_CommentNode> {
  bool _collapsed = false;
  bool _replying = false;
  final _draft = TextEditingController();

  @override
  void dispose() {
    _draft.dispose();
    super.dispose();
  }

  void _submitReply() {
    final text = _draft.text.trim();
    if (text.isEmpty) return;
    ref
        .read(feedProvider.notifier)
        .addComment(widget.postId, text, parentId: widget.node.id);
    _draft.clear();
    setState(() => _replying = false);
    showBanner('Reply added',
        type: AdaptiveSnackBarType.success,
        duration: const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    final node = widget.node;
    final key = '${widget.postId}#${node.id}';
    final vote = ref.watch(commentVotesProvider)[key] ?? 0;
    final voteNotifier = ref.read(commentVotesProvider.notifier);
    final replyCount = node.replies.fold<int>(
        0, (n, r) => n + 1 + countDescendants(r));

    Color voteColor(int dir) => vote == dir
        ? (dir > 0 ? Tw.violet500 : Tw.rose500)
        : context.brandMuted;

    return Padding(
      padding: EdgeInsets.only(left: widget.depth > 0 ? 12 : 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.colors.muted,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.colors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () =>
                        setState(() => _collapsed = !_collapsed),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: Text('[${_collapsed ? '+' : '−'}]',
                          style: TextStyle(
                              fontSize: 12,
                              fontFeatures: const [
                                FontFeature.tabularFigures()
                              ],
                              fontWeight: FontWeight.w800,
                              color: context.brandMuted)),
                    ),
                  ),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () =>
                        openUserProfile(context, node.author),
                    child: FeedAvatar(name: node.author, size: 22),
                  ),
                  const SizedBox(width: 7),
                  Flexible(
                    child: AuthorTag(
                      author: node.author,
                      bold: true,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: 7),
                  Text(ago(node.ageHours),
                      style: TextStyle(
                          fontSize: 11, color: context.brandMuted)),
                  if (_collapsed && replyCount > 0)
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () =>
                          setState(() => _collapsed = false),
                      child: Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: Text('· $replyCount more',
                            style: TextStyle(
                                fontSize: 11,
                                color: context.brandMuted)),
                      ),
                    ),
                  const Spacer(),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => voteNotifier.setVote(key, 1),
                    child: Padding(
                      padding: const EdgeInsets.all(2),
                      child: Icon(Icons.keyboard_arrow_up,
                          size: 18, color: voteColor(1)),
                    ),
                  ),
                  const SizedBox(width: 2),
                  Text('${node.score + vote}',
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: vote != 0
                              ? voteColor(vote)
                              : context.brandInk)),
                  const SizedBox(width: 2),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => voteNotifier.setVote(key, -1),
                    child: Padding(
                      padding: const EdgeInsets.all(2),
                      child: Icon(Icons.keyboard_arrow_down,
                          size: 18, color: voteColor(-1)),
                    ),
                  ),
                ]),
                if (!_collapsed) ...[
                  const SizedBox(height: 6),
                  Text(node.body,
                      style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: context.brandInk)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () =>
                        setState(() => _replying = !_replying),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.subdirectory_arrow_right,
                            size: 13, color: context.brandMuted),
                        const SizedBox(width: 4),
                        Text('Reply',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: context.brandMuted)),
                      ],
                    ),
                  ),
                  if (_replying) ...[
                    const SizedBox(height: 8),
                    AdaptiveTextField(
                      controller: _draft,
                      placeholder: 'Reply to ${node.author}…',
                      autofocus: true,
                      minLines: 2,
                      maxLines: 4,
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      AdaptiveButton(
                        onPressed: _submitReply,
                        label: 'Reply',
                        color: Tw.violet500,
                      ),
                      const SizedBox(width: 8),
                      AdaptiveButton(
                        onPressed: () {
                          _draft.clear();
                          setState(() => _replying = false);
                        },
                        label: 'Cancel',
                        style: AdaptiveButtonStyle.plain,
                      ),
                    ]),
                  ],
                ],
              ],
            ),
          ),
          if (!_collapsed && node.replies.isNotEmpty)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () =>
                        setState(() => _collapsed = true),
                    child: Padding(
                      padding: const EdgeInsets.only(
                          left: 6, right: 6, bottom: 8),
                      child: Container(
                        width: 2,
                        decoration: BoxDecoration(
                          color: context.colors.border,
                          borderRadius:
                              BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        for (final child in node.replies)
                          _CommentNode(
                              node: child,
                              postId: widget.postId,
                              depth: widget.depth + 1),
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

/// Compact comment-sort control in the app bar (Top / New) — bound to the
/// persisted [feedPrefsProvider].
class _CommentSortMenu extends StatelessWidget {
  const _CommentSortMenu({required this.value, required this.onChanged});
  final CommentSort value;
  final ValueChanged<CommentSort> onChanged;

  @override
  Widget build(BuildContext context) {
    return AdaptivePopupMenuButton.widget<CommentSort>(
      items: const [
        AdaptivePopupMenuItem(label: 'Top', value: CommentSort.top),
        AdaptivePopupMenuItem(
            label: 'New', value: CommentSort.newest),
      ],
      onSelected: (_, entry) => onChanged(entry.value as CommentSort),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.sort, size: 18, color: context.brandInk),
        const SizedBox(width: 4),
        Text(value == CommentSort.newest ? 'New' : 'Top',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: context.brandInk)),
        const SizedBox(width: 6),
      ]),
    );
  }
}
