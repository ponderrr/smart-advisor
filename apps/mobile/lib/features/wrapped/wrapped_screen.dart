import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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

/// Year-in-review (default) or a lighter month-in-review recap — same
/// stories + shareable card, just a different time window.
enum WrappedPeriod { year, month }

class WrappedScreen extends ConsumerWidget {
  const WrappedScreen({super.key, this.period = WrappedPeriod.year});
  final WrappedPeriod period;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recs = ref.watch(_wrappedProvider);
    return Scaffold(
      backgroundColor: Colors.black,
      body: recs.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: Colors.white)),
        error: (e, _) => const Center(
            child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                    'We couldn’t build your Wrapped right now. '
                    'Please try again later.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white70)))),
        data: (list) => _Story(recs: list, period: period),
      ),
    );
  }
}

class _Slide {
  const _Slide(this.colors, this.builder);
  final List<Color> colors;
  final Widget Function(BuildContext) builder;
}

class _Story extends StatefulWidget {
  const _Story({required this.recs, required this.period});
  final List<Recommendation> recs;
  final WrappedPeriod period;

  @override
  State<_Story> createState() => _StoryState();
}

class _StoryState extends State<_Story> {
  int _i = 0;
  Timer? _timer;
  final _shotKey = GlobalKey();

  static const _slideDuration = Duration(seconds: 5);

  late final List<_Slide> _slides = _build();

  @override
  void initState() {
    super.initState();
    _arm();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _arm() {
    _timer?.cancel();
    _timer = Timer(_slideDuration, () => _go(1));
  }

  void _go(int d) {
    final n = _i + d;
    if (n < 0) return;
    if (n >= _slides.length) return;
    setState(() => _i = n);
    _arm();
  }

  static const _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
  ];
  final DateTime _now = DateTime.now();
  bool get _isMonth => widget.period == WrappedPeriod.month;
  // Headline label: "2026" for the year, "May 2026" for the month.
  String get _periodTitle => _isMonth
      ? '${_monthNames[_now.month - 1]} ${_now.year}'
      : '${_now.year}';
  // Used in copy like "This <year/month>" / "a favorite this <…>".
  String get _scopeWord => _isMonth ? 'month' : 'year';

