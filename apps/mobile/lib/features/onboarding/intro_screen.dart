import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../core/supabase/supabase_providers.dart';
import '../../ui/ui.dart';

/// Pre-auth product pitch shown once on first launch, before sign in /
/// sign up. The post-auth profile setup lives in [OnboardingScreen].
class IntroScreen extends ConsumerStatefulWidget {
  const IntroScreen({super.key});

  @override
  ConsumerState<IntroScreen> createState() => _S();
}

class _S extends ConsumerState<IntroScreen> {
  final _pc = PageController();
  int _page = 0;

  static const _lastPage = 2;

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  void _next() {
    if (_page < _lastPage) {
      _pc.nextPage(
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeOutCubic);
    } else {
      _done();
    }
  }

  void _back() => _pc.previousPage(
      duration: const Duration(milliseconds: 360), curve: Curves.easeOut);

  Future<void> _done() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(StorageKeys.introSeen, true);
    // Re-runs the router redirect so it won't bounce back here.
    ref.invalidate(sharedPreferencesProvider);
    if (mounted) context.go('/auth');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BrandScaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 6, 8, 0),
                child: TextButton(
                  onPressed: _done,
                  child: Text('Skip',
                      style: TextStyle(
                          color: c.mutedForeground,
                          fontWeight: FontWeight.w600)),
                ),
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pc,
                onPageChanged: (i) => setState(() => _page = i),
                children: [
                  _Slide(child: _welcome()),
                  _Slide(child: _whatYouGet()),
                  _Slide(child: _whyItFits()),
                ],
              ),
            ),
            _controls(c),
          ],
        ),
      ),
    );
  }

  // ── Bottom control bar: back · dots · primary action ─────────────────
  Widget _controls(AppColors c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: _page == 0 ? 0 : 1,
              child: TextButton(
                onPressed: _page == 0 ? null : _back,
                child: Text('Back',
                    style: TextStyle(
                        color: c.foreground,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i <= _lastPage; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeOut,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    height: 7,
                    width: i == _page ? 22 : 7,
                    decoration: BoxDecoration(
                      color: i == _page
                          ? Tw.indigo500
                          : c.mutedForeground.withValues(alpha: .3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(
            width: 132,
            child: AdaptiveButton(
              onPressed: _next,
              label: _page == _lastPage ? 'Get started' : 'Next',
            ),
          ),
        ],
      ),
    );
  }

  // ── Slide 1: welcome ─────────────────────────────────────────────────
  Widget _welcome() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: _glyph()),
        const SizedBox(height: 36),
        const Center(child: Eyebrow('Welcome')),
        const SizedBox(height: 10),
        const BrandHeading('Smart Advisor', size: 32)
            .animate()
            .fadeIn(delay: 150.ms, duration: 500.ms)
            .slideY(begin: 0.15, end: 0, curve: Curves.easeOut),
        const SizedBox(height: 14),
        const _Centered(
          'Stop scrolling. Tell us your mood and get a movie, '
          'book or song worth your night — with a reason why.',
        ).animateFadeUp(delay: 280),
      ],
    );
  }

  Widget _glyph() {
    final ring = Container(
      width: 132,
      height: 132,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: SweepGradient(colors: [
          Tw.indigo500,
          Tw.violet500,
          Tw.rose500,
          Tw.amber500,
          Tw.indigo500,
        ]),
      ),
    ).animate(onPlay: (c) => c.repeat()).rotate(
        duration: 8000.ms, curve: Curves.linear);

    final core = Container(
      width: 96,
      height: 96,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
              color: Tw.indigo500.withValues(alpha: .35),
              blurRadius: 28,
              spreadRadius: -4),
        ],
      ),
      child: const Icon(Icons.auto_awesome, size: 44, color: Tw.indigo500),
    );

    return SizedBox(
      width: 132,
      height: 132,
      child: Stack(
        alignment: Alignment.center,
        children: [ring, core],
      ),
    ).animate(onPlay: (c) => c.repeat(reverse: true)).moveY(
        begin: -6, end: 6, duration: 2600.ms, curve: Curves.easeInOut);
  }

  // ── Slide 2: what you get ────────────────────────────────────────────
  Widget _whatYouGet() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Center(child: Eyebrow('What you get')),
        const SizedBox(height: 10),
        const BrandHeading('One taste,\nthree worlds', size: 28)
            .animateFadeUp(),
        const SizedBox(height: 28),
        _featureRow(Icons.movie_outlined, 'Movies & shows',
            'Picks tuned to your mood, not the trending tab.',
            const [Tw.amber500, Tw.orange500], 0),
        const SizedBox(height: 14),
        _featureRow(Icons.menu_book_outlined, 'Books',
            'Your next read, matched to what you actually finish.',
            const [Tw.emerald500, Tw.teal500], 1),
        const SizedBox(height: 14),
        _featureRow(Icons.music_note_outlined, 'Music',
            'Albums and tracks that fit the moment.',
            const [Tw.rose500, Tw.pink500], 2),
      ],
    );
  }

  Widget _featureRow(IconData icon, String title, String body,
      List<Color> grad, int i) {
    return BrandCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: grad),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: context.colors.foreground)),
                const SizedBox(height: 3),
                Text(body,
                    style: TextStyle(
                        fontSize: 13,
                        height: 1.35,
                        color: context.colors.mutedForeground)),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (180 + i * 140).ms, duration: 360.ms)
        .slideX(begin: 0.12, end: 0, curve: Curves.easeOut);
  }

  // ── Slide 3: why it fits ─────────────────────────────────────────────
  Widget _whyItFits() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Center(child: Eyebrow('No more guessing')),
        const SizedBox(height: 10),
        const BrandHeading('Every pick comes\nwith a reason', size: 28)
            .animateFadeUp(),
        const SizedBox(height: 24),
        BrandCard(
          accent: ContentAccentName.violet,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome,
                      size: 18, color: Tw.violet500),
                  const SizedBox(width: 8),
                  Text('Why this fits you',
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: context.colors.foreground)),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                '“A slow-burn thriller with the wit you liked in your '
                'last two picks — short enough for a weeknight.”',
                style: TextStyle(
                    fontSize: 14,
                    height: 1.45,
                    fontStyle: FontStyle.italic,
                    color: context.colors.foreground),
              ),
            ],
          ),
        )
            .animate()
            .fadeIn(delay: 200.ms, duration: 420.ms)
            .scaleXY(begin: 0.94, end: 1, curve: Curves.easeOutBack),
        const SizedBox(height: 16),
        const _Centered(
                'A quick quiz learns your taste — and keeps learning '
                'every time you rate a pick.')
            .animateFadeUp(delay: 360),
      ],
    );
  }
}

/// Scrollable, centered page frame with a width cap so it reads well on
/// phones and tablets alike.
class _Slide extends StatelessWidget {
  const _Slide({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: child,
        ),
      ),
    );
  }
}

/// Muted, centered supporting paragraph.
class _Centered extends StatelessWidget {
  const _Centered(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
            fontSize: 15,
            height: 1.5,
            color: context.colors.mutedForeground),
      );
}

extension _FadeUp on Widget {
  /// Shared "fade + rise" entrance used by headings and paragraphs.
  Widget animateFadeUp({int delay = 100}) => animate()
      .fadeIn(delay: delay.ms, duration: 420.ms)
      .slideY(begin: 0.18, end: 0, curve: Curves.easeOut);
}
