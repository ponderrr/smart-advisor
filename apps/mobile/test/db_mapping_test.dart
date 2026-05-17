import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/models/enums.dart';
import 'package:smart_advisor/core/models/library_item.dart';
import 'package:smart_advisor/core/models/recommendation.dart';

/// Verifies models map to the actual Postgres row shapes (per the canonical
/// schema migration). The recommendations table has a single `genre TEXT`
/// column and no match_score column — DatabaseService owns that split, but
/// the LibraryItem row maps 1:1 and is asserted here.
void main() {
  test('LibraryItem maps a user_library row 1:1', () {
    const row = {
      'id': 'lib1',
      'user_id': 'u1',
      'medium': 'movie',
      'title': 'Past Lives',
      'creator': 'Celine Song',
      'year': 2023,
      'poster_url': 'https://x/p.jpg',
      'status': 'finished',
      'rating': 3,
      'reaction': 'gutted me',
      'source_recommendation_id': 'rec1',
      'logged_at': '2026-05-16T00:00:00Z',
      'finished_at': '2026-05-16T01:00:00Z',
      'updated_at': '2026-05-16T01:00:00Z',
    };
    final item = LibraryItem.fromJson(row);
    expect(item.medium, LibraryMedium.movie);
    expect(item.status, LibraryStatus.finished);
    expect(item.rating, 3);
    expect(item.sourceRecommendationId, 'rec1');
    expect(item.toJson()['poster_url'], 'https://x/p.jpg');
  });

  test('LibraryStatus dropped is supported', () {
    final item = LibraryItem.fromJson(const {
      'id': 'l',
      'user_id': 'u',
      'medium': 'book',
      'title': 'X',
      'creator': null,
      'year': null,
      'poster_url': null,
      'status': 'dropped',
      'rating': null,
      'reaction': null,
      'source_recommendation_id': null,
      'logged_at': 't',
      'finished_at': null,
      'updated_at': 't',
    });
    expect(item.status, LibraryStatus.dropped);
  });

  test('Recommendation model carries client-only genres/matchScore', () {
    const rec = Recommendation(
      id: 'r1',
      userId: 'u1',
      type: 'movie',
      title: 'Past Lives',
      contentType: 'mix',
      createdAt: '2026-05-16T00:00:00Z',
      genres: ['Drama', 'Romance'],
      matchScore: 93,
    );
    expect(rec.genres, ['Drama', 'Romance']);
    expect(rec.matchScore, 93);
    expect(rec.isFavorited, isFalse);
  });
}
