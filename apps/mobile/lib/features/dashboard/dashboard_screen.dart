import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../ui/ui.dart';
import '../recommendations/services/database_service.dart';

final _dashboardRecsProvider =
    FutureProvider.autoDispose<List<Recommendation>>((ref) async {
  final res = await ref
      .watch(databaseServiceProvider)
      .getUserRecommendations(const RecommendationFilter(limit: 60));
  return res.data ?? const [];
});

/// Port of the web dashboard overview: stats, 14-day activity sparkline,
/// top-genre bars, recent picks. Charts via fl_chart.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recs = ref.watch(_dashboardRecsProvider);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const Eyebrow('Dashboard'),
        const SizedBox(height: 4),
        const BrandHeading('Your taste, so far', size: 24),
        const SizedBox(height: 16),
        recs.when(
          loading: () => const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: LoaderFive('Loading'))),
          error: (e, _) => Subtitle('Could not load: $e'),
          data: (list) => Column(children: [
            _stats(context, list),
            const SizedBox(height: 16),
            _sparkline(context, list),
            const SizedBox(height: 16),
            _genres(context, list),
            const SizedBox(height: 16),
            _recent(context, list),
          ]),
        ),
      ],
    );
  }

  Widget _stats(BuildContext context, List<Recommendation> r) {
    int by(String t) => r.where((x) => x.type == t).length;
    final cells = [
      ('Total', r.length),
      ('Favorites', r.where((x) => x.isFavorited).length),
      ('Movies', by('movie')),
      ('Books', by('book')),
      ('Music', by('music')),
    ];
    return BrandCard(
      child: Wrap(
        spacing: 24,
        runSpacing: 16,
        children: [
          for (final (label, n) in cells)
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('$n',
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: context.brandInk)),
              Text(label,
                  style:
                      TextStyle(fontSize: 12, color: context.brandMuted)),
            ]),
        ],
      ),
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
    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Last 14 days'),
          const SizedBox(height: 12),
          SizedBox(
            height: 80,
            child: LineChart(LineChartData(
              gridData: const FlGridData(show: false),
              titlesData: const FlTitlesData(show: false),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: [
                    for (var i = 0; i < counts.length; i++)
                      FlSpot(i.toDouble(), counts[i].toDouble()),
                  ],
                  isCurved: true,
                  barWidth: 2,
                  color: Tw.indigo500,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                      show: true,
                      color: Tw.indigo500.withValues(alpha: 0.12)),
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
        if (k.isEmpty) continue;
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    final top = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final shown = top.take(6).toList();
    if (shown.isEmpty) {
      return BrandCard(child: Subtitle('No genres yet — take a quiz.'));
    }
    final maxV = shown.first.value.toDouble();
    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Top genres'),
          const SizedBox(height: 12),
          SizedBox(
            height: 160,
            child: BarChart(BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: maxV,
              gridData: const FlGridData(show: false),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) {
                      final i = v.toInt();
                      if (i < 0 || i >= shown.length) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                            shown[i].key.length > 8
                                ? '${shown[i].key.substring(0, 8)}…'
                                : shown[i].key,
                            style: TextStyle(
                                fontSize: 9, color: context.brandMuted)),
                      );
                    },
                  ),
                ),
              ),
              barGroups: [
                for (var i = 0; i < shown.length; i++)
                  BarChartGroupData(x: i, barRods: [
                    BarChartRodData(
                        toY: shown[i].value.toDouble(),
                        color: Tw.indigo500,
                        width: 14,
                        borderRadius: BorderRadius.circular(3)),
                  ]),
              ],
            )),
          ),
        ],
      ),
    );
  }

  Widget _recent(BuildContext context, List<Recommendation> r) {
    final recent = r.take(5).toList();
    return BrandCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Recent picks'),
          const SizedBox(height: 8),
          if (recent.isEmpty)
            Subtitle('Nothing yet — take a quiz to get picks.')
          else
            for (final x in recent)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(children: [
                  Icon(
                      x.type == 'movie'
                          ? Icons.movie_outlined
                          : x.type == 'music'
                              ? Icons.music_note_outlined
                              : Icons.menu_book_outlined,
                      size: 18,
                      color: context.brandMuted),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Text(x.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: context.brandInk))),
                  if (x.isFavorited)
                    const Icon(Icons.favorite, size: 14, color: Tw.rose500),
                ]),
              ),
        ],
      ),
    );
  }
}
