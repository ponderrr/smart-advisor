import 'package:flutter/widgets.dart';

/// Screen-size helpers for adaptive layouts.
extension ScreenSize on BuildContext {
  Size get _size => MediaQuery.sizeOf(this);

  /// True on tablets (and large foldables) regardless of orientation.
  bool get isTablet => _size.shortestSide >= 600;

  double get screenWidth => _size.width;
}

/// Constrains content to a comfortable reading column and centres it on
/// wide screens (tablets / landscape), while staying full-bleed on phones.
///
/// The web PWA caps its flows in a centred max-width column; without this
/// the ported screens stretch edge-to-edge on a tablet and look sparse.
/// Wrap scrollables directly — [Align] hands the child the parent's bounded
/// constraints, so a `ListView` still fills the height and scrolls.
class ResponsiveCenter extends StatelessWidget {
  const ResponsiveCenter({
    super.key,
    required this.child,
    this.maxWidth = 600,
    this.alignment = Alignment.topCenter,
  });

  final Widget child;
  final double maxWidth;

  /// `topCenter` for scrolling flows; `center` for a small standalone card.
  final AlignmentGeometry alignment;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}
