import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../ui/ui.dart';
import 'demo_service.dart';

/// No-auth taste demo: 5 quick questions → demo-recommendations Edge
/// Function → enriched picks. Mirrors the web /demo single-page flow.
class DemoScreen extends ConsumerStatefulWidget {
  const DemoScreen({super.key});

  @override
  ConsumerState<DemoScreen> createState() => _DemoScreenState();
}

enum _Phase { quiz, generating, results, error }

// q0 is the content question (its answer is _picks[0], chosen on the
// bento step). q1–q3 are worded for the chosen content so a book quiz
// asks book questions, a music quiz asks music questions, etc.
const _q0 =
    ('What do you want?', ['Movie', 'Book', 'Music', 'Mix'], 'movie|book|music|mix');

class _DemoScreenState extends ConsumerState<DemoScreen> {
  _Phase _phase = _Phase.quiz;
  int _i = 0;
  int _dir = 1; // slide direction (1 forward, -1 back)
  final _picks = <int, String>{};
  final _free = TextEditingController();
  DemoResult? _result;
  String? _error;

  @override
  void dispose() {
    _free.dispose();
    super.dispose();
  }

  String get _contentType => switch (_picks[0]) {
        'Book' => 'book',
        'Music' => 'music',
        'Movie' => 'movie',
        _ => 'mix',
      };

  /// Questions worded for the chosen content. Index 0 stays the content
  /// question (answered on the bento step); 1–3 are content-specific.
  List<(String, List<String>, String)> get _qs {
    switch (_contentType) {
      case 'movie':
        return const [
          _q0,
          ('What kind of movie night?',
              ['Comfort watch', 'Edge of my seat', 'Make me think', 'Big spectacle'], ''),
          ('A film vibe you love',
              ['Cozy & warm', 'Epic & sweeping', 'Dark & gritty', 'Witty & playful'], ''),
          ('On-screen pace?',
              ['Slow burn', 'Balanced', 'Fast & relentless'], ''),
        ];
      case 'book':
        return const [
          _q0,
          ('What pulls you into a book?',
              ['Cozy escape', 'Twisty plot', 'Big ideas', 'Sweeping world'], ''),
          ('A reading vibe you love',
              ['Warm & gentle', 'Epic & immersive', 'Dark & literary', 'Sharp & funny'], ''),
          ('Page-turn pace?',
              ['Slow & savored', 'Steady', 'Can\'t-put-down'], ''),
        ];
      case 'music':
        return const [
          _q0,
          ('What are you in the mood to hear?',
              ['Easy & comforting', 'Moody & intense', 'Uplifting', 'Adventurous'], ''),
          ('A sound you love',
              ['Warm & mellow', 'Big & anthemic', 'Dark & brooding', 'Bright & playful'], ''),
          ('Energy?',
              ['Low & slow', 'Mid-tempo', 'High & driving'], ''),
        ];
      default: // mix
        return const [
          _q0,
          ('Pick a mood',
              ['Comforting', 'Suspenseful', 'Inspiring', 'Mind-bending'], ''),
          ('A vibe you love', ['Cozy', 'Epic', 'Dark', 'Playful'], ''),
          ('Pacing?', ['Slow burn', 'Balanced', 'Fast & intense'], ''),
        ];
    }
  }

  Color get _accentColor =>
      contentAccent(_accent, Theme.of(context).brightness).text;

  Color get _accentDot =>
      contentAccent(_accent, Theme.of(context).brightness).dot;

  void _leaveDemo() =>
      context.canPop() ? context.pop() : context.go('/auth');

  void _confirmLeave() {
    if (_phase == _Phase.results) {
      _leaveDemo();
      return;
    }
    AdaptiveAlertDialog.show(
      context: context,
      title: 'Leave the demo?',
      message: 'Your answers so far won’t be saved.',
      icon: Icons.logout,
      actions: [
        AlertAction(
            title: 'Keep going',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Leave',
          style: AlertActionStyle.destructive,
          onPressed: _leaveDemo,
        ),
      ],
    );
  }

