import 'package:flutter/widgets.dart';

/// Lays children in a single stretched column on phones and an N-column
/// grid on wider screens (tablet / landscape), so ported flows actually
/// use the tablet's width instead of a lone centred card.
///
/// Column count is derived from available width / [minTileWidth] (capped
/// at [maxColumns]), so it adapts to orientation and split-screen too.
class ResponsiveTiles extends StatelessWidget {
  const ResponsiveTiles({
    super.key,
    required this.children,
    this.minTileWidth = 320,
    this.maxColumns = 2,
    this.spacing = 12,
    this.tilesHaveOwnVerticalGap = false,
  });

  final List<Widget> children;

  /// Smallest width a tile should get before we drop a column.
  final double minTileWidth;
  final int maxColumns;
  final double spacing;

  /// True when each child already carries its own bottom margin (e.g. the
  /// option tiles) — keeps single-column spacing identical to before and
  /// avoids doubled vertical gaps in the grid.
  final bool tilesHaveOwnVerticalGap;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();
    return LayoutBuilder(builder: (_, c) {
      final cols =
          (c.maxWidth / minTileWidth).floor().clamp(1, maxColumns);
      if (cols <= 1) {
        if (tilesHaveOwnVerticalGap) {
          return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children);
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) SizedBox(height: spacing),
              children[i],
            ],
          ],
        );
      }
      final tileW = (c.maxWidth - spacing * (cols - 1)) / cols;
      return Wrap(
        spacing: spacing,
        runSpacing: tilesHaveOwnVerticalGap ? 0 : spacing,
        children: [
          for (final ch in children) SizedBox(width: tileW, child: ch),
        ],
      );
    });
  }
}
