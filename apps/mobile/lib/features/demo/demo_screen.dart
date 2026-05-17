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

const _qs = [
  ('What do you want?', ['Movie', 'Book', 'Music', 'Mix'], 'movie|book|music|mix'),
  ('Pick a mood', ['Comforting', 'Suspenseful', 'Inspiring', 'Mind-bending'], ''),
  ('A vibe you love', ['Cozy', 'Epic', 'Dark', 'Playful'], ''),
  ('Pacing?', ['Slow burn', 'Balanced', 'Fast & intense'], ''),
];

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
    return BrandScaffold(
      title: 'Try the demo',
      actions: [
        AdaptiveAppBarAction(
          title: 'Sign up',
          icon: Icons.person_add_alt,
          iosSymbol: 'person.badge.plus',
          onPressed: () => context.go('/auth'),
        ),
      ],
      body: switch (_phase) {
        _Phase.generating =>
          const Center(child: LoaderFive('Finding your picks')),
        _Phase.error => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Subtitle(_error ?? 'Something went wrong.', center: true),
                const SizedBox(height: 16),
                AdaptiveButton(
                    onPressed: () => setState(() => _phase = _Phase.quiz),
                    label: 'Try again'),
              ]),
            ),
          ),
        _Phase.results => _results(),
        _Phase.quiz => AnimatedSwitcher(
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
            child: KeyedSubtree(
                key: ValueKey(_i), child: _quiz()),
          ),
      },
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
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerLeft,
          child: IconButton(
            padding: EdgeInsets.zero,
            icon: const Icon(Icons.arrow_back),
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/auth'),
          ),
        ),
        const Eyebrow('Demo'),
        const SizedBox(height: 6),
        const BrandHeading('What are you in the mood for?', size: 24),
        const SizedBox(height: 20),
        for (final (label, accent, icon, desc) in opts)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ContentBentoTile(
              accent: accent,
              icon: icon,
              label: label,
              description: desc,
              selected: _picks[0] == label,
              onTap: () => setState(() => _picks[0] = label),
            ),
          ),
        const SizedBox(height: 8),
        AdaptiveButton(
          onPressed: _picks[0] == null ? null : _next,
          label: 'Continue',
        ),
      ]);
    }

    final answered = last
        ? _free.text.trim().isNotEmpty
        : _picks[_i] != null;

    return ListView(padding: const EdgeInsets.all(24), children: [
      const SizedBox(height: 4),
      Row(children: [
        IconButton(
          padding: EdgeInsets.zero,
          icon: const Icon(Icons.arrow_back),
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
        for (final o in _qs[_i].$2)
          _optionTile(o, _picks[_i] == o,
              () => setState(() => _picks[_i] = o)),
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
      for (var i = 0; i < items.length; i++)
        BrandCard(
          accent: ContentAccentName.violet,
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
      const SizedBox(height: 16),
      AdaptiveButton(
          onPressed: () => context.go('/auth'),
          label: 'Sign up for the full quiz'),
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
