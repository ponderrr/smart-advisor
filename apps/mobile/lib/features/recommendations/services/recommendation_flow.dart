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
    final RecommendationData data;
    try {
      data = await _ai.generateRecommendationsWithRetry(
        answers: answers,
        contentType: contentType,
        userAge: userAge,
        contentTone: contentTone,
        userName: userName,
      );
    } on AiServiceException catch (e) {
      return ServiceResult.fail(e.message);
    }

    final items = <AiRecommendationItem>[
      if (data.movieRecommendation != null) data.movieRecommendation!,
      if (data.bookRecommendation != null) data.bookRecommendation!,
      if (data.musicRecommendation != null) data.musicRecommendation!,
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
