import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../models/feed_models.dart';
import 'composer.dart';

/// Most recent finished library item — the basis of the "share it?" nudge.
final _latestFinishedProvider =
    FutureProvider.autoDispose<LibraryItem?>((ref) async {
  final r = await ref
      .watch(libraryServiceProvider)
      .list(status: LibraryStatus.finished, limit: 1);
  final items = r.data ?? const <LibraryItem>[];
  return items.isEmpty ? null : items.first;
});

/// Per-device record of which finished item the nudge was last dismissed
/// for, so it doesn't nag about the same pick twice.
class _NudgeDismiss extends Notifier<String?> {
  static const _key = 'sa.finished_nudge_dismissed';

  @override
  String? build() => ref
      .watch(sharedPreferencesProvider)
      .asData
      ?.value
      .getString(_key);

  Future<void> dismiss(String id) async {
    state = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, id);
  }
}

final _nudgeDismissProvider =
    NotifierProvider<_NudgeDismiss, String?>(_NudgeDismiss.new);

/// Feed nudge: "you recently finished X — want to post about it?". Taps
/// open the composer pre-filled with the item; dismissed per item.
class FinishedNudgeCard extends ConsumerWidget {
  const FinishedNudgeCard({super.key});

  FeedCommunity _communityFor(LibraryMedium m) =>
      FeedCommunity.values[m.index];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latest = ref.watch(_latestFinishedProvider).value;
    final dismissed = ref.watch(_nudgeDismissProvider);
    if (latest == null || latest.id == dismissed) {
      return const SizedBox.shrink();
    }

    final tone = contentAccent(
        ContentAccentName.emerald, Theme.of(context).brightness);

    void share() {
      // Engaging with the nudge dismisses it either way.
      ref.read(_nudgeDismissProvider.notifier).dismiss(latest.id);
      showModalBottomSheet<void>(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        builder: (_) => Composer(
          initialCommunity: _communityFor(latest.medium),
          prefill: (
            title: latest.title,
            creator: latest.creator,
            year: latest.year,
            posterUrl: latest.posterUrl,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: BrandCard(
      accent: ContentAccentName.emerald,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                  color: tone.iconCircleBg, shape: BoxShape.circle),
              child: Icon(Icons.check_circle_outline,
                  size: 19, color: tone.iconCircleFg),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('You recently finished',
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
                  Text(latest.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: context.brandInk)),
                ],
              ),
            ),
            Semantics(
              button: true,
              label: 'Dismiss',
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => ref
                    .read(_nudgeDismissProvider.notifier)
                    .dismiss(latest.id),
                child: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(Icons.close,
                      size: 18, color: context.brandMuted),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 6),
          Subtitle('Share it with your friends in the feed?'),
          const SizedBox(height: 12),
          AdaptiveButton(
            onPressed: share,
            label: 'Post about it',
            color: tone.dot,
          ),
        ],
      ),
      ),
    );
  }
}
