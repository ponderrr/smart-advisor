import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';

// ---------------------------------------------------------------------------
// Shared formatting + navigation helpers
// ---------------------------------------------------------------------------

String ago(int hours) {
  if (hours <= 0) return 'just now';
  if (hours < 24) return '${hours}h ago';
  final d = hours ~/ 24;
  return '${d}d ago';
}

String compactCount(int n) {
  if (n >= 1000) {
    final k = n / 1000;
    return '${k.toStringAsFixed(k >= 10 ? 0 : 1)}k';
  }
  return '$n';
}

/// Full-page pushes onto the persistent shell (parity with the web routes).
void openPost(BuildContext context, String id) =>
    context.push('/feed/$id');

void openUserProfile(BuildContext context, String username) =>
    context.push('/feed/u/${Uri.encodeComponent(username)}');

void openCommunity(BuildContext context, FeedCommunity community) =>
    context.push('/feed/c/${community.wire}');

// ---------------------------------------------------------------------------
// Tags / badges
// ---------------------------------------------------------------------------

/// Tappable community tag (`r/movies`) → opens the community page.
class CommunityTag extends StatelessWidget {
  const CommunityTag({
    super.key,
    required this.community,
    required this.tone,
    this.dense = false,
  });
  final FeedCommunity community;
  final ContentAccentTone tone;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => openCommunity(context, community),
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: dense ? 0 : 8, vertical: dense ? 0 : 2),
        decoration: dense
            ? null
            : BoxDecoration(
                color: tone.iconCircleBg,
                borderRadius: BorderRadius.circular(999)),
        child: Text(community.tag,
            style: TextStyle(
                fontSize: dense ? 10.5 : 10,
                fontWeight: FontWeight.w900,
                color: dense ? tone.text : tone.iconCircleFg)),
      ),
    );
  }
}

/// Tappable `u/<name>` (+ optional trailing meta) that opens that user's
/// profile — used on cards, the post detail and comments.
class AuthorTag extends StatelessWidget {
  const AuthorTag({
    super.key,
    required this.author,
    this.trailing = '',
    this.style,
    this.bold = false,
  });
  final String author;
  final String trailing;
  final TextStyle? style;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final base =
        style ?? TextStyle(fontSize: 11, color: context.brandMuted);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => openUserProfile(context, author),
      child: Text.rich(
        TextSpan(children: [
          TextSpan(
              text: 'u/$author',
              style: base.copyWith(
                  fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                  color: context.brandInk)),
          if (trailing.isNotEmpty)
            TextSpan(text: trailing, style: base),
        ]),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

/// "% your taste" chip — the social signal that replaces vote score.
class TasteBadge extends StatelessWidget {
  const TasteBadge({super.key, required this.match, required this.tone});
  final int match;
  final ContentAccentTone tone;

  @override
  Widget build(BuildContext context) {
    if (match <= 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: tone.iconCircleBg,
          borderRadius: BorderRadius.circular(999)),
      child: Text('$match% your taste',
          style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: tone.iconCircleFg)),
    );
  }
}

/// Left rail: save-to-library toggle + comment count. Interactions here
/// feed the taste graph.
class SaveRail extends ConsumerWidget {
  const SaveRail({super.key, required this.post});
  final FeedPost post;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider).contains(post.id);
    final tone =
        contentAccent(post.community.accent, Theme.of(context).brightness);
    final saveColor = saved ? tone.dot : context.brandMuted;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          button: true,
          label: saved
              ? 'Saved to library. Tap to remove “${post.title}”'
              : 'Save “${post.title}” to library',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              final nowSaved =
                  ref.read(savedProvider.notifier).toggle(post.id);
              showBanner(
                nowSaved
                    ? '“${post.title}” saved to your library'
                    : 'Removed from your library',
                type: nowSaved
                    ? AdaptiveSnackBarType.success
                    : AdaptiveSnackBarType.info,
                action: 'Undo',
                onAction: () =>
                    ref.read(savedProvider.notifier).toggle(post.id),
              );
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 44,
                  height: 32,
                  child: Center(
                    child: AnimatedScale(
                      scale: saved ? 1.12 : 1,
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOutBack,
                      child: Icon(
                          saved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded,
                          size: 24,
                          color: saveColor),
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(saved ? 'Saved' : 'Save',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: saveColor)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Semantics(
          label: '${post.comments.length} comments',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.mode_comment_outlined,
                  size: 18, color: context.brandMuted),
              const SizedBox(height: 2),
              Text('${post.comments.length}',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: context.brandMuted)),
            ],
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Card / Compact / Media post layouts
// ---------------------------------------------------------------------------

class PostCard extends StatelessWidget {
  const PostCard({super.key, required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(post.community.accent, Theme.of(context).brightness);
    final meta = [
      if (post.creator != null) post.creator!,
      if (post.year != null) '${post.year}',
    ].join(' · ');

    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child:
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SaveRail(post: post),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  CommunityTag(community: post.community, tone: tone),
                  const Spacer(),
                  TasteBadge(match: post.tasteMatch, tone: tone),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Icon(post.activity.icon, size: 14, color: tone.text),
                  const SizedBox(width: 5),
                  Flexible(
                    child: AuthorTag(
                      author: post.author,
                      trailing:
                          ' ${post.activity.verb} · ${ago(post.ageHours)}',
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(post.title,
                    style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w800,
                        height: 1.25,
                        color: context.brandInk)),
                if (post.posterUrl != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PosterThumb(
                          url: post.posterUrl,
                          square: post.square,
                          w: 52,
                          semanticLabel: '${post.title} cover'),
                      const SizedBox(width: 10),
                      if (meta.isNotEmpty)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(meta,
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: context.brandMuted)),
                          ),
                        ),
                    ],
                  ),
                ],
                if (post.body != null) ...[
                  const SizedBox(height: 8),
                  Text(post.body!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          fontStyle: FontStyle.italic,
                          color: context.brandMuted)),
                ],
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

