import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';
import '../../l10n/app_localizations.dart';
import '../../ui/ui.dart';

/// Single polished pre-auth welcome screen, shown once on first launch
/// before sign in / sign up. Replaces the previous 3-page swipe intro.
///
/// Visual: a Netflix-style tilted poster wall fills the background — a
/// procedural grid (no network, no licensing) of brand-coloured gradient
/// tiles tagged with the three content types (movie / book / music) so
/// the wall reads as "here are the three things this app picks for you".
/// A dark vignette gradient sits over it so the brand block + CTAs stay
/// legible regardless of which tiles land underneath.
///
/// One-time gating: tapping either CTA flips [StorageKeys.introSeen] so
/// returning users land on /auth directly. The post-auth profile setup
/// is a separate screen ([OnboardingScreen]).
///
/// [previewMode] is for the "Replay welcome" entry in Settings —
/// signed-in users replay the same visuals but the CTAs collapse to a
/// single "Close" that pops the route, since the auth buttons would just
/// bounce them home via the router's authed-user gate.
class GetStartedScreen extends ConsumerStatefulWidget {
  const GetStartedScreen({super.key, this.previewMode = false});

  final bool previewMode;

  @override
  ConsumerState<GetStartedScreen> createState() => _S();
}

class _S extends ConsumerState<GetStartedScreen> {
  bool _navigating = false;

