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
import '../../feed/widgets/feed_avatar.dart';
import '../../notifications/notification_service.dart';
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
      message:
          'Your answers won\'t count toward the group pick and you\'ll '
          'need the code to rejoin.',
      icon: Icons.exit_to_app,
      actions: [
        AlertAction(
            title: 'Keep playing',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Leave session',
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
  // Async mode one-shot guards (the session provider is a realtime
  // stream, so build runs on every change — these stop us re-kicking
  // start/resolve on each rebuild).
  bool _asyncStartKicked = false;
  bool _asyncResolveKicked = false;
  bool _submittedLocally = false;
  // One-shot guard so the live-activity foreground service is started
  // exactly once for this session.
  bool _liveStarted = false;

  @override
  void dispose() {
    // Leaving the session screen ends the group-quiz live activity.
    NotificationService.stopGroupQuizLive();
    super.dispose();
  }

  /// Status line for the iOS live notification — the Android foreground
  /// service builds its own (richer) line natively as it polls.
  String _liveLine(GroupQuizState s) {
    final n = s.participants.length;
    final max = s.session.maxParticipants;
    return switch (s.session.status) {
      QuizSessionStatus.lobby => n >= max
          ? 'Lobby full — starting soon'
          : 'Waiting for players — $n of $max joined',
      QuizSessionStatus.inProgress => 'Quiz in progress',
      _ => '',
    };
  }

  /// Mirrors the live session into a "live activity": on Android a
  /// foreground service keeps a promoted Live Update fresh even while
  /// backgrounded; on iOS a standard notification (ActivityKit Live
  /// Activity is scaffolded under ios/LiveActivity/).
  void _syncLiveActivity(GroupQuizState s) {
    final status = s.session.status;
    if (status == QuizSessionStatus.completed ||
        status == QuizSessionStatus.cancelled) {
      if (_liveStarted) {
        _liveStarted = false;
        NotificationService.stopGroupQuizLive();
      }
      return;
    }
    if (!_liveStarted) {
      _liveStarted = true;
      NotificationService.startGroupQuizLive(
          sessionId: widget.sessionId, code: s.session.code);
    }
    NotificationService.updateGroupQuizLive(
        code: s.session.code, line: _liveLine(s));
  }

  @override
  Widget build(BuildContext context) {
    // Fires on the initial loading→data transition and every realtime
    // session change after it, keeping the live activity in sync.
    ref.listen(groupQuizSessionProvider(widget.sessionId), (_, next) {
      final s = next.asData?.value;
      if (s != null) _syncLiveActivity(s);
    });

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
        // Async sessions take an entirely separate subtree — the live
        // status switch below is never reached for them, so live mode
        // is provably unchanged.
        if (session.isAsync) {
          return _async(session, s.participants);
        }
        return switch (session.status) {
          QuizSessionStatus.lobby =>
            _lobby(session, s.participants, isHost),
          QuizSessionStatus.inProgress =>
            _inProgress(session, s.participants, isHost),
          QuizSessionStatus.completed =>
            _completed(session, s.participants),
          QuizSessionStatus.cancelled => Center(
              child: Subtitle('This session was cancelled.')),
        };
      },
    );
  }

  /// Session-wide content accent (movie/book/music/mix). Used to color
  /// every eyebrow, button, and tinted surface in the session screen so
  /// the whole flow reads as that content type — like every other screen
  /// in the app.
  ContentAccentTone _toneFor(QuizSession s) => contentAccent(
      accentForContentType(ContentType.fromWire(s.contentType)),
      Theme.of(context).brightness);

  Widget _lobby(
      QuizSession s, List<QuizParticipant> parts, bool isHost) {
    final tone = _toneFor(s);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Eyebrow('Lobby', color: tone.text),
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
                AdaptiveButton.icon(
                  icon: Icons.copy,
                  style: AdaptiveButtonStyle.plain,
                  onPressed: () => Clipboard.setData(
                      ClipboardData(text: s.code)),
                ),
                AdaptiveButton.icon(
                  icon: Icons.ios_share,
                  style: AdaptiveButtonStyle.plain,
                  onPressed: () => SharePlus.instance.share(ShareParams(
                      text: 'Join my Smart Advisor group quiz — '
                          'code ${s.code}')),
                ),
              ]),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Eyebrow('${parts.length} / ${s.maxParticipants} joined',
            color: tone.text),
        const SizedBox(height: 10),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final p in parts)
              _ParticipantChip(participant: p, submitted: false),
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
    final tone = _toneFor(s);
    final questions = s.questions ?? const <Question>[];
    if (questions.isEmpty) {
      return const Center(child: LoaderFive('Preparing questions'));
    }
    final submitted =
        parts.where((p) => p.answersSubmittedAt != null).length;
    final allIn = parts.isNotEmpty && submitted == parts.length;

    if (isHost && allIn) {
      return ListView(padding: const EdgeInsets.all(24), children: [
        Eyebrow('Everyone\'s here', color: tone.text),
        const SizedBox(height: 6),
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
      Eyebrow('Question ${_q + 1} of ${questions.length}',
          color: tone.text),
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
      const SizedBox(height: 12),
      // Submit-status avatar strip — same avatars used elsewhere, with
      // a ring that's only fully drawn for participants who've already
      // locked in. Lightweight live readout while the room answers.
      Center(
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: [
            for (final p in parts)
              _SubmitStatusAvatar(
                  name: p.displayName,
                  submitted: p.answersSubmittedAt != null),
          ],
        ),
      ),
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
            AdaptiveListTile(
              leading: AdaptiveCheckbox(
                value: sel.contains(o),
                onChanged: (on) => setState(() {
                  final next = [...sel];
                  on == true ? next.add(o) : next.remove(o);
                  _answers[_q] = next.join(', ');
                }),
              ),
              title: Text(o),
              onTap: () => setState(() {
                final next = [...sel];
                sel.contains(o) ? next.remove(o) : next.add(o);
                _answers[_q] = next.join(', ');
              }),
            ),
        ]);
      case QuestionType.fillInBlank:
        return AdaptiveTextField(
          placeholder: q.placeholder,
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

  Widget _completed(QuizSession s, List<QuizParticipant> parts) {
    final tone = _toneFor(s);
    final r = s.result;
    final picks = [
      if (r?.movie != null) ('Movie', r!.movie!),
      if (r?.book != null) ('Book', r!.book!),
      if (r?.music != null) ('Music', r!.music!),
    ];
    return ListView(padding: const EdgeInsets.all(24), children: [
      Eyebrow('Your group pick', color: tone.text),
      const SizedBox(height: 4),
      const BrandHeading('Decided together', size: 22),
      const SizedBox(height: 10),
      // Member avatar stack — small overlapping ring of who was in the
      // room when the pick landed.
      if (parts.isNotEmpty) _AvatarStack(participants: parts),
      const SizedBox(height: 16),
      if (picks.isEmpty)
        Subtitle('No result.')
      else
        for (final (label, p) in picks)
          Builder(builder: (context) {
            // Per-pick accent: movies = amber, books = emerald,
            // music = rose. Each card's surface + eyebrow speaks
            // the type, so a mixed-mode result reads at a glance.
            final pickAccent = label == 'Movie'
                ? ContentAccentName.amber
                : label == 'Book'
                    ? ContentAccentName.emerald
                    : ContentAccentName.rose;
            final pickTone = contentAccent(
                pickAccent, Theme.of(context).brightness);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: BrandCard(
                accent: pickAccent,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Eyebrow(label, color: pickTone.text),
                    const SizedBox(height: 6),
                    Text(p.title,
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: context.brandInk)),
                    if (p.explanation != null) ...[
                      const SizedBox(height: 8),
                      Text(p.explanation!,
                          style:
                              TextStyle(color: context.brandMuted)),
                    ],
                  ],
                ),
              ),
            );
          }),
      const SizedBox(height: 16),
      AdaptiveButton(
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/'),
          label: 'Done',
          style: AdaptiveButtonStyle.bordered),
    ]);
  }

  // -------------------------------------------------------------------
  // Async mode (deadline_at != null). Entirely separate from the live
  // state machine above — answer on your own time, resolves client-side
  // when everyone's in or the deadline passes.
  // -------------------------------------------------------------------

  Future<void> _kickAsyncStart(QuizSession s) async {
    final p = ref.read(currentProfileProvider).asData?.value;
    await ref.read(groupQuizServiceProvider).startAsyncQuiz(
          s, p?.age ?? 18, p?.name ?? 'Host',
          contentTone: ref.read(contentToneProvider));
  }

  Future<void> _kickAsyncResolve(QuizSession s) async {
    final p = ref.read(currentProfileProvider).asData?.value;
    await ref.read(groupQuizServiceProvider).resolveIfReady(
          s.id, p?.age ?? 18, p?.name ?? 'Host',
          contentTone: ref.read(contentToneProvider));
  }

  String _fmtWhen(DateTime? utc) {
    if (utc == null) return '';
    final d = utc.toLocal();
    const m = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final hh = d.hour.toString().padLeft(2, '0');
    final mm = d.minute.toString().padLeft(2, '0');
    return '${m[d.month - 1]} ${d.day}, $hh:$mm';
  }

  Widget _async(QuizSession s, List<QuizParticipant> parts) {
    final tone = _toneFor(s);
    if (s.status == QuizSessionStatus.cancelled) {
      return Center(child: Subtitle('This session was cancelled.'));
    }
    if (s.status == QuizSessionStatus.completed) {
      return _completed(s, parts);
    }

    final questions = s.questions ?? const <Question>[];
    if (s.status == QuizSessionStatus.lobby || questions.isEmpty) {
      if (!_asyncStartKicked) {
        _asyncStartKicked = true;
        Future.microtask(() => _kickAsyncStart(s));
      }
      return const Center(child: LoaderFive('Setting up your quiz'));
    }

    // Resolve once on entry — covers "deadline already passed" and
    // "everyone else already submitted" on open.
    if (!_asyncResolveKicked) {
      _asyncResolveKicked = true;
      Future.microtask(() => _kickAsyncResolve(s));
    }

    final uid = ref.read(supabaseClientProvider).auth.currentUser?.id;
    final mine =
        parts.where((p) => p.userId != null && p.userId == uid);
    final iSubmitted = _submittedLocally ||
        (mine.isNotEmpty && mine.first.answersSubmittedAt != null);
    final submitted =
        parts.where((p) => p.answersSubmittedAt != null).length;
    final deadline = _fmtWhen(s.deadlineAtUtc);

    if (!iSubmitted) {
      final q = questions[_q];
      final isLast = _q == questions.length - 1;
      return ListView(padding: const EdgeInsets.all(24), children: [
        Eyebrow('Answer by $deadline', color: tone.text),
        const SizedBox(height: 8),
        BrandProgressBar(
            value: (_q + 1) / questions.length,
            accent: accentForContentType(
                ContentType.fromWire(s.contentType))),
        const SizedBox(height: 12),
        Eyebrow('Question ${_q + 1} of ${questions.length}',
            color: tone.text),
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
                  ? () async {
                      if (isLast) {
                        await _submitAll(s);
                        if (!mounted) return;
                        setState(() => _submittedLocally = true);
                        await _kickAsyncResolve(s);
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
            child:
                Subtitle('$submitted of ${parts.length} submitted')),
      ]);
    }

    return ListView(padding: const EdgeInsets.all(24), children: [
      Eyebrow('Answers in', color: tone.text),
      const SizedBox(height: 8),
      const BrandHeading('Waiting on the group', size: 22),
      const SizedBox(height: 12),
      Subtitle("We'll reveal the group pick once everyone's "
          'submitted or the deadline passes.'),
      const SizedBox(height: 16),
      BrandCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Eyebrow('$submitted of ${parts.length} submitted',
                color: tone.text),
            const SizedBox(height: 6),
            Text('Deadline · $deadline',
                style: TextStyle(color: context.brandMuted)),
            if (s.plannedForUtc != null) ...[
              const SizedBox(height: 4),
              Text('Planned for · ${_fmtWhen(s.plannedForUtc)}',
                  style: TextStyle(color: context.brandMuted)),
            ],
          ],
        ),
      ),
      const SizedBox(height: 16),
      AdaptiveButton(
        onPressed: _busy
            ? null
            : () async {
                setState(() => _busy = true);
                await _kickAsyncResolve(s);
                if (mounted) setState(() => _busy = false);
              },
        label: 'Check now',
        style: AdaptiveButtonStyle.bordered,
      ),
    ]);
  }
}

