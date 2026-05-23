import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../ui/ui.dart';
import '../feed/feed_providers.dart';
import '../feed/models/feed_models.dart';
import '../feed/widgets/feed_avatar.dart';
import 'notifications_center.dart';

/// Per-type icon + accent for a local (system / library / reminder /
/// milestone / quiz / feed) notification card.
({IconData icon, Color color}) _localStyle(AppNotificationType t) =>
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

/// Per-kind icon + accent for a server (social) notification card.
({IconData icon, Color color}) _serverStyle(String kind) => switch (kind) {
      'follow' => (icon: Icons.person_add_alt_1, color: Tw.indigo500),
      'comment_on_post' => (icon: Icons.chat_bubble_outline, color: Tw.violet500),
      'reply_to_comment' =>
        (icon: Icons.subdirectory_arrow_right, color: Tw.violet500),
      'friend_post' => (icon: Icons.forum, color: Tw.emerald500),
      'post_upvote' || 'comment_upvote' =>
        (icon: Icons.thumb_up_alt_outlined, color: Tw.amber500),
      _ => (icon: Icons.notifications_none, color: Tw.slate500),
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

/// Wraps either source so the list view can render both in one timeline,
/// sorted by `createdAt`. Keeps the source type around so each card can
/// route the right way (server → /feed/:id, local → its preset route).
sealed class _InboxItem {
  String get id;
  DateTime get createdAt;
  bool get isRead;
}

class _LocalItem extends _InboxItem {
  _LocalItem(this.n);
  final AppNotification n;
  @override
  String get id => 'local:${n.id}';
  @override
  DateTime get createdAt => n.createdAt;
  @override
  bool get isRead => n.read;
}

class _ServerItem extends _InboxItem {
  _ServerItem(this.n);
  final FeedNotification n;
  @override
  String get id => 'server:${n.id}';
  @override
  DateTime get createdAt =>
      DateTime.tryParse(n.createdAt) ?? DateTime.now();
  @override
  bool get isRead => n.isRead;
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _clearing = false;

  Future<void> _clearAll(int count) async {
    if (_clearing) return;
    Haptics.impact(HapticImpactStyle.medium);
    setState(() => _clearing = true);
    final total = Duration(milliseconds: (count - 1) * 50 + 280);
    await Future.delayed(total);
    if (!mounted) return;
    // Local + server cleared together — the screen always shows them
    // as one timeline, so half-clearing would be confusing.
    ref.read(notificationsCenterProvider.notifier).clear();
    await ref.read(feedActionsProvider).clearAllNotifications();
    if (mounted) setState(() => _clearing = false);
  }

  @override
  Widget build(BuildContext context) {
    final local = ref.watch(notificationsCenterProvider);
    final serverAsync = ref.watch(feedNotificationsProvider);
    final server = serverAsync.value ?? const <FeedNotification>[];

    // Merge → sorted timeline.
    final items = <_InboxItem>[
      ...local.map(_LocalItem.new),
      ...server.map(_ServerItem.new),
    ]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final unread = items.where((i) => !i.isRead).length;
    if (unread > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ref.read(notificationsCenterProvider.notifier).markAllRead();
        ref.read(feedActionsProvider).markAllNotificationsRead();
      });
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
                        serverAsync.isLoading && local.isEmpty
                            ? 'Loading…'
                            : 'You’re all caught up — no notifications.',
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

  Widget _buildCard(BuildContext context, _InboxItem item) {
    return Dismissible(
      key: ValueKey(item.id),
      direction: DismissDirection.startToEnd,
      onDismissed: (_) {
        Haptics.impact(HapticImpactStyle.light);
        switch (item) {
          case _LocalItem(:final n):
            ref.read(notificationsCenterProvider.notifier).remove(n.id);
          case _ServerItem(:final n):
            ref.read(feedActionsProvider).deleteNotification(n.id);
        }
      },
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
        child: switch (item) {
          _LocalItem(:final n) => _LocalCard(n: n),
          _ServerItem(:final n) => _ServerCard(n: n),
        },
      ),
    );
  }
}

/// Renders a locally-stored notification (welcome, reminder, milestone).
class _LocalCard extends ConsumerWidget {
  const _LocalCard({required this.n});
  final AppNotification n;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final style = _localStyle(n.type);
    return GestureDetector(
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
            _LeadingCircle(icon: style.icon, color: style.color),
            const SizedBox(width: 12),
            Expanded(
              child: _BodyText(
                title: n.title,
                subtitle: n.body,
                ago: _ago(n.createdAt),
                showChevron: n.route != null,
                unread: !n.read,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Renders a server notification (feed_notifications) with the actor's
/// avatar and a kind-specific copy line.
class _ServerCard extends ConsumerWidget {
  const _ServerCard({required this.n});
  final FeedNotification n;

  String get _title => switch (n.kind) {
        'follow' => '${n.actorName} started following you',
        'comment_on_post' => '${n.actorName} commented on your post',
        'reply_to_comment' => '${n.actorName} replied to your comment',
        'friend_post' => '${n.actorName} shared a new post',
        'post_upvote' => '${n.actorName} upvoted your post',
        'comment_upvote' => '${n.actorName} upvoted your comment',
        _ => '${n.actorName} interacted with you',
      };

  String? get _subtitle {
    final body = (n.commentBody ?? '').trim();
    final title = (n.postTitle ?? '').trim();
    if (body.isNotEmpty) return '“$body”';
    if (title.isNotEmpty) return title;
    return null;
  }

  String? get _route {
    if (n.postId != null) return '/feed/${n.postId}';
    if (n.kind == 'follow' && n.actorId != null) {
      return '/feed/u/${n.actorId}';
    }
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final style = _serverStyle(n.kind);
    final createdAt = DateTime.tryParse(n.createdAt) ?? DateTime.now();
    final route = _route;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: route == null
          ? null
          : () {
              ref.read(feedActionsProvider).markNotificationRead(n.id);
              context.push(route);
            },
      child: BrandCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Actor avatar with a small kind-icon badge in the corner —
            // a glance at the bell tells you "who did what" without
            // having to read the title line.
            SizedBox(
              width: 42,
              height: 42,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  FeedAvatar(
                      name: n.actorName, url: n.actorAvatarUrl, size: 38),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: style.color,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: context.colors.background, width: 2),
                      ),
                      child:
                          Icon(style.icon, size: 11, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _BodyText(
                title: _title,
                subtitle: _subtitle,
                ago: _ago(createdAt),
                showChevron: route != null,
                unread: !n.isRead,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LeadingCircle extends StatelessWidget {
  const _LeadingCircle({required this.icon, required this.color});
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 19, color: color),
    );
  }
}

class _BodyText extends StatelessWidget {
  const _BodyText({
    required this.title,
    required this.subtitle,
    required this.ago,
    required this.showChevron,
    required this.unread,
  });
  final String title;
  final String? subtitle;
  final String ago;
  final bool showChevron;
  final bool unread;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(title,
                  style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: context.brandInk)),
            ),
            if (unread)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 5, left: 8),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Tw.indigo500,
                ),
              ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(subtitle!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 13,
                  height: 1.35,
                  color: context.brandMuted)),
        ],
        const SizedBox(height: 6),
        Row(children: [
          Text(ago,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: context.brandMuted)),
          if (showChevron) ...[
            const Spacer(),
            Icon(Icons.chevron_right,
                size: 16, color: context.brandMuted),
          ],
        ]),
      ],
    );
  }
}
