import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/question.dart';
import '../../../core/services/service_providers.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../../recommendations/screens/results_view.dart';
import '../store/quiz_store.dart';

enum _Step { content, count, questions, generating, genError, results }

/// Port of the web quiz flow: content → count → questions → (generating) →
/// results, morphing in place. Questions and recommendations come from the
/// anthropic-* Edge Functions via ai_service / recommendation_flow.
class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

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

  @override
  void dispose() {
    _blank.dispose();
    super.dispose();
  }

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

  Future<void> _generate() async {
    setState(() {
      _step = _Step.generating;
      _error = null;
    });
    final answers = _formatAnswers();
    ref.read(quizStoreProvider.notifier)
      ..setContentType(_content)
      ..setQuestionCount(_count)
      ..setAnswers(answers);

    final res = await ref.read(recommendationFlowProvider).generate(
          answers: answers,
          contentType: _content,
          userAge: _age,
          contentTone: _tone,
          userName: _name,
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
    setState(() => _step = _Step.results);
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

    return BrandScaffold(
      body: SafeArea(
        child: framed
            ? ResponsiveCenter(
                // Tablet: a wide card that actually uses the screen, not a
                // skinny phone column floating in the middle.
                maxWidth: context.isTablet ? 920 : 520,
                alignment: Alignment.center,
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(context.isTablet ? 36 : 24),
                  child: BrandCard(
                      padding: EdgeInsets.all(context.isTablet ? 36 : 24),
                      child: switcher),
                ),
              )
            // Generating loader / results: keep full height but cap the
            // column so the picks list doesn't stretch across a tablet.
            // `center` keeps the loader vertically centred; the results
            // ListView fills height regardless.
            : ResponsiveCenter(
                maxWidth: context.isTablet ? 1100 : 640,
                alignment: Alignment.center,
                child: switcher),
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
        Align(
          alignment: Alignment.centerLeft,
          child: IconButton(
            padding: EdgeInsets.zero,
            icon: const Icon(Icons.arrow_back),
            // First step: leave the quiz entirely. (Solo enters via
            // /quiz/solo, a child of /quiz, so pop() would just reveal a
            // duplicate quiz — go home instead.)
            onPressed: () => context.go('/'),
          ),
        ),
        const Eyebrow('Smart Advisor'),
        const SizedBox(height: 6),
        const BrandHeading('What are you in the mood for?', size: 24),
        const SizedBox(height: 20),
        ResponsiveTiles(
          minTileWidth: 380,
          children: [
            for (final (ct, label, desc, icon) in opts)
              ContentBentoTile(
                accent: accentForContentType(ct),
                icon: icon,
                label: label,
                description: desc,
                selected: _content == ct,
                onTap: () => setState(() => _content = ct),
              ),
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
        ),
      ],
    );
  }

  Widget _countStep() {
    final accent = accentForContentType(_content);
    final tone =
        contentAccent(accent, Theme.of(context).brightness);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const BrandHeading('How many questions?', size: 24),
        const SizedBox(height: 16),
        BrandCard(
          accent: accent,
          child: Column(children: [
            ShaderMask(
              shaderCallback: (r) =>
                  LinearGradient(colors: tone.barGradient).createShader(r),
              child: Text('$_count',
                  style: const TextStyle(
                      fontSize: 56,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -2,
                      color: Colors.white)),
            ),
            Text('about ${(_count * 18 + 30) ~/ 60 + 1} min',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                    color: context.brandMuted)),
            const SizedBox(height: 12),
            AdaptiveSlider(
              value: _count.toDouble(),
              min: 3,
              max: 15,
              divisions: 12,
              onChanged: (v) => setState(() => _count = v.round()),
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
            onPressed: _loadQuestions, label: 'Try again'),
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
            IconButton(
              padding: EdgeInsets.zero,
              icon: const Icon(Icons.arrow_back),
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
      onTap: onTap,
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
    final c = context.colors;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(_genOverloaded ? 'Our AI is busy' : 'Something went wrong',
            style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: c.foreground)),
        const SizedBox(height: 8),
        Text(
            _genOverloaded
                ? 'High demand right now. Give it another go in a moment.'
                : (_error ?? 'Please try again.'),
            textAlign: TextAlign.center,
            style: TextStyle(color: c.mutedForeground)),
        const SizedBox(height: 16),
        AdaptiveButton(onPressed: _generate, label: 'Try again'),
      ],
    );
  }
}
