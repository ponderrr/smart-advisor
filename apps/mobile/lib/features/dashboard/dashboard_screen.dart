import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../ui/ui.dart';
import '../recommendations/services/database_service.dart';
import '../recommendations/utils/match_score.dart';

final _dashboardRecsProvider =
    FutureProvider.autoDispose<List<Recommendation>>((ref) async {
  final res = await ref
      .watch(databaseServiceProvider)
      .getUserRecommendations(const RecommendationFilter(limit: 60));
  return res.data ?? const [];
});

/// Web-faithful dashboard: hero, accent stat tiles, sparkline + genre
/// charts, and rich recent-pick cards (poster, creator, match, genres).
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recs = ref.watch(_dashboardRecsProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      children: [
        const SizedBox(height: 8),
        const Eyebrow('Dashboard'),
        const SizedBox(height: 4),
        const BrandHeading('Your taste, so far', size: 26),
        const SizedBox(height: 18),
        recs.when(
          loading: () => const Padding(
              padding: EdgeInsets.all(48),
              child: Center(child: LoaderFive('Loading'))),
          error: (e, _) => Subtitle('Could not load: $e'),
          data: (list) => list.isEmpty
              ? _empty(context)
              : Column(children: [
                  _statGrid(context, list),
                  const SizedBox(height: 14),
                  _sparkline(context, list),
                  const SizedBox(height: 14),
                  _genres(context, list),
                  const SizedBox(height: 22),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Eyebrow('Recent picks'),
                  ),
                  const SizedBox(height: 10),
                  for (var i = 0; i < list.take(8).length; i++)
                    _pickCard(context, list[i])
                        .animate()
                        .fadeIn(delay: (i * 70).ms, duration: 300.ms)
                        .slideY(begin: 0.06, curve: Curves.easeOut),
                ]),
        ),
      ],
    );
  }

  Widget _empty(BuildContext c) => BrandCard(
        child: Column(children: [
          Icon(Icons.auto_awesome_outlined,
              size: 32, color: c.brandMuted),
          const SizedBox(height: 10),
          Subtitle('No picks yet — take a quiz to see your taste.',
              center: true),
        ]),
      );

  Widget _statGrid(BuildContext context, List<Recommendation> r) {
    int by(String t) => r.where((x) => x.type == t).length;
    final tiles = [
      ('Total', r.length, Icons.bookmark_outline, ContentAccentName.violet),
      ('Favorites', r.where((x) => x.isFavorited).length, Icons.favorite,
          ContentAccentName.rose),
      ('Movies', by('movie'), Icons.movie_outlined,
          ContentAccentName.amber),
      ('Books', by('book'), Icons.menu_book_outlined,
          ContentAccentName.emerald),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.4,
      children: [
        for (final (label, n, icon, accent) in tiles)
          _StatTile(label: label, value: n, icon: icon, accent: accent),
      ],
    );
  }

  Widget _sparkline(BuildContext context, List<Recommendation> r) {
    final now = DateTime.now();
    final counts = List<int>.filled(14, 0);
    for (final x in r) {
      final d = DateTime.tryParse(x.createdAt);
      if (d == null) continue;
      final diff = now.difference(d).inDays;
      if (diff >= 0 && diff < 14) counts[13 - diff]++;
    }
    final total = counts.fold<int>(0, (a, b) => a + b);
    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Eyebrow('Last 14 days'),
              Text('$total picks',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.brandMuted)),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 70,
            child: LineChart(LineChartData(
              gridData: const FlGridData(show: false),
              titlesData: const FlTitlesData(show: false),
              borderData: FlBorderData(show: false),
              lineTouchData: const LineTouchData(enabled: false),
              minY: 0,
              lineBarsData: [
                LineChartBarData(
                  spots: [
                    for (var i = 0; i < counts.length; i++)
                      FlSpot(i.toDouble(), counts[i].toDouble()),
                  ],
                  isCurved: true,
                  curveSmoothness: 0.3,
                  barWidth: 3,
                  gradient: const LinearGradient(
                      colors: [Tw.indigo500, Tw.violet500]),
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Tw.violet500.withValues(alpha: 0.22),
                        Tw.violet500.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ],
            )),
          ),
        ],
      ),
    );
  }

  Widget _genres(BuildContext context, List<Recommendation> r) {
    final counts = <String, int>{};
    for (final x in r) {
      for (final g in x.genres) {
        final k = g.trim();
        if (k.isNotEmpty) counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    final shown = (counts.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value)))
        .take(5)
        .toList();
    if (shown.isEmpty) return const SizedBox.shrink();
    final maxV = shown.first.value.toDouble();
    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Top genres'),
          const SizedBox(height: 14),
          for (final e in shown) ...[
            Row(children: [
              SizedBox(
                width: 84,
                child: Text(e.key,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: context.brandInk)),
              ),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: e.value / maxV,
                    minHeight: 8,
                    backgroundColor: context.colors.muted,
                    valueColor:
                        const AlwaysStoppedAnimation(Tw.indigo500),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text('${e.value}',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.brandMuted)),
            ]),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }

  Widget _pickCard(BuildContext context, Recommendation r) {
    final b = Theme.of(context).brightness;
    final accentName = switch (r.type) {
      'movie' => ContentAccentName.amber,
      'music' => ContentAccentName.rose,
      _ => ContentAccentName.emerald,
    };
    final tone = contentAccent(accentName, b);
    final ms = deriveMatchScore(id: r.id, matchScore: r.matchScore);
    final mt = matchToneColors(ms.tone, b);
    final who = r.director ?? r.author ?? r.artist;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: tone.surfaceGradient),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tone.surfaceBorder),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        PosterThumb(url: r.posterUrl, square: r.type == 'music', w: 50),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                      color: tone.iconCircleBg,
                      borderRadius: BorderRadius.circular(999)),
                  child: Text(r.type.toUpperCase(),
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                          color: tone.iconCircleFg)),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                      color: mt.background,
                      borderRadius: BorderRadius.circular(999)),
                  child: Text('${ms.score}% match',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: mt.foreground)),
                ),
              ]),
              const SizedBox(height: 6),
              Text(r.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: context.brandInk)),
              Text(
                  '${who ?? ''}${who != null && r.year != null ? ' · ' : ''}'
                  '${r.year ?? ''}',
                  style: TextStyle(
                      fontSize: 12, color: context.brandMuted)),
              if (r.explanation != null) ...[
                const SizedBox(height: 6),
                Text(r.explanation!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        fontStyle: FontStyle.italic,
                        color: context.brandMuted)),
              ],
              if (r.genres.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final g in r.genres.take(3))
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                            color: context.colors.muted,
                            borderRadius: BorderRadius.circular(999)),
                        child: Text(g,
                            style: TextStyle(
                                fontSize: 10,
                                color: context.brandMuted)),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ]),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile(
      {required this.label,
      required this.value,
      required this.icon,
      required this.accent});
  final String label;
  final int value;
  final IconData icon;
  final ContentAccentName accent;

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(accent, Theme.of(context).brightness);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: tone.surfaceGradient),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tone.surfaceBorder),
      ),
      child: Row(children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
              color: tone.iconCircleBg, shape: BoxShape.circle),
          child: Icon(icon, size: 17, color: tone.iconCircleFg),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$value',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      height: 1,
                      color: context.brandInk)),
              const SizedBox(height: 2),
              Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 11, color: context.brandMuted)),
            ],
          ),
        ),
      ]),
    );
  }
}
