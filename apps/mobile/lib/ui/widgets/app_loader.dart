import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/tailwind_palette.dart';

/// Port of components/ui/loader.tsx `LoaderFive` — per-letter pulsing text
/// with a staggered opacity wave (indigo-500).
class LoaderFive extends StatefulWidget {
  const LoaderFive(this.text, {super.key, this.color});
  final String text;

  /// Accent for the pulsing letters. Defaults to indigo-500.
  final Color? color;

  @override
  State<LoaderFive> createState() => _LoaderFiveState();
}

class _LoaderFiveState extends State<LoaderFive>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  /// Staggered pulse: each letter's phase is offset by its index so the
  /// brightness travels across the word.
  double _letterOpacity(int i, int n) {
    final phase = (_ctrl.value - i / (n == 0 ? 1 : n)) % 1.0;
    final wave = 0.5 + 0.5 * (1 - (2 * phase - 1).abs());
    return 0.3 + 0.7 * wave;
  }

  @override
  Widget build(BuildContext context) {
    final chars = widget.text.split('');
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < chars.length; i++)
            Opacity(
              opacity: _letterOpacity(i, chars.length),
              child: Text(
                chars[i] == ' ' ? ' ' : chars[i],
                style: TextStyle(
                  color: widget.color ?? Tw.indigo500,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Multi-phase loader: cycles through [phases] with a color-coded
/// `LoaderFive` and a thin progress bar that fills as phases advance.
/// Used while the quiz is being built / picks generated so the wait
/// reads as real work rather than one static label.
class PhasedLoader extends StatefulWidget {
  const PhasedLoader({
    super.key,
    required this.phases,
    this.color,
    this.phaseDuration = const Duration(milliseconds: 2200),
  });

  final List<String> phases;
  final Color? color;
  final Duration phaseDuration;

  @override
  State<PhasedLoader> createState() => _PhasedLoaderState();
}

class _PhasedLoaderState extends State<PhasedLoader> {
  int _i = 0;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(widget.phaseDuration, (_) {
      if (!mounted) return;
      // Hold on the final phase (the real work may outlast the script).
      if (_i < widget.phases.length - 1) setState(() => _i++);
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Tw.indigo500;
    final progress = widget.phases.length <= 1
        ? 1.0
        : (_i + 1) / widget.phases.length;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 320),
          child: LoaderFive(
            widget.phases[_i],
            key: ValueKey(_i),
            color: color,
          ),
        ),
        const SizedBox(height: 18),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: SizedBox(
            width: 180,
            height: 4,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress),
              duration: const Duration(milliseconds: 480),
              curve: Curves.easeOutCubic,
              builder: (context, v, _) => LinearProgressIndicator(
                value: v,
                color: color,
                backgroundColor: color.withValues(alpha: 0.15),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Port of loader.tsx `PageLoader` — full-area route loader with a thin
/// shimmer progress bar.
class PageLoader extends StatelessWidget {
  const PageLoader({super.key, this.text = 'Loading'});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.colors.background,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 160,
            child: LinearProgressIndicator(
              minHeight: 2,
              color: Tw.indigo500,
              backgroundColor: Color(0x22000000),
            ),
          ),
          const SizedBox(height: 16),
          LoaderFive(text),
        ],
      ),
    );
  }
}
