import 'package:flutter/widgets.dart';

import '../../core/models/enums.dart';
import '../../features/recommendations/utils/match_score.dart';
import 'tailwind_palette.dart';

Color _a(Color c, double o) => c.withValues(alpha: o);

/// Per-content accent, ported from web content-accent.ts
/// (CONTENT_ACCENT_PALETTE). Tailwind `dark:` variants and `/NN` opacities
/// are reproduced exactly. Call [resolve] with the current Brightness.
enum ContentAccentName { amber, emerald, rose, violet }

class ContentAccentTone {
  const ContentAccentTone({
    required this.text,
    required this.barGradient,
    required this.surfaceGradient,
    required this.surfaceBorder,
    required this.dot,
    required this.iconCircleBg,
    required this.iconCircleFg,
    required this.focusRing,
  });

  final Color text;
  final List<Color> barGradient;
  final List<Color> surfaceGradient;
  final Color surfaceBorder;
  final Color dot;
  final Color iconCircleBg;
  final Color iconCircleFg;
  final Color focusRing;
}

ContentAccentName accentForContentType(ContentType? t) => switch (t) {
      ContentType.movie => ContentAccentName.amber,
      ContentType.book => ContentAccentName.emerald,
      ContentType.music => ContentAccentName.rose,
      _ => ContentAccentName.violet,
    };

ContentAccentTone contentAccent(ContentAccentName name, Brightness b) {
  final dark = b == Brightness.dark;
  switch (name) {
    case ContentAccentName.amber:
      return ContentAccentTone(
        text: dark ? Tw.amber400 : Tw.amber500,
        barGradient: const [Tw.amber500, Tw.orange500],
        surfaceGradient: dark
            ? [_a(Tw.amber500, .15), _a(Tw.orange500, .10), _a(Tw.rose500, .15)]
            : [_a(Tw.amber50, .8), _a(Tw.orange50, .4), _a(Tw.rose50, .6)],
        surfaceBorder:
            dark ? _a(Tw.amber500, .4) : _a(Tw.amber300, .6),
        dot: Tw.amber500,
        iconCircleBg: dark ? _a(Tw.amber500, .15) : Tw.amber100,
        iconCircleFg: dark ? Tw.amber300 : Tw.amber600,
        focusRing: Tw.amber500,
      );
    case ContentAccentName.emerald:
      return ContentAccentTone(
        text: dark ? Tw.emerald400 : Tw.emerald500,
        barGradient: const [Tw.emerald500, Tw.teal500],
        surfaceGradient: dark
            ? [_a(Tw.emerald500, .15), _a(Tw.teal500, .10), _a(Tw.cyan500, .15)]
            : [_a(Tw.emerald50, .8), _a(Tw.teal50, .4), _a(Tw.cyan50, .6)],
        surfaceBorder:
            dark ? _a(Tw.emerald500, .4) : _a(Tw.emerald300, .6),
        dot: Tw.emerald500,
        iconCircleBg: dark ? _a(Tw.emerald500, .15) : Tw.emerald100,
        iconCircleFg: dark ? Tw.emerald300 : Tw.emerald600,
        focusRing: Tw.emerald500,
      );
    case ContentAccentName.rose:
      return ContentAccentTone(
        text: dark ? Tw.rose400 : Tw.rose500,
        barGradient: const [Tw.rose500, Tw.pink500],
        surfaceGradient: dark
            ? [_a(Tw.rose500, .15), _a(Tw.pink500, .10), _a(Tw.fuchsia500, .15)]
            : [_a(Tw.rose50, .8), _a(Tw.pink50, .4), _a(Tw.fuchsia50, .6)],
        surfaceBorder: dark ? _a(Tw.rose500, .4) : _a(Tw.rose300, .6),
        dot: Tw.rose500,
        iconCircleBg: dark ? _a(Tw.rose500, .15) : Tw.rose100,
        iconCircleFg: dark ? Tw.rose300 : Tw.rose600,
        focusRing: Tw.rose500,
      );
    case ContentAccentName.violet:
      return ContentAccentTone(
        text: dark ? Tw.violet400 : Tw.violet500,
        barGradient: const [Tw.indigo500, Tw.violet500],
        surfaceGradient: dark
            ? [_a(Tw.violet500, .15), _a(Tw.fuchsia500, .10), _a(Tw.rose500, .15)]
            : [_a(Tw.violet50, .8), _a(Tw.fuchsia50, .4), _a(Tw.rose50, .6)],
        surfaceBorder:
            dark ? _a(Tw.violet500, .4) : _a(Tw.violet300, .6),
        dot: Tw.violet500,
        iconCircleBg: dark ? _a(Tw.violet500, .15) : Tw.violet100,
        iconCircleFg: dark ? Tw.violet300 : Tw.violet600,
        focusRing: Tw.violet500,
      );
  }
}

