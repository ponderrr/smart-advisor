import '../../../core/models/ai_models.dart';
import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/result.dart';
import 'ai_service.dart';
import 'database_service.dart';
import 'deezer_service.dart';
import 'open_library_service.dart';
import 'tmdb_service.dart';

/// Stand-in for the web enhanced-recommendations-service. Generates one pick
/// per applicable type via the anthropic-recommendations Edge Function, then
/// enriches artwork: movies via tmdb-proxy, books via Open Library, music
/// via Deezer (also a 30s preview). All three enrichment APIs are called
/// directly — a native client has no browser CORS, so the web's /api
/// proxies aren't needed. Still trimmed vs. web: 1 pick per type, no dedup.
class RecommendationFlow {
  RecommendationFlow(this._ai, this._tmdb, this._db, this._books, this._music);

  final AiService _ai;
  final TmdbService _tmdb;
  final DatabaseService _db;
  final OpenLibraryService _books;
  final DeezerService _music;

  Future<ServiceResult<List<Recommendation>>> generate({
    required List<Answer> answers,
    required ContentType contentType,
    required int userAge,
    required String contentTone,
    String? userName,
  }) async {
    // Web enhanced-recommendations parity: 3 of a single type, 1+1+1 for
    // mix, 2 movies+1 book for legacy "both". Each EF call returns one of
    // each type, so fan out N parallel calls and dedup by title.
    final (int movieT, int bookT, int musicT) = switch (contentType) {
      ContentType.movie => (3, 0, 0),
      ContentType.book => (0, 3, 0),
      ContentType.music => (0, 0, 3),
      ContentType.both => (2, 1, 0),
      ContentType.mix => (1, 1, 1),
    };
    final calls =
        [movieT, bookT, musicT].reduce((a, b) => a > b ? a : b);

    final List<RecommendationData> results;
    try {
      results = await Future.wait(List.generate(
        calls,
        (_) => _ai.generateRecommendationsWithRetry(
          answers: answers,
          contentType: contentType,
          userAge: userAge,
          contentTone: contentTone,
          userName: userName,
        ),
      ));
    } on AiServiceException catch (e) {
      return ServiceResult.fail(e.message);
    }

    final seen = <String>{};
    final byType = {'movie': <AiRecommendationItem>[], 'book': <AiRecommendationItem>[], 'music': <AiRecommendationItem>[]};
    for (final d in results) {
      for (final it in [
        d.movieRecommendation,
        d.bookRecommendation,
        d.musicRecommendation,
      ]) {
        if (it == null) continue;
        final key = '${it.type}:${it.title.toLowerCase().trim()}';
        if (!seen.add(key)) continue;
        byType[it.type]?.add(it);
      }
    }
    final items = <AiRecommendationItem>[
      ...byType['movie']!.take(movieT),
      ...byType['book']!.take(bookT),
      ...byType['music']!.take(musicT),
    ];
    if (items.isEmpty) {
      return ServiceResult.fail('No recommendations came back. Try again.');
    }

    final saved = <Recommendation>[];
    for (final item in items) {
      String? posterUrl;
      String? previewUrl;
      num? rating = item.rating;
      try {
        if (item.type == 'movie') {
          final m = await _tmdb.searchMovie(item.title);
          posterUrl = m.poster;
          rating = m.rating;
        } else if (item.type == 'book') {
          final b = await _books.searchBook(item.title, item.author);
          posterUrl = b.cover;
        } else if (item.type == 'music') {
          final a = await _music.searchAlbum(item.title, item.artist);
          posterUrl = a.cover;
          previewUrl = a.previewUrl;
        }
      } catch (_) {
        // Enrichment is best-effort; a missing cover shouldn't fail the pick.
      }
      final rec = Recommendation(
        id: '',
        userId: '',
        type: item.type,
        title: item.title,
        contentType: contentType.wire,
        createdAt: '',
        genres: item.genres,
        director: item.director,
        author: item.author,
        artist: item.artist,
        year: item.year,
        rating: rating,
        posterUrl: posterUrl,
        previewUrl: previewUrl,
        explanation: item.explanation,
        description: item.description,
        matchScore: item.matchScore,
      );
      final res = await _db.saveRecommendation(rec);
      // Keep the AI-only fields the DB doesn't persist (matchScore, the
      // structured genres list, fresh poster) on the returned row.
      saved.add((res.data ?? rec).copyWith(
        matchScore: item.matchScore,
        genres: item.genres,
        posterUrl: posterUrl ?? res.data?.posterUrl,
        previewUrl: previewUrl ?? res.data?.previewUrl,
        explanation: item.explanation,
        description: item.description,
      ));
    }
    return ServiceResult.ok(saved);
  }
}
