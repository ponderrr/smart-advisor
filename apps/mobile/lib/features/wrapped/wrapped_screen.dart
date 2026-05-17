import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../features/recommendations/services/database_service.dart';
import '../../ui/ui.dart';

final _wrappedProvider =
    FutureProvider.autoDispose<List<Recommendation>>((ref) async {
  final res = await ref
      .watch(databaseServiceProvider)
      .getUserRecommendations(const RecommendationFilter(limit: 5000));
  return res.data ?? const [];
});

/// Port of the web "wrapped" year-in-review. The web also mints a signed
/// share-token + public page (web-only); mobile instead renders the card to
/// a PNG via RepaintBoundary and uses the native share sheet.
class WrappedScreen extends ConsumerWidget {
  const WrappedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recs = ref.watch(_wrappedProvider);
    return BrandScaffold(
      appBar: AppBar(title: const Text('Your Wrapped')),
      body: recs.when(
        loading: () => const Center(child: LoaderFive('Crunching your year')),
        error: (e, _) => Center(child: Subtitle('$e')),
        data: (list) => _WrappedBody(recs: list),
      ),
    );
  }
}

class _WrappedBody extends StatelessWidget {
  const _WrappedBody({required this.recs});
  final List<Recommendation> recs;

  final _shotKey = const GlobalObjectKey('wrapped-card');

  Future<void> _share() async {
    final boundary = _shotKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) return;
    final image = await boundary.toImage(pixelRatio: 3);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    if (bytes == null) return;
    await SharePlus.instance.share(ShareParams(
      files: [
        XFile.fromData(bytes.buffer.asUint8List(),
            mimeType: 'image/png', name: 'smart-advisor-wrapped.png'),
      ],
      text: 'My Smart Advisor year in review',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final year = DateTime.now().year;
    final yr = recs.where((r) {
      final d = DateTime.tryParse(r.createdAt);
      return d != null && d.year == year;
    }).toList();
    int by(String t) => yr.where((r) => r.type == t).length;

    final genres = <String, int>{};
    for (final r in yr) {
      for (final g in r.genres) {
        final k = g.trim();
        if (k.isNotEmpty) genres[k] = (genres[k] ?? 0) + 1;
      }
    }
    final topGenres = (genres.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value)))
        .take(3)
        .map((e) => e.key)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        RepaintBoundary(
          key: _shotKey,
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Tw.indigo500, Tw.violet600, Tw.rose500],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$year',
                    style: const TextStyle(
                        color: Colors.white70,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 4)),
                const SizedBox(height: 4),
                const Text('Smart Advisor Wrapped',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 24),
                _big('${yr.length}', 'recommendations'),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: _stat('${by('movie')}', 'movies')),
                  Expanded(child: _stat('${by('book')}', 'books')),
                  Expanded(child: _stat('${by('music')}', 'music')),
                ]),
                const SizedBox(height: 16),
                _stat('${yr.where((r) => r.isFavorited).length}',
                    'favorites'),
                if (topGenres.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text('Top genres',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                  const SizedBox(height: 6),
                  Text(topGenres.join(' · '),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                ],
                const SizedBox(height: 24),
                const Text('smartadvisor.live',
                    style:
                        TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        AdaptiveButton(onPressed: _share, label: 'Share my Wrapped'),
      ],
    );
  }

  Widget _big(String n, String label) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(n,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 56,
                  fontWeight: FontWeight.w900,
                  height: 1)),
          Text(label,
              style: const TextStyle(color: Colors.white70, fontSize: 14)),
        ],
      );

  Widget _stat(String n, String label) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(n,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900)),
          Text(label,
              style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      );
}
