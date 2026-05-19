import 'package:flutter/material.dart';

import '../adaptive.dart';
import '../theme/accents.dart';
import '../theme/tailwind_palette.dart';

/// Web-faithful brand surfaces (the "custom" half of the hybrid: matches the
/// website's slate page, gradient/accent cards, eyebrow/heading typography,
/// why-this-pick callout, progress bar, content bento tiles). Interactive
/// controls stay Adaptive.

/// Set once from `main` (mirrors `amoledProvider`) so the many call sites
/// of [brandBg] don't each need the flag threaded through. When true,
/// dark-mode brand surfaces go pure black for OLED.
bool brandAmoled = false;

Color brandBg(Brightness b) => b == Brightness.dark
    ? (brandAmoled ? const Color(0xFF000000) : Tw.slate950)
    : Tw.slate50;

Color _ink(Brightness b) => b == Brightness.dark ? Tw.slate100 : Tw.slate900;
Color _muted(Brightness b) =>
    b == Brightness.dark ? Tw.slate400 : Tw.slate600;

/// Page scaffold on the slate-50/950 background the web uses everywhere.
class BrandScaffold extends StatelessWidget {
  const BrandScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.title,
    this.actions,
    this.leading,
  });

  final Widget body;

  /// Legacy: a Material PreferredSizeWidget app bar.
  final PreferredSizeWidget? appBar;

  /// Preferred: a [title]/[actions]/[leading] renders a native iOS 26
  /// AdaptiveAppBar (Liquid Glass toolbar) over the brand background.
  final String? title;
  final List<AdaptiveAppBarAction>? actions;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    final bg = brandBg(Theme.of(context).brightness);
    if (title != null || actions != null || leading != null) {
      return AdaptiveScaffold(
        appBar: AdaptiveAppBar(
          title: title,
          actions: actions,
          leading: leading,
          useNativeToolbar: true,
        ),
        body: ColoredBox(color: bg, child: body),
      );
    }
    return Scaffold(
      backgroundColor: bg,
      appBar: appBar,
      body: body,
    );
  }
}

/// `text-[10px] font-black uppercase tracking-[0.18em]` accent eyebrow.
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Text(
      text.toUpperCase(),
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.8,
        color: color ?? (dark ? Tw.indigo400 : Tw.indigo500),
      ),
    );
  }
}

/// `font-black tracking-tight` heading.
class BrandHeading extends StatelessWidget {
  const BrandHeading(this.text, {super.key, this.size = 24});
  final String text;
  final double size;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: TextStyle(
          fontSize: size,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
          color: _ink(Theme.of(context).brightness),
        ),
      );
}

class Subtitle extends StatelessWidget {
  const Subtitle(this.text, {super.key, this.center = false});
  final String text;
  final bool center;

  @override
  Widget build(BuildContext context) => Text(
        text,
        textAlign: center ? TextAlign.center : null,
        style: TextStyle(
            fontSize: 14, color: _muted(Theme.of(context).brightness)),
      );
}

/// `rounded-2xl border bg-gradient-to-br shadow-sm`. Neutral by default, or
/// tinted to a content accent's surface gradient/border.
class BrandCard extends StatelessWidget {
  const BrandCard({
    super.key,
    required this.child,
    this.accent,
    this.padding = const EdgeInsets.all(20),
    this.radius = 16,
  });

  final Widget child;
  final ContentAccentName? accent;
  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final b = Theme.of(context).brightness;
    final dark = b == Brightness.dark;
    final tone = accent == null ? null : contentAccent(accent!, b);

    final gradient = tone != null
        ? LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: tone.surfaceGradient)
        : LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: dark
                ? [Tw.slate900.withValues(alpha: .65), Tw.slate900]
                : [Tw.white.withValues(alpha: .85), Tw.white],
          );
    final border = tone?.surfaceBorder ??
        (dark
            ? Tw.slate700.withValues(alpha: .6)
            : Tw.slate200.withValues(alpha: .7));

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: dark ? .25 : .06),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// The "why this pick" callout: tinted per-type surface with a left gradient
/// accent bar (web WHY_TONES).
class WhyThisPick extends StatelessWidget {
  const WhyThisPick(
      {super.key, required this.accent, required this.text});
  final ContentAccentName accent;
  final String text;

  @override
  Widget build(BuildContext context) {
    final b = Theme.of(context).brightness;
    final tone = contentAccent(accent, b);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: tone.surfaceGradient),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: tone.surfaceBorder),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
                width: 4,
                decoration: BoxDecoration(
                    gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: tone.barGradient))),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Eyebrow('Why this pick', color: tone.text),
                    const SizedBox(height: 6),
                    Text(text,
                        style: TextStyle(
                            fontSize: 14,
                            height: 1.45,
                            color: _ink(b))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Gradient progress bar (`h-1.5 rounded-full`, accent fill).
class BrandProgressBar extends StatelessWidget {
  const BrandProgressBar(
      {super.key, required this.value, required this.accent});
  final double value; // 0..1
  final ContentAccentName accent;

  @override
  Widget build(BuildContext context) {
    final b = Theme.of(context).brightness;
    final tone = contentAccent(accent, b);
    final track = (b == Brightness.dark ? Tw.slate800 : Tw.slate200)
        .withValues(alpha: .7);
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: Stack(children: [
        Container(height: 6, color: track),
        // Animates whenever `value` changes (re-tweens from current width).
        TweenAnimationBuilder<double>(
          tween: Tween(end: value.clamp(0, 1)),
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOutCubic,
          builder: (_, v, _) => FractionallySizedBox(
            widthFactor: v,
            child: Container(
              height: 6,
              decoration: BoxDecoration(
                  gradient: LinearGradient(colors: tone.barGradient)),
            ),
          ),
        ),
      ]),
    );
  }
}

