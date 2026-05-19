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

class WrappedScreen extends ConsumerWidget {
  const WrappedScreen({super.key});

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
        data: (list) => _Story(recs: list),
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
  const _Story({required this.recs});
  final List<Recommendation> recs;

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

  final int _year = DateTime.now().year;

  List<_Slide> _build() {
    final yr = widget.recs.where((r) {
      final dt = DateTime.tryParse(r.createdAt);
      return dt != null && dt.year == _year;
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
    String top(Map<String, int> m) => m.isEmpty
        ? '—'
        : (m.entries.toList()
              ..sort((a, b) => b.value.compareTo(a.value)))
            .first
            .key;
    final topGenres = (genres.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value)))
        .take(3)
        .map((e) => e.key)
        .toList();
    final fav = yr.where((r) => r.isFavorited).toList();
    final standout = fav.isNotEmpty ? fav.first : (yr.isNotEmpty ? yr.first : null);

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
      _Slide(const [Tw.indigo500, Tw.violet600], (_) {
        return Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('🎬 📚 🎧',
                    style: TextStyle(fontSize: 44))
                .animate()
                .scale(duration: 500.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 16),
            Text('Your $_year\nWrapped',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 40,
                        height: 1.1,
                        fontWeight: FontWeight.w900))
                .animate()
                .fadeIn(delay: 200.ms),
          ]),
        );
      }),
      _Slide(const [Tw.violet600, Tw.rose500],
          (_) => big('This year', '${yr.length}', 'recommendations you got')),
      _Slide(const [Tw.amber500, Tw.orange500],
          (_) => big('Your mix', '${by('movie')}·${by('book')}·${by('music')}',
              'movies · books · music')),
      _Slide(const [Tw.emerald500, Tw.teal500],
          (_) => big('Your vibe', topGenres.isEmpty ? '—' : topGenres.first,
              topGenres.length > 1
                  ? 'also ${topGenres.skip(1).join(', ')}'
                  : 'your top genre')),
      _Slide(const [Tw.rose500, Tw.fuchsia500],
          (_) => big('On repeat', top(creators),
              'your most-recommended creator')),
      _Slide(const [Tw.indigo900, Tw.violet600], (_) {
        return big('Standout', standout?.title ?? '—',
            standout != null ? 'a favorite this year' : 'take a quiz!');
      }),
      _Slide(const [Tw.indigo500, Tw.rose500], (_) => _outro(yr.length)),
    ];
  }

  Widget _outro(int total) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        RepaintBoundary(
          key: _shotKey,
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Tw.indigo500, Tw.violet600, Tw.rose500]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('$_year Wrapped',
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
      text: 'My Smart Advisor $_year Wrapped',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final s = _slides[_i];
    return GestureDetector(
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
    );
  }
}
