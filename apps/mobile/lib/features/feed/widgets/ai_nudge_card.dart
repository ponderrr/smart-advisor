import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';

/// `YYYY-MM-DD` for today — the AI nudge is dismissed a day at a time.
String _today() {
  final d = DateTime.now();
  return '${d.year}-${d.month}-${d.day}';
}

/// The day the AI nudge was last dismissed, so it stays hidden for the
/// rest of that day and quietly returns tomorrow.
class _AiNudgeDismiss extends Notifier<String?> {
  static const _key = 'sa.ai_nudge_dismissed';

  @override
  String? build() => ref
      .watch(sharedPreferencesProvider)
      .asData
      ?.value
      .getString(_key);

  Future<void> dismissToday() async {
    state = _today();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, state!);
  }
}

final _aiNudgeDismissProvider =
    NotifierProvider<_AiNudgeDismiss, String?>(_AiNudgeDismiss.new);

/// A mood the user can tap to get an instant AI pick, without leaving the
/// feed or running a full quiz. Each maps to a single open-ended answer.
class _Mood {
  const _Mood({
    required this.label,
    required this.icon,
    required this.accent,
    required this.answer,
  });
  final String label;
  final IconData icon;
  final ContentAccentName accent;
  final String answer;
}

const _moods = <_Mood>[
  _Mood(
    label: 'Easygoing',
    icon: Icons.weekend_outlined,
    accent: ContentAccentName.emerald,
    answer: 'Something light and comforting — easy to get into, low '
        'effort, feel-good. Nothing heavy or demanding right now.',
  ),
  _Mood(
    label: 'Gripping',
    icon: Icons.bolt_outlined,
    accent: ContentAccentName.amber,
    answer: 'Something intense and gripping that really pulls me in — '
        'high stakes, can\'t-look-away, keeps me on edge.',
  ),
  _Mood(
    label: 'Surprise me',
    icon: Icons.casino_outlined,
    accent: ContentAccentName.violet,
    answer: 'Surprise me — anything great, no constraints. Something I '
        'might not expect but would love.',
  ),
];

/// Inline AI nudge for the feed. Unlike a plain "take a quiz" shortcut,
/// this does something the feed can't otherwise do: tap a mood and an AI
/// pick lands right here as a card — saveable, openable — no quiz, no
/// navigating away.
class AiNudgeCard extends ConsumerStatefulWidget {
  const AiNudgeCard({super.key});

  @override
  ConsumerState<AiNudgeCard> createState() => _AiNudgeCardState();
}

enum _Phase { idle, loading, result, error }

class _AiNudgeCardState extends ConsumerState<AiNudgeCard> {
  _Phase _phase = _Phase.idle;
  Recommendation? _pick;
  _Mood? _lastMood;

  Future<void> _run(_Mood mood) async {
    setState(() {
      _phase = _Phase.loading;
      _lastMood = mood;
    });
    final profile = ref.read(currentProfileProvider).asData?.value;
    final answers = [
      Answer(
        id: 'a0',
        questionId: 'mood',
        questionText: 'What are you in the mood for?',
        answerText: mood.answer,
        createdAt: DateTime.now().toUtc().toIso8601String(),
      ),
    ];
    final res = await ref.read(recommendationFlowProvider).generate(
          answers: answers,
          // mix = one EF call returning one of each type — fastest path
          // for a single nudge pick.
          contentType: ContentType.mix,
          userAge: profile?.age ?? 18,
          contentTone: ref.read(contentToneProvider),
          userName: profile?.name,
        );
    if (!mounted) return;
    if (res.isError || (res.data?.isEmpty ?? true)) {
      setState(() => _phase = _Phase.error);
      return;
    }
    setState(() {
      _pick = res.data!.first;
      _phase = _Phase.result;
    });
  }

  void _reset() => setState(() {
        _phase = _Phase.idle;
        _pick = null;
      });

