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

class _S extends ConsumerState<GroupQuizScreen> {
  _Path _path = _Path.pick;
  int _content = 3; // 0 movie,1 book,2 music,3 mix
  int _count = 5;
  int _maxP = 8;
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
    final r = await ref.read(groupQuizServiceProvider).createSession(
          contentType: _contentWire,
          questionCount: _count,
          maxParticipants: _maxP,
          displayName: _name.text.trim(),
        );
    if (!mounted) return;
    setState(() => _busy = false);
    if (r.error != null) {
      setState(() => _error = r.error);
      return;
    }
    context.go('/group-quiz/${r.session!.code}');
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
    context.go('/group-quiz/${r.session!.code}');
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

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 8),
          IconButton(
            padding: EdgeInsets.zero,
            alignment: Alignment.centerLeft,
            icon: Icon(_path == _Path.pick
                ? Icons.close
                : Icons.arrow_back),
            onPressed: () => _path == _Path.pick
                ? context.go('/')
                : setState(() => _path = _Path.pick),
          ),
          const Eyebrow('Group quiz'),
          const SizedBox(height: 4),
          const BrandHeading('Find a pick together', size: 26),
          const SizedBox(height: 8),
          Subtitle(
              'Everyone answers; the AI blends your tastes into one pick.'),
          const SizedBox(height: 22),
          if (_path == _Path.pick) ...[
            _choiceCard(
                ContentAccentName.violet,
                Icons.add_circle_outline,
                'Host a session',
                'Set it up and share a 6-character code.',
                () => setState(() => _path = _Path.host)),
            _choiceCard(
                ContentAccentName.rose,
                Icons.login,
                'Join with a code',
                'Got a code from a friend? Hop in.',
                () => setState(() => _path = _Path.join)),
          ] else if (_path == _Path.host) ...[
            BrandCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('Content'),
                  const SizedBox(height: 8),
                  BrandSegmented(
                    color: accentColorForLabel(
                        const ['Movie', 'Book', 'Music', 'Mix'][_content]),
                    labels: const ['Movie', 'Book', 'Music', 'Mix'],
                    selectedIndex: _content,
                    onValueChanged: (i) => setState(() => _content = i),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Eyebrow('Questions'),
                      Text('$_count',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: context.brandInk)),
                    ],
                  ),
                  AdaptiveSlider(
                      value: _count.toDouble(),
                      min: 3,
                      max: 15,
                      divisions: 12,
                      onChanged: (v) =>
                          setState(() => _count = v.round())),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Eyebrow('Max players'),
                      Text('$_maxP',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: context.brandInk)),
                    ],
                  ),
                  AdaptiveSlider(
                      value: _maxP.toDouble(),
                      min: 2,
                      max: 20,
                      divisions: 18,
                      onChanged: (v) =>
                          setState(() => _maxP = v.round())),
                  const SizedBox(height: 12),
                  AdaptiveTextField(
                      controller: _name,
                      placeholder: 'Your display name'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AdaptiveButton(
                onPressed: _busy ? null : _host,
                label: 'Create session'),
          ] else ...[
            BrandCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Eyebrow('Session code'),
                  const SizedBox(height: 8),
                  AdaptiveTextField(
                      controller: _code, placeholder: 'ABC123'),
                  const SizedBox(height: 14),
                  const Eyebrow('Display name'),
                  const SizedBox(height: 8),
                  AdaptiveTextField(
                      controller: _name, placeholder: 'Your name'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AdaptiveButton(
                onPressed: _busy ? null : _join, label: 'Join session'),
          ],
          if (_error != null) ...[
            const SizedBox(height: 14),
            Center(
                child: Text(_error!,
                    style: TextStyle(
                        color: context.colors.destructive,
                        fontSize: 13))),
          ],
        ],
      ),
    );
  }
}
