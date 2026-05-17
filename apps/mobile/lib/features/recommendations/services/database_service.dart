import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/app_user.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/result.dart';

/// Filtering options for getUserRecommendations (web FilterOptions).
class RecommendationFilter {
  const RecommendationFilter({
    this.contentType,
    this.isFavorited,
    this.startDate,
    this.endDate,
    this.sortBy = 'created_at',
    this.ascending = false,
    this.limit,
    this.offset,
  });

  final String? contentType;
  final bool? isFavorited;
  final String? startDate;
  final String? endDate;
  final String sortBy;
  final bool ascending;
  final int? limit;
  final int? offset;
}

class UserStats {
  const UserStats({
    required this.totalRecommendations,
    required this.favoriteCount,
    required this.movieCount,
    required this.bookCount,
    required this.musicCount,
    required this.thisMonthCount,
  });

  final int totalRecommendations;
  final int favoriteCount;
  final int movieCount;
  final int bookCount;
  final int musicCount;
  final int thisMonthCount;
}

/// Port of web database-service.ts. Owns explicit row<->model mapping: the
/// `recommendations` table stores a single `genre TEXT` column and has no
/// match_score column, so genres are (de)serialized to/from a comma list and
/// match_score is never persisted.
class DatabaseService {
  DatabaseService(this._client);

  final SupabaseClient _client;

  static const String _table = 'recommendations';

  Recommendation _fromRow(Map<String, dynamic> row) {
    final genre = row['genre'] as String?;
    return Recommendation(
      id: row['id'] as String,
      userId: row['user_id'] as String,
      type: row['type'] as String,
      title: row['title'] as String,
      contentType: row['content_type'] as String? ?? 'both',
      createdAt: row['created_at'] as String? ?? '',
      genres: (genre == null || genre.isEmpty)
          ? const <String>[]
          : genre.split(',').map((s) => s.trim()).toList(),
      isFavorited: row['is_favorited'] as bool? ?? false,
      director: row['director'] as String?,
      author: row['author'] as String?,
      artist: row['artist'] as String?,
      year: (row['year'] as num?)?.toInt(),
      rating: row['rating'] as num?,
      posterUrl: row['poster_url'] as String?,
      previewUrl: row['preview_url'] as String?,
      explanation: row['explanation'] as String?,
      description: row['description'] as String?,
    );
  }

  Map<String, dynamic> _toInsert(Recommendation r, String userId) => {
        'user_id': userId,
        'type': r.type,
        'content_type': r.contentType,
        'title': r.title,
        'description': r.description,
        'explanation': r.explanation,
        'poster_url': r.posterUrl,
        'preview_url': r.previewUrl,
        'genre': r.genres.join(', '),
        'rating': r.rating,
        'is_favorited': r.isFavorited,
        'director': r.director,
        'author': r.author,
        'artist': r.artist,
        'year': r.year,
      };

  Future<ServiceResult<Recommendation>> saveRecommendation(
      Recommendation rec) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      final row = await _client
          .from(_table)
          .insert(_toInsert(rec, userId))
          .select()
          .single();
      return ServiceResult.ok(_fromRow(row));
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<List<Recommendation>>> getUserRecommendations(
      [RecommendationFilter filter = const RecommendationFilter()]) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      var query = _client.from(_table).select().eq('user_id', userId);
      if (filter.contentType != null) {
        query = query.eq('content_type', filter.contentType!);
      }
      if (filter.isFavorited != null) {
        query = query.eq('is_favorited', filter.isFavorited!);
      }
      if (filter.startDate != null) {
        query = query.gte('created_at', filter.startDate!);
      }
      if (filter.endDate != null) {
        query = query.lte('created_at', filter.endDate!);
      }
      var ordered =
          query.order(filter.sortBy, ascending: filter.ascending);
      if (filter.limit != null) {
        ordered = ordered.range(
          filter.offset ?? 0,
          (filter.offset ?? 0) + filter.limit! - 1,
        );
      }
      final rows = await ordered;
      return ServiceResult.ok(
          rows.map((r) => _fromRow(Map<String, dynamic>.from(r))).toList());
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<bool>> toggleFavorite(String recommendationId) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      final current = await _client
          .from(_table)
          .select('is_favorited')
          .eq('id', recommendationId)
          .single();
      final next = !((current['is_favorited'] as bool?) ?? false);
      await _client
          .from(_table)
          .update({'is_favorited': next}).eq('id', recommendationId);
      return ServiceResult.ok(next);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> deleteRecommendation(String id) async {
    try {
      await _client.from(_table).delete().eq('id', id);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> deleteAllRecommendations() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      await _client.from(_table).delete().eq('user_id', userId);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<AppUser>> getCurrentUserProfile() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      final row =
          await _client.from('profiles').select().eq('id', userId).single();
      return ServiceResult.ok(
          AppUser.fromJson(Map<String, dynamic>.from(row)));
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> updateUserProfile({
    String? name,
    int? age,
    String? email,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    final updates = <String, dynamic>{
      'name': ?name,
      'age': ?age,
      'email': ?email,
    };
    if (updates.isEmpty) return ServiceResult.ok(null);
    try {
      await _client.from('profiles').update(updates).eq('id', userId);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<UserStats>> getUserStats() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      final rows = await _client
          .from(_table)
          .select('type,is_favorited,created_at')
          .eq('user_id', userId);
      final now = DateTime.now();
      var fav = 0, mov = 0, book = 0, music = 0, month = 0;
      for (final r in rows) {
        if (r['is_favorited'] == true) fav++;
        switch (r['type']) {
          case 'movie':
            mov++;
          case 'book':
            book++;
          case 'music':
            music++;
        }
        final created = DateTime.tryParse(r['created_at'] as String? ?? '');
        if (created != null &&
            created.year == now.year &&
            created.month == now.month) {
          month++;
        }
      }
      return ServiceResult.ok(UserStats(
        totalRecommendations: rows.length,
        favoriteCount: fav,
        movieCount: mov,
        bookCount: book,
        musicCount: music,
        thisMonthCount: month,
      ));
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }
}
