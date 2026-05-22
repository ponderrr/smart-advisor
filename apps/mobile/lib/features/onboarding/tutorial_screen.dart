import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';

/// One tutorial slide.
class _Slide {
  const _Slide({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String body;
}

const _slides = <_Slide>[
  _Slide(
    icon: Icons.auto_awesome,
    color: Tw.indigo500,
    title: 'Welcome to Smart Advisor',
    body: 'Your taste, your picks. Here\'s a 30-second tour of what '
        'you can do.',
  ),
  _Slide(
    icon: Icons.quiz_outlined,
    color: Tw.violet500,
    title: 'Get recommendations',
    body: 'Answer a few quick questions and get movies, books, and '
        'music matched to your taste.',
  ),
  _Slide(
    icon: Icons.bookmark_added_outlined,
    color: Tw.emerald500,
    title: 'Build your library',
    body: 'Log what you\'ve finished, rate it 👎 😐 👍, and keep a '
        'watchlist of what\'s next.',
  ),
  _Slide(
    icon: Icons.groups_outlined,
    color: Tw.rose500,
    title: 'Share with friends',
    body: 'Follow people, share your picks to the feed, and see what '
        'the people you trust are into.',
  ),
];

/// One-time post-onboarding tutorial — a short swipeable carousel that
/// explains the feed / library / quiz before dropping the user into the
/// app. Reached from the end of [OnboardingScreen]; "Skip" or the final
/// "Get started" both navigate home.
class TutorialScreen extends StatefulWidget {
  const TutorialScreen({super.key, this.replay = false});

  /// When true the tutorial was opened from Settings ("Replay tutorial")
  /// — finishing pops back there instead of navigating into the app.
  final bool replay;

  @override
  State<TutorialScreen> createState() => _TutorialScreenState();
}

class _TutorialScreenState extends State<TutorialScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finish() {
    if (!mounted) return;
    if (widget.replay) {
      Navigator.of(context).pop();
    } else {
      context.go('/');
    }
  }

  void _next() {
    if (_page >= _slides.length - 1) {
      _finish();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final last = _page == _slides.length - 1;
    return Scaffold(
      backgroundColor: Tw.slate950,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1E1B4B), Tw.slate950, Color(0xFF190A2E)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Skip.
              Align(
                alignment: Alignment.centerRight,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(0, 8, 12, 0),
                  child: TextButton(
                    onPressed: _finish,
                    child: Text('Skip',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemCount: _slides.length,
                  itemBuilder: (_, i) => _SlideView(slide: _slides[i]),
                ),
              ),
              // Dots.
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < _slides.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 240),
                      margin:
                          const EdgeInsets.symmetric(horizontal: 3),
                      width: i == _page ? 22 : 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: i == _page
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _next,
                      borderRadius: BorderRadius.circular(999),
                      child: Ink(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Tw.indigo500, Tw.violet500],
                          ),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Center(
                          child: Text(
                            last ? 'Get started' : 'Next',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SlideView extends StatelessWidget {
  const _SlideView({required this.slide});
  final _Slide slide;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: slide.color.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(28),
              border:
                  Border.all(color: slide.color.withValues(alpha: 0.4)),
            ),
            child: Icon(slide.icon, size: 44, color: slide.color),
          ),
          const SizedBox(height: 28),
          Text(
            slide.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              height: 1.15,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            slide.body,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.76),
              fontSize: 15,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