/// Content-selection bento tile: gradient media area + icon, icon circle,
/// eyebrow, title/description, selected ring + gradient checkmark chip.
class ContentBentoTile extends StatelessWidget {
  const ContentBentoTile({
    super.key,
    required this.accent,
    required this.icon,
    required this.label,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final ContentAccentName accent;
  final IconData icon;
  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final b = Theme.of(context).brightness;
    final tone = contentAccent(accent, b);
    final dark = b == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: dark
                  ? [Tw.slate900.withValues(alpha: .65), Tw.slate900]
                  : [Tw.white.withValues(alpha: .85), Tw.white]),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected
                  ? tone.dot
                  : (dark
                      ? Tw.slate700.withValues(alpha: .6)
                      : Tw.slate200.withValues(alpha: .7)),
              width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            // Gradient media area with the type icon.
            Container(
              width: 96,
              height: 96,
              margin: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: tone.surfaceGradient),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, size: 40, color: tone.iconCircleFg),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(4, 12, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Eyebrow(label, color: tone.text),
                    const SizedBox(height: 4),
                    Text(label,
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.4,
                            color: _ink(b))),
                    const SizedBox(height: 4),
                    Text(description,
                        style: TextStyle(
                            fontSize: 13, color: _muted(b), height: 1.4)),
                  ],
                ),
              ),
            ),
            if (selected)
              Container(
                margin: const EdgeInsets.only(right: 12),
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient:
                      LinearGradient(colors: tone.barGradient),
                ),
                child: const Icon(Icons.check,
                    size: 16, color: Colors.white),
              ),
          ],
        ),
      ),
    );
  }
}

/// Full-width segmented control (equal segments, animated pill). Drop-in
/// for AdaptiveSegmentedControl's API — used because the package's Material
/// SegmentedButton is content-sized with no full-width option, and the
/// design should fill the box on every platform.
class BrandSegmented extends StatelessWidget {
  const BrandSegmented({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onValueChanged,
    this.color,
    this.sfSymbols, // accepted for API parity; not shown
  });

  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onValueChanged;
  final Color? color;
  final List<dynamic>? sfSymbols;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final accent = color ?? Tw.indigo500;
    final track = dark ? Tw.slate800 : Tw.slate200;
    final pill = dark ? Tw.slate950 : Tw.white;
    final muted = dark ? Tw.slate400 : Tw.slate500;

    return LayoutBuilder(builder: (context, box) {
      final n = labels.length;
      final segW = (box.maxWidth - 8) / n; // inner width after 4px padding
      return Container(
        height: 42,
        width: double.infinity,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: track,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Stack(children: [
          if (selectedIndex >= 0 && selectedIndex < n)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              left: selectedIndex * segW,
              top: 0,
              bottom: 0,
              width: segW,
              child: Container(
                decoration: BoxDecoration(
                  color: pill,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black
                            .withValues(alpha: dark ? 0.3 : 0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2)),
                  ],
                ),
              ),
            ),
          Row(
            children: [
              for (var i = 0; i < n; i++)
                Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onValueChanged(i),
                    child: Center(
                      child: AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 160),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: i == selectedIndex ? accent : muted,
                        ),
                        child: Text(labels[i],
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ]),
      );
    });
  }
}

/// Shared poster/cover thumbnail with a graceful fallback. Music art is
/// square; movies/books are 2:3.
class PosterThumb extends StatelessWidget {
  const PosterThumb(
      {super.key,
      this.url,
      this.square = false,
      this.w = 44,
      this.semanticLabel});
  final String? url;
  final bool square;
  final double w;

  /// Accessible description (e.g. '<title> poster'). When null the thumb is
  /// treated as decorative and hidden from assistive tech.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final h = square ? w : w * 3 / 2;
    final dark = Theme.of(context).brightness == Brightness.dark;
    Widget fallback() => Container(
          width: w,
          height: h,
          color: dark ? Tw.slate800 : Tw.slate200,
          child: Icon(Icons.image_not_supported_outlined,
              size: 16, color: dark ? Tw.slate500 : Tw.slate400),
        );
    final thumb = ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: (url == null || url!.isEmpty)
          ? fallback()
          : Image.network(url!,
              width: w,
              height: h,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => fallback()),
    );
    if (semanticLabel == null || semanticLabel!.isEmpty) return thumb;
    return Semantics(image: true, label: semanticLabel, child: thumb);
  }
}

/// Small helper so screens can read the slate ink/muted colors.
extension BrandColors on BuildContext {
  Color get brandInk => _ink(Theme.of(this).brightness);
  Color get brandMuted => _muted(Theme.of(this).brightness);
}
