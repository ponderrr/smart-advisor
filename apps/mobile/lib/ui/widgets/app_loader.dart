import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/tailwind_palette.dart';

/// Port of components/ui/loader.tsx `LoaderFive` — per-letter pulsing text
/// with a staggered opacity wave (indigo-500).
class LoaderFive extends StatefulWidget {
  const LoaderFive(this.text, {super.key});
  final String text;

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
                style: const TextStyle(
                  color: Tw.indigo500,
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
