import 'package:flutter/material.dart';

import '../theme/tailwind_palette.dart';

/// How a collection screen lays out its cards.
enum ViewMode { list, grid }

/// Compact two-state list/grid switch, styled to match [BrandSegmented]'s
/// track + pill so it sits naturally beside the filters.
class ViewModeToggle extends StatelessWidget {
  const ViewModeToggle({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final ViewMode value;
  final ValueChanged<ViewMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final track = dark ? Tw.slate800 : Tw.slate200;
    final pill = dark ? Tw.slate950 : Tw.white;
    final active = dark ? Tw.slate100 : Tw.slate900;
    final muted = dark ? Tw.slate400 : Tw.slate500;

    Widget cell(ViewMode mode, IconData icon, String tooltip) {
      final selected = value == mode;
      return Tooltip(
        message: tooltip,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: selected ? null : () => onChanged(mode),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: 40,
            height: 34,
            decoration: BoxDecoration(
              color: selected ? pill : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: Colors.black
                            .withValues(alpha: dark ? 0.3 : 0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Icon(icon,
                size: 18, color: selected ? active : muted),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: track,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        cell(ViewMode.list, Icons.view_agenda_outlined, 'List view'),
        const SizedBox(width: 2),
        cell(ViewMode.grid, Icons.grid_view_outlined, 'Grid view'),
      ]),
    );
  }
}
