import 'package:flutter/material.dart';

import '../../core/models/enums.dart';
import '../../features/recommendations/utils/match_score.dart';
import '../ui.dart';

/// Phase 2 kitchen-sink (adaptive-first): native-per-platform controls from
/// adaptive_platform_ui, plus the brand-only custom pieces (accent system,
/// loader, state-machine button). On Linux/Android this shows the Material
/// path; on an iOS 26 device the same widgets render as native Liquid Glass.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  bool _switch = true;
  bool _check = true;
  int _seg = 0;
  double _slider = 0.4;
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final b = Theme.of(context).brightness;

    return Scaffold(
      appBar: AppBar(title: const Text('Design System · adaptive')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _h('Adaptive buttons'),
          Wrap(spacing: 8, runSpacing: 8, children: [
            AdaptiveButton(onPressed: () {}, label: 'Filled'),
            AdaptiveButton(
                onPressed: () {},
                label: 'Tinted',
                style: AdaptiveButtonStyle.tinted),
            AdaptiveButton(
                onPressed: () {},
                label: 'Bordered',
                style: AdaptiveButtonStyle.bordered),
            AdaptiveButton(
                onPressed: () {},
                label: 'Plain',
                style: AdaptiveButtonStyle.plain),
            AdaptiveButton(
                onPressed: () {},
                label: 'Glass',
                style: AdaptiveButtonStyle.glass),
          ]),
          _h('State-machine button (custom)'),
          Align(
            alignment: Alignment.centerLeft,
            child: StatefulButton(
              label: 'Save',
              onPressed: () async {
                await Future<void>.delayed(const Duration(seconds: 1));
                return true;
              },
            ),
          ),
          _h('Adaptive segmented control (SF Symbols on iOS)'),
          AdaptiveSegmentedControl(
            labels: const ['Movie', 'Book', 'Music'],
            sfSymbols: const ['film.fill', 'book.fill', 'music.note'],
            selectedIndex: _seg,
            onValueChanged: (i) => setState(() => _seg = i),
          ),
          _h('Adaptive switch / checkbox / slider'),
          Row(children: [
            AdaptiveSwitch(
                value: _switch,
                onChanged: (v) => setState(() => _switch = v)),
            const SizedBox(width: 16),
            AdaptiveCheckbox(
                value: _check,
                onChanged: (v) => setState(() => _check = v ?? false)),
            const SizedBox(width: 16),
            Expanded(
              child: AdaptiveSlider(
                value: _slider,
                onChanged: (v) => setState(() => _slider = v),
              ),
            ),
          ]),
          _h('Adaptive text field'),
          AdaptiveTextField(
              controller: _controller, placeholder: 'Type something…'),
          _h('Adaptive card + list tile'),
          AdaptiveCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Past Lives',
                    style: TextStyle(
                        color: c.cardForeground,
                        fontSize: 18,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('Celine Song · 2023 · Drama',
                    style: TextStyle(color: c.mutedForeground)),
                const Divider(height: 24),
                AdaptiveListTile(
                  title: const Text('Open in library'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
              ],
            ),
          ),
          _h('Content accents (custom brand)'),
          Row(children: [
            for (final ct in [
              ContentType.movie,
              ContentType.book,
              ContentType.music,
              ContentType.mix,
            ])
              Expanded(child: _accentSwatch(ct, b)),
          ]),
          _h('Match-score tones (custom brand)'),
          Row(children: [
            for (final t in MatchTone.values)
              Expanded(child: _matchChip(t, b)),
          ]),
          const SizedBox(height: 24),
          const Center(child: LoaderFive('Loading')),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _h(String t) => Padding(
        padding: const EdgeInsets.only(top: 28, bottom: 12),
        child: Text(t,
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: context.colors.foreground)),
      );

  Widget _accentSwatch(ContentType ct, Brightness b) {
    final tone = contentAccent(accentForContentType(ct), b);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: tone.surfaceGradient),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: tone.surfaceBorder),
      ),
      child: Column(
        children: [
          CircleAvatar(
              radius: 14,
              backgroundColor: tone.iconCircleBg,
              child: Icon(Icons.star, size: 14, color: tone.iconCircleFg)),
          const SizedBox(height: 8),
          Text(ct.wire, style: TextStyle(color: tone.text, fontSize: 12)),
          const SizedBox(height: 8),
          Container(
            height: 6,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: tone.barGradient),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _matchChip(MatchTone t, Brightness b) {
    final m = matchToneColors(t, b);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(vertical: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: m.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(t.name,
          style:
              TextStyle(color: m.foreground, fontWeight: FontWeight.w600)),
    );
  }
}
