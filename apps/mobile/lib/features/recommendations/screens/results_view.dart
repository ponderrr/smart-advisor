import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/ui_messenger.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/services/service_providers.dart';
import '../../../ui/ui.dart';
import '../services/refinement_input.dart';
import '../utils/match_score.dart';

/// Port of web ResultsView — the unified recommendation card list with
/// expand/collapse, "why this pick", match score, favorite, and
/// log-to-library. Trailer/music-preview media are deferred (Phase 6).
class ResultsView extends ConsumerStatefulWidget {
  const ResultsView({
    super.key,
    required this.recommendations,
    required this.onRestart,
    this.onRefine,
  });

  final List<Recommendation> recommendations;
  final VoidCallback onRestart;

  /// Conversational refinement: re-runs generation with the original quiz
  /// context plus the user's free-text steer. Null → no "Refine" entry
  /// (e.g. a caller that doesn't own the quiz state machine).
  final Future<void> Function(RefinementInput)? onRefine;

  @override
  ConsumerState<ResultsView> createState() => _ResultsViewState();
}

class _ResultsViewState extends ConsumerState<ResultsView> {
  final int _expanded = -1; // inline expand off — tap opens detail page
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
        ResponsiveTiles(
          minTileWidth: 360,
          maxColumns: 3,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (var i = 0; i < widget.recommendations.length; i++)
              _card(widget.recommendations[i], i, b)
                  .animate()
                  .fadeIn(delay: (i * 90).ms, duration: 360.ms)
                  .slideY(begin: 0.08, curve: Curves.easeOutCubic),
          ],
        ),
        const SizedBox(height: 8),
        if (widget.onRefine != null) ...[
          AdaptiveButton(
            onPressed: _openRefineSheet,
            label: 'Refine these',
            style: AdaptiveButtonStyle.tinted,
          ),
          const SizedBox(height: 8),
        ],
        Row(children: [
          Expanded(
            child: AdaptiveButton(
                onPressed: widget.onRestart, label: 'Get another'),
          ),
          const SizedBox(width: 8),
          Semantics(
            button: true,
            label: 'Share your picks',
            child: AdaptiveButton.icon(
              onPressed: () => SharePlus.instance
                  .share(ShareParams(text: _shareText())),
              icon: Icons.share,
              style: AdaptiveButtonStyle.bordered,
            ),
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

    return AdaptiveContextMenu(
      actions: [
        AdaptiveContextMenuAction(
          title: fav ? 'Remove favorite' : 'Favorite',
          icon: fav ? Icons.favorite : Icons.favorite_border,
          onPressed: () => _toggleFav(r),
        ),
        AdaptiveContextMenuAction(
          title: 'Log to library',
          icon: Icons.bookmark_add_outlined,
          onPressed: () => _logToLibrary(r),
        ),
        AdaptiveContextMenuAction(
          title: 'Share',
          icon: Icons.ios_share,
          onPressed: () => SharePlus.instance
              .share(ShareParams(text: _shareText())),
        ),
      ],
      child: Container(
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
            onTap: () => context.push('/pick', extra: r),
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
                Semantics(
                  button: true,
                  label: fav
                      ? 'Remove “${r.title}” from favorites'
                      : 'Add “${r.title}” to favorites',
                  child: AdaptiveButton.icon(
                    style: AdaptiveButtonStyle.plain,
                    icon: fav ? Icons.favorite : Icons.favorite_border,
                    iconColor:
                        fav ? accent.tileText : c.mutedForeground,
                    onPressed: () => _toggleFav(r),
                  ),
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
              semanticLabel: '${r.title} cover',
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

  /// Free-text steer + quick-tap chips. On submit, pops the sheet then
  /// hands the feedback + already-seen titles to the quiz state machine
  /// (via onRefine), which replays the original context with the steer.
  Future<void> _openRefineSheet() async {
    final onRefine = widget.onRefine;
    if (onRefine == null) return;
    final text = TextEditingController();
    // Append a chip's word to the steer without clobbering free text.
    void addChip(StateSetter setSB, String word) {
      final cur = text.text.trim();
      final has = cur
          .toLowerCase()
          .split(RegExp(r'[\s,]+'))
          .contains(word.toLowerCase());
      if (has) return;
      setSB(() {
        text.text = cur.isEmpty ? word : '$cur, $word';
        text.selection = TextSelection.collapsed(
            offset: text.text.length);
      });
    }

    const chips = [
      'Lighter',
      'Darker',
      'Shorter',
      'More obscure',
      'More popular',
    ];
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (_, setSB) => Container(
          padding: EdgeInsets.fromLTRB(
              20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          decoration: BoxDecoration(
            color: brandBg(Theme.of(ctx).brightness),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                  color: ctx.colors.border,
                  borderRadius: BorderRadius.circular(999)),
            ),
            const Align(
                alignment: Alignment.centerLeft,
                child: Eyebrow('Refine')),
            const SizedBox(height: 4),
            const Align(
                alignment: Alignment.centerLeft,
                child: BrandHeading('Tweak these picks', size: 20)),
            const SizedBox(height: 12),
            AdaptiveTextField(
              controller: text,
              maxLines: 3,
              placeholder:
                  'e.g. more like Dune, lighter, nothing over 2 hours',
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final c in chips)
                    GestureDetector(
                      onTap: () => addChip(setSB, c),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: ctx.colors.muted,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(c,
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: ctx.colors.mutedForeground)),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(
                child: AdaptiveButton(
                    onPressed: () => Navigator.pop(ctx),
                    label: 'Cancel',
                    style: AdaptiveButtonStyle.bordered),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: AdaptiveButton(
                  onPressed: () {
                    final fb = text.text.trim();
                    if (fb.isEmpty) return;
                    Navigator.pop(ctx);
                    onRefine(RefinementInput(
                      feedbackText: fb,
                      previousTitles: widget.recommendations
                          .map((r) => r.title)
                          .toList(),
                    ));
                  },
                  label: 'Refine',
                ),
              ),
            ]),
          ]),
        ),
      ),
    );
    text.dispose();
  }

  Future<void> _toggleFav(Recommendation r) async {
    final nowFav = !_favorited.contains(r.id);
    setState(() => nowFav ? _favorited.add(r.id) : _favorited.remove(r.id));
    await ref.read(databaseServiceProvider).toggleFavorite(r.id);
    showBanner(nowFav
        ? '“${r.title}” added to favorites'
        : '“${r.title}” removed from favorites');
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
    showBanner(res.isError ? res.error! : '“${r.title}” added to your library');
  }
}
