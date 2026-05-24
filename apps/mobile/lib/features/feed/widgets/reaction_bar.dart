import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_kit/haptic_kit.dart';

import '../../../core/supabase/supabase_providers.dart';
import '../../../core/ui_messenger.dart';
import '../../../ui/ui.dart';
import '../feed_providers.dart';
import '../models/feed_models.dart';

/// Compact reaction strip rendered under a post body or a comment.
/// Existing reactions are shown as pills (emoji + count) — mine is
/// tinted with the accent. A trailing "+" opens an inline picker of
/// every emoji in [kReactionEmoji]. Tapping the same emoji twice
/// clears the reaction; tapping a different one replaces it (the PK
/// on feed_reactions guarantees one reaction per user per target).
class ReactionBar extends ConsumerStatefulWidget {
  const ReactionBar({
    super.key,
    required this.targetKind,
    required this.targetId,
    required this.counts,
    required this.mine,
    required this.tone,
  });

  /// "post" or "comment" — matches feed_reactions.target_kind.
  final String targetKind;
  final String targetId;

  /// { emoji: count } for this single target.
  final Map<String, int> counts;

  /// The current user's pick for this target, or null.
  final String? mine;

  final ContentAccentTone tone;

  @override
  ConsumerState<ReactionBar> createState() => _ReactionBarState();
}

class _ReactionBarState extends ConsumerState<ReactionBar> {
  bool _pickerOpen = false;

  Future<void> _pick(String emoji) async {
    Haptics.selection();
    setState(() => _pickerOpen = false);
    try {
      // Tapping the emoji you already picked clears it; otherwise
      // replace whatever was there.
      await ref.read(feedActionsProvider).setReaction(
            targetKind: widget.targetKind,
            targetId: widget.targetId,
            emoji: widget.mine == emoji ? null : emoji,
          );
    } catch (_) {
      if (!mounted) return;
      showBanner("Couldn't save reaction.",
          type: AdaptiveSnackBarType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(supabaseClientProvider).auth.currentUser?.id;
    // Stable display order: keep kReactionEmoji order, only show ones
    // that actually have at least one reaction. Anything else stays
    // behind the "+" picker.
    final pills = <String>[
      for (final e in kReactionEmoji)
        if ((widget.counts[e] ?? 0) > 0) e,
    ];

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (final e in pills)
          _Pill(
            emoji: e,
            count: widget.counts[e] ?? 0,
            mine: widget.mine == e,
            tone: widget.tone,
            onTap: me == null ? null : () => _pick(e),
          ),
        if (me != null)
          _AddButton(
            open: _pickerOpen,
            tone: widget.tone,
            onTap: () => setState(() => _pickerOpen = !_pickerOpen),
          ),
        if (_pickerOpen && me != null)
          // Full picker row — every emoji including those without a
          // pill yet. Slides in below the existing pills so the row
          // wraps cleanly when there are many reactions.
          SizedBox(
            width: double.infinity,
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final e in kReactionEmoji)
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: _PickerKey(
                        emoji: e,
                        selected: widget.mine == e,
                        tone: widget.tone,
                        onTap: () => _pick(e),
                      ),
                    ),
                ],
              ),
            ).animate().fadeIn(duration: 120.ms).slideY(
                begin: -0.15, end: 0, duration: 140.ms, curve: Curves.easeOut),
          ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.emoji,
    required this.count,
    required this.mine,
    required this.tone,
    required this.onTap,
  });

  final String emoji;
  final int count;
  final bool mine;
  final ContentAccentTone tone;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final bg = mine ? tone.iconCircleBg : context.colors.muted;
    final border = mine ? tone.dot.withValues(alpha: 0.45) : context.colors.border;
    final fg = mine ? tone.dot : context.brandInk;
    return Semantics(
      button: true,
      selected: mine,
      label: mine
          ? 'Remove your $emoji reaction'
          : 'Add a $emoji reaction',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(emoji, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 4),
            Text(
              '$count',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: fg,
                  fontFeatures: const [FontFeature.tabularFigures()]),
            ),
          ]),
        ),
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({
    required this.open,
    required this.tone,
    required this.onTap,
  });

  final bool open;
  final ContentAccentTone tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: open ? 'Close reaction picker' : 'Add a reaction',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          Haptics.selection();
          onTap();
        },
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: context.colors.muted,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: context.colors.border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(open ? Icons.close : Icons.add_reaction_outlined,
                size: 14, color: context.brandMuted),
          ]),
        ),
      ),
    );
  }
}

class _PickerKey extends StatelessWidget {
  const _PickerKey({
    required this.emoji,
    required this.selected,
    required this.tone,
    required this.onTap,
  });

  final String emoji;
  final bool selected;
  final ContentAccentTone tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? tone.iconCircleBg : context.colors.muted,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected
                  ? tone.dot.withValues(alpha: 0.45)
                  : context.colors.border),
        ),
        child: Text(emoji, style: const TextStyle(fontSize: 16)),
      ),
    );
  }
}
