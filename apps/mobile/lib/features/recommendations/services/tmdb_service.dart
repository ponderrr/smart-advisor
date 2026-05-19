import 'package:supabase_flutter/supabase_flutter.dart';

/// Streaming / rent / buy availability for a title (TMDB → JustWatch).
/// Region-specific and volatile, so this is fetched fresh for display and
/// never persisted on the recommendation row.
class WatchProviders {
  const WatchProviders({
    this.link,
    this.flatrate = const <String>[],
    this.rent = const <String>[],
    this.buy = const <String>[],
  });

  final String? link; // JustWatch deep link for the title
  final List<String> flatrate; // included with a subscription
  final List<String> rent;
  final List<String> buy;

  bool get isEmpty => flatrate.isEmpty && rent.isEmpty && buy.isEmpty;

  factory WatchProviders.fromJson(Map<String, dynamic> json) {
    List<String> list(String k) =>
        (json[k] as List?)?.cast<String>() ?? const <String>[];
    return WatchProviders(
      link: json['link'] as String?,
      flatrate: list('flatrate'),
      rent: list('rent'),
      buy: list('buy'),
    );
  }
}

/// Port of web tmdb-service.ts. Calls the tmdb-proxy Edge Function
/// (GET ?title=...). The proxy returns a safe fallback on miss, so this
/// never throws for "not found".
class MovieSearchResult {
  const MovieSearchResult({
    required this.poster,
    required this.year,
    required this.rating,
    required this.description,
    this.genres = const <String>[],
    this.trailer,
    this.watchProviders,
  });

  final String poster;
  final int year;
  final double rating;
  final String description;
  final List<String> genres;
  final String? trailer; // YouTube URL, if found
  final WatchProviders? watchProviders;

  factory MovieSearchResult.fromJson(Map<String, dynamic> json) {
    final wp = json['watchProviders'];
    return MovieSearchResult(
      poster: json['poster'] as String? ?? '',
      year: (json['year'] as num?)?.toInt() ?? DateTime.now().year,
      rating: (json['rating'] as num?)?.toDouble() ?? 7.5,
      description: json['description'] as String? ?? '',
      genres: (json['genres'] as List?)?.cast<String>() ?? const <String>[],
      trailer: json['trailer'] as String?,
      watchProviders: wp is Map
          ? WatchProviders.fromJson(Map<String, dynamic>.from(wp))
          : null,
    );
  }
}

class TmdbService {
  TmdbService(this._client);

  final SupabaseClient _client;

  Future<MovieSearchResult> searchMovie(String title) async {
    final res = await _client.functions.invoke(
      'tmdb-proxy',
      method: HttpMethod.get,
      queryParameters: <String, dynamic>{'title': title},
    );
    final data = res.data;
    if (data is Map) {
      return MovieSearchResult.fromJson(Map<String, dynamic>.from(data));
    }
    // Match the proxy's documented fallback.
    return MovieSearchResult(
      poster:
          'https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop',
      year: DateTime.now().year,
      rating: 7.5,
      description:
          'A captivating story that will keep you entertained from start to finish.',
    );
  }
}