  /// Feed-style selectable content card (matches the solo quiz).
  Widget _contentCard(String label, ContentAccentName a, IconData icon,
      String desc) {
    final tone = contentAccent(a, Theme.of(context).brightness);
    final selected = _picks[0] == label;
    return GestureDetector(
      onTap: () => setState(() => _picks[0] = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
              color: selected ? tone.dot : tone.surfaceBorder,
              width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: tone.iconCircleBg, shape: BoxShape.circle),
            child: Icon(icon, color: tone.iconCircleFg, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                const SizedBox(height: 2),
                Text(desc,
                    style: TextStyle(
                        fontSize: 12, color: context.brandMuted)),
              ],
            ),
          ),
          Icon(
            selected
                ? Icons.check_circle
                : Icons.radio_button_unchecked,
            color: selected ? tone.dot : tone.surfaceBorder,
            size: 22,
          ),
        ]),
      ),
    );
  }

  /// Loader phases worded for the chosen content.
  List<String> get _demoPhases => switch (_contentType) {
        'movie' => const [
            'Screening your answers',
            'Matching tone & directors',
            'Curating your picks',
          ],
        'book' => const [
            'Turning your answers over',
            'Matching authors & themes',
            'Curating your picks',
          ],
        'music' => const [
            'Listening to your answers',
            'Matching artists & mood',
            'Sequencing your picks',
          ],
        _ => const [
            'Reading your answers',
            'Matching your taste',
            'Curating your picks',
          ],
      };

  Future<void> _submit() async {
    setState(() => _phase = _Phase.generating);
    final answers = [
      for (var i = 0; i < _qs.length; i++)
        {
          'id': 'q$i',
          'title': _qs[i].$1,
          'type': 'single_select',
          'value': _picks[i] ?? '',
        },
      {
        'id': 'q4',
        'title': 'Describe your perfect pick',
        'type': 'fill_in_blank',
        'value': _free.text.trim(),
      },
    ];
    final r = await ref
        .read(demoServiceProvider)
        .run(contentType: _contentType, answers: answers);
    if (!mounted) return;
    setState(() {
      if (r.result != null) {
        _result = r.result;
        _phase = _Phase.results;
      } else {
        _error = r.error;
        _phase = _Phase.error;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _confirmLeave();
      },
      child: ModalSheet(
      title: 'Demo',
      onClose: _confirmLeave,
      child: switch (_phase) {
        _Phase.generating => Center(
            child: PhasedLoader(
              color: _accentColor,
              phases: _demoPhases,
            ),
          ),
        _Phase.error => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Subtitle(_error ?? 'Something went wrong.', center: true),
                const SizedBox(height: 16),
                AdaptiveButton(
                    onPressed: () => setState(() => _phase = _Phase.quiz),
                    label: 'Try again',
                    color: _accentDot),
              ]),
            ),
          ),
        _Phase.results => ResponsiveCenter(
            maxWidth: context.isTablet ? 1100 : 600, child: _results()),
        _Phase.quiz => ResponsiveCenter(
            maxWidth: context.isTablet ? 900 : 560,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 320),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: Offset(0.22 * _dir, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              ),
              child: KeyedSubtree(key: ValueKey(_i), child: _quiz()),
            ),
          ),
      },
      ),
    );
  }

  ContentAccentName get _accent => switch (_picks[0]) {
        'Movie' => ContentAccentName.amber,
        'Book' => ContentAccentName.emerald,
        'Music' => ContentAccentName.rose,
        _ => ContentAccentName.violet,
      };

  Widget _optionTile(String label, bool selected, VoidCallback onTap) {
    final tone = contentAccent(_accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? tone.iconCircleBg : context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: selected ? tone.dot : context.colors.border,
              width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Icon(
              selected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              size: 20,
              color: selected ? tone.text : context.colors.mutedForeground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    fontSize: 15,
                    fontWeight:
                        selected ? FontWeight.w700 : FontWeight.w500,
                    color: context.brandInk)),
          ),
        ]),
      ),
    );
  }

  void _back() {
    setState(() {
      _dir = -1;
      if (_i > 0) _i--;
    });
    if (_i == 0 && context.canPop()) context.pop();
  }

  void _next() => setState(() {
        _dir = 1;
        _i++;
      });

  Widget _quiz() {
    final total = _qs.length + 1; // + free-text
    final last = _i == _qs.length;

    // Step 0 = content selection (bento), like the real quiz.
    if (_i == 0) {
      const opts = [
        ('Movie', ContentAccentName.amber, Icons.movie_outlined,
            'Films picked for your taste'),
        ('Book', ContentAccentName.emerald, Icons.menu_book_outlined,
            'Reads that fit who you are'),
        ('Music', ContentAccentName.rose, Icons.music_note_outlined,
            'Albums tuned to your mood'),
        ('Mix', ContentAccentName.violet, Icons.auto_awesome_outlined,
            'A little of everything'),
      ];
      return ListView(padding: const EdgeInsets.all(24), children: [
        Eyebrow('Free demo', color: _accentColor),
        const SizedBox(height: 6),
        const BrandHeading('What are you in the mood for?', size: 24),
        const SizedBox(height: 4),
        Subtitle('A quick taste of Smart Advisor — no account '
            'needed.'),
        const SizedBox(height: 20),
        ResponsiveTiles(
          minTileWidth: 380,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (final (label, accent, icon, desc) in opts)
              _contentCard(label, accent, icon, desc),
          ],
        ),
        const SizedBox(height: 20),
        AdaptiveButton(
          onPressed: _picks[0] == null ? null : _next,
          label: 'Continue',
          color: _accentDot,
        ),
      ]);
    }

    final answered = last
        ? _free.text.trim().isNotEmpty
        : _picks[_i] != null;

    return ListView(padding: const EdgeInsets.all(24), children: [
      const SizedBox(height: 4),
      Row(children: [
        AdaptiveButton.icon(
          padding: EdgeInsets.zero,
          style: AdaptiveButtonStyle.plain,
          icon: Icons.arrow_back,
          onPressed: _back,
        ),
        Expanded(
            child: Eyebrow('Question ${_i + 1} of $total')),
      ]),
      const SizedBox(height: 10),
      BrandProgressBar(value: (_i + 1) / total, accent: _accent),
      const SizedBox(height: 20),
      if (!last) ...[
        BrandHeading(_qs[_i].$1, size: 22),
        const SizedBox(height: 16),
        ResponsiveTiles(
          minTileWidth: 300,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (final o in _qs[_i].$2)
              _optionTile(o, _picks[_i] == o,
                  () => setState(() => _picks[_i] = o)),
          ],
        ),
      ] else ...[
        const BrandHeading('Describe your perfect pick', size: 22),
        const SizedBox(height: 16),
        AdaptiveTextField(
            controller: _free,
            placeholder: 'e.g. a slow-burn mystery that stays with me',
            maxLines: 3,
            onChanged: (_) => setState(() {})),
      ],
      const SizedBox(height: 16),
      AdaptiveButton(
        onPressed: !answered ? null : (last ? _submit : _next),
        label: last ? 'See my picks' : 'Next',
        color: _accentDot,
      ),
    ]);
  }

  Widget _results() {
    final items = _result!.items;
    return ListView(padding: const EdgeInsets.all(20), children: [
      const Eyebrow('Your demo picks'),
      const SizedBox(height: 4),
      const BrandHeading('A taste of Smart Advisor', size: 22),
      const SizedBox(height: 4),
      Subtitle('${_result!.remaining} demo runs left today'),
      const SizedBox(height: 16),
      ResponsiveTiles(
        minTileWidth: 360,
        maxColumns: 3,
        children: [
        for (var i = 0; i < items.length; i++)
        BrandCard(
          accent: switch (items[i].type) {
            'movie' => ContentAccentName.amber,
            'book' => ContentAccentName.emerald,
            'music' => ContentAccentName.rose,
            _ => ContentAccentName.violet,
          },
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            PosterThumb(
                url: items[i].posterUrl, square: items[i].type == 'music'),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(items[i].title,
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: context.brandInk)),
                  Text(
                      '${items[i].creator}'
                      '${items[i].year != null ? ' · ${items[i].year}' : ''}',
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
                  const SizedBox(height: 6),
                  Text(items[i].reason,
                      style: TextStyle(
                          fontSize: 13, color: context.brandInk)),
                ],
              ),
            ),
          ]),
        )
            .animate()
            .fadeIn(delay: (i * 90).ms, duration: 320.ms)
            .slideY(begin: 0.08),
        ],
      ),
      const SizedBox(height: 16),
      AdaptiveButton(
          onPressed: () => context.go('/auth'),
          label: 'Sign up for the full quiz',
          color: _accentDot),
      const SizedBox(height: 8),
      AdaptiveButton(
        onPressed: () => setState(() {
          _phase = _Phase.quiz;
          _i = 0;
          _picks.clear();
          _free.clear();
        }),
        label: 'Retake',
        style: AdaptiveButtonStyle.bordered,
      ),
    ]);
  }
}
