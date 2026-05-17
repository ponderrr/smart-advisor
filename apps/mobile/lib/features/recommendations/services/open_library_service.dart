import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/constants/app_constants.dart';

class BookSearchResult {
  const BookSearchResult({this.cover, this.year, this.description});
  final String? cover;
  final int? year;
  final String? description;
}

/// Direct Open Library lookup (public API, no key, no CORS on a native
/// client — the web only proxied this through /api for browser CORS).
class OpenLibraryService {
  OpenLibraryService([http.Client? client]) : _http = client ?? http.Client();
  final http.Client _http;

  Future<BookSearchResult> searchBook(String title, [String? author]) async {
    final qs = {
      'title': title,
      if (author != null && author.isNotEmpty) 'author': author,
      'limit': '1',
      'fields': 'title,author_name,first_publish_year,cover_i',
    };
    final uri =
        Uri.parse(ApiUrls.openLibrarySearch).replace(queryParameters: qs);
    try {
      final res = await _http.get(uri).timeout(kFetchTimeout);
      if (res.statusCode != 200) return const BookSearchResult();
      final docs = (jsonDecode(res.body)['docs'] as List?) ?? const [];
      if (docs.isEmpty) return const BookSearchResult();
      final d = docs.first as Map<String, dynamic>;
      final coverId = d['cover_i'];
      return BookSearchResult(
        cover: coverId == null
            ? null
            : '${ApiUrls.openLibraryCovers}/$coverId-L.jpg',
        year: (d['first_publish_year'] as num?)?.toInt(),
      );
    } catch (_) {
      return const BookSearchResult();
    }
  }
}
