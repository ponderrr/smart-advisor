import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/enums.dart';
import '../../../core/models/library_item.dart';
import '../../../core/result.dart';

/// Port of web library-service.ts. The web layer upserts on
/// (user_id, medium, lower(title)); that conflict target is a functional
/// unique index which PostgREST can't address directly, so log() does an
/// explicit find-then-update/insert with the same semantics.
class LibraryService {
  LibraryService(this._client);

  final SupabaseClient _client;

  static const String _table = 'user_library';

  Future<ServiceResult<LibraryItem>> log(LogLibraryInput input) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    final status = input.status ?? LibraryStatus.finished;
    final values = <String, dynamic>{
      'user_id': userId,
      'medium': input.medium.wire,
      'title': input.title,
      'creator': input.creator,
      'year': input.year,
      'poster_url': input.posterUrl,
      'status': status.wire,
      'rating': input.rating,
      'reaction': input.reaction,
      'source_recommendation_id': input.sourceRecommendationId,
      'finished_at': status == LibraryStatus.finished
          ? DateTime.now().toUtc().toIso8601String()
          : null,
    };
    try {
      final existing = await _client
          .from(_table)
          .select('id')
          .eq('user_id', userId)
          .eq('medium', input.medium.wire)
          .ilike('title', input.title)
          .maybeSingle();

      final Map<String, dynamic> row;
      if (existing != null) {
        row = await _client
            .from(_table)
            .update(values)
            .eq('id', existing['id'] as String)
            .select()
            .single();
      } else {
        row = await _client.from(_table).insert(values).select().single();
      }
      return ServiceResult.ok(
          LibraryItem.fromJson(Map<String, dynamic>.from(row)));
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<List<LibraryItem>>> list({
    LibraryMedium? medium,
    LibraryStatus? status,
    int? limit,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      var query = _client.from(_table).select().eq('user_id', userId);
      if (medium != null) query = query.eq('medium', medium.wire);
      if (status != null) query = query.eq('status', status.wire);
      var ordered = query.order('logged_at', ascending: false);
      if (limit != null) ordered = ordered.limit(limit);
      final rows = await ordered;
      return ServiceResult.ok(rows
          .map((r) => LibraryItem.fromJson(Map<String, dynamic>.from(r)))
          .toList());
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> update(
      String id, UpdateLibraryInput input) async {
    final updates = <String, dynamic>{
      if (input.status != null) 'status': input.status!.wire,
      if (input.status == LibraryStatus.finished)
        'finished_at': DateTime.now().toUtc().toIso8601String(),
      if (input.rating != null) 'rating': input.rating,
      if (input.reaction != null) 'reaction': input.reaction,
    };
    if (updates.isEmpty) return ServiceResult.ok(null);
    try {
      await _client.from(_table).update(updates).eq('id', id);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<void>> remove(String id) async {
    try {
      await _client.from(_table).delete().eq('id', id);
      return ServiceResult.ok(null);
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }

  Future<ServiceResult<List<LibraryItem>>> recentRated(
      {int limit = 12}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return ServiceResult.fail('Not authenticated');
    try {
      final rows = await _client
          .from(_table)
          .select()
          .eq('user_id', userId)
          .not('rating', 'is', null)
          .order('logged_at', ascending: false)
          .limit(limit);
      return ServiceResult.ok(rows
          .map((r) => LibraryItem.fromJson(Map<String, dynamic>.from(r)))
          .toList());
    } on PostgrestException catch (e) {
      return ServiceResult.fail(e.message);
    }
  }
}