  Future<void> _markSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(StorageKeys.introSeen, true);
    ref.invalidate(sharedPreferencesProvider);
  }

  Future<void> _go(String path) async {
    if (_navigating) return;
    setState(() => _navigating = true);
    await _markSeen();
    if (mounted) context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final l = AppLocalizations.of(context);
    return Scaffold(
      // No BrandScaffold — we own the background.
      backgroundColor: dark ? Tw.slate950 : Tw.slate900,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _PosterWall()
              .animate()
              .fadeIn(duration: 600.ms)
              .scaleXY(begin: 1.04, end: 1, curve: Curves.easeOut),
          // Vignette: keeps the bottom half dark enough for white text +
          // CTAs without dimming the colourful wall completely.
          const _Vignette(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top brand bar — just the wordmark, no nav. Sits on
                  // top of the slightly dimmer poster top.
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.auto_awesome,
                          size: 16, color: Colors.white),
                      const SizedBox(width: 6),
                      Text(
                        'Smart Advisor',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: .95),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                  const Spacer(),
                  // Hero block — centred over the bottom of the wall
                  // where the vignette is darkest.
                  Text(
                    l.getStartedHeadline,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 34,
                      height: 1.05,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.6,
                      shadows: [
                        Shadow(
                          color: Colors.black.withValues(alpha: .35),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 340.ms, duration: 460.ms)
                      .slideY(begin: 0.16, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 14),
                  Text(
                    l.getStartedBody,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .82),
                      fontSize: 15,
                      height: 1.45,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 460.ms, duration: 460.ms)
                      .slideY(begin: 0.12, end: 0, curve: Curves.easeOut),
                  const SizedBox(height: 28),
                  if (widget.previewMode)
                    _PrimaryCta(
                      label: l.closePreview,
                      onPressed: () => Navigator.of(context).pop(),
                    )
                        .animate()
                        .fadeIn(delay: 580.ms, duration: 360.ms)
                        .slideY(begin: 0.16, end: 0, curve: Curves.easeOut)
                  else ...[
                    _PrimaryCta(
                      label: l.getStartedPrimary,
                      onPressed: _navigating ? null : () => _go('/auth/signup'),
                    )
                        .animate()
                        .fadeIn(delay: 580.ms, duration: 360.ms)
                        .slideY(begin: 0.16, end: 0, curve: Curves.easeOut),
                    const SizedBox(height: 10),
                    _SecondaryCta(
                      label: l.getStartedSecondary,
                      onPressed: _navigating ? null : () => _go('/auth'),
                    )
                        .animate()
                        .fadeIn(delay: 680.ms, duration: 360.ms)
                        .slideY(begin: 0.16, end: 0, curve: Curves.easeOut),
                  ],
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Bright, branded primary CTA. Indigo→violet gradient to match the
/// HoverBorderGradient used on the web; sits well over the dim wall.
class _PrimaryCta extends StatelessWidget {
  const _PrimaryCta({required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Tw.indigo500, Tw.violet500],
            ),
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              BoxShadow(
                color: Tw.indigo500.withValues(alpha: disabled ? .15 : .4),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Quieter sibling — glassy pill so it still reads on the wall without
/// stealing focus from the primary "Get started".
class _SecondaryCta extends StatelessWidget {
  const _SecondaryCta({required this.label, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.white.withValues(alpha: .25)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: .92),
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Dark gradient overlay over the poster wall. Light at the top so the
/// wordmark still has colour breathing behind it, dark at the bottom so
/// the heading + CTAs read clearly.
class _Vignette extends StatelessWidget {
  const _Vignette();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withValues(alpha: .25),
              Colors.black.withValues(alpha: .55),
              Colors.black.withValues(alpha: .85),
              Colors.black.withValues(alpha: .92),
            ],
            stops: const [0.0, 0.35, 0.7, 1.0],
          ),
        ),
      ),
    );
  }
}

/// The poster wall: a tilted grid of procedural poster tiles that drifts
/// like a living mosaic. Each column scrolls vertically at its own speed,
/// alternating up / down, so the wall feels alive rather than static.
/// Sized to overflow the viewport on every side so the rotated, drifting
/// edges never reveal blank background.
class _PosterWall extends StatefulWidget {
  const _PosterWall();

  @override
  State<_PosterWall> createState() => _PosterWallState();
}

class _PosterWallState extends State<_PosterWall>
    with SingleTickerProviderStateMixin {
  // One long looping controller drives every column; each column derives
  // its own offset from the shared 0→1 progress (with a per-column speed
  // and phase) so they never march in lockstep.
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 48),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, cons) {
        // Tile sizing — keeps the wall dense regardless of phone size.
        final tileW = cons.maxWidth >= 700 ? 110.0 : 90.0;
        final tileH = tileW * 1.5; // 2:3 poster ratio
        // The wall is wider/taller than the viewport so the ~6° tilt never
        // exposes a blank corner. Derive the column count from that
        // padded width — deriving it from the bare viewport (the old
        // bug) left the right edge of the tilted wall unpopulated on
        // wide / tablet layouts.
        final wallW = cons.maxWidth + tileW * 4;
        final wallH = cons.maxHeight + tileH * 2;
        final cols = (wallW / tileW).ceil();
        // Enough tiles per column to cover the wall plus a full extra
        // screen, so the seamless wrap is always off-screen.
        final perColumn = (wallH / tileH).ceil() + 3;

        return ClipRect(
          child: OverflowBox(
            maxWidth: double.infinity,
            maxHeight: double.infinity,
            child: Transform.rotate(
              angle: -0.10, // ~6° tilt
              child: SizedBox(
                width: wallW,
                height: wallH,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (var c = 0; c < cols; c++)
                      _DriftColumn(
                        controller: _ctrl,
                        columnIndex: c,
                        tileW: tileW,
                        tileH: tileH,
                        perColumn: perColumn,
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// A single vertically-drifting column of poster tiles. The tile strip is
/// rendered twice back-to-back; translating by exactly one strip-height
/// per loop makes the wrap seamless. Odd columns drift up, even columns
/// drift down, and the speed varies slightly per column.
class _DriftColumn extends StatelessWidget {
  const _DriftColumn({
    required this.controller,
    required this.columnIndex,
    required this.tileW,
    required this.tileH,
    required this.perColumn,
  });

  final Animation<double> controller;
  final int columnIndex;
  final double tileW;
  final double tileH;
  final int perColumn;

  @override
  Widget build(BuildContext context) {
    final up = columnIndex.isOdd;
    // Speed multiplier: 0.7–1.15, deterministic per column so it's stable
    // across rebuilds but the columns aren't uniform.
    final speed = 0.7 + ((columnIndex * 37) % 100) / 100 * 0.45;
    final stripHeight = perColumn * tileH;

    final strip = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var r = 0; r < perColumn; r++)
          Padding(
            padding: const EdgeInsets.all(4),
            child: _PosterTile(
              // Seed with multipliers coprime to the source count so a
              // column walks through every poster before repeating, and
              // neighbouring columns are offset. Deriving the step from
              // columnCount (the old bug) made columns that shared a
              // factor with the source count alternate just 2 posters.
              seed: columnIndex * 13 + r * 17,
              width: tileW - 8,
              height: tileH - 8,
            ),
          ),
      ],
    );

    return SizedBox(
      width: tileW,
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          // progress wraps 0→1; one strip-height of travel per loop.
          final p = (controller.value * speed) % 1.0;
          final dy = up ? -p * stripHeight : (p - 1) * stripHeight;
          return ClipRect(
            child: OverflowBox(
              maxHeight: double.infinity,
              alignment: Alignment.topCenter,
              child: Transform.translate(
                offset: Offset(0, dy),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [strip, strip],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Real-cover source descriptor. Each tile is bound to one of these by
/// `seed % length`. If the URL fails (404, offline, slow) the tile keeps
/// rendering its gradient + icon underneath, so the wall is never empty.
///
/// Sources:
///   * Movies → TMDB public image CDN (image.tmdb.org). Well-known
///     stable poster_path values for marquee titles.
///   * Books  → OpenLibrary covers by ISBN-13. Most reliable cover
///     source on the public web; redirects gracefully and 404s into the
///     fallback when a cover isn't archived.
class _PosterSource {
  const _PosterSource(
      {required this.url,
      required this.gradient,
      required this.icon});

  final String url;
  final List<Color> gradient;
  final IconData icon;
}

const _movieIcon = Icons.movie_creation_outlined;
const _bookIcon = Icons.menu_book_outlined;
const _musicIcon = Icons.music_note_outlined;

/// Curated cover sources. Mixed media so the wall reads as
/// "movies + books + music" — the three things the app picks.
const _posterSources = <_PosterSource>[
  // ── Movies (TMDB w342, 2:3) ──────────────────────────────────────
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    gradient: [Tw.amber500, Tw.orange500],
    icon: _movieIcon,
  ),
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    gradient: [Tw.indigo500, Tw.violet500],
    icon: _movieIcon,
  ),
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    gradient: [Tw.violet500, Tw.fuchsia500],
    icon: _movieIcon,
  ),
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    gradient: [Tw.cyan500, Tw.indigo500],
    icon: _movieIcon,
  ),
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    gradient: [Tw.emerald500, Tw.teal500],
    icon: _movieIcon,
  ),
  _PosterSource(
    url: 'https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    gradient: [Tw.rose500, Tw.pink500],
    icon: _movieIcon,
  ),
  // ── Books (OpenLibrary, ISBN-13, medium) ─────────────────────────
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg',
    gradient: [Tw.orange500, Tw.rose500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg',
    gradient: [Tw.indigo500, Tw.fuchsia500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg',
    gradient: [Tw.teal500, Tw.cyan500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780765311788-M.jpg',
    gradient: [Tw.amber500, Tw.pink500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg',
    gradient: [Tw.emerald500, Tw.amber500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg',
    gradient: [Tw.violet500, Tw.rose500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg',
    gradient: [Tw.pink500, Tw.violet500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780316769488-M.jpg',
    gradient: [Tw.cyan500, Tw.violet500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780345391803-M.jpg',
    gradient: [Tw.amber500, Tw.emerald500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780307387899-M.jpg',
    gradient: [Tw.rose500, Tw.amber500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg',
    gradient: [Tw.pink500, Tw.indigo500],
    icon: _bookIcon,
  ),
  _PosterSource(
    url: 'https://covers.openlibrary.org/b/isbn/9780060850524-M.jpg',
    gradient: [Tw.violet500, Tw.cyan500],
    icon: _bookIcon,
  ),
  // ── Music tiles — gradient-only fallback (album cover CDN paths are
  //    hash-based and not stable to hardcode). Music icon distinguishes
  //    them so the wall still reads as "all three media types".
  _PosterSource(
    url: '',
    gradient: [Tw.rose500, Tw.violet500],
    icon: _musicIcon,
  ),
  _PosterSource(
    url: '',
    gradient: [Tw.fuchsia500, Tw.amber500],
    icon: _musicIcon,
  ),
  _PosterSource(
    url: '',
    gradient: [Tw.indigo500, Tw.pink500],
    icon: _musicIcon,
  ),
];

/// One poster tile. Renders a coloured gradient + content icon as the
/// permanent base, then lays an Image.network on top with a fade-in once
/// it resolves. If the URL is empty or errors, the gradient + icon stays
/// as the final visual.
class _PosterTile extends StatelessWidget {
  const _PosterTile(
      {required this.seed, required this.width, required this.height});

  final int seed;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final source = _posterSources[seed % _posterSources.length];
    final radius = BorderRadius.circular(10);

    final fallback = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: source.gradient,
        ),
        borderRadius: radius,
      ),
      child: Stack(
        children: [
          // Diagonal gloss so even fallback tiles read as "poster art".
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: radius,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: .18),
                    Colors.transparent,
                    Colors.black.withValues(alpha: .15),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          Center(
            child: Icon(
              source.icon,
              size: width * 0.38,
              color: Colors.white.withValues(alpha: .92),
            ),
          ),
        ],
      ),
    );

    return SizedBox(
      width: width,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: radius,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .25),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: radius,
          child: Stack(
            fit: StackFit.expand,
            children: [
              fallback,
              if (source.url.isNotEmpty)
                Image.network(
                  source.url,
                  fit: BoxFit.cover,
                  // Smooth swap-in once the real cover lands.
                  frameBuilder: (context, child, frame, wasSyncLoaded) {
                    if (wasSyncLoaded || frame != null) {
                      return AnimatedOpacity(
                        opacity: 1,
                        duration: const Duration(milliseconds: 320),
                        curve: Curves.easeOut,
                        child: child,
                      );
                    }
                    return const SizedBox.shrink();
                  },
                  // Any error (404, network) keeps the fallback visible.
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
