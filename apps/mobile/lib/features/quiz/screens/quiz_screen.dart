import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    return BrandScaffold(
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: KeyedSubtree(
              key: ValueKey('${_step}_$_qIndex'), child: _content_()),
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
        return const Center(child: LoaderFive('Finding your picks'));
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

  Widget _pad(Widget child) =>
      Padding(padding: const EdgeInsets.all(24), child: child);

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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
        const SizedBox(height: 12),
        const Eyebrow('Smart Advisor'),
        const SizedBox(height: 6),
        const BrandHeading('What are you in the mood for?', size: 24),
        const SizedBox(height: 20),
        for (final (ct, label, desc, icon) in opts)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ContentBentoTile(
              accent: accentForContentType(ct),
              icon: icon,
              label: label,
              description: desc,
              selected: _content == ct,
              onTap: () => setState(() => _content = ct),
            ),
          ),
        const SizedBox(height: 8),
        AdaptiveButton(
          onPressed: () {
            ref.read(quizStoreProvider.notifier).setRecommendations([]);
            setState(() => _step = _Step.count);
          },
          label: 'Continue',
        ),
        ],
      ),
    );
  }

  Widget _countStep() {
    final accent = accentForContentType(_content);
    final tone =
        contentAccent(accent, Theme.of(context).brightness);
    return _pad(Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisAlignment: MainAxisAlignment.center,
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
                onPressed: () => setState(() => _step = _Step.content),
                label: 'Back',
                style: AdaptiveButtonStyle.bordered),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: AdaptiveButton(
              onPressed: () {
                setState(() => _step = _Step.questions);
                _loadQuestions();
              },
              label: 'Start',
            ),
          ),
        ]),
      ],
    ));
  }

  Widget _questionsStep() {
    if (_loadingQuestions) {
      return const Center(child: LoaderFive('Building your quiz'));
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

    return _pad(Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BrandProgressBar(
          value: (_qIndex + 1) / _questions.length,
          accent: accentForContentType(_content),
        ),
        const SizedBox(height: 12),
        Eyebrow('Question ${_qIndex + 1} of ${_questions.length}'),
        const SizedBox(height: 8),
        BrandHeading(q.text, size: 20),
        const SizedBox(height: 16),
        Expanded(child: SingleChildScrollView(child: _questionInput(q))),
        Row(children: [
          if (_qIndex > 0)
            Expanded(
              child: AdaptiveButton(
                  onPressed: () => setState(() => _qIndex--),
                  label: 'Back',
                  style: AdaptiveButtonStyle.bordered),
            ),
          if (_qIndex > 0) const SizedBox(width: 8),
          Expanded(
            child: AdaptiveButton(
              onPressed: !answered
                  ? null
                  : () {
                      if (isLast) {
                        _generate();
                      } else {
                        setState(() => _qIndex++);
                      }
                    },
              label: isLast ? 'See results' : 'Next',
            ),
          ),
        ]),
      ],
    ));
  }

  Widget _questionInput(Question q) {
    final c = context.colors;
    switch (q.type) {
      case QuestionType.fillInBlank:
        _blank.text = (_answers[q.id] as String?) ?? '';
        return AdaptiveTextField(
          controller: _blank,
          placeholder: q.placeholder ?? 'Type your answer…',
          maxLines: 3,
          onChanged: (t) => _answers[q.id] = t,
        );
      case QuestionType.selectAll:
        final sel = (_answers[q.id] as List<String>?) ?? <String>[];
        return Column(
          children: [
            for (final o in q.options ?? const <String>[])
              CheckboxListTile(
                value: sel.contains(o),
                title: Text(o, style: TextStyle(color: c.foreground)),
                onChanged: (on) => setState(() {
                  final next = [...sel];
                  on == true ? next.add(o) : next.remove(o);
                  _answers[q.id] = next;
                }),
              ),
          ],
        );
      case QuestionType.singleSelect:
        final cur = _answers[q.id] as String?;
        return Column(
          children: [
            for (final o in q.options ?? const <String>[])
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AdaptiveButton(
                  onPressed: () => setState(() => _answers[q.id] = o),
                  label: o,
                  style: cur == o
                      ? AdaptiveButtonStyle.filled
                      : AdaptiveButtonStyle.bordered,
                ),
              ),
          ],
        );
    }
  }

  Widget _errorStep() {
    final c = context.colors;
    return _pad(Column(
      mainAxisAlignment: MainAxisAlignment.center,
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
    ));
  }
}