  @override
  Widget build(BuildContext context) {
    // Dismissible — once dismissed it stays gone for the rest of the day
    // (a result in progress is never yanked away).
    final dismissed = ref.watch(_aiNudgeDismissProvider) == _today();
    if (_phase == _Phase.idle && dismissed) {
      return const SizedBox.shrink();
    }
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: BrandCard(
        accent: ContentAccentName.violet,
        padding: const EdgeInsets.all(14),
        child: switch (_phase) {
          _Phase.idle => _idle(tone),
          _Phase.loading => _loading(tone),
          _Phase.result => _result(),
          _Phase.error => _error(),
        },
      ),
    );
  }

  Widget _dismissButton() => Semantics(
        button: true,
        label: 'Dismiss',
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () =>
              ref.read(_aiNudgeDismissProvider.notifier).dismissToday(),
          child: Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Icon(Icons.close,
                size: 18, color: context.brandMuted),
          ),
        ),
      );

  Widget _header(ContentAccentTone tone, String title, String subtitle,
          {Widget? trailing}) =>
      Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
              color: tone.iconCircleBg, shape: BoxShape.circle),
          child: Icon(Icons.auto_awesome,
              size: 19, color: tone.iconCircleFg),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: context.brandInk)),
              Text(subtitle,
                  style: TextStyle(
                      fontSize: 12, color: context.brandMuted)),
            ],
          ),
        ),
        ?trailing,
      ]);

  Widget _idle(ContentAccentTone tone) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _header(tone, 'Not sure what to pick?',
              'Tap a vibe — we\'ll drop a pick right here.',
              trailing: _dismissButton()),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final m in _moods) _moodChip(m),
            ],
          ),
        ],
      );

  Widget _moodChip(_Mood m) {
    final tone = contentAccent(m.accent, Theme.of(context).brightness);
    return GestureDetector(
      onTap: () => _run(m),
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: tone.iconCircleBg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(m.icon, size: 15, color: tone.iconCircleFg),
          const SizedBox(width: 6),
          Text(m.label,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: tone.iconCircleFg)),
        ]),
      ),
    );
  }

  Widget _loading(ContentAccentTone tone) => Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
              color: tone.iconCircleBg, shape: BoxShape.circle),
          child: Icon(Icons.auto_awesome,
              size: 19, color: tone.iconCircleFg),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: LoaderFive(
              'Finding something ${_lastMood?.label.toLowerCase() ?? ''}…'),
        ),
      ]);

  Widget _result() {
    final r = _pick!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Icon(Icons.auto_awesome,
              size: 14,
              color: contentAccent(ContentAccentName.violet,
                      Theme.of(context).brightness)
                  .iconCircleFg),
          const SizedBox(width: 6),
          Text('YOUR ${(_lastMood?.label ?? 'AI').toUpperCase()} PICK',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.6,
                  color: context.brandMuted)),
        ]),
        const SizedBox(height: 10),
        GestureDetector(
          onTap: () => context.push('/pick', extra: r),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            PosterThumb(
                url: r.posterUrl,
                square: r.type == 'music',
                w: 52,
                semanticLabel: '${r.title} cover'),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                          color: context.brandInk)),
                  const SizedBox(height: 2),
                  Text(
                      '${r.type} · '
                      '${r.director ?? r.author ?? r.artist ?? ''}'
                      '${r.year != null ? ' · ${r.year}' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 12, color: context.brandMuted)),
                  if (r.explanation != null &&
                      r.explanation!.trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(r.explanation!.trim(),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 12.5,
                            height: 1.4,
                            fontStyle: FontStyle.italic,
                            color: context.brandMuted)),
                  ],
                ],
              ),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: AdaptiveButton(
              onPressed: () => context.push('/pick', extra: r),
              label: 'See the pick',
            ),
          ),
          const SizedBox(width: 8),
          AdaptiveButton.child(
            style: AdaptiveButtonStyle.plain,
            onPressed: _reset,
            child: Text('Another vibe',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: context.brandMuted)),
          ),
        ]),
      ],
    );
  }

  Widget _error() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(Icons.cloud_off_outlined,
                size: 18, color: context.brandMuted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                  'Couldn\'t reach the AI just now. Try again in a moment.',
                  style: TextStyle(
                      fontSize: 13, color: context.brandMuted)),
            ),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            AdaptiveButton.child(
              style: AdaptiveButtonStyle.plain,
              onPressed: _lastMood == null
                  ? null
                  : () => _run(_lastMood!),
              child: const Text('Try again',
                  style: TextStyle(fontWeight: FontWeight.w800)),
            ),
            AdaptiveButton.child(
              style: AdaptiveButtonStyle.plain,
              onPressed: _reset,
              child: Text('Back',
                  style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: context.brandMuted)),
            ),
          ]),
        ],
      );
}