  List<_Slide> _build() {
    final yr = widget.recs.where((r) {
      final dt = DateTime.tryParse(r.createdAt);
      if (dt == null || dt.year != _now.year) return false;
      return !_isMonth || dt.month == _now.month;
    }).toList();
    int by(String t) => yr.where((x) => x.type == t).length;
    final genres = <String, int>{};
    final creators = <String, int>{};
    for (final r in yr) {
      for (final g in r.genres) {
        final k = g.trim();
        if (k.isNotEmpty) genres[k] = (genres[k] ?? 0) + 1;
      }
      final who = r.director ?? r.author ?? r.artist;
      if (who != null && who.isNotEmpty) {
        creators[who] = (creators[who] ?? 0) + 1;
      }
    }
    final topGenres = (genres.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value)))
        .take(3)
        .map((e) => e.key)
        .toList();
    final topCreator = creators.isEmpty
        ? null
        : (creators.entries.toList()
              ..sort((a, b) => b.value.compareTo(a.value)))
            .first
            .key;
    final fav = yr.where((r) => r.isFavorited).toList();
    final standout =
        fav.isNotEmpty ? fav.first : (yr.isNotEmpty ? yr.first : null);

    // Per-medium representative pick: first item with a usable cover.
    Recommendation? firstByType(String t) {
      for (final r in yr) {
        if (r.type == t && (r.posterUrl?.isNotEmpty ?? false)) return r;
      }
      return null;
    }

    List<Recommendation> worksByCreator(String name) => yr
        .where((r) =>
            (r.director ?? r.author ?? r.artist) == name &&
            (r.posterUrl?.isNotEmpty ?? false))
        .toList();

    // Distinct poster URLs across the period — drives the intro
    // collage backdrop and the share-card thumb strip.
    final allPosters = <String>{
      for (final r in yr)
        if (r.posterUrl != null && r.posterUrl!.isNotEmpty) r.posterUrl!,
    }.toList();

    Widget big(String kicker, String value, String label) => Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(kicker.toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white70,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3,
                        fontSize: 13))
                .animate()
                .fadeIn(duration: 400.ms),
            const SizedBox(height: 10),
            Text(value,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        height: 1,
                        fontSize: 72))
                .animate()
                .fadeIn(delay: 150.ms, duration: 500.ms)
                .slideY(begin: 0.15, curve: Curves.easeOut),
            const SizedBox(height: 10),
            Text(label,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 20, height: 1.3))
                .animate()
                .fadeIn(delay: 350.ms, duration: 450.ms),
          ],
        );

    return [
      // Intro — emojis + headline floating over a low-opacity
      // backdrop of the period's posters so the screen reads as
      // "your year/month in covers" the moment it opens.
      _Slide(const [Tw.indigo500, Tw.violet600], (_) {
        return Stack(
          fit: StackFit.expand,
          children: [
            _posterBackdrop(allPosters),
            Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('🎬 📚 🎧', style: TextStyle(fontSize: 44))
                    .animate()
                    .scale(duration: 500.ms, curve: Curves.easeOutBack),
                const SizedBox(height: 16),
                Text('Your $_periodTitle\nWrapped',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 40,
                            height: 1.1,
                            fontWeight: FontWeight.w900,
                            shadows: [
                              Shadow(blurRadius: 16, color: Colors.black54),
                            ]))
                    .animate()
                    .fadeIn(delay: 200.ms),
              ]),
            ),
          ],
        );
      }),
      _Slide(const [Tw.violet600, Tw.rose500],
          (_) => big('This $_scopeWord', '${yr.length}',
              'recommendations you got')),
      // Mix — three mini-posters above their counts.
      _Slide(const [Tw.amber500, Tw.orange500], (_) {
        return _mixSlide(
          firstByType('movie'),
          firstByType('book'),
          firstByType('music'),
          by('movie'),
          by('book'),
          by('music'),
        );
      }),
      _Slide(const [Tw.emerald500, Tw.teal500],
          (_) => big('Your vibe', topGenres.isEmpty ? '—' : topGenres.first,
              topGenres.length > 1
                  ? 'also ${topGenres.skip(1).join(', ')}'
                  : 'your top genre')),
      // On repeat — creator name plus a row of their cover-art works.
      _Slide(const [Tw.rose500, Tw.fuchsia500], (_) {
        final works =
            topCreator == null ? <Recommendation>[] : worksByCreator(topCreator);
        return _creatorSlide(topCreator ?? '—', works);
      }),
      // Standout — single large poster with the title underneath.
      _Slide(const [Tw.indigo900, Tw.violet600],
          (_) => _standoutSlide(standout)),
      _Slide(const [Tw.indigo500, Tw.rose500],
          (_) => _outro(yr.length, allPosters)),
    ];
  }

  /// Cover thumbnail with a tinted fallback that matches the slide so
  /// missing covers don't punch a hole in the layout. Network errors
  /// and missing URLs both go to the same fallback.
  Widget _poster(String? url,
          {double w = 96, double h = 144, double radius = 10}) =>
      ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: SizedBox(
          width: w,
          height: h,
          child: url == null || url.isEmpty
              ? _posterFallback()
              : Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => _posterFallback(),
                  loadingBuilder: (_, child, p) =>
                      p == null ? child : ColoredBox(color: Colors.white12),
                ),
        ),
      );

  Widget _posterFallback() => DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.white24, Color(0x14FFFFFF)],
          ),
        ),
        child: const Center(
          child: Icon(Icons.movie_filter_outlined,
              color: Colors.white54, size: 22),
        ),
      );

  /// Drifting wall of small posters at low opacity, used behind the
  /// intro headline. Empty list → renders nothing so the gradient
  /// still reads clean on a brand-new account.
  Widget _posterBackdrop(List<String> urls) {
    if (urls.isEmpty) return const SizedBox.shrink();
    return IgnorePointer(
      child: Opacity(
        opacity: 0.22,
        child: OverflowBox(
          maxWidth: double.infinity,
          maxHeight: double.infinity,
          child: Wrap(
            alignment: WrapAlignment.center,
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final u in urls.take(18))
                _poster(u, w: 58, h: 86, radius: 6),
            ],
          ),
        ).animate().fadeIn(duration: 800.ms),
      ),
    );
  }

  Widget _mixSlide(Recommendation? m, Recommendation? b, Recommendation? mu,
      int movies, int books, int music) {
    Widget cell(Recommendation? r, String label, int n) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _poster(r?.posterUrl, w: 84, h: 124, radius: 10),
          const SizedBox(height: 10),
          Text('$n',
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  height: 1,
                  fontSize: 26)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ],
      );
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('YOUR MIX',
                style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    fontSize: 13))
            .animate()
            .fadeIn(duration: 400.ms),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            cell(m, 'Movies', movies),
            cell(b, 'Books', books),
            cell(mu, 'Music', music),
          ],
        )
            .animate()
            .fadeIn(delay: 150.ms, duration: 500.ms)
            .slideY(begin: 0.15, curve: Curves.easeOut),
        const SizedBox(height: 18),
        Text('your $_scopeWord, in three covers',
                style: const TextStyle(
                    color: Colors.white, fontSize: 18, height: 1.3))
            .animate()
            .fadeIn(delay: 350.ms),
      ],
    );
  }

  Widget _creatorSlide(String name, List<Recommendation> works) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ON REPEAT',
                style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    fontSize: 13))
            .animate()
            .fadeIn(duration: 400.ms),
        const SizedBox(height: 10),
        Text(name,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 1,
                    fontSize: 44))
            .animate()
            .fadeIn(delay: 150.ms, duration: 500.ms)
            .slideY(begin: 0.15, curve: Curves.easeOut),
        const SizedBox(height: 8),
        const Text('your most-recommended creator',
                style: TextStyle(
                    color: Colors.white, fontSize: 18, height: 1.3))
            .animate()
            .fadeIn(delay: 300.ms),
        if (works.isNotEmpty) ...[
          const SizedBox(height: 22),
          SizedBox(
            height: 128,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: works.length > 6 ? 6 : works.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, i) =>
                  _poster(works[i].posterUrl, w: 84, h: 126, radius: 10),
            ),
          )
              .animate()
              .fadeIn(delay: 450.ms, duration: 500.ms)
              .slideX(begin: 0.06, curve: Curves.easeOut),
        ],
      ],
    );
  }

  Widget _standoutSlide(Recommendation? standout) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text('STANDOUT',
                style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    fontSize: 13))
            .animate()
            .fadeIn(duration: 400.ms),
        const SizedBox(height: 18),
        if (standout != null)
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.45),
                  blurRadius: 28,
                  offset: const Offset(0, 14),
                ),
              ],
            ),
            child: _poster(standout.posterUrl,
                w: 200, h: 290, radius: 14),
          )
              .animate()
              .fadeIn(delay: 150.ms, duration: 500.ms)
              .scale(
                  begin: const Offset(0.92, 0.92),
                  end: const Offset(1, 1),
                  curve: Curves.easeOut),
        const SizedBox(height: 22),
        Text(
          standout?.title ?? '—',
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              height: 1.05,
              fontSize: 28),
        ).animate().fadeIn(delay: 350.ms),
        const SizedBox(height: 8),
        Text(
                standout != null
                    ? 'a favorite this $_scopeWord'
                    : 'take a quiz!',
                style: const TextStyle(
                    color: Colors.white, fontSize: 17, height: 1.3))
            .animate()
            .fadeIn(delay: 500.ms),
      ],
    );
  }

  Widget _outro(int total, List<String> posters) {
    final strip = posters.take(5).toList();
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        RepaintBoundary(
          key: _shotKey,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Tw.indigo500, Tw.violet600, Tw.rose500]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              if (strip.isNotEmpty) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (final u in strip)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _poster(u, w: 44, h: 64, radius: 6),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
              ],
              Text('$_periodTitle Wrapped',
                  style: const TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 3)),
              const SizedBox(height: 10),
              Text('$total picks',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 44,
                      fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              const Text('Smart Advisor',
                  style: TextStyle(color: Colors.white70)),
            ]),
          ),
        ),
        const SizedBox(height: 24),
        AdaptiveButton.child(
          onPressed: _share,
          color: Colors.white,
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.ios_share, color: Colors.black, size: 18),
              SizedBox(width: 8),
              Text('Share',
                  style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        AdaptiveButton.child(
          onPressed: () => context.pop(),
          style: AdaptiveButtonStyle.plain,
          child: const Text('Done',
              style: TextStyle(color: Colors.white70)),
        ),
      ],
    );
  }

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
            mimeType: 'image/png', name: 'wrapped.png')
      ],
      text: 'My Smart Advisor $_periodTitle Wrapped',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final s = _slides[_i];
    return Semantics(
      label: 'Wrapped story, slide ${_i + 1} of ${_slides.length}',
      hint: 'Swipe up for next, swipe down for previous',
      onTap: () => _go(1),
      onIncrease: () => _go(1),
      onDecrease: () => _go(-1),
      child: GestureDetector(
      onTapUp: (e) {
        final w = MediaQuery.sizeOf(context).width;
        _go(e.globalPosition.dx < w * 0.32 ? -1 : 1);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 450),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: s.colors),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(10),
                child: Row(
                  children: [
                    for (var k = 0; k < _slides.length; k++)
                      Expanded(
                        child: Container(
                          height: 3,
                          margin:
                              const EdgeInsets.symmetric(horizontal: 2),
                          decoration: BoxDecoration(
                            color: k <= _i
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  key: ValueKey(_i),
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 28),
                  child: s.builder(context),
                ),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
