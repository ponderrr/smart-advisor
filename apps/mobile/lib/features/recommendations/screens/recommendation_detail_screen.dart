import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../utils/match_score.dart';

/// Dedicated pick detail page (parity with the web recommendation detail):
/// large poster, why-this-pick, genres, description, favorite + log.
class RecommendationDetailScreen extends ConsumerStatefulWidget {
  const RecommendationDetailScreen({super.key, required this.rec});
  final Recommendation rec;

  @override
  ConsumerState<RecommendationDetailScreen> createState() => _S();
}

class _S extends ConsumerState<RecommendationDetailScreen> {
  late bool _fav = widget.rec.isFavorited;
  bool _logged = false;

  ContentAccentName get _accentName => switch (widget.rec.type) {
        'movie' => ContentAccentName.amber,
        'music' => ContentAccentName.rose,
        _ => ContentAccentName.emerald,
      };

  @override
  Widget build(BuildContext context) {
    final r = widget.rec;
    final b = Theme.of(context).brightness;
    final tone = contentAccent(_accentName, b);
    final ms = deriveMatchScore(id: r.id, matchScore: r.matchScore);
    final mt = matchToneColors(ms.tone, b);
    final who = r.director ?? r.author ?? r.artist;

    return BrandScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_fav ? Icons.favorite : Icons.favorite_border,
                color: _fav ? tone.text : context.brandMuted),
            onPressed: () async {
              setState(() => _fav = !_fav);
              await ref
                  .read(databaseServiceProvider)
                  .toggleFavorite(r.id);
              showBanner(_fav
                  ? '“${r.title}” added to favorites'
                  : '“${r.title}” removed from favorites');
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        children: [
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: r.posterUrl != null
                  ? Image.network(r.posterUrl!,
                      height: 260, fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          _posterFallback(context))
                  : _posterFallback(context),
            ),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: tone.iconCircleBg,
                  borderRadius: BorderRadius.circular(999)),
              child: Text(r.type.toUpperCase(),
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: tone.iconCircleFg)),
            ),
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: mt.background,
                  borderRadius: BorderRadius.circular(999)),
              child: Text('${ms.score}% match',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: mt.foreground)),
            ),
          ]),
          const SizedBox(height: 12),
          BrandHeading(r.title, size: 26),
          if (who != null || r.year != null) ...[
            const SizedBox(height: 4),
            Subtitle(
                '${who ?? ''}${who != null && r.year != null ? ' · ' : ''}'
                '${r.year ?? ''}'),
          ],
          if (r.explanation != null) ...[
            const SizedBox(height: 18),
            WhyThisPick(accent: _accentName, text: r.explanation!),
          ],
          if (r.genres.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final g in r.genres)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                        color: context.colors.muted,
                        borderRadius: BorderRadius.circular(999)),
                    child: Text(g,
                        style: TextStyle(
                            fontSize: 12, color: context.brandMuted)),
                  ),
              ],
            ),
          ],
          if (r.description != null) ...[
            const SizedBox(height: 18),
            const Eyebrow('About'),
            const SizedBox(height: 8),
            Text(r.description!,
                style: TextStyle(
                    fontSize: 14, height: 1.5, color: context.brandInk)),
          ],
          const SizedBox(height: 24),
          AdaptiveButton(
            onPressed: _logged ? null : _log,
            label: _logged ? 'In your library' : 'Log to library',
            style: AdaptiveButtonStyle.tinted,
          ),
          const SizedBox(height: 10),
          AdaptiveButton(
            onPressed: () => Clipboard.setData(ClipboardData(
                text: '${r.title}'
                    '${r.year != null ? ' (${r.year})' : ''}'
                    '${who != null ? ' — $who' : ''}')),
            label: 'Copy to share',
            style: AdaptiveButtonStyle.bordered,
          ),
        ],
      ),
    );
  }

  Widget _posterFallback(BuildContext context) => Container(
        height: 260,
        width: 180,
        color: context.colors.muted,
        child: Icon(Icons.image_not_supported_outlined,
            color: context.brandMuted, size: 32),
      );

  Future<void> _log() async {
    final r = widget.rec;
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
    if (!res.isError) setState(() => _logged = true);
    showBanner(
        res.isError ? res.error! : '“${r.title}” added to your library');
  }
}
