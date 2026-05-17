import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../core/ui_messenger.dart';
import '../../ui/ui.dart';
import '../recommendations/services/database_service.dart';

class _Filter {
  const _Filter(this.contentType, this.favorites, this.sortBy, this.asc);
  final String? contentType;
  final bool favorites;
  final String sortBy;
  final bool asc;

  // Value equality so the FutureProvider.family keys correctly — without
  // this every rebuild made a new provider and it never finished loading.
  @override
  bool operator ==(Object o) =>
      o is _Filter &&
      o.contentType == contentType &&
      o.favorites == favorites &&
      o.sortBy == sortBy &&
      o.asc == asc;

  @override
  int get hashCode => Object.hash(contentType, favorites, sortBy, asc);
}

final _historyProvider = FutureProvider.autoDispose
    .family<List<Recommendation>, _Filter>((ref, f) async {
  final res = await ref.watch(databaseServiceProvider).getUserRecommendations(
        RecommendationFilter(
          contentType: f.contentType,
          isFavorited: f.favorites ? true : null,
          sortBy: f.sortBy,
          ascending: f.asc,
        ),
      );
  return res.data ?? const [];
});

/// Port of web /history: medium/favorites filter, sort, favorite + delete.
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  int _mediumIdx = 0; // All, Movies, Books, Music, Favorites
  int _sortIdx = 0; // Newest, Oldest

  _Filter get _filter {
    final ct = switch (_mediumIdx) {
      1 => 'movie',
      2 => 'book',
      3 => 'music',
      _ => null,
    };
    return _Filter(ct, _mediumIdx == 4, 'created_at', _sortIdx == 1);
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(_historyProvider(_filter));
    return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 8),
          const Eyebrow('History'),
          const SizedBox(height: 4),
          const BrandHeading('Past picks', size: 24),
          const SizedBox(height: 16),
          AdaptiveSegmentedControl(
            color: accentColorForLabel(const [
              'All',
              'Movies',
              'Books',
              'Music',
              'Favs'
            ][_mediumIdx]),
            labels: const ['All', 'Movies', 'Books', 'Music', 'Favs'],
            selectedIndex: _mediumIdx,
            onValueChanged: (i) => setState(() => _mediumIdx = i),
          ),
          const SizedBox(height: 8),
          AdaptiveSegmentedControl(
            color: Tw.indigo500,
            labels: const ['Newest', 'Oldest'],
            selectedIndex: _sortIdx,
            onValueChanged: (i) => setState(() => _sortIdx = i),
          ),
          const SizedBox(height: 16),
          data.when(
            loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: LoaderFive('Loading'))),
            error: (e, _) => Subtitle('Could not load: $e'),
            data: (list) => list.isEmpty
                ? Subtitle('No recommendations yet.')
                : Column(children: [for (final r in list) _row(r)]),
          ),
        ],
    );
  }

  Widget _row(Recommendation r) => GestureDetector(
        onTap: () => context.push('/pick', extra: r),
        child: BrandCard(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          PosterThumb(url: r.posterUrl, square: r.type == 'music'),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: context.brandInk)),
                Text(
                    '${r.type} · ${r.director ?? r.author ?? r.artist ?? ''}'
                    '${r.year != null ? ' · ${r.year}' : ''}',
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
              ],
            ),
          ),
          AdaptiveTooltip(
            message: r.isFavorited ? 'Remove favorite' : 'Favorite',
            child: IconButton(
              icon: Icon(
                  r.isFavorited ? Icons.favorite : Icons.favorite_border,
                  size: 20,
                  color: r.isFavorited ? Tw.rose500 : context.brandMuted),
              onPressed: () async {
                await ref
                    .read(databaseServiceProvider)
                    .toggleFavorite(r.id);
                ref.invalidate(_historyProvider);
              },
            ),
          ),
          AdaptiveTooltip(
            message: 'Delete',
            child: IconButton(
            icon: Icon(Icons.delete_outline,
                size: 20, color: context.brandMuted),
            onPressed: () => AdaptiveAlertDialog.show(
              context: context,
              title: 'Delete recommendation?',
              message: '“${r.title}” will be removed from your history.',
              icon: Icons.delete_outline,
              actions: [
                AlertAction(
                    title: 'Cancel',
                    style: AlertActionStyle.cancel,
                    onPressed: () {}),
                AlertAction(
                  title: 'Delete',
                  style: AlertActionStyle.destructive,
                  onPressed: () async {
                    final db = ref.read(databaseServiceProvider);
                    await db.deleteRecommendation(r.id);
                    ref.invalidate(_historyProvider);
                    showBanner('“${r.title}” deleted',
                        type: AdaptiveSnackBarType.warning,
                        action: 'Undo', onAction: () async {
                      await db.saveRecommendation(r);
                      ref.invalidate(_historyProvider);
                    });
                  },
                ),
              ],
            ),
          ),
          ),
        ]),
        ),
      );
}
