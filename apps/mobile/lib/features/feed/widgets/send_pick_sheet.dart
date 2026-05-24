import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';
import 'feed_avatar.dart';

/// Bottom sheet: "send this pick to a friend." Lists everyone the
/// current user follows (the most relevant audience for "you should
/// check this out"); tap a row to send, optional one-liner above.
///
/// One-shot per pick: after a successful send, the sheet auto-closes
/// with a confirm banner. Multi-select is intentionally NOT supported
/// to keep the friction high — a pick blasted to 50 people isn't a
/// recommendation, it's spam.
class SendPickSheet extends ConsumerStatefulWidget {
  const SendPickSheet({super.key, required this.post});
  final FeedPost post;

  @override
  ConsumerState<SendPickSheet> createState() => _SendPickSheetState();
}

class _SendPickSheetState extends ConsumerState<SendPickSheet> {
  final _message = TextEditingController();
  String _query = '';
  String? _sendingId;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send(({String id, String name, String? avatarUrl}) p) async {
    setState(() => _sendingId = p.id);
    Haptics.selection();
    try {
      await ref.read(feedActionsProvider).sendPick(
            postId: widget.post.id,
            recipientId: p.id,
            message: _message.text,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      showBanner('Sent "${widget.post.title}" to ${p.name}',
          type: AdaptiveSnackBarType.success,
          duration: const Duration(seconds: 2));
    } catch (e) {
      if (!mounted) return;
      setState(() => _sendingId = null);
      showBanner("Couldn't send — ${e.toString()}",
          type: AdaptiveSnackBarType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me =
        ref.watch(feedServiceProvider); // not used directly, ensures rebuild
    me.toString();
    final followingAsync = ref.watch(myFollowingProfilesProvider);
    final following = followingAsync.value ?? const [];
    final q = _query.trim().toLowerCase();
    final filtered = q.isEmpty
        ? following
        : following
            .where((p) => p.name.toLowerCase().contains(q))
            .toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollController) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: brandBg(Theme.of(context).brightness),
          borderRadius: const BorderRadius.vertical(
              top: Radius.circular(20)),
          border: Border.all(color: context.colors.border),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            // Drag handle.
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: context.brandMuted.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Send to a friend',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: context.brandInk)),
                  const SizedBox(height: 4),
                  Text('"${widget.post.title}"',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 13, color: context.brandMuted)),
                  const SizedBox(height: 14),
                  AdaptiveTextField(
                    controller: _message,
                    placeholder: 'Add a note (optional)',
                    maxLines: 2,
                    minLines: 1,
                  ),
                  const SizedBox(height: 10),
                  AdaptiveTextField(
                    placeholder: 'Search your follows',
                    onChanged: (v) => setState(() => _query = v),
                    prefix: Icon(Icons.search,
                        size: 16, color: context.brandMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: followingAsync.when(
                loading: () =>
                    const Center(child: LoaderFive('Loading')),
                error: (_, _) => Padding(
                  padding: const EdgeInsets.all(24),
                  child: Subtitle(
                      "Couldn't load your friends list.",
                      center: true),
                ),
                data: (_) {
                  if (following.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(24),
                      child: Subtitle(
                          'Follow someone first — then you can send '
                          'them picks.',
                          center: true),
                    );
                  }
                  if (filtered.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(24),
                      child: Subtitle('No matches for "$_query".',
                          center: true),
                    );
                  }
                  return ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final p = filtered[i];
                      final sending = _sendingId == p.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: _sendingId == null
                              ? () => _send(p)
                              : null,
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: context.colors.muted,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: context.colors.border),
                            ),
                            child: Row(children: [
                              FeedAvatar(
                                  name: p.name,
                                  url: p.avatarUrl,
                                  size: 34),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(p.name,
                                    style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: context.brandInk)),
                              ),
                              if (sending)
                                const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2))
                              else
                                Icon(Icons.send_outlined,
                                    size: 18, color: Tw.violet500),
                            ]),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
