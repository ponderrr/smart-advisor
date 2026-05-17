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

  @override
  Widget build(BuildContext context) {
    return BrandScaffold(
      appBar: AppBar(title: const Text('Group quiz')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Eyebrow('Group quiz'),
          const SizedBox(height: 4),
          const BrandHeading('Find a pick together', size: 24),
          const SizedBox(height: 20),
          if (_path == _Path.pick) ...[
            AdaptiveButton(
                onPressed: () => setState(() => _path = _Path.host),
                label: 'Host a session'),
            const SizedBox(height: 10),
            AdaptiveButton(
                onPressed: () => setState(() => _path = _Path.join),
                label: 'Join with a code',
                style: AdaptiveButtonStyle.bordered),
          ] else if (_path == _Path.host) ...[
            const Eyebrow('Content'),
            const SizedBox(height: 8),
            AdaptiveSegmentedControl(
            color: Tw.indigo500,
              labels: const ['Movie', 'Book', 'Music', 'Mix'],
              selectedIndex: _content,
              onValueChanged: (i) => setState(() => _content = i),
            ),
            const SizedBox(height: 16),
            Subtitle('$_count questions'),
            AdaptiveSlider(
                value: _count.toDouble(),
                min: 3,
                max: 15,
                divisions: 12,
                onChanged: (v) => setState(() => _count = v.round())),
            Subtitle('Up to $_maxP people'),
            AdaptiveSlider(
                value: _maxP.toDouble(),
                min: 2,
                max: 20,
                divisions: 18,
                onChanged: (v) => setState(() => _maxP = v.round())),
            const SizedBox(height: 12),
            AdaptiveTextField(
                controller: _name, placeholder: 'Your display name'),
            const SizedBox(height: 12),
            AdaptiveButton(
                onPressed: _busy ? null : _host,
                label: 'Create session'),
          ] else ...[
            AdaptiveTextField(
                controller: _code, placeholder: '6-char code'),
            const SizedBox(height: 12),
            AdaptiveTextField(
                controller: _name, placeholder: 'Your display name'),
            const SizedBox(height: 12),
            AdaptiveButton(
                onPressed: _busy ? null : _join, label: 'Join'),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Center(child: Subtitle(_error!)),
          ],
        ],
      ),
    );
  }
}
