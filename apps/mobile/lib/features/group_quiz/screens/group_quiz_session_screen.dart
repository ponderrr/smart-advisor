import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/question.dart';
import '../../../core/supabase/supabase_providers.dart';
import '../../../ui/ui.dart';
import '../../auth/auth_providers.dart';
import '../group_quiz_providers.dart';
import '../models/group_quiz.dart';

final _resolveProvider = FutureProvider.autoDispose
    .family<String?, String>((ref, code) async {
  final r = await ref.watch(groupQuizServiceProvider).findByCode(code);
  return r.session?.id;
});

class GroupQuizSessionScreen extends ConsumerWidget {
  const GroupQuizSessionScreen({super.key, required this.code});
  final String code;

  void _confirmLeave(BuildContext context) {
    AdaptiveAlertDialog.show(
      context: context,
      title: 'Leave the session?',
      message: 'You’ll drop out of this group quiz.',
      icon: Icons.logout,
      actions: [
        AlertAction(
            title: 'Stay',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Leave',
          style: AlertActionStyle.destructive,
          onPressed: () => context.canPop()
              ? context.pop()
              : context.go('/'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = ref.watch(_resolveProvider(code));
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _confirmLeave(context);
      },
      child: ModalSheet(
        title: 'Session $code',
        onClose: () => _confirmLeave(context),
        child: id.when(
          loading: () => const Center(child: LoaderFive('Joining')),
          error: (e, _) => Center(
              child: Subtitle(
                  'Couldn’t reach the session. Check your '
                  'connection and try again.',
                  center: true)),
          data: (sessionId) => sessionId == null
              ? Center(child: Subtitle('Session not found or expired.'))
              : _Body(code: code, sessionId: sessionId),
        ),
      ),
    );
  }
}

class _Body extends ConsumerStatefulWidget {
  const _Body({required this.code, required this.sessionId});
  final String code;
  final String sessionId;

  @override
  ConsumerState<_Body> createState() => _BodyState();
}

class _BodyState extends ConsumerState<_Body> {
  final _answers = <int, String>{};
  int _q = 0;
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(groupQuizSessionProvider(widget.sessionId));
    return async.when(
      loading: () => const Center(child: LoaderFive('Loading')),
      error: (e, _) => Center(
          child: Subtitle(
              'Something went wrong loading the session. '
              'Please try again.',
              center: true)),
      data: (s) {
        final session = s.session;
        final uid = ref.read(supabaseClientProvider).auth.currentUser?.id;
        final isHost = uid != null && uid == session.hostUserId;
        return switch (session.status) {
          QuizSessionStatus.lobby =>
            _lobby(session, s.participants, isHost),
          QuizSessionStatus.inProgress =>
            _inProgress(session, s.participants, isHost),
          QuizSessionStatus.completed => _completed(session),
          QuizSessionStatus.cancelled => Center(
              child: Subtitle('This session was cancelled.')),
        };
      },
    );
  }

  Widget _lobby(
      QuizSession s, List<QuizParticipant> parts, bool isHost) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Eyebrow('Lobby'),
        const SizedBox(height: 8),
        BrandCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(s.code,
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                      color: context.brandInk)),
              Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                  icon: const Icon(Icons.copy),
                  tooltip: 'Copy code',
                  onPressed: () => Clipboard.setData(
                      ClipboardData(text: s.code)),
                ),
                IconButton(
                  icon: const Icon(Icons.ios_share),
                  tooltip: 'Share',
                  onPressed: () => SharePlus.instance.share(ShareParams(
                      text: 'Join my Smart Advisor group quiz — '
                          'code ${s.code}')),
                ),
              ]),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Eyebrow('${parts.length} / ${s.maxParticipants} joined'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final p in parts)
              Chip(
                  label: Text(
                      '${p.displayName}${p.isHost ? ' · host' : ''}')),
          ],
        ),
        const SizedBox(height: 20),
        if (isHost)
          AdaptiveButton(
            onPressed: (_busy || parts.length < 2)
                ? null
                : () => _start(s),
            label: parts.length < 2
                ? 'Need 2+ to start'
                : 'Start quiz',
          )
        else
          Center(child: Subtitle('Waiting for the host to start…')),
      ],
    );
  }

  Future<void> _start(QuizSession s) async {
    setState(() => _busy = true);
    final profile = ref.read(currentProfileProvider).asData?.value;
    await ref.read(groupQuizServiceProvider).generateAndStartQuiz(
          s,
          profile?.age ?? 18,
          profile?.name ?? 'Host',
          contentTone: ref.read(contentToneProvider),
        );
    if (mounted) setState(() => _busy = false);
  }

  Widget _inProgress(
      QuizSession s, List<QuizParticipant> parts, bool isHost) {
    final questions = s.questions ?? const <Question>[];
    if (questions.isEmpty) {
      return const Center(child: LoaderFive('Preparing questions'));
    }
    final submitted =
        parts.where((p) => p.answersSubmittedAt != null).length;
    final allIn = parts.isNotEmpty && submitted == parts.length;

    if (isHost && allIn) {
      return ListView(padding: const EdgeInsets.all(24), children: [
        const BrandHeading('Everyone\'s in', size: 22),
        const SizedBox(height: 8),
        Subtitle('Synthesize the group\'s shared pick.'),
        const SizedBox(height: 16),
        AdaptiveButton(
            onPressed: _busy ? null : () => _synthesize(s, parts),
            label: 'Reveal the pick'),
      ]);
    }

    final q = questions[_q];
    final isLast = _q == questions.length - 1;
    return ListView(padding: const EdgeInsets.all(24), children: [
      BrandProgressBar(
          value: (_q + 1) / questions.length,
          accent: accentForContentType(
              ContentType.fromWire(s.contentType))),
      const SizedBox(height: 12),
      Eyebrow('Question ${_q + 1} of ${questions.length}'),
      const SizedBox(height: 8),
      BrandHeading(q.text, size: 20),
      const SizedBox(height: 12),
      _input(q),
      const SizedBox(height: 16),
      Row(children: [
        if (_q > 0)
          Expanded(
              child: AdaptiveButton(
                  onPressed: () => setState(() => _q--),
                  label: 'Back',
                  style: AdaptiveButtonStyle.bordered)),
        if (_q > 0) const SizedBox(width: 8),
        Expanded(
          child: AdaptiveButton(
            onPressed: (_answers[_q]?.trim().isNotEmpty ?? false)
                ? () {
                    if (isLast) {
                      _submitAll(s);
                    } else {
                      setState(() => _q++);
                    }
                  }
                : null,
            label: isLast ? 'Submit answers' : 'Next',
          ),
        ),
      ]),
      const SizedBox(height: 16),
      Center(
          child: Subtitle('$submitted of ${parts.length} locked in')),
    ]);
  }

  Widget _input(Question q) {
    switch (q.type) {
      case QuestionType.singleSelect:
        return Column(
            children: [
          for (final o in q.options ?? const <String>[])
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AdaptiveButton(
                onPressed: () => setState(() => _answers[_q] = o),
                label: o,
                style: _answers[_q] == o
                    ? AdaptiveButtonStyle.filled
                    : AdaptiveButtonStyle.bordered,
              ),
            ),
        ]);
      case QuestionType.selectAll:
        final sel = (_answers[_q] ?? '').split(', ')
          ..removeWhere((e) => e.isEmpty);
        return Column(children: [
          for (final o in q.options ?? const <String>[])
            CheckboxListTile(
              value: sel.contains(o),
              title: Text(o),
              onChanged: (on) => setState(() {
                final next = [...sel];
                on == true ? next.add(o) : next.remove(o);
                _answers[_q] = next.join(', ');
              }),
            ),
        ]);
      case QuestionType.fillInBlank:
        return TextField(
          decoration: InputDecoration(hintText: q.placeholder),
          onChanged: (t) => _answers[_q] = t,
        );
    }
  }

  Future<void> _submitAll(QuizSession s) async {
    setState(() => _busy = true);
    final svc = ref.read(groupQuizServiceProvider);
    final pid = await svc.guestParticipantId(s.code);
    String? participantId = pid;
    if (participantId == null) {
      final uid = ref.read(supabaseClientProvider).auth.currentUser?.id;
      final parts = await svc.listParticipants(s.id);
      participantId = parts
          .where((p) => p.userId == uid)
          .map((p) => p.id)
          .cast<String?>()
          .firstWhere((_) => true, orElse: () => null);
    }
    if (participantId == null) {
      if (mounted) setState(() => _busy = false);
      return;
    }
    final questions = s.questions ?? const <Question>[];
    for (var i = 0; i < questions.length; i++) {
      await svc.submitAnswer(
        sessionId: s.id,
        participantId: participantId,
        questionIndex: i,
        question: questions[i].text,
        answer: _answers[i] ?? '',
      );
    }
    await svc.markParticipantSubmitted(participantId);
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _synthesize(
      QuizSession s, List<QuizParticipant> parts) async {
    setState(() => _busy = true);
    final profile = ref.read(currentProfileProvider).asData?.value;
    await ref.read(groupQuizServiceProvider).synthesizeRecommendation(
          s,
          parts,
          profile?.age ?? 18,
          profile?.name ?? 'Host',
          contentTone: ref.read(contentToneProvider),
        );
    if (mounted) setState(() => _busy = false);
  }

  Widget _completed(QuizSession s) {
    final r = s.result;
    final picks = [
      if (r?.movie != null) ('Movie', r!.movie!),
      if (r?.book != null) ('Book', r!.book!),
      if (r?.music != null) ('Music', r!.music!),
    ];
    return ListView(padding: const EdgeInsets.all(24), children: [
      const Eyebrow('Your group pick'),
      const SizedBox(height: 4),
      const BrandHeading('Decided together', size: 22),
      const SizedBox(height: 16),
      if (picks.isEmpty)
        Subtitle('No result.')
      else
        for (final (label, p) in picks)
          BrandCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(label),
                const SizedBox(height: 6),
                Text(p.title,
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                if (p.explanation != null) ...[
                  const SizedBox(height: 8),
                  Text(p.explanation!,
                      style: TextStyle(color: context.brandMuted)),
                ],
              ],
            ),
          ),
      const SizedBox(height: 16),
      AdaptiveButton(
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/'),
          label: 'Done',
          style: AdaptiveButtonStyle.bordered),
    ]);
  }
}
