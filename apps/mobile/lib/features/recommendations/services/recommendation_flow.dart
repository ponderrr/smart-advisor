import '../../../core/models/ai_models.dart';
import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/result.dart';
import 'ai_service.dart';
import 'database_service.dart';
import 'tmdb_service.dart';

/// Trimmed stand-in for the web enhanced-recommendations-service.
///
/// The web service does parallel 3-per-type generation + dedup + TMDB /
/// Open Library / Deezer enrichment. Open Library + Deezer enrichment is
/// deferred (blocked on moving the Next.js /api routes to Edge Functions),
/// so this generates one pick per applicable type via the
/// anthropic-recommendations Edge Function, enriches movie posters via the
/// tmdb-proxy Edge Function, persists each, and returns the saved rows.
class RecommendationFlow {
  RecommendationFlow(this._ai, this._tmdb, this._db);

  final AiService _ai;
  final TmdbService _tmdb;
  final DatabaseService _db;

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
      num? rating = item.rating;
      if (item.type == 'movie') {
        try {
          final m = await _tmdb.searchMovie(item.title);
          posterUrl = m.poster;
          rating = m.rating;
        } catch (_) {
          // tmdb-proxy returns a safe fallback; ignore hard failures.
        }
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
        explanation: item.explanation,
        description: item.description,
      ));
    }
    return ServiceResult.ok(saved);
  }
}
