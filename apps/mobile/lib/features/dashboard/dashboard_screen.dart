import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/recommendation.dart';
import '../../core/services/service_providers.dart';
import '../../ui/ui.dart';
import '../auth/auth_providers.dart';
import '../recommendations/services/database_service.dart';
import '../recommendations/utils/match_score.dart';
import 'milestones.dart';

final _dashboardRecsProvider =
    FutureProvider.autoDispose<List<Recommendation>>((ref) async {
  final res = await ref
      .watch(databaseServiceProvider)
      .getUserRecommendations(const RecommendationFilter(limit: 60));
  return res.data ?? const [];
});

/// Web-faithful dashboard: hero, accent stat tiles, a top-genres chart,
/// and rich recent-pick cards (poster, creator, match, genres).
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recs = ref.watch(_dashboardRecsProvider);
    final name = ref.watch(currentProfileProvider).asData?.value?.name;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      children: [
        const SizedBox(height: 8),
        _hero(context, name),
        const SizedBox(height: 16),
        recs.when(
          loading: () => const Padding(
              padding: EdgeInsets.all(48),
              child: Center(child: LoaderFive('Loading'))),
          error: (e, _) => const MessageBanner.error(
              'We couldn’t load your picks right now. '
              'Please try again in a moment.'),
          data: (list) => list.isEmpty
              ? _empty(context)
              : Column(children: [
                  _statGrid(context, list),
                  const SizedBox(height: 14),
                  _genres(context, list),
                  const SizedBox(height: 14),
                  _milestonesSummary(context, ref),
                  const SizedBox(height: 22),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Eyebrow('Recent picks'),
                  ),
                  const SizedBox(height: 10),
                  for (var i = 0; i < list.take(4).length; i++)
                    _pickCard(context, list[i])
                        .animate()
                        .fadeIn(delay: (i * 70).ms, duration: 300.ms)
                        .slideY(begin: 0.06, curve: Curves.easeOut),
                ]),
        ),
      ],
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /// Web-style hero: greeting + name, a line about the app, and the
  /// primary "Start a quiz" call to action.
  Widget _hero(BuildContext context, String? name) {
    final tone = contentAccent(ContentAccentName.violet,
        Theme.of(context).brightness);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: tone.surfaceGradient),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: tone.surfaceBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Your taste'),
          const SizedBox(height: 8),
          BrandHeading(
            name == null || name.isEmpty
                ? '${_greeting()}.'
                : '${_greeting()}, $name.',
            size: 26,
          ),
          const SizedBox(height: 6),
          Subtitle('A snapshot of what you\'re into.'),
        ],
      ),
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
    final top = [
      ('Total', r.length, Icons.bookmark_outline, ContentAccentName.violet),
      ('Favorites', r.where((x) => x.isFavorited).length, Icons.favorite,
          ContentAccentName.rose),
    ];
    final byType = [
      ('Movies', by('movie'), Icons.movie_outlined,
          ContentAccentName.amber),
      ('Books', by('book'), Icons.menu_book_outlined,
          ContentAccentName.emerald),
      ('Music', by('music'), Icons.music_note_outlined,
          ContentAccentName.rose),
    ];
    Widget tile((String, int, IconData, ContentAccentName) t) => _StatTile(
        label: t.$1, value: t.$2, icon: t.$3, accent: t.$4);
    return Column(children: [
      Row(children: [
        Expanded(child: tile(top[0])),
        const SizedBox(width: 12),
        Expanded(child: tile(top[1])),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        for (var i = 0; i < byType.length; i++) ...[
          if (i > 0) const SizedBox(width: 12),
          Expanded(child: tile(byType[i])),
        ],
      ]),
    ]);
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

  /// Compact milestones summary (web overview parity): earned count +
  /// tap-through to the full grid.
  Widget _milestonesSummary(BuildContext context, WidgetRef ref) {
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    final data = ref.watch(milestonesProvider);
    final summary = data.maybeWhen(
      data: (d) => '${d.earned} of ${d.total} earned',
      orElse: () => '—',
    );
    return GestureDetector(
      onTap: () => context.push('/milestones'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(Icons.emoji_events_outlined,
                color: tone.iconCircleFg, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('Milestones'),
                const SizedBox(height: 4),
                Text(summary,
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: context.brandInk)),
                const SizedBox(height: 2),
                Text('See every milestone, grouped by tier.',
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: context.brandMuted),
        ]),
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

    return GestureDetector(
      onTap: () => context.push('/pick', extra: r),
      child: Container(
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
        PosterThumb(
            url: r.posterUrl,
            square: r.type == 'music',
            w: 50,
            semanticLabel: '${r.title} cover'),
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
      ),
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
