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
        _Phase.quiz => _quiz(),
      },
    );
  }

  Widget _optionTile(String label, bool selected, VoidCallback onTap) {
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
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

  Widget _quiz() {
    final last = _i == _qs.length;
    return ListView(padding: const EdgeInsets.all(24), children: [
      BrandProgressBar(
          value: (_i + 1) / (_qs.length + 1),
          accent: ContentAccentName.violet),
      const SizedBox(height: 16),
      Eyebrow('Question ${_i + 1} of ${_qs.length + 1}'),
      const SizedBox(height: 8),
      if (!last) ...[
        BrandHeading(_qs[_i].$1, size: 22),
        const SizedBox(height: 16),
        for (final o in _qs[_i].$2)
          _optionTile(o, _picks[_i] == o, () => setState(() {
                _picks[_i] = o;
                _i++;
              })),
      ] else ...[
        const BrandHeading('Describe your perfect pick', size: 22),
        const SizedBox(height: 16),
        AdaptiveTextField(
            controller: _free,
            placeholder: 'e.g. a slow-burn mystery that stays with me',
            maxLines: 3),
        const SizedBox(height: 16),
        AdaptiveButton(onPressed: _submit, label: 'See my picks'),
      ],
      if (_i > 0)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: AdaptiveButton(
              onPressed: () => setState(() => _i--),
              label: 'Back',
              style: AdaptiveButtonStyle.plain),
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
