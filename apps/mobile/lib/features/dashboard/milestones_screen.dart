import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ui/ui.dart';
import 'milestones.dart';

/// Full milestone grid, grouped by tier (easy → master). Port of the web
/// dashboard "Milestones" tab.
class MilestonesScreen extends ConsumerWidget {
  const MilestonesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(milestonesProvider);
    return BrandScaffold(
      title: 'Milestones',
      body: data.when(
        loading: () => const Padding(
            padding: EdgeInsets.all(48),
            child: Center(child: LoaderFive('Loading'))),
        error: (e, _) => Center(child: Subtitle('Could not load: $e')),
        data: (d) => ResponsiveCenter(
          maxWidth: context.isTablet ? 1000 : 640,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            children: [
              _summary(context, d),
              const SizedBox(height: 6),
              Subtitle('Earn milestones as you use Smart Advisor.'),
              const SizedBox(height: 20),
              for (final tier in MilestoneTier.values) ...[
                _tierHeader(context, tier, d),
                const SizedBox(height: 12),
                ResponsiveTiles(
                  minTileWidth: 320,
                  tilesHaveOwnVerticalGap: true,
                  children: [
                    for (var i = 0; i < d.forTier(tier).length; i++)
                      _MilestoneTile(m: d.forTier(tier)[i])
                          .animate()
                          .fadeIn(
                              delay: (i * 45).ms, duration: 260.ms)
                          .slideY(begin: 0.06, curve: Curves.easeOut),
                  ],
                ),
                const SizedBox(height: 22),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _summary(BuildContext context, MilestonesData d) {
    final tone = contentAccent(
        ContentAccentName.violet, Theme.of(context).brightness);
    return Container(
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
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
              color: tone.iconCircleBg, shape: BoxShape.circle),
          child: Icon(Icons.emoji_events_outlined,
              color: tone.iconCircleFg, size: 24),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Milestones'),
              const SizedBox(height: 4),
              Text('${d.earned} of ${d.total} earned',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: context.brandInk)),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _tierHeader(
      BuildContext context, MilestoneTier tier, MilestonesData d) {
    final items = d.forTier(tier);
    final earned = items.where((m) => m.earned).length;
    final complete = earned == items.length && items.isNotEmpty;
    final accent = switch (tier) {
      MilestoneTier.easy => ContentAccentName.emerald,
      MilestoneTier.medium => ContentAccentName.violet,
      MilestoneTier.hard => ContentAccentName.amber,
      MilestoneTier.master => ContentAccentName.rose,
    };
    final tone = contentAccent(accent, Theme.of(context).brightness);
    return Row(children: [
      Eyebrow(tier.label, color: tone.text),
      const SizedBox(width: 8),
      if (complete)
        Icon(Icons.verified, size: 16, color: tone.text),
      const Spacer(),
      Text('$earned/${items.length}',
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: context.brandMuted)),
    ]);
  }
}

class _MilestoneTile extends StatelessWidget {
  const _MilestoneTile({required this.m});
  final Milestone m;

  @override
  Widget build(BuildContext context) {
    final tone = contentAccent(m.accent, Theme.of(context).brightness);
    final earned = m.earned;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: earned
                ? tone.surfaceGradient
                : [context.colors.card, context.colors.card]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: earned ? tone.dot : context.colors.border,
            width: earned ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                  color: earned
                      ? tone.iconCircleBg
                      : context.colors.muted,
                  shape: BoxShape.circle),
              child: Icon(m.icon,
                  size: 19,
                  color: earned
                      ? tone.iconCircleFg
                      : context.brandMuted),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(m.label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: context.brandInk)),
            ),
            if (earned)
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                    color: tone.iconCircleBg,
                    borderRadius: BorderRadius.circular(999)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check, size: 12, color: tone.text),
                  const SizedBox(width: 3),
                  Text('Unlocked',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: tone.text)),
                ]),
              ),
          ]),
          const SizedBox(height: 10),
          Text(m.description,
              style: TextStyle(
                  fontSize: 12.5,
                  height: 1.35,
                  color: context.brandMuted)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: m.fraction,
              minHeight: 7,
              backgroundColor: context.colors.muted,
              valueColor: AlwaysStoppedAnimation(
                  earned ? tone.text : tone.dot),
            ),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
                '${m.progress.clamp(0, m.target)}/${m.target}',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: context.brandMuted)),
          ),
        ],
      ),
    );
  }
}
