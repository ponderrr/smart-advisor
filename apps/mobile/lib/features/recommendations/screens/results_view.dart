import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/services/service_providers.dart';
import '../../../ui/ui.dart';
import '../utils/match_score.dart';

/// Port of web ResultsView — the unified recommendation card list with
/// expand/collapse, "why this pick", match score, favorite, and
/// log-to-library. Trailer/music-preview media are deferred (Phase 6).
class ResultsView extends ConsumerStatefulWidget {
  const ResultsView(
      {super.key, required this.recommendations, required this.onRestart});

  final List<Recommendation> recommendations;
  final VoidCallback onRestart;

  @override
  ConsumerState<ResultsView> createState() => _ResultsViewState();
}

class _ResultsViewState extends ConsumerState<ResultsView> {
  int _expanded = 0;
  final _favorited = <String>{};
  final _logged = <String>{};

  RecType _recType(String t) => switch (t) {
        'movie' => RecType.movie,
        'music' => RecType.music,
        _ => RecType.book,
      };

  ContentAccentName _accentName(String t) => switch (t) {
        'movie' => ContentAccentName.amber,
        'music' => ContentAccentName.rose,
        _ => ContentAccentName.emerald,
      };

  String _creatorLine(Recommendation r) {
    final who = r.director ?? r.author ?? r.artist;
    final y = r.year?.toString();
    if (who != null && y != null) return 'by $who · $y';
    if (who != null) return 'by $who';
    return y ?? '';
  }

  String _shareText() => widget.recommendations
      .map((r) =>
          '${r.title}${r.year != null ? ' (${r.year})' : ''} — ${_creatorLine(r)}')
      .join('\n');

  @override
  Widget build(BuildContext context) {
    final b = Theme.of(context).brightness;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Eyebrow('Your picks'),
        const SizedBox(height: 4),
        const BrandHeading('Made for you', size: 22),
        const SizedBox(height: 12),
        for (var i = 0; i < widget.recommendations.length; i++)
          _card(widget.recommendations[i], i, b)
              .animate()
              .fadeIn(delay: (i * 90).ms, duration: 360.ms)
              .slideY(begin: 0.08, curve: Curves.easeOutCubic),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(
            child: AdaptiveButton(
                onPressed: widget.onRestart, label: 'Get another'),
          ),
          const SizedBox(width: 8),
          AdaptiveButton.icon(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: _shareText()));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Copied to clipboard')),
                );
              }
            },
            icon: Icons.share,
            style: AdaptiveButtonStyle.bordered,
          ),
        ]),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _card(Recommendation r, int i, Brightness b) {
    final c = context.colors;
    final accent = recTypeAccent(_recType(r.type), b);
    final accentName = _accentName(r.type);
    final surface = contentAccent(accentName, b);
    final ms = deriveMatchScore(id: r.id, matchScore: r.matchScore);
    final mt = matchToneColors(ms.tone, b);
    final open = _expanded == i;
    final fav = _favorited.contains(r.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: surface.surfaceGradient),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: surface.surfaceBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => setState(() => _expanded = open ? -1 : i),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _poster(r),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                              color: accent.chipBg,
                              borderRadius: BorderRadius.circular(4)),
                          child: Text(r.type.toUpperCase(),
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: accent.tileText)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                              color: mt.background,
                              borderRadius: BorderRadius.circular(999)),
                          child: Text('${ms.score}%',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: mt.foreground)),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      Text(r.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: c.foreground)),
                      Text(_creatorLine(r),
                          style: TextStyle(
                              fontSize: 12, color: c.mutedForeground)),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(fav ? Icons.favorite : Icons.favorite_border,
                      color: fav ? accent.tileText : c.mutedForeground),
                  onPressed: () => _toggleFav(r),
                ),
                Icon(open ? Icons.expand_less : Icons.expand_more,
                    color: c.mutedForeground),
              ],
            ),
          ),
          if (open) ...[
            const SizedBox(height: 12),
            if (r.explanation != null)
              WhyThisPick(accent: accentName, text: r.explanation!),
            if (r.genres.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final g in r.genres.take(4))
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                          color: c.muted,
                          borderRadius: BorderRadius.circular(999)),
                      child: Text(g,
                          style: TextStyle(
                              fontSize: 11, color: c.mutedForeground)),
                    ),
                ],
              ),
            ],
            if (r.description != null) ...[
              const SizedBox(height: 10),
              Text(r.description!,
                  style: TextStyle(fontSize: 13, color: c.foreground)),
            ],
            const SizedBox(height: 12),
            AdaptiveButton(
              onPressed:
                  _logged.contains(r.id) ? null : () => _logToLibrary(r),
              label: _logged.contains(r.id)
                  ? 'In your library'
                  : 'Log to library',
              style: AdaptiveButtonStyle.tinted,
            ),
          ],
        ],
      ),
    );
  }

  Widget _poster(Recommendation r) {
    final square = r.type == 'music';
    final w = 56.0;
    final h = square ? 56.0 : 84.0;
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: r.posterUrl != null
          ? Image.network(r.posterUrl!,
              width: w,
              height: h,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _posterFallback(w, h))
          : _posterFallback(w, h),
    );
  }

  Widget _posterFallback(double w, double h) => Container(
        width: w,
        height: h,
        color: context.colors.muted,
        child: Icon(Icons.image_not_supported,
            size: 18, color: context.colors.mutedForeground),
      );

  Future<void> _toggleFav(Recommendation r) async {
    setState(() => _favorited.contains(r.id)
        ? _favorited.remove(r.id)
        : _favorited.add(r.id));
    await ref.read(databaseServiceProvider).toggleFavorite(r.id);
  }

  Future<void> _logToLibrary(Recommendation r) async {
    final medium = switch (r.type) {
      'movie' => LibraryMedium.movie,
      'music' => LibraryMedium.music,
      _ => LibraryMedium.book,
    };
    final res = await ref.read(libraryServiceProvider).log(LogLibraryInput(
          medium: medium,
          title: r.title,
          creator: r.director ?? r.author ?? r.artist,
          year: r.year,
          posterUrl: r.posterUrl,
          sourceRecommendationId: r.id.isEmpty ? null : r.id,
          status: LibraryStatus.wishlist,
        ));
    if (!mounted) return;
    if (!res.isError) setState(() => _logged.add(r.id));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(res.isError ? res.error! : 'Added to your library'),
    ));
  }
}
