import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/constants/app_constants.dart';

class BookSearchResult {
  const BookSearchResult({this.cover, this.year, this.description});
  final String? cover;
  final int? year;
  final String? description;
}

/// Title + author + cover + year for a single ISBN lookup. Returned
/// by [OpenLibraryService.lookupIsbn]; null fields mean Open Library
/// didn't have that bit (the title is always populated when the
/// record exists at all).
class BookIsbnResult {
  const BookIsbnResult({
    required this.title,
    this.author,
    this.year,
    this.cover,
  });
  final String title;
  final String? author;
  final int? year;
  final String? cover;
}

/// Direct Open Library lookup (public API, no key, no CORS on a native
/// client — the web only proxied this through /api for browser CORS).
class OpenLibraryService {
  OpenLibraryService([http.Client? client]) : _http = client ?? http.Client();
  final http.Client _http;

  /// ISBN → book metadata. Hits the public `/api/books?bibkeys=ISBN:X`
  /// endpoint, which returns title, authors, publish_date, cover URLs
  /// keyed by the bibkey. Returns null when Open Library doesn't have
  /// the record (which happens for niche / very-new books — the
  /// barcode scanner UI surfaces a "not found" message in that case).
  Future<BookIsbnResult?> lookupIsbn(String isbn) async {
    final clean = isbn.replaceAll(RegExp(r'[^0-9X]'), '');
    if (clean.length != 10 && clean.length != 13) return null;
    final uri = Uri.parse(
        'https://openlibrary.org/api/books?bibkeys=ISBN:$clean'
        '&format=json&jscmd=data');
    try {
      final res = await _http.get(uri).timeout(kFetchTimeout);
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final entry = body['ISBN:$clean'] as Map<String, dynamic>?;
      if (entry == null) return null;
      final title = (entry['title'] as String?)?.trim();
      if (title == null || title.isEmpty) return null;
      final authors = (entry['authors'] as List?) ?? const [];
      final author = authors.isEmpty
          ? null
          : (authors.first as Map<String, dynamic>)['name'] as String?;
      // publish_date is sometimes "2018", sometimes "Apr 2018" — pull
      // out the first 4-digit run as the year.
      final publish = entry['publish_date'] as String?;
      final yearMatch = publish == null
          ? null
          : RegExp(r'\b(\d{4})\b').firstMatch(publish);
      final year = yearMatch == null
          ? null
          : int.tryParse(yearMatch.group(1)!);
      final covers = entry['cover'] as Map<String, dynamic>?;
      final cover = (covers?['large'] ?? covers?['medium'] ?? covers?['small'])
          as String?;
      return BookIsbnResult(
          title: title, author: author, year: year, cover: cover);
    } catch (_) {
      return null;
    }
  }

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
