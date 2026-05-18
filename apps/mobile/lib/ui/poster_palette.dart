import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:palette_generator/palette_generator.dart';

/// Dominant accent colour pulled from a poster / album artwork, used to
/// tint the recommendation detail backdrop so the page feels like the
/// thing it's showing. Memoised per-URL for the session — extracting a
/// palette decodes the image, so we never want to do it twice.
final posterAccentProvider =
    FutureProvider.autoDispose.family<Color?, String>((ref, url) async {
  ref.keepAlive();
  if (url.isEmpty) return null;
  final palette = await PaletteGenerator.fromImageProvider(
    NetworkImage(url),
    // We only need a colour, not detail — downscale hard for speed.
    size: const Size(120, 180),
    maximumColorCount: 16,
  );
  return palette.vibrantColor?.color ??
      palette.dominantColor?.color ??
      palette.mutedColor?.color;
});
