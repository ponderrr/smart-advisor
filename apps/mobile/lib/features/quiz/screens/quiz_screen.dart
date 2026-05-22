import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_kit/haptic_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/question.dart';
import '../../../core/services/service_providers.dart';
import '../../notifications/notifications_center.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../recommendations/screens/results_view.dart';
import '../../recommendations/services/refinement_input.dart';
import '../store/quiz_store.dart';

enum _Step { content, count, questions, generating, genError, results }

/// Port of the web quiz flow: content → count → questions → (generating) →
/// results, morphing in place. Questions and recommendations come from the
/// anthropic-* Edge Functions via ai_service / recommendation_flow.
class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key, this.surprise = false});

  /// One-tap mode: pick a random content type and generate immediately
  /// from a "no constraints" prompt, skipping content/question steps.
  final bool surprise;

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  _Step _step = _Step.content;
  ContentType _content = ContentType.mix;
  int _count = 5;

  List<Question> _questions = [];
  int _qIndex = 0;
  int _dir = 1; // 1 = moving forward, -1 = backward (drives slide)
  final _answers = <String, dynamic>{}; // questionId -> String | List<String>
  final _blank = TextEditingController();

  bool _loadingQuestions = false;
  String? _error;
  bool _genOverloaded = false;
  // The refinement (if any) for the in-flight / last-failed gen pass, so
  // the error step's "Try again" replays the same steer.
  RefinementInput? _pendingRefinement;

  @override
  void initState() {
    super.initState();
    if (widget.surprise) {
      // Pick a random single type for a focused surprise, then jump
      // straight to generating once the first frame is up.
      const types = [
        ContentType.movie,
        ContentType.book,
        ContentType.music,
      ];
      _content = types[Random().nextInt(types.length)];
      _step = _Step.generating;
      WidgetsBinding.instance
          .addPostFrameCallback((_) => _generate());
    } else {
      // Hydrate the default content selection from the user's saved
      // preference (Settings → Recommendations → Default content). The
      // user can still flip it on the content step; this just makes the
      // step land on their preferred choice instead of always `mix`.
      _hydrateContentFocus();
    }
  }

  Future<void> _hydrateContentFocus() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(StorageKeys.prefContentFocus);
    if (saved == null || !mounted) return;
    final next = switch (saved) {
      'movie' => ContentType.movie,
      'book' => ContentType.book,
      'music' => ContentType.music,
      'mix' => ContentType.mix,
      _ => null,
    };
    if (next != null && next != _content) {
      setState(() => _content = next);
    }
  }

  @override
  void dispose() {
    _blank.dispose();
    super.dispose();
  }

  /// A single open-ended answer so the AI returns varied, unexpected
  /// picks instead of restarting the personality quiz.
  List<Answer> _surpriseAnswers() => [
        Answer(
          id: 'a0',
          questionId: 'surprise',
          questionText: 'What are you in the mood for?',
          answerText: 'Surprise me — anything great, no constraints. '
              'Pick something I might not expect but would love.',
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      ];

  int get _age =>
      ref.read(currentProfileProvider).asData?.value?.age ?? 18;
  String? get _name =>
      ref.read(currentProfileProvider).asData?.value?.name;
  String get _tone => ref.read(contentToneProvider);

  /// Solid accent for the current content type (loaders, eyebrow, etc.).
  Color get _accentColor => contentAccent(
        accentForContentType(_content),
        Theme.of(context).brightness,
      ).text;

  /// Filled-button accent for the current content type.
  Color get _accentDot => contentAccent(
        accentForContentType(_content),
        Theme.of(context).brightness,
      ).dot;

  /// Loader phases worded for the chosen content. [building] = quiz build
  /// phase; otherwise the recommendation phase.
  List<String> _phases({required bool building}) {
    switch (_content) {
      case ContentType.movie:
        return building
            ? const [
                'Reading your taste in film',
                'Framing your questions',
                'Setting the scene',
                'Almost rolling',
              ]
            : const [
                'Screening your answers',
                'Matching directors & tone',
                'Curating your watchlist',
                'Rolling the credits',
              ];
      case ContentType.book:
        return building
            ? const [
                'Reading your literary taste',
                'Shaping your questions',
                'Dog-earing the details',
                'Almost off the shelf',
              ]
            : const [
                'Turning your answers over',
                'Matching authors & themes',
                'Curating your reading list',
                'Closing the cover',
              ];
      case ContentType.music:
        return building
            ? const [
                'Reading your sound',
                'Tuning your questions',
                'Setting the levels',
                'Almost on the air',
              ]
            : const [
                'Listening to your answers',
                'Matching artists & mood',
                'Sequencing your playlist',
                'Dropping the needle',
              ];
      default:
        return building
            ? const [
                'Reading your vibe',
                'Shaping your questions',
                'Tuning the details',
                'Almost ready',
              ]
            : const [
                'Reading your answers',
                'Matching your taste',
                'Curating your picks',
                'Polishing the results',
              ];
    }
  }

  Future<void> _loadQuestions() async {
    setState(() {
      _loadingQuestions = true;
      _error = null;
    });
    try {
      final qs = await ref.read(aiServiceProvider).generateQuestionsWithRetry(
            contentType: _content,
            userAge: _age,
            contentTone: _tone,
            questionCount: _count,
            userName: _name,
          );
      if (!mounted) return;
      setState(() {
        _questions = qs;
        _qIndex = 0;
        _loadingQuestions = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingQuestions = false;
        _error = 'We couldn\'t build your quiz. Tap to try again.';
      });
    }
  }

  List<Answer> _formatAnswers() {
    var n = 0;
    return _questions.map((q) {
      final v = _answers[q.id];
      final selected = v is List<String> ? v : null;
      return Answer(
        id: 'a${n++}',
        questionId: q.id,
        questionText: q.text,
        answerText: v is List<String> ? v.join(', ') : (v as String? ?? ''),
        selectedOptions: selected,
        createdAt: DateTime.now().toUtc().toIso8601String(),
      );
    }).toList();
  }

  /// One generation pass. [refinement] != null means a follow-up "refine
  /// these" pass: the original quiz context (answers + content type) is
  /// pulled from quizStore so we never re-ask questions, and it works
  /// identically for the normal quiz and surprise modes (both write that
  /// context here on the first pass). [refinement] == null is the
  /// original behaviour, byte-for-byte.
  Future<void> _generate({RefinementInput? refinement}) async {
    setState(() {
      _step = _Step.generating;
      _error = null;
    });
    // Stash the refinement so the genError "Try again" button replays the
    // same pass instead of silently dropping the steer.
    _pendingRefinement = refinement;

    final ContentType contentType;
    final List<Answer> answers;
    if (refinement != null) {
      final st = ref.read(quizStoreProvider);
      contentType = st.contentType ?? _content;
      answers = st.answers;
    } else {
      contentType = _content;
      answers = widget.surprise ? _surpriseAnswers() : _formatAnswers();
      ref.read(quizStoreProvider.notifier)
        ..setContentType(_content)
        ..setQuestionCount(_count)
        ..setAnswers(answers);
    }

    final res = await ref.read(recommendationFlowProvider).generate(
          answers: answers,
          contentType: contentType,
          userAge: _age,
          contentTone: _tone,
          userName: _name,
          refinement: refinement,
        );
    if (!mounted) return;
    if (res.isError) {
      setState(() {
        _step = _Step.genError;
        _genOverloaded = (res.error ?? '').toLowerCase().contains('overload');
        _error = res.error;
      });
      return;
    }
    ref.read(quizStoreProvider.notifier).setRecommendations(res.data!);
    // Log the result to the notification center as a persistent record
    // the user can revisit from History later.
    final n = res.data!.length;
    ref.read(notificationsCenterProvider.notifier).add(
          'Your picks are ready 🍿',
          n == 1
              ? 'A fresh recommendation from your quiz — find it in History.'
              : '$n fresh recommendations from your quiz — find them in History.',
          type: AppNotificationType.quiz,
          route: '/history',
        );
    setState(() => _step = _Step.results);
  }

  // Pop so the quiz plays its reverse (fade + slide-down) transition and
  // the shell underneath stays put. Fallback to home only if it was a
  // deep-link with nothing to pop back to.
  void _leaveQuiz() =>
      context.canPop() ? context.pop() : context.go('/');

  /// Confirms before abandoning an in-progress quiz. On the results step
  /// there's nothing to lose, so leave straight away.
  void _confirmLeave() {
    if (_step == _Step.results) {
      _leaveQuiz();
      return;
    }
    AdaptiveAlertDialog.show(
      context: context,
      title: 'Leave the quiz?',
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
          onPressed: _leaveQuiz,
        ),
      ],
    );
  }

  void _restart() {
    ref.read(quizStoreProvider.notifier).reset();
    setState(() {
      _step = _Step.content;
      _questions = [];
      _answers.clear();
      _qIndex = 0;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Interactive steps live in a centered, max-width branded card like the
    // web /quiz. Generating + results stay full-bleed (their own scrollers).
    final framed = _step == _Step.content ||
        _step == _Step.count ||
        _step == _Step.questions ||
        _step == _Step.genError;

    final switcher = AnimatedSwitcher(
      duration: const Duration(milliseconds: 320),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: Offset(0.22 * _dir, 0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        ),
      ),
      child: KeyedSubtree(
          key: ValueKey('${_step}_$_qIndex'), child: _content_()),
    );

    final content = framed
        ? ResponsiveCenter(
            // Steps sit directly on the modal surface (no card) — the
            // sheet itself is the container now.
            maxWidth: context.isTablet ? 920 : 520,
            alignment: Alignment.center,
            child: SingleChildScrollView(
              padding: EdgeInsets.all(context.isTablet ? 36 : 24),
              child: switcher,
            ),
          )
        // Generating loader / results: keep full height but cap the
        // column so the picks list doesn't stretch across a tablet.
        : ResponsiveCenter(
            maxWidth: context.isTablet ? 1100 : 640,
            alignment: Alignment.center,
            child: switcher);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _confirmLeave();
      },
      // Modal task: a rounded sheet that sits over the dimmed shell, with
      // a grab handle + a single confirmed close (the X). No bottom nav.
      child: Align(
        alignment: Alignment.bottomCenter,
        child: FractionallySizedBox(
          heightFactor: 0.95,
          widthFactor: 1,
          child: ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(28)),
            // Material (not a bare ColoredBox) so Slider / IconButton ink
            // and other Material descendants have the ancestor they need.
            child: Material(
              color: brandBg(Theme.of(context).brightness),
              child: SafeArea(
                top: false,
                child: Column(children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                        color: context.colors.border,
                        borderRadius: BorderRadius.circular(999)),
                  ),
                  Padding(
                    padding:
                        const EdgeInsets.fromLTRB(20, 6, 8, 0),
                    child: Row(children: [
                      const Expanded(
                          child: BrandHeading('Quiz', size: 20)),
                      Semantics(
                        button: true,
                        label: 'Close quiz',
                        child: AdaptiveButton.icon(
                          icon: Icons.close,
                          style: AdaptiveButtonStyle.plain,
                          onPressed: _confirmLeave,
                        ),
                      ),
                    ]),
                  ),
                  Expanded(child: content),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _content_() {
    switch (_step) {
      case _Step.content:
        return _contentStep();
      case _Step.count:
        return _countStep();
      case _Step.questions:
        return _questionsStep();
      case _Step.generating:
        return Center(
          child: PhasedLoader(
            color: _accentColor,
            phases: _phases(building: false),
          ),
        );
      case _Step.genError:
        return _errorStep();
      case _Step.results:
        return ResultsView(
          recommendations:
              ref.watch(quizStoreProvider).recommendations,
          onRestart: _restart,
          onRefine: _refine,
        );
    }
  }

  Widget _contentStep() {
    const opts = [
      (ContentType.movie, 'Movie', 'Films picked for your taste',
          Icons.movie_outlined),
      (ContentType.book, 'Book', 'Reads that fit who you are',
          Icons.menu_book_outlined),
      (ContentType.music, 'Music', 'Albums tuned to your mood',
          Icons.music_note_outlined),
      (ContentType.mix, 'Mix', 'A little of everything',
          Icons.auto_awesome_outlined),
    ];
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Eyebrow('New quiz', color: _accentColor),
        const SizedBox(height: 6),
        const BrandHeading('What are you in the mood for?', size: 24),
        const SizedBox(height: 4),
        Subtitle('Pick a lane — every question is tailored to it.'),
        const SizedBox(height: 20),
        ResponsiveTiles(
          minTileWidth: 380,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (final (ct, label, desc, icon) in opts)
              _contentCard(ct, label, desc, icon),
          ],
        ),
        const SizedBox(height: 20),
        AdaptiveButton(
          onPressed: () {
            ref.read(quizStoreProvider.notifier).setRecommendations([]);
            setState(() {
              _dir = 1;
              _step = _Step.count;
            });
          },
          label: 'Continue',
          color: _accentDot,
        ),
      ],
    );
  }

  /// Feed-style selectable surface: per-content gradient + accent border,
  /// icon circle, and a check affordance — matches the Feed/Dashboard
  /// card language instead of the old neutral bento tile.
  Widget _contentCard(
      ContentType ct, String label, String desc, IconData icon) {
    final tone = contentAccent(
        accentForContentType(ct), Theme.of(context).brightness);
    final selected = _content == ct;
    return GestureDetector(
      onTap: () {
        Haptics.selection();
        setState(() => _content = ct);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
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

  Widget _countStep() {
    final accent = accentForContentType(_content);
    final tone =
        contentAccent(accent, Theme.of(context).brightness);
    const presets = [3, 5, 8, 10, 15];
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Eyebrow('Question count', color: tone.text),
        const SizedBox(height: 6),
        const BrandHeading('How many questions?', size: 24),
        const SizedBox(height: 4),
        Subtitle('More questions, sharper picks.'),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: tone.surfaceGradient),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: tone.surfaceBorder),
          ),
          child: Column(children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                ShaderMask(
                  shaderCallback: (r) =>
                      LinearGradient(colors: tone.barGradient)
                          .createShader(r),
                  child: Text('$_count',
                      style: const TextStyle(
                          fontSize: 56,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -2,
                          color: Colors.white)),
                ),
                const SizedBox(width: 8),
                Text('questions',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: context.brandMuted)),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                  color: tone.iconCircleBg,
                  borderRadius: BorderRadius.circular(999)),
              child: Text(
                  '≈ ${(_count * 18 + 30) ~/ 60 + 1} min',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: tone.iconCircleFg)),
            ),
            const SizedBox(height: 16),
            AdaptiveSlider(
              value: _count.toDouble(),
              min: 3,
              max: 15,
              divisions: 12,
              onChanged: (v) {
                final r = v.round();
                if (r != _count) Haptics.selection();
                setState(() => _count = r);
              },
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                for (final p in presets)
                  GestureDetector(
                    onTap: () {
                      Haptics.selection();
                      setState(() => _count = p);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 140),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: _count == p
                            ? tone.dot
                            : tone.iconCircleBg,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text('$p',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: _count == p
                                  ? Colors.white
                                  : tone.iconCircleFg)),
                    ),
                  ),
              ],
            ),
          ]),
        ),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(
            child: AdaptiveButton(
                onPressed: () => setState(() {
                  _dir = -1;
                  _step = _Step.content;
                }),
                label: 'Back',
                style: AdaptiveButtonStyle.bordered),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: AdaptiveButton(
              onPressed: () {
                setState(() {
                  _dir = 1;
                  _step = _Step.questions;
                });
                _loadQuestions();
              },
              label: 'Start',
              color: _accentDot,
            ),
          ),
        ]),
      ],
    );
  }

  Widget _questionsStep() {
    if (_loadingQuestions) {
      return Center(
        child: PhasedLoader(
          color: _accentColor,
          phases: _phases(building: true),
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: AdaptiveButton(
            onPressed: _loadQuestions,
            label: 'Try again',
            color: _accentDot),
      );
    }
    if (_questions.isEmpty) return const SizedBox.shrink();

    final q = _questions[_qIndex];
    final isLast = _qIndex == _questions.length - 1;
    final v = _answers[q.id];
    final answered = q.type == QuestionType.selectAll
        ? (v is List<String> && v.isNotEmpty)
        : (v is String && v.trim().isNotEmpty);

    return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            Semantics(
              button: true,
              label: 'Previous question',
              child: AdaptiveButton.icon(
              padding: EdgeInsets.zero,
              icon: Icons.arrow_back,
              style: AdaptiveButtonStyle.plain,
              onPressed: () => _qIndex > 0
                  ? setState(() {
                      _dir = -1;
                      _qIndex--;
                    })
                  : setState(() {
                      _dir = -1;
                      _step = _Step.count;
                    }),
              ),
            ),
            Expanded(
              child: Eyebrow(
                'Question ${_qIndex + 1} of ${_questions.length}',
                color: _accentColor,
              ),
            ),
          ]),
          const SizedBox(height: 10),
          BrandProgressBar(
            value: (_qIndex + 1) / _questions.length,
            accent: accentForContentType(_content),
          ),
          const SizedBox(height: 20),
          BrandHeading(q.text, size: 22),
          if (q.type == QuestionType.selectAll) ...[
            const SizedBox(height: 4),
            Subtitle('Pick all that apply'),
          ],
          const SizedBox(height: 18),
          _questionInput(q),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: AdaptiveButton(
                onPressed: !answered
                    ? null
                    : () {
                        if (isLast) {
                          _generate();
                        } else {
                          setState(() {
                            _dir = 1;
                            _qIndex++;
                          });
                        }
                      },
                label: isLast ? 'See results' : 'Next',
                color: _accentDot,
              ),
            ),
          ]),
        ],
    );
  }

  Widget _optionTile(String label, bool selected, VoidCallback onTap,
      {bool multi = false}) {
    final tone =
        contentAccent(accentForContentType(_content),
            Theme.of(context).brightness);
    return GestureDetector(
      onTap: () {
        Haptics.selection();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected
              ? tone.iconCircleBg
              : context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: selected ? tone.dot : context.colors.border,
              width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Icon(
            multi
                ? (selected
                    ? Icons.check_box
                    : Icons.check_box_outline_blank)
                : (selected
                    ? Icons.radio_button_checked
                    : Icons.radio_button_unchecked),
            size: 20,
            color: selected ? tone.text : context.colors.mutedForeground,
          ),
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

  Widget _questionInput(Question q) {
    switch (q.type) {
      case QuestionType.fillInBlank:
        _blank.text = (_answers[q.id] as String?) ?? '';
        return BrandCard(
          child: AdaptiveTextField(
            controller: _blank,
            placeholder: q.placeholder ?? 'Type your answer…',
            maxLines: 3,
            onChanged: (t) => _answers[q.id] = t,
          ),
        );
      case QuestionType.selectAll:
        final sel = (_answers[q.id] as List<String>?) ?? <String>[];
        return ResponsiveTiles(
          minTileWidth: 300,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (final o in q.options ?? const <String>[])
              _optionTile(o, sel.contains(o), () => setState(() {
                    final next = [...sel];
                    sel.contains(o) ? next.remove(o) : next.add(o);
                    _answers[q.id] = next;
                  }), multi: true),
          ],
        );
      case QuestionType.singleSelect:
        final cur = _answers[q.id] as String?;
        return ResponsiveTiles(
          minTileWidth: 300,
          tilesHaveOwnVerticalGap: true,
          children: [
            for (final o in q.options ?? const <String>[])
              _optionTile(o, cur == o,
                  () => setState(() => _answers[q.id] = o)),
          ],
        );
    }
  }

  Widget _errorStep() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BrandHeading(
            _genOverloaded ? 'Our AI is busy' : 'Something went wrong',
            size: 22),
        const SizedBox(height: 12),
        MessageBanner.error(_genOverloaded
            ? 'High demand right now. Give it another go in a moment.'
            : (_error ?? 'Please try again.')),
        const SizedBox(height: 16),
        AdaptiveButton(
            onPressed: () =>
                _generate(refinement: _pendingRefinement),
            label: 'Try again',
            color: _accentDot),
      ],
    );
  }

  /// Entry point for results_view's "Refine these": replays the original
  /// quiz context (from quizStore) with the user's steer layered on, reusing
  /// the generating loader + error handling + results transition.
  Future<void> _refine(RefinementInput input) =>
      _generate(refinement: input);
}
