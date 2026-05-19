import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../ui/ui.dart';
import '../group_quiz_providers.dart';

/// Port of web /group-quiz landing: path picker → host setup (auth) or
/// join (no auth) → routes to /group-quiz/<code>.
class GroupQuizScreen extends ConsumerStatefulWidget {
  const GroupQuizScreen({super.key});

  @override
  ConsumerState<GroupQuizScreen> createState() => _S();
}

enum _Path { pick, host, join }

/// Host setup is a solo-quiz-style stepper: one decision per page,
/// morphing in place.
enum _HostStep { content, questions, players, mode, confirm }

class _S extends ConsumerState<GroupQuizScreen> {
  _Path _path = _Path.pick;
  _HostStep _hostStep = _HostStep.content;
  int _dir = 1; // 1 forward, -1 back — drives the slide direction
  int _content = 3; // 0 movie,1 book,2 music,3 mix
  int _count = 5;
  int _maxP = 8;
  // Async mode (additive). _mode 0 = live (default, unchanged), 1 = async.
  int _mode = 0;
  int _deadlinePreset = 1; // index into _deadlineOptions
  DateTime? _plannedFor;
  static const _deadlineOptions = [
    ('24 hours', Duration(hours: 24)),
    ('3 days', Duration(days: 3)),
    ('1 week', Duration(days: 7)),
  ];
  final _name = TextEditingController();
  final _code = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _code.dispose();
    super.dispose();
  }

  String get _contentWire =>
      ['movie', 'book', 'music', 'mix'][_content];

  Future<void> _host() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Enter a display name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final deadline = _mode == 1
        ? DateTime.now().add(_deadlineOptions[_deadlinePreset].$2)
        : null;
    final r = await ref.read(groupQuizServiceProvider).createSession(
          contentType: _contentWire,
          questionCount: _count,
          maxParticipants: _maxP,
          displayName: _name.text.trim(),
          deadlineAt: deadline,
          plannedFor: _mode == 1 ? _plannedFor : null,
        );
    if (!mounted) return;
    setState(() => _busy = false);
    if (r.error != null) {
      setState(() => _error = r.error);
      return;
    }
    context.push('/group-quiz/${r.session!.code}');
  }

  Future<void> _join() async {
    if (_code.text.trim().length != 6 || _name.text.trim().isEmpty) {
      setState(() => _error = 'Enter the 6-char code and a display name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final r = await ref.read(groupQuizServiceProvider).joinSession(
        code: _code.text.trim().toUpperCase(),
        displayName: _name.text.trim());
    if (!mounted) return;
    setState(() => _busy = false);
    if (r.error != null) {
      setState(() => _error = r.error);
      return;
    }
    context.push('/group-quiz/${r.session!.code}');
  }

  void _leaveGroup() =>
      context.canPop() ? context.pop() : context.go('/');

  /// Header X / system back. From a sub-step it just returns to the
  /// picker; from the picker it confirms leaving the whole task.
  void _onClose() {
    if (_path != _Path.pick) {
      setState(() {
        _dir = -1;
        _path = _Path.pick;
        _error = null;
      });
      return;
    }
    AdaptiveAlertDialog.show(
      context: context,
      title: 'Leave group quiz?',
      message: 'You’ll exit this setup.',
      icon: Icons.logout,
      actions: [
        AlertAction(
            title: 'Keep going',
            style: AlertActionStyle.cancel,
            onPressed: () {}),
        AlertAction(
          title: 'Leave',
          style: AlertActionStyle.destructive,
          onPressed: _leaveGroup,
        ),
      ],
    );
  }

  ContentAccentName get _accentName => switch (_content) {
        0 => ContentAccentName.amber, // movie
        1 => ContentAccentName.emerald, // book
        2 => ContentAccentName.rose, // music
        _ => ContentAccentName.violet, // mix
      };

  /// Feed-style number surface (mirrors the solo quiz count step):
  /// accent gradient panel, big gradient number, optional badge pill,
  /// slider + color-coded preset pills.
  Widget _numberSurface({
    required ContentAccentTone tone,
    required String eyebrow,
    required int value,
    required String unit,
    String? badge,
    required double min,
    required double max,
    required int divisions,
    required ValueChanged<int> onChanged,
    required List<int> presets,
  }) {
    return Container(
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
        Align(
            alignment: Alignment.centerLeft,
            child: Eyebrow(eyebrow, color: tone.text)),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            ShaderMask(
              shaderCallback: (r) =>
                  LinearGradient(colors: tone.barGradient)
                      .createShader(r),
              child: Text('$value',
                  style: const TextStyle(
                      fontSize: 56,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -2,
                      color: Colors.white)),
            ),
            const SizedBox(width: 8),
            Text(unit,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: context.brandMuted)),
          ],
        ),
        if (badge != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
                color: tone.iconCircleBg,
                borderRadius: BorderRadius.circular(999)),
            child: Text(badge,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: tone.iconCircleFg)),
          ),
        ],
        const SizedBox(height: 16),
        AdaptiveSlider(
            value: value.toDouble(),
            min: min,
            max: max,
            divisions: divisions,
            onChanged: (v) => onChanged(v.round())),
        const SizedBox(height: 14),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: [
            for (final p in presets)
              GestureDetector(
                onTap: () => onChanged(p),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 140),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: value == p
                        ? tone.dot
                        : tone.iconCircleBg,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text('$p',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: value == p
                              ? Colors.white
                              : tone.iconCircleFg)),
                ),
              ),
          ],
        ),
      ]),
    );
  }

  Widget _choiceCard(ContentAccentName a, IconData icon, String title,
      String body, VoidCallback onTap) {
    final tone = contentAccent(a, Theme.of(context).brightness);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: tone.surfaceGradient),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.surfaceBorder),
        ),
        child: Row(children: [
          CircleAvatar(
              radius: 24,
              backgroundColor: tone.iconCircleBg,
              child: Icon(icon, color: tone.iconCircleFg, size: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: context.brandInk)),
                const SizedBox(height: 3),
                Text(body,
                    style: TextStyle(
                        fontSize: 13,
                        height: 1.35,
                        color: context.brandMuted)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: tone.text),
        ]),
      ),
    );
  }

  void _toHost(_HostStep s, int dir) =>
      setState(() {
        _dir = dir;
        _hostStep = s;
      });

  Widget _header(
      ContentAccentTone tone, String eyebrow, String title,
      [String? subtitle]) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(eyebrow, color: tone.text),
        const SizedBox(height: 6),
        BrandHeading(title, size: 24),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Subtitle(subtitle),
        ],
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _nav({
    required ContentAccentTone tone,
    required VoidCallback onBack,
    required String nextLabel,
    required VoidCallback? onNext,
  }) {
    return Row(children: [
      Expanded(
        child: AdaptiveButton(
            onPressed: onBack,
            label: 'Back',
            style: AdaptiveButtonStyle.bordered),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: AdaptiveButton(
            onPressed: onNext, label: nextLabel, color: tone.dot),
      ),
    ]);
  }

  Widget _errorText(ContentAccentTone tone) => _error == null
      ? const SizedBox.shrink()
      : Padding(
          padding: const EdgeInsets.only(top: 14),
          child: MessageBanner(
            message: _error!,
            tone: tone,
            icon: Icons.error_outline,
          ),
        );

  Widget _contentCard(int idx, IconData icon, String label, String desc) {
    final tone = contentAccent(
        switch (idx) {
          0 => ContentAccentName.amber,
          1 => ContentAccentName.emerald,
          2 => ContentAccentName.rose,
          _ => ContentAccentName.violet,
        },
        Theme.of(context).brightness);
    final selected = _content == idx;
    return GestureDetector(
      onTap: () => setState(() => _content = idx),
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

  Widget _page(ContentAccentTone tone) {
    if (_path == _Path.pick) {
      return Column(
        key: const ValueKey('pick'),
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Eyebrow('Group quiz'),
          const SizedBox(height: 4),
          const BrandHeading('Find a pick together', size: 26),
          const SizedBox(height: 8),
          Subtitle(
              'Everyone answers; the AI blends your tastes into one pick.'),
          const SizedBox(height: 22),
          ResponsiveTiles(
            minTileWidth: 380,
            tilesHaveOwnVerticalGap: true,
            children: [
              _choiceCard(
                  ContentAccentName.violet,
                  Icons.add_circle_outline,
                  'Host a session',
                  'Set it up and share a 6-character code.',
                  () => setState(() {
                        _dir = 1;
                        _path = _Path.host;
                        _hostStep = _HostStep.content;
                      })),
              _choiceCard(
                  ContentAccentName.rose,
                  Icons.login,
                  'Join with a code',
                  'Got a code from a friend? Hop in.',
                  () => setState(() {
                        _dir = 1;
                        _path = _Path.join;
                      })),
            ],
          ),
        ],
      );
    }

    if (_path == _Path.join) {
      return Column(
        key: const ValueKey('join'),
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header(tone, 'Join', 'Enter the code',
              'Use the 6-character code a host shared with you.'),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Session code', color: tone.text)),
          const SizedBox(height: 8),
          AdaptiveTextField(
              controller: _code, placeholder: 'ABC123'),
          const SizedBox(height: 16),
          Align(
              alignment: Alignment.centerLeft,
              child: Eyebrow('Display name', color: tone.text)),
          const SizedBox(height: 8),
          AdaptiveTextField(
              controller: _name, placeholder: 'Your name'),
          _errorText(tone),
          const SizedBox(height: 20),
          _nav(
            tone: tone,
            onBack: () => setState(() {
              _dir = -1;
              _path = _Path.pick;
              _error = null;
            }),
            nextLabel: 'Join session',
            onNext: _busy ? null : _join,
          ),
        ],
      );
    }

    // Host stepper.
    switch (_hostStep) {
      case _HostStep.content:
        const opts = [
          (0, Icons.movie_outlined, 'Movie', 'Films for the group'),
          (1, Icons.menu_book_outlined, 'Book', 'A read for everyone'),
          (2, Icons.music_note_outlined, 'Music', 'A shared soundtrack'),
          (3, Icons.auto_awesome_outlined, 'Mix', 'A little of everything'),
        ];
        return Column(
          key: const ValueKey('host_content'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(tone, 'Group quiz', 'What should we recommend?',
                'Everyone answers; the AI blends your tastes.'),
            ResponsiveTiles(
              minTileWidth: 380,
              tilesHaveOwnVerticalGap: true,
              children: [
                for (final (i, icon, label, desc) in opts)
                  _contentCard(i, icon, label, desc),
              ],
            ),
            const SizedBox(height: 8),
            _nav(
              tone: tone,
              onBack: () => setState(() {
                _dir = -1;
                _path = _Path.pick;
              }),
              nextLabel: 'Continue',
              onNext: () => _toHost(_HostStep.questions, 1),
            ),
          ],
        );
      case _HostStep.questions:
        return Column(
          key: const ValueKey('host_questions'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(tone, 'Step 2', 'How many questions?',
                'More questions, sharper group pick.'),
            _numberSurface(
              tone: tone,
              eyebrow: 'Questions',
              value: _count,
              unit: 'questions',
              badge: '≈ ${(_count * 18 + 30) ~/ 60 + 1} min',
              min: 3,
              max: 15,
              divisions: 12,
              onChanged: (v) => setState(() => _count = v),
              presets: const [3, 5, 8, 10, 15],
            ),
            const SizedBox(height: 20),
            _nav(
              tone: tone,
              onBack: () => _toHost(_HostStep.content, -1),
              nextLabel: 'Continue',
              onNext: () => _toHost(_HostStep.players, 1),
            ),
          ],
        );
      case _HostStep.players:
        return Column(
          key: const ValueKey('host_players'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(tone, 'Step 3', 'How many players?',
                'The most people who can join this session.'),
            _numberSurface(
              tone: tone,
              eyebrow: 'Max players',
              value: _maxP,
              unit: 'players',
              min: 2,
              max: 20,
              divisions: 18,
              onChanged: (v) => setState(() => _maxP = v),
              presets: const [2, 4, 6, 8, 12, 20],
            ),
            const SizedBox(height: 20),
            _nav(
              tone: tone,
              onBack: () => _toHost(_HostStep.questions, -1),
              nextLabel: 'Continue',
              onNext: () => _toHost(_HostStep.mode, 1),
            ),
          ],
        );
      case _HostStep.mode:
        return Column(
          key: const ValueKey('host_mode'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(tone, 'Step 4', 'When do you answer?',
                'Everyone together now, or on their own time.'),
            BrandSegmented(
              labels: const ['Together now', 'By a deadline'],
              selectedIndex: _mode,
              color: tone.dot,
              onValueChanged: (i) => setState(() => _mode = i),
            ),
            const SizedBox(height: 16),
            if (_mode == 1) ...[
              Align(
                  alignment: Alignment.centerLeft,
                  child: Eyebrow('Answer within', color: tone.text)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (var i = 0;
                      i < _deadlineOptions.length;
                      i++)
                    GestureDetector(
                      onTap: () =>
                          setState(() => _deadlinePreset = i),
                      child: AnimatedContainer(
                        duration:
                            const Duration(milliseconds: 140),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 9),
                        decoration: BoxDecoration(
                          color: _deadlinePreset == i
                              ? tone.dot
                              : tone.iconCircleBg,
                          borderRadius:
                              BorderRadius.circular(999),
                        ),
                        child: Text(_deadlineOptions[i].$1,
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: _deadlinePreset == i
                                    ? Colors.white
                                    : tone.iconCircleFg)),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Align(
                  alignment: Alignment.centerLeft,
                  child: Eyebrow('Plan to do it together (optional)',
                      color: tone.text)),
              const SizedBox(height: 8),
              AdaptiveButton(
                style: AdaptiveButtonStyle.bordered,
                onPressed: () async {
                  final now = DateTime.now();
                  final d = await AdaptiveDatePicker.show(
                    context: context,
                    initialDate: _plannedFor ??
                        now.add(const Duration(days: 1)),
                    firstDate: now,
                    lastDate:
                        now.add(const Duration(days: 365)),
                  );
                  if (d != null) {
                    setState(() => _plannedFor = d);
                  }
                },
                label: _plannedFor == null
                    ? 'Pick a date'
                    : '${_plannedFor!.year}-'
                        '${_plannedFor!.month.toString().padLeft(2, '0')}-'
                        '${_plannedFor!.day.toString().padLeft(2, '0')}',
              ),
              if (_plannedFor != null) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () =>
                        setState(() => _plannedFor = null),
                    child: Text('Clear date',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: tone.text)),
                  ),
                ),
              ],
            ] else
              Subtitle(
                  'Live: everyone joins the lobby and answers in '
                  'real time. The host reveals the pick.'),
            const SizedBox(height: 20),
            _nav(
              tone: tone,
              onBack: () => _toHost(_HostStep.players, -1),
              nextLabel: 'Continue',
              onNext: () => _toHost(_HostStep.confirm, 1),
            ),
          ],
        );
      case _HostStep.confirm:
        final summary = [
          ['Movie', 'Book', 'Music', 'Mix'][_content],
          '$_count questions',
          'up to $_maxP players',
          _mode == 1
              ? 'async · ${_deadlineOptions[_deadlinePreset].$1}'
              : 'live · together now',
        ];
        return Column(
          key: const ValueKey('host_confirm'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(tone, 'Confirm', 'Ready when you are',
                'Pick a name; we’ll generate a join code.'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: tone.surfaceGradient),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: tone.surfaceBorder),
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final s in summary)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                          color: tone.iconCircleBg,
                          borderRadius: BorderRadius.circular(999)),
                      child: Text(s,
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: tone.iconCircleFg)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Align(
                alignment: Alignment.centerLeft,
                child: Eyebrow('Display name', color: tone.text)),
            const SizedBox(height: 8),
            AdaptiveTextField(
                controller: _name,
                placeholder: 'Your display name'),
            _errorText(tone),
            const SizedBox(height: 20),
            _nav(
              tone: tone,
              onBack: () => _toHost(_HostStep.mode, -1),
              nextLabel: 'Create session',
              onNext: _busy ? null : _host,
            ),
          ],
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tone =
        contentAccent(_accentName, Theme.of(context).brightness);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _onClose();
      },
      child: ModalSheet(
        title: 'Group quiz',
        onClose: _onClose,
        child: ResponsiveCenter(
          maxWidth: context.isTablet ? 920 : 520,
          alignment: Alignment.center,
          child: SingleChildScrollView(
            padding: EdgeInsets.all(context.isTablet ? 36 : 24),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
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
              child: _page(tone),
            ),
          ),
        ),
      ),
    );
  }
}
