import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/services/service_providers.dart';
import '../../core/supabase/supabase_providers.dart';

class DemoItem {
  DemoItem({
    required this.type,
    required this.title,
    required this.creator,
    required this.year,
    required this.description,
    required this.reason,
    required this.matchScore,
    this.posterUrl,
    this.previewUrl,
  });

  final String type;
  final String title;
  final String creator;
  final int? year;
  final String description;
  final String reason;
  final num? matchScore;
  String? posterUrl;
  String? previewUrl;
}

class DemoResult {
  const DemoResult(this.items, this.remaining);
  final List<DemoItem> items;
  final int remaining;
}

/// No-auth demo via the demo-recommendations Edge Function (IP rate
/// limited). Artwork is enriched client-side with the same services the
/// authed flow uses.
class DemoService {
  DemoService(this._ref);
  final Ref _ref;

  Future<({DemoResult? result, String? error, bool limited})> run({
    required String contentType,
    required List<Map<String, dynamic>> answers,
  }) async {
    final client = _ref.read(supabaseClientProvider);
    try {
      final res = await client.functions.invoke('demo-recommendations',
          body: {'contentType': contentType, 'answers': answers});
      final data = res.data as Map?;
      final raw = (data?['items'] as List?) ?? const [];
      final items = raw.map((e) {
        final m = Map<String, dynamic>.from(e as Map);
        return DemoItem(
          type: m['type'] as String? ?? 'movie',
          title: m['title'] as String? ?? '',
          creator: m['creator'] as String? ?? '',
          year: (m['year'] as num?)?.toInt(),
          description: m['description'] as String? ?? '',
          reason: m['reason'] as String? ?? '',
          matchScore: m['match_score'] as num?,
        );
      }).toList();
      await _enrich(items);
      return (
        result: DemoResult(items, (data?['remaining'] as num?)?.toInt() ?? 0),
        error: null,
        limited: false
      );
    } on FunctionException catch (e) {
      if (e.status == 429) {
        return (result: null, error: 'Daily demo limit reached.', limited: true);
      }
      final d = e.details;
      return (
        result: null,
        error: (d is Map && d['error'] is String)
            ? d['error'] as String
            : 'Demo failed (${e.status}).',
        limited: false
      );
    }
  }

  Future<void> _enrich(List<DemoItem> items) async {
    for (final it in items) {
      try {
        if (it.type == 'movie') {
          it.posterUrl =
              (await _ref.read(tmdbServiceProvider).searchMovie(it.title))
                  .poster;
        } else if (it.type == 'book') {
          it.posterUrl = (await _ref
                  .read(openLibraryServiceProvider)
                  .searchBook(it.title, it.creator))
              .cover;
        } else if (it.type == 'music') {
          final a = await _ref
              .read(deezerServiceProvider)
              .searchAlbum(it.title, it.creator);
          it.posterUrl = a.cover;
          it.previewUrl = a.previewUrl;
        }
      } catch (_) {/* best-effort */}
    }
  }
}

final demoServiceProvider = Provider<DemoService>((ref) => DemoService(ref));