/// Card / Compact / Media switch — track + sliding pill with icons,
/// styled to match [ViewModeToggle]. Pure Flutter so it renders
/// identically on iOS and Android.
class FeedViewToggle extends StatelessWidget {
  const FeedViewToggle({
    super.key,
    required this.value,
    required this.onChanged,
  });
  final FeedView value;
  final ValueChanged<FeedView> onChanged;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final track = dark ? Tw.slate800 : Tw.slate200;
    final pill = dark ? Tw.slate950 : Tw.white;
    final active = dark ? Tw.slate100 : Tw.slate900;
    final muted = dark ? Tw.slate400 : Tw.slate500;

    Widget cell(FeedView v, IconData icon, String tip) {
      final selected = value == v;
      return Tooltip(
        message: tip,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: selected ? null : () => onChanged(v),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: 38,
            height: 34,
            decoration: BoxDecoration(
              color: selected ? pill : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: Colors.black
                              .withValues(alpha: dark ? 0.3 : 0.08),
                          blurRadius: 6,
                          offset: const Offset(0, 2))
                    ]
                  : null,
            ),
            child:
                Icon(icon, size: 17, color: selected ? active : muted),
          ),
        ),
      );
    }

    return Container(
      height: 42,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
          color: track, borderRadius: BorderRadius.circular(14)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        cell(FeedView.card, Icons.view_agenda_outlined, 'Card view'),
        const SizedBox(width: 2),
        cell(FeedView.compact, Icons.density_small, 'Compact view'),
        const SizedBox(width: 2),
        cell(FeedView.media, Icons.photo_library_outlined, 'Media view'),
      ]),
    );
  }
}

/// Compact view: a dense one/two-line row — Reddit's "compact" mode.
class CompactPostRow extends StatelessWidget {
  const CompactPostRow(
      {super.key, required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(post.community.accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: context.colors.muted,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child:
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (post.posterUrl != null) ...[
            PosterThumb(
                url: post.posterUrl,
                square: post.square,
                w: 34,
                semanticLabel: '${post.title} cover'),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                        color: context.brandInk)),
                const SizedBox(height: 4),
                Row(children: [
                  CommunityTag(
                      community: post.community,
                      tone: tone,
                      dense: true),
                  Text('  ·  ',
                      style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: tone.text)),
                  Flexible(
                    child: AuthorTag(
                      author: post.author,
                      trailing:
                          '  ${post.activity.verb}  ·  ${ago(post.ageHours)}',
                      style: TextStyle(
                          fontSize: 10.5, color: context.brandMuted),
                    ),
                  ),
                ]),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (post.tasteMatch > 0)
                Text('${post.tasteMatch}%',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: tone.text)),
              const SizedBox(height: 4),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.mode_comment_outlined,
                    size: 11, color: context.brandMuted),
                const SizedBox(width: 3),
                Text('${post.comments.length}',
                    style: TextStyle(
                        fontSize: 10.5, color: context.brandMuted)),
              ]),
            ],
          ),
        ]),
      ),
    );
  }
}

/// Media view: poster-forward, immersive — large cover with the title and
/// vote/comment bar over a gradient scrim.
class MediaPostCard extends StatelessWidget {
  const MediaPostCard(
      {super.key, required this.post, required this.onOpen});
  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(post.community.accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 200,
              width: double.infinity,
              child: Stack(fit: StackFit.expand, children: [
                if (post.posterUrl != null)
                  Image.network(post.posterUrl!,
                      fit: BoxFit.cover,
                      semanticLabel: '${post.title} cover',
                      errorBuilder: (_, _, _) =>
                          ColoredBox(color: tone.iconCircleBg))
                else
                  Center(
                    child: Icon(Icons.forum_outlined,
                        size: 48, color: tone.iconCircleFg),
                  ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.65),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 12,
                  top: 12,
                  child: CommunityTag(
                      community: post.community, tone: tone),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: 12,
                  child: Text(post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          height: 1.2,
                          color: Colors.white)),
                ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Row(children: [
                Icon(post.activity.icon, size: 15, color: tone.text),
                const SizedBox(width: 5),
                if (post.tasteMatch > 0)
                  Text('${post.tasteMatch}% your taste',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: tone.text)),
                const SizedBox(width: 14),
                Icon(Icons.mode_comment_outlined,
                    size: 16, color: context.brandMuted),
                const SizedBox(width: 5),
                Text('${post.comments.length}',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: context.brandMuted)),
                const Spacer(),
                Flexible(
                  child: AuthorTag(
                    author: post.author,
                    trailing:
                        ' ${post.activity.verb} · ${ago(post.ageHours)}',
                    style: TextStyle(
                        fontSize: 11, color: context.brandMuted),
                  ),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

/// Extended FAB that smoothly grows/shrinks as its label changes and
/// cross-fades both the text and the accent color.
class PostFab extends StatelessWidget {
  const PostFab(
      {super.key,
      required this.color,
      required this.label,
      required this.onTap});
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<Color?>(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      tween: ColorTween(end: color),
      builder: (context, animColor, _) {
        final bg = animColor ?? color;
        return Material(
          color: bg,
          elevation: 6,
          shadowColor: bg.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(26),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox(
              height: 52,
              child: AnimatedSize(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.edit_outlined,
                        size: 18, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      softWrap: false,
                      maxLines: 1,
                      overflow: TextOverflow.clip,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
