import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../services/tmdb_service.dart';
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
  String? _trailerUrl;
  WatchProviders? _watch;
  AudioPlayer? _audio;
  bool _previewPlaying = false;

  @override
  void initState() {
    super.initState();
    if (widget.rec.type == 'movie') _loadTrailer();
  }

  @override
  void dispose() {
    _audio?.dispose();
    super.dispose();
  }

  Future<void> _loadTrailer() async {
    try {
      final m = await ref
          .read(tmdbServiceProvider)
          .searchMovie(widget.rec.title);
      if (!mounted) return;
      final wp = m.watchProviders;
      if (m.trailer != null || (wp != null && !wp.isEmpty)) {
        setState(() {
          _trailerUrl = m.trailer;
          _watch = (wp != null && !wp.isEmpty) ? wp : null;
        });
      }
    } catch (_) {/* no trailer / availability */}
  }

  Future<void> _togglePreview(String url) async {
    _audio ??= AudioPlayer();
    if (_previewPlaying) {
      await _audio!.pause();
      setState(() => _previewPlaying = false);
    } else {
      await _audio!.play(UrlSource(url));
      setState(() => _previewPlaying = true);
      _audio!.onPlayerComplete.listen((_) {
        if (mounted) setState(() => _previewPlaying = false);
      });
    }
  }

  ContentAccentName get _accentName => switch (widget.rec.type) {
        'movie' => ContentAccentName.amber,
        'music' => ContentAccentName.rose,
        _ => ContentAccentName.emerald,
      };

  @override
  Widget build(BuildContext context) {
    final r = widget.rec;
    final b = Theme.of(context).brightness;
    final accent =
        ref.watch(posterAccentProvider(r.posterUrl ?? '')).asData?.value;
    final tone = contentAccent(_accentName, b);
    final ms = deriveMatchScore(id: r.id, matchScore: r.matchScore);
    final mt = matchToneColors(ms.tone, b);
    final who = r.director ?? r.author ?? r.artist;

    return BrandScaffold(
      title: r.type[0].toUpperCase() + r.type.substring(1),
      actions: [
        AdaptiveAppBarAction(
          icon: _fav ? Icons.favorite : Icons.favorite_border,
          iosSymbol: _fav ? 'heart.fill' : 'heart',
          onPressed: () async {
            setState(() => _fav = !_fav);
            await ref.read(databaseServiceProvider).toggleFavorite(r.id);
            showBanner(_fav
                ? '“${r.title}” added to favorites'
                : '“${r.title}” removed from favorites');
          },
        ),
      ],
      body: Stack(
        children: [
          _backdrop(accent, b),
          ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        children: [
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: r.posterUrl != null
                  ? Image.network(r.posterUrl!,
                      height: 260, fit: BoxFit.cover,
                      semanticLabel: '${r.title} cover',
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
          if (r.type == 'movie' && _trailerUrl != null) ...[
            AdaptiveButton.child(
              onPressed: () => launchUrl(Uri.parse(_trailerUrl!),
                  mode: LaunchMode.externalApplication),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.play_circle_outline,
                      color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text('Watch trailer',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          if (r.type == 'movie' && _watch != null) ...[
            _WhereToWatch(_watch!),
            const SizedBox(height: 10),
          ],
          if (r.type == 'music' && r.previewUrl != null) ...[
            AdaptiveButton.child(
              onPressed: () => _togglePreview(r.previewUrl!),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                      _previewPlaying
                          ? Icons.pause_circle_outline
                          : Icons.play_circle_outline,
                      color: Colors.white,
                      size: 18),
                  const SizedBox(width: 8),
                  Text(_previewPlaying ? 'Pause preview' : 'Play preview',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
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
        ],
      ),
    );
  }

  Widget _backdrop(Color? accent, Brightness b) {
    final dark = b == Brightness.dark;
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      height: 360,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeOut,
        opacity: accent == null ? 0 : 1,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                (accent ?? Colors.transparent)
                    .withValues(alpha: dark ? 0.42 : 0.30),
                Colors.transparent,
              ],
            ),
          ),
        ),
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

/// Streaming / rent / buy availability (TMDB → JustWatch). Tapping opens
/// the JustWatch page; the "via JustWatch" caption is the required
/// attribution for this data.
class _WhereToWatch extends StatelessWidget {
  const _WhereToWatch(this.wp);
  final WatchProviders wp;

  @override
  Widget build(BuildContext context) {
    final link = wp.link;
    Widget row(String label, List<String> names) {
      if (names.isEmpty) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 56,
              child: Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.brandMuted)),
            ),
            Expanded(
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final n in names)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: context.colors.muted,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(n,
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: context.brandInk)),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          const Expanded(child: Eyebrow('Where to watch')),
          if (link != null)
            Icon(Icons.open_in_new, size: 14, color: context.brandMuted),
        ]),
        row('Stream', wp.flatrate),
        row('Rent', wp.rent),
        row('Buy', wp.buy),
        const SizedBox(height: 8),
        Text('via JustWatch',
            style: TextStyle(fontSize: 10, color: context.brandMuted)),
      ],
    );

    final card = BrandCard(
        padding: const EdgeInsets.all(14),
        child: SizedBox(width: double.infinity, child: body));
    if (link == null) return card;
    return Semantics(
      button: true,
      label: 'Where to watch. Opens JustWatch',
      child: GestureDetector(
        onTap: () => launchUrl(Uri.parse(link),
            mode: LaunchMode.externalApplication),
        child: card,
      ),
    );
  }
}