/// Per-rec-type accent, ported from type-accent.ts. Unknown → book (web
/// default).
class RecTypeAccentTone {
  const RecTypeAccentTone({
    required this.stripe,
    required this.tileBorder,
    required this.tileText,
    required this.chipBg,
    required this.outline,
  });

  final List<Color> stripe;
  final Color tileBorder;
  final Color tileText;
  final Color chipBg;
  final Color outline;
}

RecTypeAccentTone recTypeAccent(RecType type, Brightness b) {
  final dark = b == Brightness.dark;
  switch (type) {
    case RecType.movie:
      return RecTypeAccentTone(
        stripe: const [Tw.amber400, Tw.orange500],
        tileBorder: dark ? _a(Tw.amber500, .4) : _a(Tw.amber300, .6),
        tileText: dark ? Tw.amber400 : Tw.amber600,
        chipBg: dark ? _a(Tw.amber500, .15) : Tw.amber100,
        outline: dark ? _a(Tw.amber500, .5) : Tw.amber300,
      );
    case RecType.music:
      return RecTypeAccentTone(
        stripe: const [Tw.rose400, Tw.pink500],
        tileBorder: dark ? _a(Tw.rose500, .4) : _a(Tw.rose300, .6),
        tileText: dark ? Tw.rose400 : Tw.rose600,
        chipBg: dark ? _a(Tw.rose500, .15) : Tw.rose100,
        outline: dark ? _a(Tw.rose500, .5) : Tw.rose300,
      );
    case RecType.book:
      return RecTypeAccentTone(
        stripe: const [Tw.emerald400, Tw.teal500],
        tileBorder: dark ? _a(Tw.emerald500, .4) : _a(Tw.emerald300, .6),
        tileText: dark ? Tw.emerald400 : Tw.emerald600,
        chipBg: dark ? _a(Tw.emerald500, .15) : Tw.emerald100,
        outline: dark ? _a(Tw.emerald500, .5) : Tw.emerald300,
      );
  }
}

/// Match-score chip colors, ported from MATCH_TONE_CLASSES.
class MatchToneColors {
  const MatchToneColors(this.background, this.foreground);
  final Color background;
  final Color foreground;
}

MatchToneColors matchToneColors(MatchTone tone, Brightness b) {
  final dark = b == Brightness.dark;
  switch (tone) {
    case MatchTone.green:
      return dark
          ? MatchToneColors(_a(Tw.emerald900, .4), Tw.emerald300)
          : MatchToneColors(_a(Tw.emerald50, .9), Tw.emerald700);
    case MatchTone.yellow:
      return dark
          ? MatchToneColors(_a(Tw.amber900, .4), Tw.amber300)
          : MatchToneColors(_a(Tw.amber50, .9), Tw.amber700);
    case MatchTone.red:
      return dark
          ? MatchToneColors(_a(Tw.rose900, .4), Tw.rose300)
          : MatchToneColors(_a(Tw.rose50, .9), Tw.rose700);
  }
}
