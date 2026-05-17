import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/models/enums.dart';
import 'package:smart_advisor/features/recommendations/utils/match_score.dart';
import 'package:smart_advisor/ui/theme/accents.dart';
import 'package:smart_advisor/ui/theme/app_colors.dart';
import 'package:smart_advisor/ui/theme/tailwind_palette.dart';

void main() {
  group('semantic tokens (globals.css verbatim)', () {
    test('light background is white, foreground near-black', () {
      expect(AppColors.light.background, const Color(0xFFFFFFFF));
      // 222.2 84% 4.9% ≈ very dark slate
      expect(AppColors.light.foreground.computeLuminance(), lessThan(0.05));
    });

    test('dark background is the slate token, foreground near-white', () {
      expect(AppColors.dark.background.computeLuminance(), lessThan(0.02));
      expect(
          AppColors.dark.foreground.computeLuminance(), greaterThan(0.85));
    });
  });

  group('content accent mapping (content-accent.ts)', () {
    test('content type → accent name', () {
      expect(accentForContentType(ContentType.movie),
          ContentAccentName.amber);
      expect(accentForContentType(ContentType.book),
          ContentAccentName.emerald);
      expect(accentForContentType(ContentType.music),
          ContentAccentName.rose);
      expect(accentForContentType(ContentType.mix),
          ContentAccentName.violet);
      expect(accentForContentType(null), ContentAccentName.violet);
    });

    test('amber bar gradient is amber500 → orange500, dark text shifts', () {
      final light =
          contentAccent(ContentAccentName.amber, Brightness.light);
      final dark = contentAccent(ContentAccentName.amber, Brightness.dark);
      expect(light.barGradient, [Tw.amber500, Tw.orange500]);
      expect(light.text, Tw.amber500);
      expect(dark.text, Tw.amber400);
      expect(dark.surfaceGradient.first.a, closeTo(0.15, 0.001));
    });
  });

  test('rec-type accent defaults unknown handling (book palette base)', () {
    final book = recTypeAccent(RecType.book, Brightness.light);
    expect(book.stripe, [Tw.emerald400, Tw.teal500]);
  });

  test('match tone colors switch by brightness', () {
    final lightGreen = matchToneColors(MatchTone.green, Brightness.light);
    final darkGreen = matchToneColors(MatchTone.green, Brightness.dark);
    expect(lightGreen.foreground, Tw.emerald700);
    expect(darkGreen.foreground, Tw.emerald300);
  });
}