/// Lobby participant chip: avatar (initials on hue-by-name) + display
/// name + a small "host" badge. Replaces the plain Material Chip so the
/// room feels more personal.
class _ParticipantChip extends StatelessWidget {
  const _ParticipantChip(
      {required this.participant, required this.submitted});

  final QuizParticipant participant;
  final bool submitted;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 6, 12, 6),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: c.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FeedAvatar(name: participant.displayName, size: 28),
          const SizedBox(width: 8),
          Text(
            participant.displayName,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: c.foreground),
          ),
          if (participant.isHost) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Tw.amber500.withValues(alpha: .18),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'host',
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                    color: Tw.amber500),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// In-progress submit-status avatar. Renders the same FeedAvatar with
/// a coloured ring around it — emerald when locked in, neutral muted
/// otherwise. Lightweight live readout while the room is answering.
class _SubmitStatusAvatar extends StatelessWidget {
  const _SubmitStatusAvatar({required this.name, required this.submitted});

  final String name;
  final bool submitted;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Tooltip(
      message: submitted ? '$name · locked in' : '$name · still answering',
      child: Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: submitted ? Tw.emerald500 : c.border,
            width: submitted ? 2 : 1.5,
          ),
        ),
        child: FeedAvatar(name: name, size: 30),
      ),
    );
  }
}

/// Overlapping avatar stack used on the result card. Shows up to 6
/// members; if more, the trailing tile shows "+N".
class _AvatarStack extends StatelessWidget {
  const _AvatarStack({required this.participants});

  final List<QuizParticipant> participants;

  @override
  Widget build(BuildContext context) {
    const max = 6;
    final shown = participants.take(max).toList();
    final overflow = participants.length - shown.length;
    const size = 32.0;
    const overlap = 10.0;
    final width = shown.length * (size - overlap) + overlap +
        (overflow > 0 ? size - overlap : 0);
    final c = context.colors;
    return SizedBox(
      height: size + 4,
      width: width,
      child: Stack(
        children: [
          for (var i = 0; i < shown.length; i++)
            Positioned(
              left: i * (size - overlap),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: c.background,
                ),
                child: FeedAvatar(
                  name: shown[i].displayName,
                  size: size - 4,
                ),
              ),
            ),
          if (overflow > 0)
            Positioned(
              left: shown.length * (size - overlap),
              child: Container(
                width: size,
                height: size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: c.muted,
                  border: Border.all(color: c.background, width: 2),
                ),
                child: Text(
                  '+$overflow',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: c.foreground),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
