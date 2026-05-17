import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/constants/app_constants.dart';

class AlbumSearchResult {
  const AlbumSearchResult({this.cover, this.previewUrl, this.year});
  final String? cover;
  final String? previewUrl;
  final int? year;
}

/// Direct Deezer lookup (public API, no key, no CORS on a native client —
/// the web only proxied this through /api for browser CORS). One /search
/// call yields both the album art and a 30s preview URL.
class DeezerService {
  DeezerService([http.Client? client]) : _http = client ?? http.Client();
  final http.Client _http;

  Future<AlbumSearchResult> searchAlbum(String title,
      [String? artist]) async {
    final q = [artist, title].where((s) => s != null && s.isNotEmpty).join(' ');
    final uri = Uri.parse('${ApiUrls.deezerApi}/search')
        .replace(queryParameters: {'q': q, 'limit': '1'});
    try {
      final res = await _http.get(uri).timeout(kFetchTimeout);
      if (res.statusCode != 200) return const AlbumSearchResult();
      final data = (jsonDecode(res.body)['data'] as List?) ?? const [];
      if (data.isEmpty) return const AlbumSearchResult();
      final t = data.first as Map<String, dynamic>;
      final album = t['album'] as Map<String, dynamic>?;
      return AlbumSearchResult(
        cover: album?['cover_big'] as String? ??
            album?['cover_medium'] as String?,
        previewUrl: t['preview'] as String?,
      );
    } catch (_) {
      return const AlbumSearchResult();
    }
  }
}
