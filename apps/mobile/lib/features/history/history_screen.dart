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
  ViewMode _view = ViewMode.list;

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
    // CustomScrollView so the item list is lazy — a plain
    // ListView(children: [Column(...)]) built every history row up front
    // on the first frame, which is what made this screen slower to paint
    // than the others.
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
          sliver: SliverToBoxAdapter(
            child: Column(
              children: [
                Row(children: [
                  const Expanded(child: BrandHeading('Past picks', size: 32)),
                  if (data.asData?.value.isNotEmpty ?? false)
                    ClearAllButton(
                      title: 'Clear all history?',
                      message: 'Every past pick will be permanently '
                          'deleted. This can’t be undone.',
                      onConfirm: _clearAll,
                    ),
                ]),
                const SizedBox(height: 16),
                BrandSegmented(
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
                Row(children: [
                  Expanded(
                    child: BrandSegmented(
                      color: Tw.indigo500,
                      labels: const ['Newest', 'Oldest'],
                      selectedIndex: _sortIdx,
                      onValueChanged: (i) => setState(() => _sortIdx = i),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ViewModeToggle(
                    value: _view,
                    onChanged: (v) => setState(() => _view = v),
                  ),
                ]),
              ],
            ),
          ),
        ),
        ...data.when(
          loading: () => [
            const SliverToBoxAdapter(
              child: Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: LoaderFive('Loading'))),
            ),
          ],
          error: (e, _) => [
            const SliverPadding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverToBoxAdapter(
                child: MessageBanner.error(
                    'We couldn’t load your history right now. '
                    'Please try again in a moment.'),
              ),
            ),
          ],
          data: (list) => _resultSlivers(list),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  /// Lazy slivers for the loaded result set — a SliverList for list view,
  /// a SliverGrid for grid view, so off-screen rows aren't built.
  List<Widget> _resultSlivers(List<Recommendation> list) {
    if (list.isEmpty) {
      return [
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: Subtitle('No recommendations yet.'),
          ),
        ),
      ];
    }
    if (_view == ViewMode.grid) {
      // Grid cards are variable height (movie/book posters are 3:2, music
      // is square) so a SliverGrid's uniform aspect ratio would overflow
      // or leave gaps — keep the content-sized Wrap here. Grid is the
      // opt-in secondary view; the default list view below is lazy.
      const gap = 12.0;
      final cellW =
          (MediaQuery.sizeOf(context).width - 40 - gap) / 2;
      return [
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: Wrap(
              spacing: gap,
              runSpacing: gap,
              children: [
                for (final r in list) _gridCard(r, cellW),
              ],
            ),
          ),
        ),
      ];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, i) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _row(list[i]),
            ),
            childCount: list.length,
          ),
        ),
      ),
    ];
  }

  Future<void> _clearAll() async {
    final db = ref.read(databaseServiceProvider);
    final res = await db.deleteAllRecommendations();
    ref.invalidate(_historyProvider);
    showBanner(
      res.error == null
          ? 'History cleared'
          : 'Could not clear history: ${res.error}',
      type: res.error == null
          ? AdaptiveSnackBarType.success
          : AdaptiveSnackBarType.error,
    );
  }

  Widget _row(Recommendation r) => GestureDetector(
        onTap: () => context.push('/pick', extra: r),
        child: BrandCard(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          PosterThumb(
              url: r.posterUrl,
              square: r.type == 'music',
              semanticLabel: '${r.title} cover'),
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
            child: _favButton(r),
          ),
          AdaptiveTooltip(
            message: 'Delete',
            child: _delButton(r),
          ),
        ]),
        ),
      );

  Widget _gridCard(Recommendation r, double w) => GestureDetector(
        onTap: () => context.push('/pick', extra: r),
        child: SizedBox(
          width: w,
          child: BrandCard(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: PosterThumb(
                        url: r.posterUrl,
                        square: r.type == 'music',
                        w: w - 20,
                        semanticLabel: '${r.title} cover'),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Semantics(
                          button: true,
                          label: r.isFavorited
                              ? 'Remove “${r.title}” from favorites'
                              : 'Add “${r.title}” to favorites',
                          child: _favButton(r, scrim: true),
                        ),
                        Semantics(
                          button: true,
                          label: 'Delete “${r.title}”',
                          child: _delButton(r, scrim: true),
                        ),
                      ]),
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(r.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: context.brandInk)),
                const SizedBox(height: 2),
                Text(
                    '${r.type} · ${r.director ?? r.author ?? r.artist ?? ''}'
                    '${r.year != null ? ' · ${r.year}' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
              ],
            ),
          ),
        ),
      );

  Widget _favButton(Recommendation r, {bool scrim = false}) =>
      AdaptiveButton.icon(
        style: AdaptiveButtonStyle.plain,
        icon: r.isFavorited ? Icons.favorite : Icons.favorite_border,
        iconColor: r.isFavorited
            ? Tw.rose500
            : (scrim ? Colors.white : context.brandMuted),
        onPressed: () async {
          await ref.read(databaseServiceProvider).toggleFavorite(r.id);
          ref.invalidate(_historyProvider);
        },
      );

  Widget _delButton(Recommendation r, {bool scrim = false}) =>
      AdaptiveButton.icon(
        style: AdaptiveButtonStyle.plain,
        icon: Icons.delete_outline,
        iconColor: scrim ? Colors.white : context.brandMuted,
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
      );
}
