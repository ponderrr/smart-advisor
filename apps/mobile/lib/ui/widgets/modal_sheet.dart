import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'brand.dart';

/// Shared "focused modal task" chrome: a rounded sheet that sits over a
/// dimmed barrier (the route supplies the barrier + slide/fade), with a
/// grab handle and a header whose single close affordance is the X.
///
/// Used by the solo quiz and the group-quiz flow so they present
/// identically. A [Material] surface (not a bare ColoredBox) so Slider /
/// IconButton ink and other Material descendants have an ancestor.
class ModalSheet extends StatelessWidget {
  const ModalSheet({
    super.key,
    required this.title,
    required this.child,
    this.onClose,
    this.heightFactor = 0.95,
  });

  final String title;
  final Widget child;

  /// Tapping the header X. If null, no X is shown (e.g. a sub-step that
  /// owns its own back affordance).
  final VoidCallback? onClose;
  final double heightFactor;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: FractionallySizedBox(
        heightFactor: heightFactor,
        widthFactor: 1,
        child: ClipRRect(
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(28)),
          child: Material(
            color: brandBg(Theme.of(context).brightness),
            child: SafeArea(
              top: false,
              child: Column(children: [
                const SizedBox(height: 10),
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                      color: context.colors.border,
                      borderRadius: BorderRadius.circular(999)),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 6, 8, 0),
                  child: Row(children: [
                    Expanded(child: BrandHeading(title, size: 20)),
                    if (onClose != null)
                      IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Close',
                        onPressed: onClose,
                      ),
                  ]),
                ),
                Expanded(child: child),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
